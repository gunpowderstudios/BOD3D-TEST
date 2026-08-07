from pathlib import Path

scene=Path('js/scene3d.js')
s=scene.read_text()
old="const TILE=2.05;\nconst TILE_THICKNESS=.10;\nconst PHYSICAL_TILE_MM=50;\nconst DRAGON_BASE_MM=78;\n"
new="""const TILE=2.05;
const TILE_THICKNESS=.10;
const PHYSICAL_TILE_MM=50;
const DRAGON_BASE_MM=78;
const TILE_DROP_HEIGHT=TILE*(10/PHYSICAL_TILE_MM);
const TILE_DROP_MS=400;
let pendingTileDropKey=null;
function queueTileDrop(tileKey){pendingTileDropKey=String(tileKey||'');}
function animateTileDrop(tileKey,tileBody,topMesh,sideMaterial,topMaterial){
 if(pendingTileDropKey!==tileKey)return;
 pendingTileDropKey=null;
 const bodyRestY=tileBody.position.y;
 const topRestY=topMesh.position.y;
 tileBody.position.y=bodyRestY+TILE_DROP_HEIGHT;
 topMesh.position.y=topRestY+TILE_DROP_HEIGHT;
 [sideMaterial,topMaterial].forEach(material=>{material.transparent=true;material.opacity=0;material.depthWrite=false;material.needsUpdate=true;});
 const started=performance.now();
 const frame=now=>{
  const t=Math.min(1,(now-started)/TILE_DROP_MS);
  const fall=1-Math.pow(1-t,3);
  const fade=Math.min(1,t/.72);
  tileBody.position.y=THREE.MathUtils.lerp(bodyRestY+TILE_DROP_HEIGHT,bodyRestY,fall);
  topMesh.position.y=THREE.MathUtils.lerp(topRestY+TILE_DROP_HEIGHT,topRestY,fall);
  sideMaterial.opacity=fade;topMaterial.opacity=fade;
  if(t<1){requestAnimationFrame(frame);return;}
  tileBody.position.y=bodyRestY;topMesh.position.y=topRestY;
  [sideMaterial,topMaterial].forEach(material=>{material.opacity=1;material.transparent=false;material.depthWrite=true;material.needsUpdate=true;});
  if(typeof sndTile==='function')sndTile();else if(typeof playSound==='function')playSound('tile');
 };
 requestAnimationFrame(frame);
}
"""
if old not in s:
    raise SystemExit('constants block not found')
s=s.replace(old,new,1)

add_tile=s.find('async function addTile(')
if add_tile<0:
    raise SystemExit('addTile function not found')
mesh_add=s.find('boardGroup.add(mesh);',add_tile)
if mesh_add<0:
    raise SystemExit('tile mesh add not found')
insert_at=mesh_add+len('boardGroup.add(mesh);')
s=s[:insert_at]+"\n animateTileDrop(key,tileBody,mesh,sideMaterial,topMaterial);"+s[insert_at:]

old="window.BOD3D={\n render:renderBoard,\n clearDice3D,\n"
new="window.BOD3D={\n render:renderBoard,\n clearDice3D,\n queueTileDrop,\n"
if old not in s:
    raise SystemExit('export block not found')
scene.write_text(s.replace(old,new,1))

game=Path('js/game.js')
g=game.read_text()
place_start=g.find("document.getElementById('placeBtn').onclick")
if place_start<0:
    raise SystemExit('placement handler not found')
place_end=g.find('function placeExitAndRing',place_start)
snd_pos=g.find('sndTile();',place_start)
if snd_pos<0 or (place_end>=0 and snd_pos>place_end):
    raise SystemExit('placement sndTile call not found')
g=g[:snd_pos]+"window.BOD3D?.queueTileDrop?.(key(nx,ny));"+g[snd_pos+len('sndTile();'):]
game.write_text(g)

index=Path('index.html')
h=index.read_text()
h=h.replace('data-build-version="v13.25"','data-build-version="v13.26"',1)
h=h.replace('js/game.js?cache=20260807-health-hud-v1322','js/game.js?cache=20260807-tile-drop-v1326',1)
h=h.replace('js/scene3d.js?cache=20260807-combat-pulse-v1316','js/scene3d.js?cache=20260807-tile-drop-v1326',1)
index.write_text(h)
