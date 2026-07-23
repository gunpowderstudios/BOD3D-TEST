// BOD3D-TEST v11.55 — heroes face North on dungeon entry and Start-tile respawn
(function(){
  function faceNorth(){
    if(!window.state||!state.player)return;
    state.player.facing='N';
    window.BOD3D?.snapHeroToPlayer?.();
    window.BOD3D?.render?.(state);
  }

  function install(){
    if(window.__bodHeroNorthInstalled)return true;
    if(typeof newGame!=='function')return false;
    window.__bodHeroNorthInstalled=true;

    const originalNewGame=newGame;
    newGame=function(){
      const result=originalNewGame.apply(this,arguments);
      faceNorth();
      setTimeout(faceNorth,0);
      setTimeout(faceNorth,180);
      return result;
    };

    if(typeof death==='function'){
      const originalDeath=death;
      death=function(){
        const result=originalDeath.apply(this,arguments);
        setTimeout(()=>{
          if(state?.player&&state.player.x===0&&state.player.y===0)faceNorth();
        },850);
        setTimeout(()=>{
          if(state?.player&&state.player.x===0&&state.player.y===0)faceNorth();
        },1500);
        return result;
      };
    }
    return true;
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      if(install())return;
      let attempts=0;
      const timer=setInterval(()=>{if(install()||++attempts>160)clearInterval(timer);},50);
    },{once:true});
  }else if(!install()){
    let attempts=0;
    const timer=setInterval(()=>{if(install()||++attempts>160)clearInterval(timer);},50);
  }
})();
