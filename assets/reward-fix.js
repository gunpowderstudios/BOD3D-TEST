// BOD3D-TEST v11.38 — sequential rewards, Lethal Blow loader and final responsive warning scroll
(function(){
  const VERSION='v11.38';

  function syncVersion(){
    document.title='Bag of Dungeon 3D '+VERSION;
    const visible=document.getElementById('visibleBuildVersion');
    if(visible)visible.textContent=VERSION;
  }

  function loadLethalBlow(){
    if(document.querySelector('script[data-bod-lethal-blow]'))return;
    const script=document.createElement('script');
    script.src='assets/lethal-blow.js?v=11.38';
    script.dataset.bodLethalBlow='1';
    document.head.appendChild(script);
  }

  function installScrollOverride(){
    if(document.getElementById('bodFinalScrollStyles'))return;
    const style=document.createElement('style');
    style.id='bodFinalScrollStyles';
    style.textContent=`
      .bodWarningWrap{
        position:fixed!important;
        left:50%!important;
        top:52%!important;
        transform:translate(-50%,-50%)!important;
        width:min(88vw,calc(78vh * 1.58),760px)!important;
        height:auto!important;
        aspect-ratio:1.58/1!important;
        max-width:calc(100vw - 48px)!important;
        max-height:calc(100vh - 120px)!important;
        margin:0!important;
        overflow:visible!important;
        box-sizing:border-box!important;
        display:grid!important;
        place-items:center!important;
        z-index:1002!important;
      }
      .bodWarningWrap>.bodWarningScroll,
      .bodWarningWrap>img{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        max-width:100%!important;
        max-height:100%!important;
        object-fit:contain!important;
        display:block!important;
      }
      .bodWarningContent{
        position:relative!important;
        inset:auto!important;
        width:57%!important;
        max-width:57%!important;
        max-height:64%!important;
        margin:0!important;
        padding:0!important;
        transform:translateX(5%)!important;
        overflow:visible!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
        box-sizing:border-box!important;
        font-size:clamp(10px,.85vw,15px)!important;
        line-height:1.16!important;
        z-index:2!important;
      }
      .bodWarningContent,.bodWarningContent *{
        box-sizing:border-box!important;
        max-width:100%!important;
        white-space:normal!important;
        overflow-wrap:break-word!important;
      }
      @media (min-width:901px) and (max-height:820px){
        .bodWarningWrap{
          top:54%!important;
          width:min(82vw,calc(68vh * 1.58),680px)!important;
          max-height:calc(100vh - 96px)!important;
        }
        .bodWarningContent{font-size:clamp(9px,.72vw,13px)!important;line-height:1.12!important}
        .bodWarningContent p{margin:.18em 0!important}
        .bodWarningContent button{min-height:34px!important;padding:6px 12px!important;margin-top:.3em!important}
      }
      @media (max-width:900px){
        .bodWarningWrap{
          top:50%!important;
          width:min(96vw,calc(72dvh * 1.58),680px)!important;
          max-width:calc(100vw - 12px)!important;
          max-height:72dvh!important;
        }
        .bodWarningContent{width:68%!important;max-width:68%!important;transform:translateX(3%)!important}
      }
    `;
    document.head.appendChild(style);
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
    installScrollOverride();
    loadLethalBlow();
    if(installRewards())return;
    let attempts=0;
    const timer=setInterval(()=>{
      syncVersion();
      installScrollOverride();
      loadLethalBlow();
      if(installRewards()||++attempts>240)clearInterval(timer);
    },50);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  setTimeout(syncVersion,900);
})();