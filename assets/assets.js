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

// BOD3D-TEST dice experiment: give each roll a short screen-space "player throw"
// from the near/front edge of the screen, then hand off to the existing calibrated
// GLB dice for their final bounce and settle. The actual rolled values, calibrated
// top faces and final board positions remain controlled by the normal 3D roller.
(function installPlayerDiceThrowExperiment(){
  const THROW_MS = 360;
  const HANDOFF_DROP_HEIGHT = 0.38;
  const HANDOFF_DURATION = 760;
  let installed = false;

  const facePips = {
    1: [[50,50]],
    2: [[30,30],[70,70]],
    3: [[30,30],[50,50],[70,70]],
    4: [[30,30],[70,30],[30,70],[70,70]],
    5: [[30,30],[70,30],[50,50],[30,70],[70,70]],
    6: [[30,27],[70,27],[30,50],[70,50],[30,73],[70,73]]
  };

  function ensureStyles(){
    if (document.getElementById('bodDiceThrowStyles')) return;
    const style = document.createElement('style');
    style.id = 'bodDiceThrowStyles';
    style.textContent = `
      .bodDiceThrowLayer{position:fixed;inset:0;z-index:9998;pointer-events:none;overflow:hidden;perspective:900px}
      .bodDiceThrowProxy{position:absolute;width:52px;height:52px;border-radius:8px;box-sizing:border-box;transform-style:preserve-3d;will-change:transform,opacity;filter:drop-shadow(0 10px 8px rgba(0,0,0,.48))}
      .bodDiceThrowProxy.hero{background:#171717;border:2px solid #050505;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
      .bodDiceThrowProxy.monster{background:#a51f19;border:2px solid #54100d;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}
      .bodDiceThrowPip{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:#f2e6c7;box-shadow:0 1px 1px rgba(0,0,0,.45)}
      @media (max-width:800px){.bodDiceThrowProxy{width:44px;height:44px;border-radius:7px}.bodDiceThrowPip{width:7px;height:7px;margin:-3.5px 0 0 -3.5px}}
    `;
    document.head.appendChild(style);
  }

  function makeProxy(value, role){
    const die = document.createElement('div');
    die.className = 'bodDiceThrowProxy ' + (role === 'monster' ? 'monster' : 'hero');
    (facePips[Number(value)] || facePips[1]).forEach(([x,y]) => {
      const pip = document.createElement('i');
      pip.className = 'bodDiceThrowPip';
      pip.style.left = x + '%';
      pip.style.top = y + '%';
      die.appendChild(pip);
    });
    return die;
  }

  function throwTarget(role, index, count){
    const mobile = window.innerWidth <= 800;
    const spread = mobile ? 42 : 64;
    const baseX = role === 'monster' ? window.innerWidth * 0.61 : window.innerWidth * 0.39;
    const x = baseX + (index - (count - 1) / 2) * spread;
    const y = window.innerHeight * (mobile ? 0.46 : 0.50);
    return {x,y};
  }

  function animateProxySet(values, role){
    values = (Array.isArray(values) ? values : [values]).map(Number).filter(v => v >= 1 && v <= 6);
    if (!values.length) return Promise.resolve();
    ensureStyles();
    let layer = document.querySelector('.bodDiceThrowLayer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'bodDiceThrowLayer';
      document.body.appendChild(layer);
    }

    const promises = values.map((value, i) => new Promise(resolve => {
      const die = makeProxy(value, role);
      const target = throwTarget(role, i, values.length);
      const startX = window.innerWidth * 0.50 + (i - (values.length - 1) / 2) * 26;
      const startY = window.innerHeight + 45 + i * 7;
      die.style.left = '0';
      die.style.top = '0';
      die.style.opacity = '0';
      die.style.transform = `translate3d(${startX}px,${startY}px,160px) rotateX(18deg) rotateY(0deg) rotateZ(0deg) scale(1.32)`;
      layer.appendChild(die);

      const delay = i * 45;
      const animation = die.animate([
        {offset:0, opacity:0, transform:`translate3d(${startX}px,${startY}px,160px) rotateX(20deg) rotateY(0deg) rotateZ(0deg) scale(1.34)`},
        {offset:.12, opacity:1, transform:`translate3d(${startX + (target.x-startX)*.14}px,${startY + (target.y-startY)*.14 - 38}px,125px) rotateX(150deg) rotateY(120deg) rotateZ(80deg) scale(1.22)`},
        {offset:.58, opacity:1, transform:`translate3d(${startX + (target.x-startX)*.62}px,${startY + (target.y-startY)*.62 - 92}px,42px) rotateX(430deg) rotateY(360deg) rotateZ(300deg) scale(.94)`},
        {offset:1, opacity:.10, transform:`translate3d(${target.x}px,${target.y}px,0px) rotateX(720deg) rotateY(600deg) rotateZ(520deg) scale(.72)`}
      ],{
        duration:THROW_MS,
        delay,
        easing:'cubic-bezier(.16,.72,.24,1)',
        fill:'forwards'
      });
      animation.onfinish = () => { die.remove(); resolve(); };
      animation.oncancel = () => { die.remove(); resolve(); };
    }));

    return Promise.all(promises).then(() => {
      if (layer && !layer.children.length) layer.remove();
    });
  }

  function withShortLanding(originalCall){
    const roller = window.BODDice3D;
    if (!roller || !roller.tuning) return Promise.resolve(originalCall());
    const oldDrop = roller.tuning.dropHeight;
    const oldDuration = roller.tuning.duration;
    roller.setTuning?.({dropHeight:HANDOFF_DROP_HEIGHT,duration:HANDOFF_DURATION});
    return Promise.resolve(originalCall()).finally(() => {
      roller.setTuning?.({dropHeight:oldDrop,duration:oldDuration});
    });
  }

  function install(){
    const roller = window.BODDice3D;
    if (!roller || installed || roller.__playerThrowWrapped) return !!roller;
    installed = true;
    roller.__playerThrowWrapped = true;
    const originalRoll = roller.roll.bind(roller);
    const originalCombat = roller.rollCombat.bind(roller);

    roller.roll = async function(values, role='hero'){
      await animateProxySet(values, role);
      return withShortLanding(() => originalRoll(values, role));
    };

    roller.rollCombat = async function(heroValues, monsterValues){
      await Promise.all([
        animateProxySet(heroValues, 'hero'),
        animateProxySet(monsterValues, 'monster')
      ]);
      return withShortLanding(() => originalCombat(heroValues, monsterValues));
    };
    console.info('BOD3D-TEST player-thrown dice experiment installed');
    return true;
  }

  if (!install()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (install() || tries > 160) clearInterval(timer);
    }, 50);
  }
})();
