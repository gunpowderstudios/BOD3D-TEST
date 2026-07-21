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
