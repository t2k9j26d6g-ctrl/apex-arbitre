/* APEX V2.0.3 — mobilité guidée + surveillance cloud périodique */
(function(){
  if(typeof LIBRARY==='undefined') return;

  LIBRARY.C1={
    code:'C1',pillar:'Mobilité',title:'Mobilité arbitre complète',duration:'15–18 min',intensity:'Très faible',rpe:'2/10',
    summary:'Séance guidée pour déverrouiller chevilles, mollets, hanches, chaîne postérieure, genou et haut du dos sans créer de fatigue.',
    purpose:'Retrouver de l’amplitude utile à la course et aux changements de direction, diminuer les raideurs et préparer une récupération active.',
    knee:'Aucun mouvement ne doit augmenter franchement la douleur. Rester dans une amplitude confortable et fluide, sans chercher à forcer la flexion du genou.',
    equipment:'Mur ou support stable + tapis',
    exercises:[
      {name:'Cheville — genou vers le mur',time:'1 min par côté',setup:'Face à un mur, pied à plat, talon collé au sol.',how:'Avancer doucement le genou vers le mur au-dessus des orteils puis revenir. Mouvement lent, sans décoller le talon.',focus:'Mobilité de cheville utile à la foulée et aux changements de direction.',knee:'Le genou suit l’axe du pied, sans rentrer vers l’intérieur.'},
      {name:'Mollet — jambe tendue puis fléchie',time:'45 s + 45 s par côté',setup:'Mains contre un mur, une jambe en arrière, talon au sol.',how:'D’abord jambe arrière tendue, puis légèrement fléchie. Garder le pied dans l’axe et respirer calmement.',focus:'Mollet superficiel puis profond, cheville.',knee:'Pas de douleur articulaire ; la tension doit rester musculaire.'},
      {name:'Ouverture / fermeture de hanche',time:'8 répétitions par côté',setup:'Debout près d’un support, bassin stable.',how:'Lever légèrement le genou, ouvrir la hanche vers l’extérieur puis revenir. Faire ensuite le mouvement inverse, lentement.',focus:'Hanches, contrôle du bassin, mobilité pour les déplacements latéraux.',knee:'Petite amplitude si le genou de la jambe d’appui est sensible.'},
      {name:'Charnière de hanche / chaîne postérieure',time:'8 répétitions lentes',setup:'Debout, pieds largeur bassin, genoux légèrement déverrouillés.',how:'Pousser les fesses vers l’arrière en gardant le dos long, puis revenir debout en serrant légèrement les fessiers.',focus:'Ischio-jambiers, fessiers, mobilité de hanche.',knee:'Très peu de flexion de genou ; le mouvement vient de la hanche.'},
      {name:'Flexion-extension douce du genou',time:'10 répétitions par côté',setup:'Debout avec appui ou assis sur une chaise.',how:'Plier puis tendre le genou lentement dans une amplitude confortable, sans charge supplémentaire.',focus:'Lubrification articulaire et contrôle du mouvement.',knee:'Stopper avant toute douleur nette ou blocage.'},
      {name:'Rotation thoracique à quatre pattes',time:'8 répétitions par côté',setup:'À quatre pattes, une main derrière la tête.',how:'Amener le coude vers le sol puis ouvrir le coude vers le plafond en suivant du regard. Bassin stable.',focus:'Haut du dos, cage thoracique, dissociation tronc-bassin.',knee:'Mettre un coussin sous les genoux si nécessaire.'},
      {name:'Respiration de récupération',time:'2 min',setup:'Allongé ou assis confortablement.',how:'Inspirer 4 secondes, expirer 6 secondes, sans forcer. Relâcher progressivement épaules et jambes.',focus:'Retour au calme et récupération.'}
    ]
  };

  LIBRARY.C2={
    code:'C2',pillar:'Mobilité',title:'Déverrouillage express / récupération',duration:'8–12 min',intensity:'Très faible',rpe:'1–2/10',
    summary:'Version courte à utiliser les jours de fatigue, après une séance exigeante, la veille d’un test ou quand tu veux simplement remettre le corps en mouvement.',
    purpose:'Obtenir le minimum efficace de mobilité et de récupération sans ajouter de charge d’entraînement.',
    knee:'La séance doit te laisser identique ou mieux qu’au départ. Aucun exercice ne doit réveiller durablement la douleur du genou.',
    equipment:'Mur ou support stable + tapis facultatif',
    exercises:[
      {name:'Cheville — mobilisation rapide',time:'45 s par côté',setup:'Face à un mur, pied à plat.',how:'Genou vers l’avant au-dessus des orteils puis retour, sans décoller le talon.',focus:'Cheville et préparation de la foulée.',knee:'Axe genou-pied propre.'},
      {name:'Mollet — étirement doux',time:'45 s par côté',setup:'Appui au mur, jambe arrière tendue.',how:'Talons au sol, avancer légèrement le bassin jusqu’à sentir une tension modérée.',focus:'Mollet et chaîne postérieure basse.'},
      {name:'Ouverture de hanche',time:'6 répétitions par côté',setup:'Debout avec appui.',how:'Monter légèrement le genou et ouvrir la hanche sans tourner le bassin.',focus:'Hanche et mobilité latérale.',knee:'Amplitude petite si besoin.'},
      {name:'Genou — flexion-extension contrôlée',time:'8 répétitions par côté',setup:'Assis ou debout avec appui.',how:'Plier/tendre lentement le genou dans la zone confortable.',focus:'Mobilité articulaire douce.',knee:'Aucune recherche d’amplitude maximale.'},
      {name:'Rotation du haut du dos',time:'6 répétitions par côté',setup:'Assis ou à quatre pattes.',how:'Tourner doucement le thorax sans forcer le bassin.',focus:'Dos et relâchement du tronc.'},
      {name:'Respiration lente',time:'90 s',setup:'Position confortable.',how:'Expiration plus longue que l’inspiration, rythme calme.',focus:'Retour au calme.'}
    ]
  };

  // Rend la fiche d’exercices générique : Pilates ou Mobilité guidée.
  if(typeof renderExerciseSheet==='function'){
    renderExerciseSheet=function(x){
      const label=x.pillar==='Mobilité'?'FICHE MOBILITÉ GUIDÉE':'FICHE PILATES';
      return `<section class="exercise-sheet"><div class="exercise-head"><div><span class="eyebrow">${label}</span><h2>${esc(x.code)} · déroulé complet</h2></div><span class="badge">${esc(x.equipment||'')}</span></div><div class="exercise-list">${x.exercises.map((e,i)=>`<article class="exercise-card"><div class="exercise-num">${i+1}</div><div class="exercise-main"><div class="exercise-title"><h3>${esc(e.name)}</h3><b>${esc(e.time)}</b></div><p><strong>Installation :</strong> ${esc(e.setup)}</p><p><strong>Exécution :</strong> ${esc(e.how)}</p><p><strong>Cible :</strong> ${esc(e.focus)}</p>${e.knee?`<p class="exercise-knee"><strong>Genou :</strong> ${esc(e.knee)}</p>`:''}</div></article>`).join('')}</div></section>`;
    };
  }

  // Surveillance cloud : vérification périodique quand APEX est réellement visible.
  let apexV203Heartbeat=null;
  function canHeartbeat(){
    try{return document.visibilityState==='visible' && !!apexCloudUser && v19CloudState().autoSync && v19Online() && !apexV19SyncBusy;}catch(e){return false;}
  }
  async function heartbeat(){
    if(!canHeartbeat())return;
    try{
      await pullCloudToLocalV19({reason:'contrôle périodique'});
      const c=v19CloudState();
      c.lastCloudPeriodicCheckAt=new Date().toISOString();
      localStorage.setItem(KEY,JSON.stringify(state));
      renderV19SyncUi();
      const el=document.getElementById('autoSyncResult');
      if(el && !el.classList.contains('error')){
        el.textContent=`Dernière vérification automatique du cloud : ${v19FmtTime(c.lastCloudPeriodicCheckAt)}.`;
        el.className='cloud-result ok';
      }
    }catch(e){console.warn('APEX V2.0.3 heartbeat',e);}
  }
  function startHeartbeat(){
    if(apexV203Heartbeat)clearInterval(apexV203Heartbeat);
    apexV203Heartbeat=setInterval(heartbeat,30000);
    setTimeout(heartbeat,1500);
  }
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(heartbeat,250);});
  window.addEventListener('focus',()=>setTimeout(heartbeat,250));
  window.addEventListener('online',()=>setTimeout(heartbeat,500));
  startHeartbeat();

  state.settings ||= {};
  state.settings.apexVersion='2.0.3';
  localStorage.setItem(KEY,JSON.stringify(state));
  if(typeof refreshAll==='function')refreshAll();
})();
