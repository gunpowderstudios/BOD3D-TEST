// BOD3D TEST — visible 3D dice for item-driven rolls
(function(){
  'use strict';
  if(window.__bodItemDiceRollsInstalled)return;

  function install(){
    if(window.__bodItemDiceRollsInstalled)return true;
    if(typeof useItem!=='function'||typeof roll!=='function'||typeof render!=='function')return false;
    window.__bodItemDiceRollsInstalled=true;

    const originalUseItem=useItem;

    async function showItemDice(result){
      if(typeof playSound==='function')playSound('dice');
      const dicePromise=window.BODDice3D?.roll?.(result.rolls,'hero');
      if(dicePromise&&typeof dicePromise.then==='function'){
        try{await dicePromise;}catch(error){console.warn('Item dice animation failed.',error);}
      }
      return result.total;
    }

    function finishItem(item,consume,msg,kind='loot'){
      if(typeof playItemSound==='function')playItemSound(item);
      if(item.use==='bomb')playCurrentTileEffect?.('explosion',950);
      else if(item.use==='healthPotion')playCurrentTileEffect?.('heal',1000);
      if(msg){log?.(msg,kind);toast?.(msg);}
      if(consume)consume();
      if(combat?.tile?.monster&&combat.tile.monster.health<=0){killMonster();return;}
      if(state.player.health<=0){death();return;}
      render();
      if(combat)renderCombat();
    }

    useItem=async function(item,consume){
      const p=state.player;
      const m=combat?.tile?.monster;

      if(item?.use==='healthPotion'){
        const result=roll(2);
        await showItemDice(result);
        p.health=Math.min(p.maxHealth,p.health+result.total);
        finishItem(item,consume,'Health Potion restores '+result.total+' health.','heal');
        return;
      }

      if(item?.use==='bomb'&&m){
        if(p.ap<1){toast('Not enough AP');return;}
        const result=roll(2);
        await showItemDice(result);
        p.ap-=1;
        m.health-=result.total;
        finishItem(item,consume,item.name+' used. '+m.name+' takes '+result.total+' damage.');
        return;
      }

      if(item?.use==='skull'&&m){
        const result=roll(1);
        await showItemDice(result);
        m.health-=result.total;
        finishItem(item,consume,item.name+' used. '+m.name+' takes '+result.total+' damage.');
        return;
      }

      if(item?.use==='vine'&&m){
        if(p.ap<1){toast('Not enough AP');return;}
        const result=roll(1);
        await showItemDice(result);
        p.ap-=1;
        m.health-=result.total;
        combat.monsterSkip=true;
        window.BOD3D?.playEffect?.('vine');
        finishItem(item,consume,item.name+' used. '+m.name+' takes '+result.total+' damage.');
        return;
      }

      if(item?.use==='smallChest'){
        const result=roll(1);
        await showItemDice(result);
        let msg='';
        if(result.total<=2){
          p.health-=2;
          msg='Chest roll '+result.total+' — trapped! Take 2 damage.';
          if(p.health<=0)recordFinalBlow('Killed by a trapped Small Chest','The chest rolled '+result.total+' and the trap caused 2 direct damage.');
        }else{
          awardItem();
          msg='Chest roll '+result.total+' — safe! Draw 1 item.';
        }
        finishItem(item,consume,msg);
        return;
      }

      if(item?.use==='largeChest'){
        const result=roll(1);
        await showItemDice(result);
        let msg='';
        if(result.total<=2){
          p.health-=5;
          msg='Chest roll '+result.total+' — TRAPPED! Take 5 damage.';
          if(p.health<=0)recordFinalBlow('Killed by a trapped Large Chest','The chest rolled '+result.total+' and the trap caused 5 direct damage.');
        }else{
          awardItem();awardItem();
          msg='Chest roll '+result.total+' — safe! Draw 2 items.';
        }
        finishItem(item,consume,msg);
        return;
      }

      return originalUseItem.apply(this,arguments);
    };

    return true;
  }

  function start(){
    if(install())return;
    let tries=0;
    const timer=setInterval(()=>{if(install()||++tries>240)clearInterval(timer);},50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
