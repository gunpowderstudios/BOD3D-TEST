// BOD3D-TEST v11.57 — collapse owned combat items into a compact drawer
(function(){
  let menuOpen=false;
  let lastCombat=null;

  function usableCombatItems(){
    if(typeof allCarriedItems!=='function')return [];
    return allCarriedItems()
      .map((item,index)=>({item,index}))
      .filter(({item})=>item&&(item.type==='spell'||item.type==='consumable'||item.use)&&item.use!=='teleport');
  }

  function install(){
    if(window.__bodCombatItemsMenuInstalled)return true;
    if(typeof combatItemButtons!=='function'||typeof addBtn!=='function'||typeof useInventoryIndex!=='function')return false;
    window.__bodCombatItemsMenuInstalled=true;

    combatItemButtons=function(wrap){
      if(!wrap)return;
      if(combat!==lastCombat){
        lastCombat=combat;
        menuOpen=false;
      }

      const entries=usableCombatItems();
      if(!entries.length)return;

      const toggle=addBtn(
        wrap,
        menuOpen?'Items ▴':'Items ▾',
        'red combatItemsToggle',
        ()=>{
          menuOpen=!menuOpen;
          if(typeof renderCombat==='function')renderCombat();
        },
        !!combat?.rolling
      );
      toggle.setAttribute('aria-expanded',menuOpen?'true':'false');
      toggle.setAttribute('aria-controls','combatItemsDrawer');

      if(!menuOpen)return;

      const drawer=document.createElement('div');
      drawer.id='combatItemsDrawer';
      drawer.className='combatItemsDrawer';
      drawer.setAttribute('role','menu');

      entries.forEach(({item,index})=>{
        const button=document.createElement('button');
        button.type='button';
        button.className='combatItemChoice';
        button.setAttribute('role','menuitem');
        button.innerHTML='<span class="combatItemChoiceIcon">'+(item.icon||'◆')+'</span><span>'+item.name+'</span>';
        button.onclick=()=>{
          menuOpen=false;
          useInventoryIndex(index);
        };
        drawer.appendChild(button);
      });

      const close=document.createElement('button');
      close.type='button';
      close.className='combatItemChoice combatItemsClose';
      close.textContent='Close';
      close.onclick=()=>{menuOpen=false;if(typeof renderCombat==='function')renderCombat();};
      drawer.appendChild(close);
      wrap.appendChild(drawer);
    };

    return true;
  }

  function start(){
    if(install())return;
    let attempts=0;
    const timer=setInterval(()=>{if(install()||++attempts>200)clearInterval(timer);},50);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
