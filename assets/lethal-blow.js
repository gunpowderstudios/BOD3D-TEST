// BOD3D-TEST v11.36 — Sirrus and Tamara Lethal Blow
(function installLethalBlow(){
  function ready(){
    return typeof window.fightRound==='function' &&
      typeof window.resolveFightRound==='function' &&
      typeof window.renderCombat==='function';
  }

  function install(){
    if(window.__bodLethalBlowInstalled)return true;
    if(!ready())return false;
    window.__bodLethalBlowInstalled=true;

    const originalFightRound=window.fightRound;
    const originalRenderCombat=window.renderCombat;
    const originalResolveFightRound=window.resolveFightRound;

    function lethalAvailable(){
      const p=window.state?.player;
      return !!(
        window.combat && p &&
        p.flags?.special==='Lethal Blow' &&
        !p.flags.usedSpecial &&
        window.combat.pendingDiceRoll
      );
    }

    window.fightRound=function(){
      if(!window.combat||window.combat.rolling)return;
      const p=window.state.player,m=window.combat.tile.monster;
      m.meleeStarted=true;
      window.combat.rolling=true;
      window.combat.awaitingLethalDecision=false;
      const pr=window.roll(window.pDice()),mr=window.roll(m.dice);
      window.combat.pendingDiceRoll={pr,mr};
      window.BOD3D?.combatPulse?.();
      window.showDice(Array.from({length:window.pDice()},()=>'?'),Array.from({length:m.dice},()=>'?'),true);
      document.getElementById('combatLog').textContent='Rolling dice...';
      window.playSound('dice');
      window.BODDice3D?.rollCombat?.(pr.rolls,mr.rolls);
      window.renderCombat();
      setTimeout(()=>{
        if(!window.combat)return;
        if(lethalAvailable()){
          window.combat.rolling=false;
          window.combat.awaitingLethalDecision=true;
          window.showDice(pr.rolls,mr.rolls,false);
          const normalDiceScore=window.isCritical(pr.rolls)?pr.total*2:pr.total;
          const normalTotal=normalDiceScore+window.pCombatMod();
          document.getElementById('combatLog').textContent=
            'You rolled '+pr.rolls.join(', ')+' for a combat total of '+normalTotal+'. Use Lethal Blow to double the complete total to '+(normalTotal*2)+'?';
          window.renderCombat();
        }else{
          originalResolveFightRound();
        }
      },1050);
    };

    window.useLethalBlow=function(){
      if(!lethalAvailable()||!window.combat.awaitingLethalDecision)return;
      window.combat.useLethalBlow=true;
      window.combat.awaitingLethalDecision=false;
      window.state.player.flags.usedSpecial=true;
      originalResolveFightRound();
    };

    window.resolveWithoutLethalBlow=function(){
      if(!window.combat?.awaitingLethalDecision)return;
      window.combat.useLethalBlow=false;
      window.combat.awaitingLethalDecision=false;
      originalResolveFightRound();
    };

    window.resolveFightRound=function(){
      if(lethalAvailable()&&!window.combat.useLethalBlow){
        window.combat.rolling=false;
        window.combat.awaitingLethalDecision=true;
        window.renderCombat();
        return;
      }
      return originalResolveFightRound();
    };

    window.renderCombat=function(){
      originalRenderCombat();
      if(!window.combat)return;
      const buttons=document.getElementById('combatBtns');
      if(!buttons)return;
      if(window.combat.awaitingLethalDecision&&lethalAvailable()){
        buttons.innerHTML='';
        window.addBtn(buttons,'⚔ Use Lethal Blow','gold',window.useLethalBlow,false);
        window.addBtn(buttons,'Resolve Normally','green',window.resolveWithoutLethalBlow,false);
        return;
      }
      const p=window.state?.player;
      if(p?.flags?.special==='Lethal Blow'){
        const note=document.createElement('div');
        note.className='small lethalBlowStatus';
        note.textContent=p.flags.usedSpecial?'Lethal Blow used':'Lethal Blow ready — once per game';
        buttons.appendChild(note);
      }
    };

    // Apply the doubling immediately before the normal resolver compares totals.
    const baseCombatMod=window.pCombatMod;
    window.pCombatMod=function(){
      const normal=baseCombatMod();
      return normal;
    };

    // Patch the stored pending player roll so the existing resolver naturally uses
    // a doubled complete total without changing critical-hit behaviour.
    const nativeResolve=originalResolveFightRound;
    window.resolveFightRound=function(){
      if(!window.combat)return;
      if(window.combat.awaitingLethalDecision)return;
      const use=!!window.combat.useLethalBlow;
      if(use&&window.combat.pendingDiceRoll){
        const pending=window.combat.pendingDiceRoll;
        const crit=window.isCritical(pending.pr.rolls);
        const normalDice=crit?pending.pr.total*2:pending.pr.total;
        const normalTotal=normalDice+baseCombatMod();
        // Convert the desired doubled complete total back into a temporary dice total
        // expected by the existing resolver: temp dice + normal modifier.
        pending.pr={...pending.pr,total:(normalTotal*2)-baseCombatMod()};
        window.playSound('critical');
        window.playCurrentTileEffect?.('critical',1000);
        window.log((window.state.charDef?.name||'The fighter')+' uses LETHAL BLOW! Combat total doubled to '+(normalTotal*2)+'.','combat');
        const combatLog=document.getElementById('combatLog');
        if(combatLog)combatLog.textContent=(window.state.charDef?.name||'The fighter')+' USES LETHAL BLOW!';
      }
      window.combat.useLethalBlow=false;
      return nativeResolve();
    };

    return true;
  }

  function start(){
    if(install())return;
    let tries=0;
    const timer=setInterval(()=>{if(install()||++tries>160)clearInterval(timer);},50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
