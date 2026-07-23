// BOD3D-TEST v11.57 — collapse extra combat item buttons into an Items drawer
(function(){
  let drawerOpen=false;
  let activeCombat=null;

  function usableItems(){
    if(typeof allCarriedItems!=='function')return [];
    return allCarriedItems()
      .map((item,index)=>({item,index}))
      .filter(({item})=>item&&item.use&&item.use!=='teleport');
  }

  function makeButton(text,className,onClick,disabled=false){
    const button=document.createElement('button');
    button.type='button';
    button.className=className;
    button.textContent=text;
    button.disabled=disabled;
    button.addEventListener('click',onClick);
    return button;
  }

  function install(){
    if(window.__bodCombatItemsMenuInstalled)return true;
    if(typeof combatItemButtons!=='function'||typeof useInventoryIndex!=='function'||typeof renderCombat!=='function')return false;

    window.__bodCombatItemsMenuInstalled=true;

    combatItemButtons=function(wrap){
      if(!wrap)return;

      if(activeCombat!==combat){
        activeCombat=combat;
        drawerOpen=false;
      }

      const entries=usableItems();
      if(!entries.length)return;

      const toggle=makeButton(
        drawerOpen?'Items ▴':'Items ▾',
        'red combatItemsToggle',
        ()=>{
          drawerOpen=!drawerOpen;
          renderCombat();
        },
        !!combat?.rolling
      );
      toggle.setAttribute('aria-expanded',drawerOpen?'true':'false');
      wrap.appendChild(toggle);

      if(!drawerOpen)return;

      const drawer=document.createElement('div');
      drawer.id='combatItemsDrawer';
      drawer.className='combatItemsDrawer';

      entries.forEach(({item,index})=>{
        const choice=makeButton(
          (item.icon?item.icon+' ':'')+item.name,
          'combatItemChoice',
          ()=>{
            drawerOpen=false;
            useInventoryIndex(index);
          }
        );
        drawer.appendChild(choice);
      });

      drawer.appendChild(makeButton('Close','combatItemChoice combatItemsClose',()=>{
        drawerOpen=false;
        renderCombat();
      }));

      wrap.appendChild(drawer);
    };

    return true;
  }

  function start(){
    if(install())return;
    let attempts=0;
    const timer=setInterval(()=>{
      if(install()||++attempts>200)clearInterval(timer);
    },50);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
