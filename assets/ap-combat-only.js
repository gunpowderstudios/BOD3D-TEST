// BOD3D-TEST v11.53 — AP is combat-only; no exploration Rest
(function installCombatOnlyAP(){
  function ready(){
    return typeof move==='function'&&typeof startPlace==='function'&&typeof renderControls==='function'&&typeof updateMobileDpad==='function'&&typeof addBtn==='function';
  }
  function install(){
    if(window.__bodCombatOnlyAPInstalled)return true;
    if(!ready())return false;
    window.__bodCombatOnlyAPInstalled=true;

    const originalMove=move;
    const originalStartPlace=startPlace;
    const originalPlace=document.getElementById('placeBtn')?.onclick;

    // Walking remains free. Give the legacy move routine one temporary AP so its
    // own subtraction leaves the player's real AP unchanged.
    move=function(dir){
      if(!state?.player)return;
      const before=state.player.ap;
      state.player.ap=before+1;
      originalMove(dir);
      state.player.ap=before;
      render();
    };

    // Drawing/starting a placement no longer requires exploration AP.
    startPlace=function(dir){
      if(!state?.player)return;
      const before=state.player.ap;
      state.player.ap=before+1;
      originalStartPlace(dir);
      state.player.ap=before;
    };

    // The legacy placement handler subtracts AP after confirming the tile.
    // Neutralise that subtraction and retire the old Torch free-lay bookkeeping.
    const placeBtn=document.getElementById('placeBtn');
    if(placeBtn&&originalPlace){
      placeBtn.onclick=function(event){
        if(!state?.player)return originalPlace.call(this,event);
        const before=state.player.ap;
        const oldTorch=!!state.player.flags?.torchFreeLay;
        state.player.ap=before+1;
        if(state.player.flags)state.player.flags.torchFreeLay=false;
        try{return originalPlace.call(this,event);}
        finally{
          if(state?.player){
            state.player.ap=before;
            if(state.player.flags)state.player.flags.torchFreeLay=false;
            render();
          }
        }
      };
    }

    // Rebuild exploration controls without Rest or automatic AP-rest behaviour.
    renderControls=function(){
      const wrap=document.getElementById('controls');
      if(!wrap||!state)return;
      wrap.innerHTML='';
      updateMobileDpad();
      const rest=document.getElementById('mobileRestBtn');
      if(rest){rest.hidden=true;rest.style.display='none';rest.onclick=null;}
      if(state.gameOver)return;
      if(teleportItem){addBtn(wrap,'Cancel Teleport','red',cancelTeleport);return;}
      if(rangedMode){addBtn(wrap,'Cancel Ranged Attack','red',cancelRangedAttack);return;}
      const p=state.player;
      if(p.equipment.bow)addBtn(wrap,p.equipment.bow.name+' — Range 1-3 (3 AP)','blue',()=>startRangedAttack('bow'),p.ap<3);
      if(p.equipment.staff)addBtn(wrap,'Ice Staff — Range 1-2 (4 AP)','blue',()=>startRangedAttack('iceStaff'),p.ap<4);
    };

    const originalUpdateMobileDpad=updateMobileDpad;
    updateMobileDpad=function(){
      originalUpdateMobileDpad();
      const dpad=document.getElementById('mobileDpad');
      if(dpad&&!state?.gameOver&&!combat&&!placement&&!teleportItem&&!rangedMode){
        dpad.querySelectorAll('.dpadBtn[data-action="move"],.dpadBtn[data-action="lay"]').forEach(btn=>btn.disabled=false);
      }
      const rest=document.getElementById('mobileRestBtn');
      if(rest){rest.hidden=true;rest.style.display='none';rest.onclick=null;}
    };

    render();
    return true;
  }
  function start(){
    if(install())return;
    let tries=0;
    const timer=setInterval(()=>{if(install()||++tries>240)clearInterval(timer);},50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
