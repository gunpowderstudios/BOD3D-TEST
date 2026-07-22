// BOD3D-TEST v11.40 — sequential rewards, Lethal Blow and responsive warning scroll
(function(){
  const VERSION='v11.40';

  function syncVersion(){
    document.title='Bag of Dungeon 3D '+VERSION;
    const visible=document.getElementById('visibleBuildVersion');
    if(visible)visible.textContent=VERSION;
  }

  function loadLethalBlow(){
    if(document.querySelector('script[data-bod-lethal-blow]'))return;
    const script=document.createElement('script');
    script.src='assets/lethal-blow.js?v=11.40';
    script.dataset.bodLethalBlow='1';
    document.head.appendChild(script);
  }

  function loadWarningScrollStyles(){
    if(document.querySelector('link[data-bod-warning-scroll]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='css/warning-scroll.css?v=11.40';
    link.dataset.bodWarningScroll='1';
    document.head.appendChild(link);
  }

  function installRewards(){
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
        if((!modalBusy()&&!inventoryBusy())||++attempts>1200){
          clearInterval(timer);
          callback();
        }
      },50);
    }

    function deliverNext(){
      if(!rewardQueue.length){delivering=false;return;}
      delivering=true;
      const item=rewardQueue.shift();
      const delivered=originalAwardItem(item);
      if(delivered===false&&typeof log==='function')log('Could not deliver '+item.name+'; continuing with remaining rewards.','system');
      waitUntilReady(()=>setTimeout(deliverNext,80));
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
      const drawn=item||drawItem();
      if(!drawn){if(typeof log==='function')log('No items left in the item deck.','system');return false;}
      rewardQueue.push(drawn);
      if(!delivering)setTimeout(deliverNext,40);
      return true;
    };

    return true;
  }

  function start(){
    syncVersion();
    loadWarningScrollStyles();
    loadLethalBlow();
    if(installRewards())return;
    let attempts=0;
    const timer=setInterval(()=>{
      syncVersion();
      loadWarningScrollStyles();
      loadLethalBlow();
      if(installRewards()||++attempts>240)clearInterval(timer);
    },50);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  setTimeout(syncVersion,900);
})();
