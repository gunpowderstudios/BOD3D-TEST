window.ASSET_PATHS = {
  "Start": "assets/tiles/start.png",
  "Exit": "assets/tiles/exit.png",
  "Straight": "assets/tiles/straight.png",
  "Corner": "assets/tiles/corner.png",
  "T-Junction": "assets/tiles/tjunction.png",
  "Crossroad": "assets/tiles/crossroad.png",
  "Spike Trap": "assets/tiles/spiketrap.png",
  "Healing Pool": "assets/tiles/healingpool.png",
  "Hidden Monster": "assets/ui/hiddenmonster.png",
  "Ring": "assets/ui/ring.png",

  "Sirrus the Fighter": "assets/heroes/sirrus.png",
  "Tamara the Fighter": "assets/heroes/tamara.png",
  "Duric the Dwarf": "assets/heroes/duric.png",
  "Marria the Dwarf": "assets/heroes/marria.png",
  "Rill the Healer": "assets/heroes/rill.png",
  "Tarak the Healer": "assets/heroes/tarak.png",
  "Alendra the Elf": "assets/heroes/alendra.png",
  "Galhorn the Elf": "assets/heroes/galhorn.png",

  "Goblin": "assets/monsters/goblin.png",
  "Zombie": "assets/monsters/zombie.png",
  "Mummy": "assets/monsters/mummy.png",
  "Monk": "assets/monsters/monk.png",
  "Mud Monster": "assets/monsters/mudmonster.png",
  "Werewolf": "assets/monsters/werewolf.png",
  "Troll": "assets/monsters/troll.png",
  "Minotaur": "assets/monsters/minotaur.png",
  "Skeleton": "assets/monsters/skeleton.png",
  "Giant Snake": "assets/monsters/giantsnake.png",
  "Reacher": "assets/monsters/reacher.png",
  "Mirror Monster": "assets/monsters/mirrormonster.png",
  "Dragon": "assets/monsters/dragon.png"
};

// TEST-only: keep the loading-screen logo repository-relative so it works on
// /BOD3D-TEST/ as well as when the project is copied elsewhere.
(function fixTestLoadingLogo(){
  function apply(){
    const logo=document.getElementById('heroSelectLogo');
    if(!logo)return false;
    logo.style.display='';
    logo.src='./assets/ui/bod3d-logo.png';
    return true;
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      if(apply())return;
      let tries=0;
      const timer=setInterval(()=>{if(apply()||++tries>=50)clearInterval(timer);},100);
    },{once:true});
  }else if(!apply()){
    let tries=0;
    const timer=setInterval(()=>{if(apply()||++tries>=50)clearInterval(timer);},100);
  }
})();

// v11.23 TEST: show the current version consistently wherever the UI exposes it.
(function syncTestVersion(){
  const version='v11.23';
  function apply(){
    document.title='Bag of Dungeon 3D '+version;
    ['bodVersionUnderLogo','topLogoVersion'].forEach(id=>{
      const el=document.getElementById(id);
      if(el)el.textContent=version;
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
  // The legacy start-screen code may populate its version label slightly later.
  setTimeout(apply,1000);
})();

// v11.23 TEST: mute only dungeon-sounds.mp3. Other effects and music are untouched.
(function installDungeonAmbienceToggle(){
  let muted=false;
  let button=null;

  function findDungeonAudio(){
    const audios=[...document.querySelectorAll('audio')];
    return audios.find(audio=>{
      const src=(audio.currentSrc||audio.src||audio.getAttribute('src')||'').toLowerCase();
      return src.includes('dungeon-sounds.mp3');
    })||null;
  }

  function applyMute(){
    const audio=findDungeonAudio();
    if(audio)audio.muted=muted;
    if(button){
      button.textContent=muted?'🔇':'🔊';
      button.title=muted?'Dungeon ambience off':'Dungeon ambience on';
      button.setAttribute('aria-label',button.title);
    }
  }

  function install(){
    if(document.getElementById('dungeonSoundToggle'))return true;
    const fullscreen=document.getElementById('fullscreenBtn');
    if(!fullscreen||!fullscreen.parentNode)return false;
    button=document.createElement('button');
    button.id='dungeonSoundToggle';
    button.type='button';
    button.textContent='🔊';
    button.title='Dungeon ambience on';
    button.setAttribute('aria-label',button.title);
    button.style.cssText='position:absolute;top:10px;right:52px;z-index:65;width:34px;height:34px;padding:0;display:flex;align-items:center;justify-content:center;border:2px solid var(--ink);border-radius:5px;background:var(--cream);color:var(--ink);box-shadow:2px 2px 0 #000;font:700 18px/1 Arial,sans-serif;pointer-events:auto';
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      muted=!muted;
      applyMute();
    });
    fullscreen.parentNode.insertBefore(button,fullscreen);
    return true;
  }

  function start(){
    if(!install()){
      let tries=0;
      const timer=setInterval(()=>{if(install()||++tries>=50)clearInterval(timer);},100);
    }
    // dungeon-sounds.mp3 can be created after the button, so briefly keep its
    // mute state in sync without touching any other Audio object.
    let checks=0;
    const sync=setInterval(()=>{
      applyMute();
      if(++checks>=50)clearInterval(sync);
    },100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();