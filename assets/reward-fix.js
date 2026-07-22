(function(){
  const VERSION='v11.36';
  function syncVersion(){
    document.title='Bag of Dungeon 3D '+VERSION;
    const visible=document.getElementById('visibleBuildVersion');
    if(visible)visible.textContent=VERSION;
  }

  function loadLethalBlow(){
    if(document.querySelector('script[data-bod-lethal-blow]'))return;
    const script=document.createElement('script');
    script.src='assets/lethal-blow.js?v=11.36';
    script.dataset.bodLethalBlow='1';
    document.head.appendChild(script);
  }

  function install(){
    syncVersion();
    loadLethalBlow();
    if(window.__bodSequentialRewardsInstalled)return true;
    if(typeof awardItem!=='function'||typeof drawItem!=='function')return false;
    window.__bodSequentialRewardsInstalled=true;

    const originalAwardItem=awardItem;
    const rewardQueue=[];
    let delivering=false;

    function modalBusy(){
      const modal=document.getElementById('modal');
      return !!(modal&&modal.classList.contains('open'));
    }

    function inventoryBusy(){
      return typeof pendingItemQueue!=='undefined'&&Array.isArray(pendingItemQueue)&&pendingItemQueue.length>0;
    }

    function waitUntilReady(callback){
      let attempts=0;
      const timer=setInterval(()=>{
        if((!modalBusy()&&!inventoryBusy())||++attempts>600){
          clearInterval(timer);
          callback();
        }
      },50);
    }

    function deliverNext(){
      if(!rewardQueue.length){delivering=false;return;}
      delivering=true;
      const item=rewardQueue.shift();
      originalAwardItem(item);
      waitUntilReady(()=>setTimeout(deliverNext,60));
    }

    window.queueMonsterRewards=function(count){
      const total=Math.max(0,Number(count)||0);
      for(let i=0;i<total;i++){
        const item=drawItem();
        if(item)rewardQueue.push(item);
        else if(typeof log==='function')log('No items left in the item deck.','system');
      }
      if(!delivering&&rewardQueue.length)setTimeout(deliverNext,120);
    };

    awardItem=function(item){
      if(item)return originalAwardItem(item);
      const drawn=drawItem();
      if(!drawn){if(typeof log==='function')log('No items left in the item deck.','system');return false;}
      rewardQueue.push(drawn);
      if(!delivering)setTimeout(deliverNext,40);
      return true;
    };

    return true;
  }

  function start(){
    loadLethalBlow();
    if(install())return;
    let attempts=0;
    const timer=setInterval(()=>{if(install()||++attempts>160)clearInterval(timer);},50);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  setTimeout(syncVersion,900);
})();
