// BOD3D TEST — Story Mode prototype v13.74
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
 #bodStoryNearby{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);z-index:70;pointer-events:none;font-size:44px;filter:drop-shadow(0 3px 5px #000);animation:bodStoryFloat 1.5s ease-in-out infinite;text-shadow:0 0 12px #e8c878;}
 #bodStoryCounter{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:65;background:rgba(0,0,0,.68);border:1px solid rgba(232,200,120,.6);border-radius:7px;padding:5px 10px;color:#f4dfad;font-size:13px;font-weight:700;pointer-events:none;}
 @keyframes bodStoryFloat{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-8px)}}
 .bodStoryPaper{font-family:Georgia,serif;font-size:17px;line-height:1.55;text-align:left;padding:12px 8px;color:#f2e2b8;}
 `;
 document.head.appendChild(style);

 function host(){return document.getElementById('viewport')||document.getElementById('threeBoard')||document.body;}
 function removeNearby(){document.getElementById('bodStoryNearby')?.remove();}
 function updateCounter(){
  let el=document.getElementById('bodStoryCounter');
  if(mode!=='story'||typeof state==='undefined'||!state?.player){el?.remove();return;}
  if(!el){el=document.createElement('div');el.id='bodStoryCounter';host().appendChild(el);}
  el.textContent='STORY '+Math.min(nextPart-1,6)+' / 6';
 }
 function adjacentStoryTile(){
  if(mode!=='story'||typeof state==='undefined'||!state?.player)return null;
  const p=state.player;
  for(const d of Object.values(DIRS||{})){
   const t=getTile(p.x+d.dx,p.y+d.dy);
   if(t?.storyPart&&!t.storyRead)return t;
  }
  return null;
 }
 function updateNearby(){
  removeNearby();updateCounter();
  const t=adjacentStoryTile();
  if(!t)return;
  const el=document.createElement('div');el.id='bodStoryNearby';el.textContent='📜';el.title='A story scroll is nearby';host().appendChild(el);
 }
 function storyPopup(part){
  showModal('YOU HAVE FOUND PART '+part,'',[{text:'Continue',cls:'green',fn:closeModal}]);
  const body=document.getElementById('modalBody');
  if(body)body.innerHTML='<div class="bodStoryPaper">'+STORY_PARTS[part-1]+'</div>';
 }
 function wrongOrderPopup(part){
  showModal('STORY SCROLL '+part,'You have found Part '+part+', but the story must be uncovered in order. Find the previous scroll'+(nextPart>1?' — Part '+nextPart+' is next.':'s first — Part 1 is still missing.')+'',[{text:'Keep Searching',fn:closeModal}]);
 }
 function checkCurrentStory(){
  if(mode!=='story'||typeof state==='undefined'||!state?.player)return;
  const t=getTile(state.player.x,state.player.y);
  if(!t?.storyPart||t.storyRead)return;
  const part=Number(t.storyPart);
  if(part!==nextPart){wrongOrderPopup(part);return;}
  t.storyRead=true;nextPart++;
  log('Story scroll Part '+part+' discovered.','loot');
  storyPopup(part);updateCounter();
 }

 // Choose the game style after the hero has been selected.
 const originalStartGame=startGame;
 startGame=function(c){
  pendingHero=c;
  audio();
  showModal('CHOOSE YOUR ADVENTURE','How do you want to enter the dungeon?',[{
   text:'STORY MODE',cls:'green',fn:()=>{mode='story';nextPart=1;closeModal();originalStartGame(pendingHero);}
  },{
   text:"HACK 'N' SLASH",fn:()=>{mode='hack';nextPart=1;closeModal();originalStartGame(pendingHero);}
  }]);
 };

 // Story Mode uses a much larger 90–100 tile dungeon. Hack 'n' Slash is unchanged.
 const originalCreateTileDeck=createTileDeck;
 createTileDeck=function(){
  let deck=originalCreateTileDeck.apply(this,arguments);
  if(mode!=='story')return deck;
  const exit=deck.find(t=>t.kind==='exit')||{kind:'exit'};
  let floors=deck.filter(t=>t!==exit&&t.kind!=='exit');
  const targetTotal=90+Math.floor(Math.random()*11);
  const kinds=['straight','straight','straight','corner','corner','corner','t','cross'];
  while(floors.length<targetTotal-1)floors.push({kind:kinds[Math.floor(Math.random()*kinds.length)]});
  floors=shuffle(floors);
  const candidates=shuffle(floors.filter(t=>!t.monsterMarker&&!t.itemMarker&&!['spike','pool'].includes(t.kind))).slice(0,6);
  candidates.forEach((t,i)=>{t.storyPart=i+1;});
  return [exit,...shuffle(floors)];
 };

 // Preserve a scroll marker when its floor tile is laid.
 const placeBtn=document.getElementById('placeBtn');
 if(placeBtn){
  placeBtn.addEventListener('click',()=>{
   if(mode!=='story'||!placement?.raw?.storyPart)return;
   const dir=placement.dir,part=placement.raw.storyPart,p=state.player,d=DIRS[dir];
   setTimeout(()=>{const t=getTile(p.x+d.dx,p.y+d.dy);if(t){t.storyPart=part;t.storyRead=false;}updateNearby();},0);
  },true);
 }

 const originalMove=move;
 move=function(dir){
  const result=originalMove.apply(this,arguments);
  setTimeout(()=>{checkCurrentStory();updateNearby();},60);
  return result;
 };

 const originalNewGame=newGame;
 newGame=function(){
  nextPart=1;removeNearby();document.getElementById('bodStoryCounter')?.remove();
  const result=originalNewGame.apply(this,arguments);
  setTimeout(updateCounter,300);return result;
 };

 window.BODStoryMode={get mode(){return mode;},get nextPart(){return nextPart;},parts:STORY_PARTS};
})();