/* Bag of Dungeon 3D — UI module
 * v11.24 migration step 1
 * Owns the visible build version while the remaining legacy UI code is migrated.
 */
(function installBodUiModule(){
  'use strict';

  const VERSION = 'v11.24';
  window.BOD3D_VERSION = VERSION;

  function setVersionText(){
    document.title = 'Bag of Dungeon 3D ' + VERSION;

    ['bodVersionUnderLogo', 'topLogoVersion'].forEach(function(id){
      const element = document.getElementById(id);
      if(element && element.textContent !== VERSION){
        element.textContent = VERSION;
      }
    });
  }

  function start(){
    setVersionText();

    // Legacy startup code still creates the labels dynamically. Keep them synced
    // until that markup is safely migrated out of index.html in a later step.
    const observer = new MutationObserver(setVersionText);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start, { once: true });
  }else{
    start();
  }
})();
