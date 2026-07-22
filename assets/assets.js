window.ASSET_PATHS={
  "Start":"assets/tiles/start.png","Exit":"assets/tiles/exit.png","Straight":"assets/tiles/straight.png","Corner":"assets/tiles/corner.png","T-Junction":"assets/tiles/tjunction.png","Crossroad":"assets/tiles/crossroad.png","Spike Trap":"assets/tiles/spiketrap.png","Healing Pool":"assets/tiles/healingpool.png","Hidden Monster":"assets/ui/hiddenmonster.png","Ring":"assets/ui/ring.png",
  "Sirrus the Fighter":"assets/heroes/sirrus.png","Tamara the Fighter":"assets/heroes/tamara.png","Duric the Dwarf":"assets/heroes/duric.png","Marria the Dwarf":"assets/heroes/marria.png","Rill the Healer":"assets/heroes/rill.png","Tarak the Healer":"assets/heroes/tarak.png","Alendra the Elf":"assets/heroes/alendra.png","Galhorn the Elf":"assets/heroes/galhorn.png",
  "Goblin":"assets/monsters/goblin.png","Zombie":"assets/monsters/zombie.png","Mummy":"assets/monsters/mummy.png","Monk":"assets/monsters/monk.png","Mud Monster":"assets/monsters/mudmonster.png","Werewolf":"assets/monsters/werewolf.png","Troll":"assets/monsters/troll.png","Minotaur":"assets/monsters/minotaur.png","Skeleton":"assets/monsters/skeleton.png","Giant Snake":"assets/monsters/giantsnake.png","Reacher":"assets/monsters/reacher.png","Mirror Monster":"assets/monsters/mirrormonster.png","Dragon":"assets/monsters/dragon.png"
};

(function fixTestLoadingLogo(){
  function apply(){const logo=document.getElementById('heroSelectLogo');if(!logo)return false;logo.style.display='';logo.src='./assets/ui/bod3d-logo.png';return true;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(apply())return;let tries=0;const timer=setInterval(()=>{if(apply()||++tries>=50)clearInterval(timer);},100);},{once:true});
  else if(!apply()){let tries=0;const timer=setInterval(()=>{if(apply()||++tries>=50)clearInterval(timer);},100);}
})();

(function syncTestVersion(){
  const version='v11.30';
  function apply(){document.title='Bag of Dungeon 3D '+version;const visible=document.getElementById('visibleBuildVersion');if(visible)visible.textContent=version;['bodVersionUnderLogo','topLogoVersion'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=version;});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();setTimeout(apply,1000);
})();

(function installDungeonAmbienceToggle(){
  let muted=false;
  if(!HTMLMediaElement.prototype.__bodDungeonMutePatched){const originalPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const src=String(this.currentSrc||this.src||'');if(window.__BOD_DUNGEON_AMBIENCE_MUTED__&&/(?:^|\/)dungeon-sounds\.mp3(?:\?|$)/i.test(src)){try{this.pause();}catch(_){}return Promise.resolve();}return originalPlay.apply(this,arguments);};HTMLMediaElement.prototype.__bodDungeonMutePatched=true;}
  function updateButton(button){button.textContent=muted?'🔇':'🔊';button.title=muted?'Dungeon ambience off — click to turn on':'Dungeon ambience on — click to turn off';button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed',muted?'true':'false');}
  function install(){if(document.getElementById('dungeonSoundToggle'))return true;const fullscreen=document.getElementById('fullscreenBtn');if(!fullscreen||!fullscreen.parentNode)return false;const button=document.createElement('button');button.id='dungeonSoundToggle';button.type='button';updateButton(button);button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();muted=!muted;window.__BOD_DUNGEON_AMBIENCE_MUTED__=muted;if(muted)window.stopDungeonAmbience?.();else window.startDungeonAmbience?.();updateButton(button);});fullscreen.insertAdjacentElement('beforebegin',button);return true;}
  function start(){window.__BOD_DUNGEON_AMBIENCE_MUTED__=false;if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

(function installEnterDungeonHoverFix(){const style=document.createElement('style');style.id='enterDungeonHoverFix';style.textContent='.chooseHeroBtn:hover,.chooseHeroBtn:focus-visible{background:linear-gradient(#fff2c8,#efd68b)!important;color:#000!important}';document.head.appendChild(style);})();

(function installBackgroundAudioLifecycleGuard(){
  if(HTMLMediaElement.prototype.__bodBackgroundLifecyclePatched)return;
  const originalPlay=HTMLMediaElement.prototype.play,backgroundTracks=new Set(),resumeTracks=new Set();
  HTMLMediaElement.prototype.play=function(){if(this.loop)backgroundTracks.add(this);return originalPlay.apply(this,arguments);};HTMLMediaElement.prototype.__bodBackgroundLifecyclePatched=true;
  function pauseBackgroundAudio(){backgroundTracks.forEach(track=>{if(!track.paused){resumeTracks.add(track);try{track.pause();}catch(_){}}});}
  function resumeBackgroundAudio(){if(document.hidden)return;resumeTracks.forEach(track=>{const src=String(track.currentSrc||track.src||'');if(window.__BOD_DUNGEON_AMBIENCE_MUTED__&&/dungeon-sounds\.mp3/i.test(src))return;originalPlay.call(track).catch(()=>{});});resumeTracks.clear();}
  document.addEventListener('visibilitychange',()=>document.hidden?pauseBackgroundAudio():resumeBackgroundAudio());window.addEventListener('pagehide',pauseBackgroundAudio);window.addEventListener('beforeunload',pauseBackgroundAudio);window.addEventListener('pageshow',resumeBackgroundAudio);
})();

(function installGameplayRules(){
  function install(){
    if(window.__bodTestGameplayRulesInstalled)return true;
    if(typeof CHARACTERS==='undefined'||typeof drawItem!=='function'||typeof drawMonster!=='function'||typeof placeExitAndRing!=='function'||typeof collectRingIfSafe!=='function'||typeof killMonster!=='function')return false;
    window.__bodTestGameplayRulesInstalled=true;
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
    killMonster=function(){const m=combat.tile.monster,tile=combat.tile,tileKey=combat.sourceKey||key(state.player.x,state.player.y),carriesRing=!!m.carriesRing;playSound('monsterDie');playTileEffect(tileKey,'monsterDeath',1000);log('Defeated '+m.name+'.','combat');state.player.killed.push(m.name);state.monsterDiscard.push(m);recordMonsterCorpse(tile,tileKey,m);tile.monster=null;if(carriesRing){tile.hasRing=true;state.ringActivated=true;state.ringCarrierAssigned=true;state.ringKey=tileKey;log(m.name+' drops the Ring of Creation!','loot');}if(m.isDragon&&state.player.hasRing){win();return;}const rewardCount=(!m.isDragon&&!carriesRing)?(m.maxHealth>=10?2:(m.maxHealth>=6?1:0)):0;if(!m.isDragon&&!carriesRing&&rewardCount===0)log(m.name+' had '+m.maxHealth+' starting Health: no item reward.','system');if(rewardCount)log(m.name+' had '+m.maxHealth+' starting Health: draw '+rewardCount+' item'+(rewardCount===1?'':'s')+'.','loot');closeCombat();render();if(carriesRing){setTimeout(()=>collectRingIfSafe(tileKey),80);return;}if(rewardCount)setTimeout(()=>{for(let i=0;i<rewardCount;i++)awardItem();},120);};
    setInterval(ensureRingCarrier,500);return true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(install())return;let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);},{once:true});else if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);}
})();

(function installHealthHud(){
  function install(){let hud=document.getElementById('livesHud');const main=document.getElementById('main');if(!main)return false;if(!hud){hud=document.createElement('div');hud.id='livesHud';hud.setAttribute('aria-live','polite');main.appendChild(hud);}function update(){if(typeof state==='undefined'||!state||!state.player){hud.style.display='none';return;}hud.style.display='flex';const health=Math.max(0,Math.floor(Number(state.player.health)||0));const maxHealth=Math.max(health,Math.floor(Number(state.player.maxHealth)||health));hud.innerHTML=Array.from({length:maxHealth},(_,i)=>'<span class="lifeHeart'+(i<health?'':' emptyHeart')+'" aria-hidden="true">♥</span>').join('');hud.setAttribute('aria-label',health+' of '+maxHealth+' health remaining');}update();setInterval(update,120);return true;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);}},{once:true});else if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);}
})();

(function installCombatOnlyAP(){
  function install(){if(window.__bodCombatOnlyAPInstalled)return true;if(typeof move!=='function'||typeof startPlace!=='function')return false;window.__bodCombatOnlyAPInstalled=true;const originalMove=move;move=function(){if(!state?.player)return originalMove.apply(this,arguments);const before=state.player.ap;if(before<1)state.player.ap=1;const result=originalMove.apply(this,arguments);state.player.ap=before;if(typeof render==='function')render();return result;};const originalStartPlace=startPlace;startPlace=function(){if(!state?.player)return originalStartPlace.apply(this,arguments);const before=state.player.ap;if(before<1)state.player.ap=1;const result=originalStartPlace.apply(this,arguments);state.player.ap=before;return result;};const placeButton=document.getElementById('placeBtn');if(placeButton&&placeButton.onclick&&!placeButton.__bodFreePlacementPatched){const originalPlace=placeButton.onclick;placeButton.onclick=function(){const before=state?.player?.ap;const result=originalPlace.apply(this,arguments);if(state?.player&&Number.isFinite(before))state.player.ap=before;if(typeof render==='function')render();return result;};placeButton.__bodFreePlacementPatched=true;}const hideRestButtons=()=>document.querySelectorAll('button').forEach(button=>{const label=((button.id||'')+' '+(button.className||'')+' '+(button.textContent||'')).toLowerCase();if(/\brest\b/.test(label)&&!button.closest('#combat'))button.style.setProperty('display','none','important');});hideRestButtons();new MutationObserver(hideRestButtons).observe(document.documentElement,{subtree:true,childList:true,characterData:true});return true;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);}},{once:true});else if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>=100)clearInterval(timer);},50);}
})();

(function installResponsivePopupSizing(){
  const style=document.createElement('style');style.id='responsivePopupSizing';style.textContent=`
    .chooseHeroBtn{min-width:230px;min-height:58px;padding:14px 28px!important;font-size:21px!important}
    #modal .card,#placement .card{width:min(94vw,620px);max-height:min(88vh,760px);overflow:auto;padding:20px}
    #modal .card h2,#placement .card h2{font-size:28px;line-height:1.08}
    #modalBody,#placement .desc{font-size:19px;line-height:1.35}
    #modal .btnrow button,#placement .btnrow button{min-height:48px;font-size:17px;padding:11px 16px}
    @media(max-width:700px){
      #modal,#placement{padding:8px;align-items:center}
      #modal .card,#placement .card{width:96vw;max-height:92dvh;padding:20px 16px;border-width:4px}
      #modal .card h2,#placement .card h2{font-size:30px;margin-bottom:14px}
      #modalBody,#placement .desc{font-size:21px;line-height:1.38}
      #modal .btnrow,#placement .btnrow{display:grid;grid-template-columns:1fr;width:100%;gap:10px}
      #modal .btnrow button,#placement .btnrow button{width:100%;min-height:56px;font-size:19px;padding:13px 16px}
      .chooseHeroBtn{width:min(88vw,360px);min-height:66px;font-size:24px!important;padding:16px 24px!important}
    }
    @media(max-width:900px) and (orientation:landscape){#modal .card,#placement .card{max-height:88dvh;padding:14px}#modalBody,#placement .desc{font-size:18px}#modal .btnrow button,#placement .btnrow button{min-height:46px;font-size:17px}}
  `;document.head.appendChild(style);
})();

(function installMinimalTopControls(){
  const style=document.createElement('style');style.id='minimalTopControls';style.textContent=`
    #topbar{left:22px!important;right:110px!important;top:18px!important;gap:18px!important;align-items:center!important}
    #topbar .cluster{gap:18px!important;align-items:center!important;flex-wrap:nowrap!important}
    #topbar button,#fullscreenBtn,#dungeonSoundToggle{
      appearance:none!important;-webkit-appearance:none!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;color:#fff!important;text-shadow:0 1px 3px #000!important;padding:8px 10px!important;min-width:44px!important;min-height:44px!important;font-family:"Alegreya Sans",Arial,sans-serif!important;font-size:18px!important;font-weight:700!important;line-height:1!important;display:flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;opacity:.94;transition:opacity .15s ease,transform .15s ease!important
    }
    #topbar button:hover,#topbar button:focus-visible,#fullscreenBtn:hover,#fullscreenBtn:focus-visible,#dungeonSoundToggle:hover,#dungeonSoundToggle:focus-visible{background:transparent!important;color:#fff!important;opacity:1!important;transform:scale(1.04)!important;outline:1px solid rgba(255,255,255,.45)!important;outline-offset:1px!important}
    #fullscreenBtn{position:absolute!important;top:18px!important;right:18px!important;z-index:68!important;font-size:25px!important;width:46px!important;height:46px!important}
    #dungeonSoundToggle{position:absolute!important;top:18px!important;right:66px!important;z-index:68!important;font-size:22px!important;width:46px!important;height:46px!important}
    #livesHud{position:absolute!important;top:16px!important;left:50%!important;transform:translateX(-50%)!important;z-index:67!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;max-width:34vw!important;min-height:28px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;pointer-events:none!important}
    #livesHud .lifeHeart{font-size:19px!important;line-height:1!important;color:#ef333b!important;text-shadow:0 1px 4px #000,0 0 5px rgba(239,51,59,.4)!important}
    #livesHud .emptyHeart{opacity:.22!important}
    @media(max-width:900px){
      #topbar{left:6px!important;right:94px!important;top:7px!important;gap:4px!important}
      #topbar .cluster{gap:1px!important}
      #topbar button{font-size:15px!important;padding:7px 6px!important;min-width:38px!important;min-height:40px!important}
      #fullscreenBtn{top:7px!important;right:5px!important;width:42px!important;height:42px!important;font-size:22px!important}
      #dungeonSoundToggle{top:7px!important;right:47px!important;width:42px!important;height:42px!important;font-size:20px!important}
      #livesHud{top:52px!important;max-width:82vw!important;gap:1px!important}
      #livesHud .lifeHeart{font-size:15px!important}
    }
    @media(max-width:560px){
      #topbar button{font-size:0!important;width:38px!important;padding:5px!important}
      #topbar button::first-letter{font-size:18px!important}
      #topbar button[title*="Centre" i],#topbar button[id*="centre" i]{font-size:13px!important;width:auto!important}
      #topbar button[title*="Map" i],#topbar button[id*="view" i]{font-size:13px!important;width:auto!important}
      #topbar button[title*="North" i],#topbar button[id*="north" i]{font-size:13px!important;width:auto!important}
      #topbar button[title*="Menu" i],#topbar button[id*="menu" i]{font-size:13px!important;width:auto!important}
    }
  `;document.head.appendChild(style);
})();
