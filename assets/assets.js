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

// TEST-only: the LIVE build may reference the loading-screen logo through the
// /BOD3D/ site path. Force the TEST build to use its own repository-relative
// copy without changing any other game behaviour.
(function fixTestLoadingLogo(){
  function apply(){
    const logo = document.getElementById('heroSelectLogo');
    if (!logo) return false;
    logo.style.display = '';
    logo.src = './assets/ui/bod3d-logo.png';
    return true;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ()=>{
      if (apply()) return;
      let tries = 0;
      const timer = setInterval(()=>{
        if (apply() || ++tries >= 50) clearInterval(timer);
      },100);
    }, {once:true});
  } else if (!apply()) {
    let tries = 0;
    const timer = setInterval(()=>{
      if (apply() || ++tries >= 50) clearInterval(timer);
    },100);
  }
})();
