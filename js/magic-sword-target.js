// Magic Sword click-target interaction
(function(){
  'use strict';
  let active=false;

  function equippedSword(){
    if(!window.state||!state.player)return null;
    return [state.player.slots?.left,state.player.slots?.right].find(item=>item?.name==='Magic Sword')||null;
  }
  function adjacentKeys(){
    if(!window.state||!state.player)return [];
    const p=state.player,out=[];
    for(const dir of dirOrder){
      const d=DIRS[dir],kk=key(p.x+d.dx,p.y+d.dy),t=state.tiles[kk];
      if(t&&(t.monsterPending||(t.monster&&t.monster.health>0&&!t.monster.revealed&&!t.monster.peeked)))out.push(kk);
    }
    return out;
  }
  function stop(message){
    active=false;
    if(message)toast(message);
    render();
  }
  function reveal(tileKey){
    if(!active)return false;
    if(!equippedSword()){stop('Equip the Magic Sword first');return false;}
    if(!adjacentKeys().includes(tileKey)){toast('Choose an adjacent hidden monster');return false;}
    const t=state.tiles[tileKey];
    if(t.monsterPending&&!t.monster){t.monster=drawMonster();t.monsterPending=false;}
    const m=t.monster;
    if(!m)return false;
    active=false;
    m.peeked=true;
    const sword=equippedSword();
    if(sword&&typeof playItemSound==='function')playItemSound(sword);
    render();
    showModal('Magic Sword',m.name+'\nHealth '+m.maxHealth+'\nCombat '+m.dice+'d6+'+m.mod,[{text:'Close',fn:closeModal}]);
    return true;
  }
  window.startMagicSwordTarget=function(){
    if(!equippedSword()){toast('Equip the Magic Sword first');return;}
    if(!adjacentKeys().length){toast('No hidden monster is adjacent');return;}
    active=true;
    closeModal();
    toast('Magic Sword: click an adjacent hidden monster');
    render();
  };
  window.cancelMagicSwordTarget=function(){stop('Magic Sword cancelled');};

  function wire(){
    if(typeof inspectItemObject!=='function'||typeof renderControls!=='function'||typeof window.BOD3DAction!=='function')return false;

    const originalInspect=inspectItemObject;
    inspectItemObject=function(item){
      if(item?.name!=='Magic Sword'||!equippedSword()){originalInspect(item);return;}
      playItemSound(item);
      const buttons=[
        {text:'Use Magic Sword',cls:'green',fn:window.startMagicSwordTarget},
        {text:'Move to Backpack',fn:()=>{if(unequipItem(item)){closeModal();render();}}},
        {text:'Drop',cls:'red',fn:()=>dropItemObject(item)},
        {text:'Close',fn:closeModal}
      ];
      showModal(item.name,(item.desc||'+2 combat roll. Reveal and view an adjacent hidden monster.')+'\n\nActive: '+(equippedSlotFor(item)||'equipped'),buttons);
    };

    const originalRenderControls=renderControls;
    renderControls=function(){
      originalRenderControls();
      if(!active)return;
      const wrap=document.getElementById('controls');
      if(!wrap)return;
      wrap.innerHTML='';
      addBtn(wrap,'Cancel Magic Sword','red',window.cancelMagicSwordTarget);
    };

    const originalAction=window.BOD3DAction;
    window.BOD3DAction=function(type,tileKey){
      if(active&&type==='hidden'){reveal(tileKey);return;}
      originalAction(type,tileKey);
    };

    document.addEventListener('click',function(e){
      if(!active)return;
      const hidden=e.target.closest?.('.hiddenMonster');
      if(!hidden)return;
      const tileKey=hidden.dataset.rangedKey||hidden.closest?.('[data-tile-key]')?.dataset.tileKey;
      if(tileKey){e.preventDefault();e.stopPropagation();reveal(tileKey);}
    },true);
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{if(wire()||++tries>200)clearInterval(timer);},25);
})();
