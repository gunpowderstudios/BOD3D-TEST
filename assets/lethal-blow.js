// BOD3D-TEST v11.36 — Sirrus and Tamara Lethal Blow
(function installLethalBlow(){
  function ready(){
    return typeof fightRound==='function'&&typeof resolveFightRound==='function'&&typeof renderCombat==='function';
  }

  function install(){
    if(window.__bodLethalBlowInstalled)return true;
    if(!ready())return false;
    window.__bodLethalBlowInstalled=true;

    const originalRenderCombat=renderCombat;
    const originalResolveFightRound=resolveFightRound;

    function lethalAvailable(){
      return !!(
        combat&&state?.player&&
        state.player.flags?.special==='Lethal Blow'&&
        !state.player.flags.usedSpecial&&
        combat.pendingDiceRoll
      );
    }

    function resolveChoice(useLethal){
      if(!combat||!combat.pendingDiceRoll)return;
      combat.awaitingLethalDecision=false;
      combat.rolling=false;

      if(useLethal&&lethalAvailable()){
        const pending=combat.pendingDiceRoll;
        const critical=isCritical(pending.pr.rolls);
        const normalDice=critical?pending.pr.total*2:pending.pr.total;
        const modifier=pCombatMod();
        const normalTotal=normalDice+modifier;
        const doubledTotal=normalTotal*2;

        state.player.flags.usedSpecial=true;
        combat.lethalBlowDisplay={normalTotal,doubledTotal};

        // The existing resolver doubles the stored dice total again on a critical.
        // Reverse that step here so its final calculated total is exactly doubledTotal.
        const resolverDiceTotal=(doubledTotal-modifier)/(critical?2:1);
        pending.pr={...pending.pr,total:resolverDiceTotal};

        playSound('critical');
        playCurrentTileEffect?.('critical',1000);
        log((state.charDef?.name||'The fighter')+' uses LETHAL BLOW! Combat total doubled from '+normalTotal+' to '+doubledTotal+'.','combat');
      }

      originalResolveFightRound();
      if(combat)delete combat.lethalBlowDisplay;
    }

    fightRound=function(){
      if(!combat||combat.rolling||combat.awaitingLethalDecision)return;
      const p=state.player,m=combat.tile.monster;
      m.meleeStarted=true;
      combat.rolling=true;
      const pr=roll(pDice()),mr=roll(m.dice);
      combat.pendingDiceRoll={pr,mr};
      window.BOD3D?.combatPulse?.();
      showDice(Array.from({length:pDice()},()=>'?'),Array.from({length:m.dice},()=>'?'),true);
      document.getElementById('combatLog').textContent='Rolling dice...';
      playSound('dice');
      window.BODDice3D?.rollCombat?.(pr.rolls,mr.rolls);
      renderCombat();

      setTimeout(()=>{
        if(!combat)return;
        if(lethalAvailable()){
          combat.rolling=false;
          combat.awaitingLethalDecision=true;
          showDice(pr.rolls,mr.rolls,false);
          const critical=isCritical(pr.rolls);
          const normalTotal=(critical?pr.total*2:pr.total)+pCombatMod();
          document.getElementById('combatLog').textContent=
            'Your combat total is '+normalTotal+'. Use Lethal Blow to double it to '+(normalTotal*2)+'?';
          renderCombat();
        }else{
          originalResolveFightRound();
        }
      },1050);
    };

    window.useLethalBlow=()=>resolveChoice(true);
    window.resolveWithoutLethalBlow=()=>resolveChoice(false);

    renderCombat=function(){
      originalRenderCombat();
      if(!combat)return;
      const buttons=document.getElementById('combatBtns');
      if(!buttons)return;

      if(combat.awaitingLethalDecision&&lethalAvailable()){
        buttons.innerHTML='';
        addBtn(buttons,'⚔ Use Lethal Blow','gold',window.useLethalBlow,false);
        addBtn(buttons,'Resolve Normally','green',window.resolveWithoutLethalBlow,false);
        return;
      }

      if(state.player.flags?.special==='Lethal Blow'){
        const note=document.createElement('div');
        note.className='small lethalBlowStatus';
        note.textContent=state.player.flags.usedSpecial?'Lethal Blow used':'Lethal Blow ready — once per game';
        buttons.appendChild(note);
      }
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
