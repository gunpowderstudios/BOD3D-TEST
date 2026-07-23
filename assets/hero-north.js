// BOD3D-TEST v11.56 — heroes face North on dungeon entry and Start-tile respawn
(function(){
  function getState(){
    try{return typeof state!=='undefined'?state:null;}catch(_){return null;}
  }
  function faceNorth(){
    const current=getState();
    if(!current||!current.player)return false;
    current.player.facing='N';
    // Reset the renderer's remembered rotation before rebuilding the hero.
    window.BOD3D?.resetHeroFacing?.();
    window.BOD3D?.snapHeroToPlayer?.();
    window.BOD3D?.render?.(current);
    return true;
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
      setTimeout(faceNorth,120);
      setTimeout(faceNorth,420);
      return result;
    };

    if(typeof death==='function'){
      const originalDeath=death;
      death=function(){
        const result=originalDeath.apply(this,arguments);
        [700,1100,1600].forEach(delay=>setTimeout(()=>{
          const current=getState();
          if(current?.player&&current.player.x===0&&current.player.y===0)faceNorth();
        },delay));
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