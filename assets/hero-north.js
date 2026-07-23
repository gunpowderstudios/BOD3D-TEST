// BOD3D-TEST v11.58 — safely face heroes North without competing 3D rebuilds
(function(){
  function getState(){
    try{return typeof state!=='undefined'?state:null;}catch(_){return null;}
  }

  function setNorth(renderNow=false){
    const current=getState();
    if(!current||!current.player)return false;
    current.player.facing='N';
    if(renderNow)window.BOD3D?.render?.(current);
    return true;
  }

  function install(){
    if(window.__bodHeroNorthInstalled)return true;
    if(typeof newGame!=='function')return false;
    window.__bodHeroNorthInstalled=true;

    const originalNewGame=newGame;
    newGame=function(){
      const result=originalNewGame.apply(this,arguments);
      // Change game-state direction immediately, but do not repeatedly reset or
      // rebuild the asynchronous GLB while it is loading. One delayed render is safe.
      setNorth(false);
      setTimeout(()=>setNorth(true),700);
      return result;
    };

    if(typeof death==='function'){
      const originalDeath=death;
      death=function(){
        const result=originalDeath.apply(this,arguments);
        setTimeout(()=>{
          const current=getState();
          if(current?.player&&current.player.x===0&&current.player.y===0)setNorth(true);
        },1300);
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