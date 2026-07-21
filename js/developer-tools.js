// v11.20: Small top-right fullscreen control. The browser's native Esc key exits.
    (function(){
      const button=document.getElementById('fullscreenBtn');
      if(!button)return;
      const fullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
      button.addEventListener('click',async()=>{
        try{
          if(fullscreenElement()){
            if(document.exitFullscreen)await document.exitFullscreen();
            else if(document.webkitExitFullscreen)document.webkitExitFullscreen();
          }else{
            const root=document.documentElement;
            if(root.requestFullscreen)await root.requestFullscreen();
            else if(root.webkitRequestFullscreen)root.webkitRequestFullscreen();
            else toast('Full screen is not supported by this browser.');
          }
        }catch(error){console.warn('Full screen request failed:',error);}
      });
      const syncFullscreenButton=()=>{
        const active=!!fullscreenElement();
        button.textContent=active?'×':'⛶';
        button.title=active?'Exit full screen (or press Esc)':'Full screen — press Esc to exit';
        button.setAttribute('aria-label',active?'Exit full screen':'Enter full screen');
      };
      document.addEventListener('fullscreenchange',syncFullscreenButton);
      document.addEventListener('webkitfullscreenchange',syncFullscreenButton);
    })();

