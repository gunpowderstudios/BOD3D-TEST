// BOD3D TEST — Story Mode prototype v13.78
(function(){
 'use strict';
 if(window.__bodStoryModeInstalled)return;
 window.__bodStoryModeInstalled=true;

 const STORY_PARTS=[
  'Story text for Part 1 goes here…',
  'Story text for Part 2 goes here…',
  'Story text for Part 3 goes here…',
  'Story text for Part 4 goes here…',
  'Story text for Part 5 goes here…',
  'Story text for Part 6 goes here…'
 ];
 let mode='hack';
 let nextPart=1;
 let pendingHero=null;

 const style=document.createElement('style');
 style.textContent=`
 #bodStoryNearby{
  position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);z-index:70;
  pointer-events:auto;cursor:pointer;border:0;background:transparent;padding:8px;
  font-size:44px;line-height:1;filter:drop-shadow(0 3px 5px #000);
  animation:bodStoryFloat 1.5s ease-in-out infinite;text-shadow:0 0 12px #e8c878;
  touch-action:manipulation;
 }
 #bodStoryNearby:focus-visible{outline:2px solid #fff;outline-offset:4px;border-radius:8px;}
 @keyframes bodStoryFloat{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-8px)}}
 .bodStoryPaper{font-family:Georgia,serif;font-size:17px;line-height:1.55;text-align:left;padding:12px 8px;color:#f2e2b8;}
 `;
 document.head.appendChild(style);

 function host(){return document.getElementById('viewport')||document.getElementById('threeBoard')||document.body;}
 function removeNearby(){document.getElementById('bodStoryNearby')?.remove();}
 function removeCounter(){document.getElementById('bodStoryCounter')?.remove();}

 function storyTileInReach(){
  if(mode!=='story'||typeof state==='undefined'||!state?.player)return null;
  const p=state.player;
  const current=getTile(p.x,p.y);
  if(current?.storyPart&&!current.storyRead)return current;
  for(const d of Object.values(DIRS||{})){
   const t=getTile(p.x+d.dx,p.y+d.dy);
   if(t?.storyPart&&!t.storyRead)return t;
  }
  return null;
 }

 function storyPopup(part){
  showModal('YOU HAVE FOUND PART '+part,'',[{text:'Continue',cls:'green',fn:closeModal}]);
  const body=document.getElementById('modalBody');
  if(body)body.innerHTML='<div class="bodStoryPaper">'+STORY_PARTS[part-1]+'</div>';
 }
 function wrongOrderPopup(part){
  showModal('STORY SCROLL '+part,'You have found Part '+part+', but the story must be uncovered in order. Find the previous scroll'+(nextPart>1?' — Part '+nextPart+' is next.':'s first — Part 1 is still missing.')+'',[{text:'Keep Searching',fn:closeModal}]);
 }
 function readStoryTile(tile){
  if(!tile?.storyPart||tile.storyRead)return;
  const part=Number(tile.storyPart);
  if(part!==nextPart){wrongOrderPopup(part);return;}
  tile.storyRead=true;nextPart++;
  log('Story scroll Part '+part+' discovered.','loot');
  storyPopup(part);updateNearby();
 }
 function updateNearby(){
  removeNearby();removeCounter();
  const tile=storyTileInReach();
  if(!tile)return;
  const part=Number(tile.storyPart);
  const el=document.createElement('button');
  el.type='button';el.id='bodStoryNearby';el.textContent='📜';el.title='Open story scroll';
  el.setAttribute('aria-label','Open story scroll Part '+part);
  el.addEventListener('click',()=>readStoryTile(tile));
  host().appendChild(el);
 }

 const originalStartGame=startGame;
 startGame=function(c){
  pendingHero=c;audio();
  showModal('CHOOSE YOUR ADVENTURE','How do you want to enter the dungeon?',[{
   text:'STORY MODE',cls:'green',fn:()=>{mode='story';nextPart=1;closeModal();originalStartGame(pendingHero);}
  },{
   text:"HACK 'N' SLASH",fn:()=>{mode='hack';nextPart=1;closeModal();originalStartGame(pendingHero);}
  }]);
 };

 // Story Mode: 90–100 tiles total, 20–24 ordinary monster locations, six story scrolls.
 // It deliberately removes the standard M2–M12 numbering; Hack 'n' Slash remains unchanged.
 const originalCreateTileDeck=createTileDeck;
 createTileDeck=function(){
  let deck=originalCreateTileDeck.apply(this,arguments);
  if(mode!=='story')return deck;
  const exit=deck.find(t=>t.kind==='exit')||{kind:'exit'};
  let floors=deck.filter(t=>t!==exit&&t.kind!=='exit');
  const targetTotal=90+Math.floor(Math.random()*11);
  const kinds=['straight','straight','straight','corner','corner','corner','t','cross'];
  while(floors.length<targetTotal-1)floors.push({kind:kinds[Math.floor(Math.random()*kinds.length)]});

  // Strip the short-game M system and rebuild monster locations for the larger story dungeon.
  floors.forEach(t=>{delete t.monsterMarker;delete t.mNumber;delete t.storyPart;delete t.storyRead;});
  const ordinary=floors.filter(t=>!['spike','pool'].includes(t.kind));
  const monsterCount=20+Math.floor(Math.random()*5);
  shuffle(ordinary).slice(0,monsterCount).forEach(t=>{t.monsterMarker=true;});

  // Six story scrolls live on otherwise ordinary floor tiles and do not overlap monsters/items/traps/pool.
  const storyCandidates=shuffle(floors.filter(t=>!t.monsterMarker&&!t.itemMarker&&!['spike','pool'].includes(t.kind))).slice(0,6);
  storyCandidates.forEach((t,i)=>{t.storyPart=i+1;});
  return [exit,...shuffle(floors)];
 };

 // Story Mode no longer rolls M2–M12 for the Ring when the Exit appears.
 // Instead, after the Exit is laid the Ring is placed on a random previously-laid ordinary monster tile.
 // This keeps the Ring as a physical dungeon objective while freeing Story Mode from numbered M tiles.
 const originalPlaceExitAndRing=placeExitAndRing;
 placeExitAndRing=function(x,y,fromTile){
  if(mode!=='story')return originalPlaceExitAndRing.apply(this,arguments);

  state.exitPlaced=true;
  const exitKey=key(x,y);
  const exitTile=state.tiles[exitKey]||fromTile;
  exitTile.kind='exit';
  exitTile.rot=Number(exitTile.rot)||0;
  exitTile.opens=openings('exit',exitTile.rot);
  exitTile.visited=!!exitTile.visited;
  delete exitTile.monsterMarker;delete exitTile.monsterPending;delete exitTile.mNumber;
  delete exitTile.itemMarker;delete exitTile.itemPending;delete exitTile.item;
  exitTile.monster={name:'Red Dragon',dice:4,mod:0,maxHealth:20,health:20,glyph:'🐉',revealed:true,isDragon:true};
  state.tiles[exitKey]=exitTile;

  const candidates=shuffle(Object.entries(state.tiles).filter(([kk,t])=>kk!==exitKey&&t.kind!=='start'&&t.kind!=='spike'&&t.kind!=='pool'&&(t.monsterPending||(t.monster&&!t.monster.isDragon))));
  const fallback=shuffle(Object.entries(state.tiles).filter(([kk,t])=>kk!==exitKey&&t.kind!=='start'&&t.kind!=='spike'&&t.kind!=='pool'));
  const chosen=(candidates[0]||fallback[0]||null);
  state.ringActivated=true;state.ringNumber=null;state.ringRoll=null;state.ringKey=chosen?chosen[0]:null;
  if(chosen){chosen[1].hasRing=true;chosen[1].ringReveal=true;setTimeout(()=>{if(chosen[1]){chosen[1].ringReveal=false;render();}},3000);}

  playSound('dragon');playTileEffect(exitKey,'dragon',1400);
  const exitMessage=state.player.hasRing
   ?'You have found the Exit—and you hold the Ring of Creation! Defeat the Red Dragon to escape the dungeon.'
   :'You have found the Exit—but none shall pass the Red Dragon without the Ring of Creation! Somewhere in the dungeon a monster guards the Ring. Find it, then return to face her.';
  showModal('THE EXIT!',exitMessage,[{text:'Continue',cls:'green',fn:closeModal}]);
  log('The final dungeon tile is laid. The Exit appears and the Red Dragon guards it.','loot');
  if(chosen){
   log('The Ring of Creation has appeared somewhere among the monsters already discovered in the dungeon.','loot');
   const ringTile=chosen[1];
   if(ringTile.monsterPending||(ringTile.monster&&ringTile.monster.health>0))log('A monster guards the Ring. It must be defeated before the Ring can be collected.','combat');
  }
 };

 const placeBtn=document.getElementById('placeBtn');
 if(placeBtn){
  placeBtn.addEventListener('click',()=>{
   if(mode!=='story'||!placement?.raw?.storyPart)return;
   const dir=placement.dir,part=placement.raw.storyPart,p=state.player,d=DIRS[dir];
   setTimeout(()=>{const t=getTile(p.x+d.dx,p.y+d.dy);if(t){t.storyPart=part;t.storyRead=false;}updateNearby();},0);
  },true);
 }

 const originalMove=move;
 move=function(dir){const result=originalMove.apply(this,arguments);setTimeout(updateNearby,60);return result;};
 const originalNewGame=newGame;
 newGame=function(){nextPart=1;removeNearby();removeCounter();const result=originalNewGame.apply(this,arguments);setTimeout(()=>{removeCounter();updateNearby();},300);return result;};

 window.BODStoryMode={get mode(){return mode;},get nextPart(){return nextPart;},parts:STORY_PARTS};
})();

// Match LIVE: keep only one visible Enter the Dungeon button, with the same spacing.
(function(){
 function fixIntroButton(){
  const modal=document.getElementById('modal');
  if(!modal||!modal.classList.contains('introScrollModal')||!modal.querySelector('.testerWarningScroll'))return;
  const buttons=[...modal.querySelectorAll('button')].filter(button=>{
   if((button.textContent||'').trim().toLowerCase()!=='enter the dungeon')return false;
   const style=getComputedStyle(button);
   return style.display!=='none'&&style.visibility!=='hidden'&&button.getClientRects().length>0;
  });
  if(!buttons.length)return;
  buttons.sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);
  const keep=buttons[0];keep.style.setProperty('margin-top','20px','important');buttons.slice(1).forEach(button=>button.remove());
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fixIntroButton,{once:true});else fixIntroButton();
 new MutationObserver(fixIntroButton).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
})();
