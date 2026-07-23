// BOD3D-TEST v11.56 — force warning Enter button text black at runtime
(function(){
  function apply(){
    const modal=document.getElementById('modal');
    if(!modal)return;
    modal.querySelectorAll('#modalButtons button').forEach(button=>{
      if(!/enter at your own risk/i.test(button.textContent||''))return;
      button.classList.remove('green','red','blue');
      button.classList.add('warningEnterButton');
      button.style.setProperty('color','#000','important');
      button.style.setProperty('-webkit-text-fill-color','#000','important');
      button.style.setProperty('text-shadow','none','important');
      button.style.setProperty('background','#efe0b7','important');
      button.style.setProperty('border-color','#000','important');
    });
  }
  function start(){
    apply();
    const modal=document.getElementById('modal');
    if(modal)new MutationObserver(apply).observe(modal,{subtree:true,childList:true,characterData:true,attributes:true});
    ['pointerover','pointerdown','focusin','touchstart'].forEach(type=>document.addEventListener(type,apply,true));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();