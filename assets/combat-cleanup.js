// BOD3D-TEST v11.52 — remove redundant pre-fight placeholder copy
(function(){
  const PLACEHOLDERS=new Set(['Dice will appear here.','Ready to fight!']);
  function cleanElement(el){
    if(!el)return;
    const text=(el.textContent||'').trim();
    if(PLACEHOLDERS.has(text))el.textContent='';
  }
  function clean(){
    cleanElement(document.getElementById('diceTray'));
    cleanElement(document.getElementById('combatLog'));
  }
  function start(){
    clean();
    const combat=document.getElementById('combat');
    if(!combat)return;
    new MutationObserver(clean).observe(combat,{subtree:true,childList:true,characterData:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
