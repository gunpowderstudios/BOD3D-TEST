window.ASSET_PATHS={
 "Start":"assets/tiles/start.png","Exit":"assets/tiles/exit.png","Straight":"assets/tiles/straight.png","Corner":"assets/tiles/corner.png","T-Junction":"assets/tiles/tjunction.png","Crossroad":"assets/tiles/crossroad.png","Spike Trap":"assets/tiles/spiketrap.png","Healing Pool":"assets/tiles/healingpool.png","Hidden Monster":"assets/ui/hiddenmonster.png","Ring":"assets/ui/ring.png",
 "Sirrus the Fighter":"assets/heroes/sirrus.png","Tamara the Fighter":"assets/heroes/tamara.png","Duric the Dwarf":"assets/heroes/duric.png","Marria the Dwarf":"assets/heroes/marria.png","Rill the Healer":"assets/heroes/rill.png","Tarak the Healer":"assets/heroes/tarak.png","Alendra the Elf":"assets/heroes/alendra.png","Galhorn the Elf":"assets/heroes/galhorn.png",
 "Goblin":"assets/monsters/goblin.png","Zombie":"assets/monsters/zombie.png","Mummy":"assets/monsters/mummy.png","Monk":"assets/monsters/monk.png","Mud Monster":"assets/monsters/mudmonster.png","Werewolf":"assets/monsters/werewolf.png","Troll":"assets/monsters/troll.png","Minotaur":"assets/monsters/minotaur.png","Skeleton":"assets/monsters/skeleton.png","Giant Snake":"assets/monsters/giantsnake.png","Reacher":"assets/monsters/reacher.png","Mirror Monster":"assets/monsters/mirrormonster.png","Dragon":"assets/monsters/dragon.png"
};

(function fixTestLoadingLogo(){function apply(){const logo=document.getElementById('heroSelectLogo');if(!logo)return false;logo.style.display='';logo.src='./assets/ui/bod3d-logo.png';return true;}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(apply())return;let tries=0;const timer=setInterval(()=>{if(apply()||++tries>=50)clearInterval(timer);},100);},{once:true});else if(!apply()){let tries=0;const timer=setInterval(()=>{if(apply()||++tries>=50)clearInterval(timer);},100);}})();

(function syncTestVersion(){const version='v11.29';function apply(){document.title='Bag of Dungeon 3D '+version;const visible=document.getElementById('visibleBuildVersion');if(visible)visible.textContent=version;['bodVersionUnderLogo','topLogoVersion'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=version;});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();setTimeout(apply,1000);})();

(function installDungeonAmbienceToggle(){let muted=false;if(!HTMLMediaElement.prototype.__bodDungeonMutePatched){const originalPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const src=String(this.currentSrc||this.src||'');if(window.__BOD_DUNGEON_AMBIENCE_MUTED__&&/(?:^|\/)dungeon-sounds\.mp3(?:\?|$)/i.test(src)){try{this.pause();}catch(_){}return Promise.resolve();}return originalPlay.apply(this,arguments);};HTMLMediaElement.prototype.__bodDungeonMutePatched=true;}function updateButton(button){button.textContent=muted?'🔇':'🔊';button.title=muted?'Dungeon ambience off — click to turn on':'Dungeon ambience on — click to turn off';button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed',muted?'true':'false');}function install(){if(document.getElementById('dungeonSoundToggle'))return true;const fullscreen=document.getElementById('fullscreenBtn');if(!fullscreen||!fullscreen.parentNode)return false;const style=document.createElement('style');style.id='dungeonSoundToggleStyles';style.textContent='#dungeonSoundToggle{position:absolute;top:10px;right:50px;z-index:66;width:34px;height:34px;padding:0;display:flex;align-items:center;justify-content:center;border:2px solid var(--ink);border-radius:5px;background:var(--cream);color:var(--ink);box-shadow:2px 2px 0 #000;font:700 18px/1 Arial,sans-serif;pointer-events:auto;cursor:pointer}#dungeonSoundToggle:hover{background:#fff1c9}#topbar{right:92px!important}';document.head.appendChild(style);const button=document.createElement('button');button.id='dungeonSoundToggle';button.type='button';updateButton(button);button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();muted=!muted;window.__BOD_DUNGEON_AMBIENCE_MUTED__=muted;if(muted)window.stopDungeonAmbience?.();else window.startDungeonAmbience?.();updateButton(button);});fullscreen.insertAdjacentElement('beforebegin',button);return true;}function start(){window.__BOD_DUNGEON_AMBIENCE_MUTED__=false;if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);}}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();})();

(function installEnterDungeonHoverFix(){const style=document.createElement('style');style.id='enterDungeonHoverFix';style.textContent='.chooseHeroBtn:hover,.chooseHeroBtn:focus-visible{background:linear-gradient(#fff2c8,#efd68b)!important;color:#000!important}';document.head.appendChild(style);})();

(function installBackgroundAudioLifecycleGuard(){if(HTMLMediaElement.prototype.__bodBackgroundLifecyclePatched)return;const originalPlay=HTMLMediaElement.prototype.play;const backgroundTracks=new Set(),resumeTracks=new Set();HTMLMediaElement.prototype.play=function(){if(this.loop)backgroundTracks.add(this);return originalPlay.apply(this,arguments);};HTMLMediaElement.prototype.__bodBackgroundLifecyclePatched=true;function pauseBackgroundAudio(){backgroundTracks.forEach(track=>{if(!track.paused){resumeTracks.add(track);try{track.pause();}catch(_){}}});}function resumeBackgroundAudio(){if(document.hidden)return;resumeTracks.forEach(track=>{const src=String(track.currentSrc||track.src||'');if(window.__BOD_DUNGEON_AMBIENCE_MUTED__&&/dungeon-sounds\.mp3/i.test(src))return;originalPlay.call(track).catch(()=>{});});resumeTracks.clear();}document.addEventListener('visibilitychange',()=>document.hidden?pauseBackgroundAudio():resumeBackgroundAudio());window.addEventListener('pagehide',pauseBackgroundAudio);window.addEventListener('beforeunload',pauseBackgroundAudio);window.addEventListener('pageshow',resumeBackgroundAudio);})();

(function installV1125GameplayRules(){
 function install(){
  if(window.__bodV1125RulesInstalled)return true;
  if(typeof CHARACTERS==='undefined'||typeof drawItem!=='function'||typeof drawMonster!=='function'||typeof placeExitAndRing!=='function'||typeof collectRingIfSafe!=='function'||typeof killMonster!=='function')return false;
  window.__bodV1125RulesInstalled=true;
  const allowedHeroes=CHARACTERS.filter(hero=>hero.id==='sirrus'||hero.id==='tamara');CHARACTERS.splice(0,CHARACTERS.length,...allowedHeroes);selectedCharacterIndex=Math.min(selectedCharacterIndex,CHARACTERS.length-1);renderCharSelect();
  const lockedItems=new Set(['Ice Staff','Large Steel Axe']);
  const laidTileCount=()=>!state||!state.tiles?0:Object.values(state.tiles).filter(tile=>tile&&tile.kind!=='start'&&tile.kind!=='exit').length;
  drawItem=function(){if(!state||!Array.isArray(state.itemDeck)||!state.itemDeck.length)return null;const unlocked=laidTileCount()>=20;for(let i=state.itemDeck.length-1;i>=0;i--){const candidate=state.itemDeck[i];if(unlocked||!lockedItems.has(candidate.name)){const item=state.itemDeck.splice(i,1)[0];return item?{...item}:null;}}return null;};
  function ringAlreadyAssigned(){if(!state)return false;if(state.player?.hasRing||state.ringCarrierAssigned)return true;return Object.values(state.tiles||{}).some(tile=>tile?.hasRing||tile?.monster?.carriesRing);}
  function assignRingToMonster(monster,tileKey=null){if(!state||!monster||monster.isDragon||monster.maxHealth<10||ringAlreadyAssigned())return false;monster.carriesRing=true;state.ringCarrierAssigned=true;state.ringActivated=true;state.ringKey=tileKey;state.ringNumber=null;state.ringRoll=null;log('A powerful monster somewhere in the dungeon now carries the Ring of Creation.','loot');return true;}
  function ensureRingCarrier(){if(!state||laidTileCount()<20||ringAlreadyAssigned())return;const candidates=Object.entries(state.tiles||{}).filter(([,tile])=>tile?.monster&&tile.monster.health>0&&!tile.monster.isDragon&&tile.monster.maxHealth>=10);if(candidates.length){const [tileKey,tile]=candidates[Math.floor(Math.random()*candidates.length)];assignRingToMonster(tile.monster,tileKey);}}
  const originalDrawMonster=drawMonster;drawMonster=function(){const monster=originalDrawMonster.apply(this,arguments);if(monster&&laidTileCount()>=20&&!ringAlreadyAssigned())assignRingToMonster(monster,null);return monster;};
  placeExitAndRing=function(x,y,fromTile){state.exitPlaced=true;let exitKey=null,placed=false;for(const dir of dirOrder){const d=DIRS[dir],ex=x+d.dx,ey=y+d.dy;if(fromTile.opens[dir]&&!getTile(ex,ey)){exitKey=key(ex,ey);state.tiles[exitKey]={kind:'exit',opens:{...TILE_BASE.exit},rot:0,visited:false,monster:{name:'Red Dragon',dice:4,mod:0,maxHealth:20,health:20,glyph:'🐉',revealed:true,isDragon:true}};placed=true;break;}}if(!placed){for(const dir of dirOrder){const d=DIRS[dir],ex=x+d.dx,ey=y+d.dy;if(!getTile(ex,ey)){exitKey=key(ex,ey);state.tiles[exitKey]={kind:'exit',opens:{...TILE_BASE.exit},rot:0,visited:false,monster:{name:'Red Dragon',dice:4,mod:0,maxHealth:20,health:20,glyph:'🐉',revealed:true,isDragon:true}};break;}}}playSound('dragon');playTileEffect(exitKey,'dragon',1400);log('The final dungeon tile is laid. The Exit appears and the Red Dragon guards it.','loot');ensureRingCarrier();};
  collectRingIfSafe=function(tileKey){if(!state.ringActivated||state.player.hasRing||state.ringKey!==tileKey)return false;if(key(state.player.x,state.player.y)!==tileKey)return false;const tile=state.tiles[tileKey];if(!tile||!tile.hasRing)return false;const livingMonster=tile.monsterPending||(tile.monster&&tile.monster.health>0);if(livingMonster)return false;tile.hasRing=false;state.player.hasRing=true;playSound('ring');playTileEffect(tileKey,'ring',1200);log('You found the Ring of Creation — now get out!','loot');showModal('THE RING OF CREATION','You found the Ring of Creation — now get out!',[{text:'Get Out!',cls:'green',fn:closeModal}]);return true;};
  const originalRangedKill=rangedKill;rangedKill=function(tile,tileKey,monster,weaponName,damage){const carriesRing=!!monster?.carriesRing;if(carriesRing){tile.hasRing=true;state.ringActivated=true;state.ringCarrierAssigned=true;state.ringKey=tileKey;monster.isDragon=true;}const result=originalRangedKill.apply(this,arguments);if(carriesRing){monster.isDragon=false;log(monster.name+' drops the Ring of Creation!','loot');}return result;};
  killMonster=function(){
   const m=combat.tile.monster,tile=combat.tile,tileKey=combat.sourceKey||key(state.player.x,state.player.y),carriesRing=!!m.carriesRing;
   playSound('monsterDie');playTileEffect(tileKey,'monsterDeath',1000);log('Defeated '+m.name+'.','combat');state.player.killed.push(m.name);state.monsterDiscard.push(m);recordMonsterCorpse(tile,tileKey,m);tile.monster=null;
   if(carriesRing){tile.hasRing=true;state.ringActivated=true;state.ringCarrierAssigned=true;state.ringKey=tileKey;log(m.name+' drops the Ring of Creation!','loot');}
   if(m.isDragon&&state.player.hasRing){win();return;}
   const rewardCount=(!m.isDragon&&!carriesRing)?(m.maxHealth>=10?2:(m.maxHealth>=6?1:0)):0;
   if(!m.isDragon&&!carriesRing&&rewardCount===0)log(m.name+' had '+m.maxHealth+' starting Health: no item reward.','system');
   if(rewardCount)log(m.name+' had '+m.maxHealth+' starting Health: draw '+rewardCount+' item'+(rewardCount===1?'':'s')+'.','loot');
   closeCombat();render();
   if(carriesRing){setTimeout(()=>collectRingIfSafe(tileKey),80);return;}
   if(rewardCount){setTimeout(()=>{for(let i=0;i<rewardCount;i++)awardItem();},120);}
  };
  setInterval(ensureRingCarrier,500);return true;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(install())return;let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);},{once:true});else if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);}
})();

(function installHealthHud(){
 function install(){
  let hud=document.getElementById('livesHud');const main=document.getElementById('main');if(!main)return false;
  if(!document.getElementById('livesHudStyles')){const style=document.createElement('style');style.id='livesHudStyles';style.textContent='#livesHud{position:absolute;top:12px;left:50%;transform:translateX(-50%);z-index:67;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:2px;max-width:min(360px,60vw);min-height:24px;padding:3px 8px;border-radius:12px;background:rgba(0,0,0,.42);pointer-events:none;user-select:none}#livesHud .lifeHeart{font-size:17px;line-height:1;color:#e3262e;text-shadow:0 1px 2px #000,0 0 4px rgba(227,38,46,.45)}#livesHud .emptyHeart{opacity:.24}@media(max-width:700px){#livesHud{top:8px;max-width:70vw;padding:3px 7px;gap:1px}#livesHud .lifeHeart{font-size:15px}}body.combatActive #livesHud{z-index:1005}';document.head.appendChild(style);}
  if(!hud){hud=document.createElement('div');hud.id='livesHud';hud.setAttribute('aria-live','polite');main.appendChild(hud);}
  function update(){if(typeof state==='undefined'||!state||!state.player){hud.style.display='none';return;}hud.style.display='flex';const health=Math.max(0,Math.floor(Number(state.player.health)||0));const maxHealth=Math.max(health,Math.floor(Number(state.player.maxHealth)||health));hud.innerHTML=Array.from({length:maxHealth},(_,i)=>'<span class="lifeHeart'+(i<health?'':' emptyHeart')+'" aria-hidden="true">♥</span>').join('');hud.setAttribute('aria-label',health+' of '+maxHealth+' health remaining');}
  update();setInterval(update,120);return true;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);}},{once:true});else if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);}
})();

(function installCombatOnlyAP(){
 function install(){
  if(window.__bodCombatOnlyAPInstalled)return true;if(typeof move!=='function'||typeof startPlace!=='function')return false;window.__bodCombatOnlyAPInstalled=true;
  const originalMove=move;move=function(){if(!state?.player)return originalMove.apply(this,arguments);const before=state.player.ap;if(before<1)state.player.ap=1;const result=originalMove.apply(this,arguments);state.player.ap=before;if(typeof render==='function')render();return result;};
  const originalStartPlace=startPlace;startPlace=function(){if(!state?.player)return originalStartPlace.apply(this,arguments);const before=state.player.ap;if(before<1)state.player.ap=1;const result=originalStartPlace.apply(this,arguments);state.player.ap=before;return result;};
  const placeButton=document.getElementById('placeBtn');if(placeButton&&placeButton.onclick&&!placeButton.__bodFreePlacementPatched){const originalPlace=placeButton.onclick;placeButton.onclick=function(){const before=state?.player?.ap;const result=originalPlace.apply(this,arguments);if(state?.player&&Number.isFinite(before))state.player.ap=before;if(typeof render==='function')render();return result;};placeButton.__bodFreePlacementPatched=true;}
  const style=document.createElement('style');style.id='combatOnlyAPStyles';style.textContent='#mobileRestBtn{display:none!important}body:not(.combatActive) #controls button[data-action="rest"],body:not(.combatActive) #controls .restBtn,body:not(.combatActive) #controls button[id*="rest" i]{display:none!important}';document.head.appendChild(style);
  const hideRestButtons=()=>{document.querySelectorAll('button').forEach(button=>{const label=((button.id||'')+' '+(button.className||'')+' '+(button.textContent||'')).toLowerCase();if(/\brest\b/.test(label)&&!button.closest('#combat'))button.style.setProperty('display','none','important');});};hideRestButtons();new MutationObserver(hideRestButtons).observe(document.documentElement,{subtree:true,childList:true,characterData:true});return true;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);}},{once:true});else if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);}
})();

// v11.29 TEST: more readable, touch-friendly popup and start-screen formatting.
(function installResponsiveReadableUI(){
 const style=document.createElement('style');style.id='responsiveReadableUI';style.textContent=`
 .chooseHeroBtn{min-height:54px;padding:14px 28px!important;font-size:clamp(18px,1.5vw,22px)!important;line-height:1.15!important;border-radius:8px!important}
 #modal .card,#placement .card{width:min(620px,calc(100vw - 32px));max-height:min(82vh,760px);overflow-y:auto;padding:clamp(22px,3vw,34px)!important}
 #modal .card h2,#placement .card h2{font-size:clamp(25px,2.4vw,34px)!important;line-height:1.1!important;margin-bottom:16px!important}
 #modal .desc,#placement .desc{font-size:clamp(17px,1.45vw,20px)!important;line-height:1.48!important}
 #modal .btnrow,#placement .btnrow{gap:10px!important;margin-top:20px!important}
 #modal .btnrow button,#placement .btnrow button{min-height:50px;padding:12px 18px!important;font-size:17px!important;line-height:1.2!important}
 @media(max-width:700px){
  .chooseHeroBtn{width:min(92vw,420px)!important;min-height:62px;padding:17px 24px!important;font-size:22px!important;margin-top:14px!important}
  #heroInfoPanel{padding-bottom:max(18px,env(safe-area-inset-bottom))!important}
  #modal,#placement{align-items:flex-start!important;padding:clamp(18px,5vh,42px) 10px max(18px,env(safe-area-inset-bottom))!important;overflow-y:auto!important}
  #modal .card,#placement .card{width:calc(100vw - 20px)!important;min-height:48vh;max-height:calc(100dvh - 36px)!important;padding:24px 20px 26px!important;border-radius:10px!important}
  #modal .card h2,#placement .card h2{font-size:29px!important;line-height:1.08!important;margin-bottom:17px!important}
  #modal .desc,#placement .desc,#modalBody{font-size:19px!important;line-height:1.5!important;white-space:pre-line}
  #modal .btnrow,#placement .btnrow{display:grid!important;grid-template-columns:1fr!important;gap:11px!important;margin-top:22px!important}
  #modal .btnrow button,#placement .btnrow button{width:100%!important;min-height:56px!important;padding:14px 16px!important;font-size:19px!important;font-weight:700!important;border-radius:7px!important}
  #placement .preview{min-height:150px!important}
 }
 @media(max-width:700px) and (orientation:landscape){
  #modal,#placement{padding-top:8px!important}
  #modal .card,#placement .card{min-height:0;max-height:calc(100dvh - 16px)!important;padding:18px 20px!important}
  #modal .card h2,#placement .card h2{font-size:25px!important;margin-bottom:10px!important}
  #modal .desc,#placement .desc,#modalBody{font-size:17px!important;line-height:1.35!important}
  #modal .btnrow,#placement .btnrow{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-top:12px!important}
  #modal .btnrow button,#placement .btnrow button{min-height:48px!important;font-size:17px!important;padding:10px 12px!important}
 }
 `;document.head.appendChild(style);
})();