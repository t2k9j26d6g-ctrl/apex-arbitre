/* APEX V2.0.4 — correctifs iPhone : check-in immédiat + nav Safari stable */
(function(){
  if(typeof state==='undefined') return;

  // 1) Après validation du check-in : rendu immédiat + push cloud immédiat.
  if(typeof saveCheckin==='function'){
    const saveCheckinV203=saveCheckin;
    saveCheckin=function(){
      saveCheckinV203();
      try{
        const c=typeof todayCheckin==='function'?todayCheckin():null;
        if(c){
          state.settings ||= {};
          state.settings.cloud ||= {};
          state.settings.cloud.lastCheckinSavedAt=new Date().toISOString();
          localStorage.setItem(KEY,JSON.stringify(state));
          // Double rendu volontaire : Safari peut conserver un DOM ancien après interaction formulaire.
          if(typeof refreshAll==='function') refreshAll();
          requestAnimationFrame(()=>{ if(typeof refreshAll==='function') refreshAll(); });

          // Le check-in est une donnée prioritaire : pas d'attente du debounce de 900 ms.
          if(typeof apexCloudUser!=='undefined' && apexCloudUser &&
             typeof v19CloudState==='function' && v19CloudState().autoSync &&
             typeof v19Online==='function' && v19Online() &&
             typeof pushLocalToCloudV19==='function'){
            setTimeout(async()=>{
              try{
                const ok=await pushLocalToCloudV19({reason:'checkin-immediate'});
                if(ok){
                  const cc=v19CloudState();
                  cc.lastCheckinPushAt=new Date().toISOString();
                  localStorage.setItem(KEY,JSON.stringify(state));
                  if(typeof renderV19SyncUi==='function')renderV19SyncUi('Check-in envoyé immédiatement au cloud.','ok');
                }
              }catch(e){console.warn('APEX V2.0.4 check-in push',e);}
            },80);
          }
        }
      }catch(e){console.warn('APEX V2.0.4 post-checkin',e);}
    };
  }

  // 2) Quand l'utilisateur revient sur Aujourd'hui, toujours reconstruire depuis l'état mémoire courant.
  if(typeof go==='function'){
    const goV203=go;
    go=function(id){
      goV203(id);
      if(id==='cockpit'){
        requestAnimationFrame(()=>{
          if(typeof renderCockpit==='function')renderCockpit();
          if(typeof renderHistory==='function')renderHistory();
        });
      }
    };
  }

  // 3) Stabilisation barre mobile Safari via VisualViewport.
  let vvRaf=0;
  function updateVisualViewportBottom(){
    cancelAnimationFrame(vvRaf);
    vvRaf=requestAnimationFrame(()=>{
      const vv=window.visualViewport;
      let inset=0;
      if(vv){
        inset=Math.max(0,window.innerHeight-(vv.height+vv.offsetTop));
      }
      document.documentElement.style.setProperty('--apex-vv-bottom',Math.round(inset)+'px');
    });
  }
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',updateVisualViewportBottom,{passive:true});
    window.visualViewport.addEventListener('scroll',updateVisualViewportBottom,{passive:true});
  }
  window.addEventListener('resize',updateVisualViewportBottom,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(updateVisualViewportBottom,120),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(updateVisualViewportBottom,50);});
  updateVisualViewportBottom();

  state.settings ||= {};
  state.settings.apexVersion='2.0.4';
  localStorage.setItem(KEY,JSON.stringify(state));
  if(typeof refreshAll==='function')refreshAll();
})();
