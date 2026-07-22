// BOD3D-TEST v11.47 — preserve red combat emphasis in the Quest Log
(function(){
  const RED='#ef2f3e';
  const COMBAT_WORDS=/\b(critical|lethal blow|damage|damaged|hits?|attacks?|strikes?|wounds?|defeated|slain|killed|combat|run away|no escape|armour blocks?|monster rolls?|you roll)\b/i;

  function colourLine(el){
    if(!el||el.nodeType!==1)return;
    const text=(el.textContent||'').trim();
    if(!text)return;
    const explicitCombat=el.classList.contains('combat')||el.classList.contains('critical')||el.dataset?.type==='combat';
    if(explicitCombat||COMBAT_WORDS.test(text)){
      el.style.setProperty('color',RED,'important');
      el.classList.add('questCombatLine');
    }else if(el.classList.contains('questCombatLine')){
      el.style.removeProperty('color');
      el.classList.remove('questCombatLine');
    }
  }

  function refresh(){
    const log=document.getElementById('log');
    if(!log)return false;
    Array.from(log.children).forEach(colourLine);
    if(!log.dataset.combatColourObserver){
      log.dataset.combatColourObserver='1';
      new MutationObserver(records=>{
        records.forEach(record=>{
          record.addedNodes.forEach(node=>{
            if(node.nodeType===1){colourLine(node);node.querySelectorAll?.('*').forEach(colourLine);}
          });
          if(record.type==='characterData')colourLine(record.target.parentElement);
        });
      }).observe(log,{childList:true,subtree:true,characterData:true});
    }
    return true;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
  let tries=0;const timer=setInterval(()=>{if(refresh()||++tries>120)clearInterval(timer);},100);
})();
