// v10.98 dice ground-plane normaliser: keeps every settled die on the same board surface.
(function(){
  window.BOD3D_DICE_DEFAULTS = Object.assign({}, window.BOD3D_DICE_DEFAULTS || {}, {
    duration:1050, dropHeight:2.5, bounce1:1, bounce2:0.02, bounce3:0.06, separation:0.55, spacing:0.9, floorOffset:0.03
  });
  function normaliseSettledDice(){
    try{
      const scene = window.scene || window.gameScene || window.threeScene;
      const THREEref = window.THREE;
      if(!scene || !THREEref) return;
      const dice=[];
      scene.traverse(o=>{
        const n=(o.name||'').toLowerCase();
        if(n.includes('dice') && o.visible && o.userData && (o.userData.isDice||o.userData.die||o.userData.diceType)) dice.push(o);
      });
      if(!dice.length) return;
      let boardY = null;
      // Prefer explicit shared plane values if the game exposes one.
      const candidates=[window.diceBoardY,window.tileTopY,window.boardSurfaceY,window.DICE_BOARD_Y];
      for(const v of candidates){ if(Number.isFinite(v)){ boardY=v; break; } }
      if(boardY===null){
        // Infer a common plane from the lowest current die bottoms, then use the minimum so none float above another.
        const bottoms=dice.map(d=>{ const box=new THREEref.Box3().setFromObject(d); return box.min.y; }).filter(Number.isFinite);
        if(!bottoms.length) return;
        boardY=Math.min(...bottoms)-0.2;
      }
      const targetBottom=boardY+0.2;
      dice.forEach(d=>{
        const box=new THREEref.Box3().setFromObject(d);
        if(!Number.isFinite(box.min.y)) return;
        d.position.y += (targetBottom-box.min.y);
      });
    }catch(e){ console.warn('Dice ground normaliser:',e); }
  }
  // Run after likely roll durations; repeated briefly to catch staggered multi-die settles.
  window.addEventListener('load',()=>{
    /* v10.99: disabled legacy interval normaliser; grounding is now exact per die at settle time. */
  });
})();



window.RESPAWN_CAMERA_DELAY_MS=2000;
window.RESPAWN_CENTER_ON_START=true;

