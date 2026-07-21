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

// BOD3D-TEST: keep the loading-screen logo repository-relative so this build
// works from /BOD3D-TEST/ as well as from a local checkout.
(function fixLoadingScreenLogoPath(){
  function applyLogoPath(){
    const logo = document.getElementById('heroSelectLogo');
    if (!logo) return;
    const testLogoPath = './assets/ui/bod3d-logo.png?v=test-logo-fix-1';
    if (!logo.src.includes('/BOD3D-TEST/assets/ui/bod3d-logo.png')) {
      logo.style.display = '';
      logo.src = testLogoPath;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLogoPath, { once: true });
  } else {
    applyLogoPath();
  }
})();

// v11.23 — Dungeon ambience-only mute button beside Full Screen.
// This deliberately blocks only dungeon-sounds.mp3; combat, dice, spell,
// monster and start-screen sounds continue to play normally.
(function installDungeonAmbienceToggle(){
  const VERSION_LABEL = 'v11.23';
  let dungeonMuted = false;

  // Block only the dungeon ambience at the Audio.play() boundary. This also
  // prevents an internal ambience restart from overriding the player's mute.
  if (!HTMLMediaElement.prototype.__bodDungeonMutePatched) {
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function(){
      const src = String(this.currentSrc || this.src || '');
      if (window.__BOD_DUNGEON_AMBIENCE_MUTED__ && /(?:^|\/)dungeon-sounds\.mp3(?:\?|$)/i.test(src)) {
        try { this.pause(); } catch (_) {}
        return Promise.resolve();
      }
      return originalPlay.apply(this, arguments);
    };
    HTMLMediaElement.prototype.__bodDungeonMutePatched = true;
  }

  function updateVersionLabel(){
    document.title = 'Bag of Dungeon 3D ' + VERSION_LABEL;
    ['bodVersionUnderLogo','topLogoVersion'].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.textContent=VERSION_LABEL;
    });
    document.querySelectorAll('.buildVersion,.version').forEach(el=>{
      if(/v11\.22/.test(el.textContent||'')) el.textContent=(el.textContent||'').replace(/v11\.22/g,VERSION_LABEL);
    });
  }

  function updateButton(button){
    button.textContent = dungeonMuted ? '🔇' : '🔊';
    button.title = dungeonMuted ? 'Dungeon ambience off — click to turn on' : 'Dungeon ambience on — click to turn off';
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-pressed', dungeonMuted ? 'true' : 'false');
  }

  function installButton(){
    if(document.getElementById('dungeonSoundToggle')) return true;
    const fullscreen=document.getElementById('fullscreenBtn');
    if(!fullscreen) return false;

    const style=document.createElement('style');
    style.id='dungeonSoundToggleStyles';
    style.textContent=`
      #dungeonSoundToggle{position:absolute;top:10px;right:50px;z-index:66;width:34px;height:34px;padding:0;display:flex;align-items:center;justify-content:center;border:2px solid var(--ink);border-radius:5px;background:var(--cream);color:var(--ink);box-shadow:2px 2px 0 #000;font:700 18px/1 Arial,sans-serif;pointer-events:auto;cursor:pointer}
      #dungeonSoundToggle:hover{background:#fff1c9}
      #topbar{right:92px!important}
    `;
    document.head.appendChild(style);

    const button=document.createElement('button');
    button.id='dungeonSoundToggle';
    button.type='button';
    updateButton(button);
    button.addEventListener('click',()=>{
      dungeonMuted=!dungeonMuted;
      window.__BOD_DUNGEON_AMBIENCE_MUTED__=dungeonMuted;
      if(dungeonMuted){
        window.stopDungeonAmbience?.();
      }else{
        window.startDungeonAmbience?.();
      }
      updateButton(button);
    });
    fullscreen.insertAdjacentElement('beforebegin',button);
    return true;
  }

  function boot(){
    window.__BOD_DUNGEON_AMBIENCE_MUTED__=false;
    updateVersionLabel();
    // Legacy code creates the small under-logo version label slightly later.
    // Correct it once after that setup has completed; no observer or loop.
    setTimeout(updateVersionLabel, 750);
    if(!installButton()){
      let tries=0;
      const timer=setInterval(()=>{
        updateVersionLabel();
        if(installButton() || ++tries>100) clearInterval(timer);
      },50);
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();