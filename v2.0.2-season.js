/* APEX V2.0.3 — Saison robuste, chargé après app.js */
(function(){
  'use strict';
  const V202_SEASON_START='2026-08-30';
  const V202_PLAN=[
    {date:'2026-08-30',code:'A5',note:'J+1 test : récupération active, marche facile et mobilité. Aucun travail intense.'},
    {date:'2026-08-31',code:'C1',note:'Mobilité générale + bilan des sensations après le test.'},
    {date:'2026-09-01',code:'B4',note:'Reprise douce avec barre Pilates : activation corps entier, faible fatigue résiduelle.'},
    {date:'2026-09-02',code:'S1',note:'Entretien aérobie : séance facile à modérée, sans recherche de performance.'},
    {date:'2026-09-03',code:'C2',note:'Mobilité courte / récupération.'},
    {date:'2026-09-04',code:'B2',note:'Barre Pilates : stabilité hanche-genou + chaîne postérieure.'},
    {date:'2026-09-05',code:'A5',note:'Récupération active. Si arbitrage le week-end, cette séance devient optionnelle.'},
    {date:'2026-09-07',code:'B1',note:'Barre Pilates corps entier.'},
    {date:'2026-09-09',code:'S2',note:'Intermittent entretien arbitre sur tapis. Volume inférieur à A3.'},
    {date:'2026-09-10',code:'C1',note:'Mobilité et récupération.'},
    {date:'2026-09-11',code:'B3',note:'Barre Pilates haut du corps + tronc.'},
    {date:'2026-09-13',code:'A5',note:'Récupération active, à adapter à la charge réelle du week-end.'},
    {date:'2026-09-14',code:'B2',note:'Stabilité + chaîne postérieure avec barre et bandes.'},
    {date:'2026-09-16',code:'S1',note:'Entretien aérobie continu.'},
    {date:'2026-09-18',code:'B1',note:'Barre Pilates corps entier.'},
    {date:'2026-09-20',code:'C2',note:'Récupération courte / mobilité.'},
    {date:'2026-09-21',code:'B3',note:'Haut du corps + tronc avec barre Pilates.'},
    {date:'2026-09-23',code:'S2',note:'Intermittent entretien arbitre.'},
    {date:'2026-09-25',code:'B4',note:'Activation légère avant week-end.'},
    {date:'2026-09-27',code:'A5',note:'Récupération active ou repos selon charge d’arbitrage.'}
  ];

  const v202Library={
    S1:{code:'S1',pillar:'Cardio saison',title:'Entretien aérobie arbitre',duration:'35–45 min',intensity:'Modérée',summary:'Endurance facile à modérée pour conserver la base cardio pendant la saison.',purpose:'Maintenir l’endurance sans accumuler de fatigue.',knee:'Course confortable ou marche rapide selon le genou.',rpe:'4–5/10',steps:['8–10 min très faciles','20–25 min à allure confortable et régulière','5–10 min de retour au calme','Noter RPE, genou et souffle']},
    S2:{code:'S2',pillar:'Cardio saison',title:'Intermittent entretien arbitre',duration:'≈ 31 min',intensity:'Modérée +',domyos:true,summary:'Fractionné d’entretien plus court que A3.',purpose:'Entretenir rythme, relances et efforts répétés sans rechercher un pic de forme.',knee:'À remplacer par A5/C2 après week-end très chargé ou genou sensible.',rpe:'6–7/10',domyosInput:{warmup:{duration:'8:00',speed:'7,0 km/h'},high:{duration:'0:50',speed:'11,5 km/h'},low:{duration:'0:50',speed:'6,5 km/h'},intervalSelect:4,intervalActual:5,exerciseRepeatSelect:1,exerciseActual:2,rest:{duration:'2:50',speed:'7,0 km/h',incline:'0 %'},recovery:{duration:'7:30',speed:'6,0 km/h'}},domyosNote:'5 passages réels par bloc = valeur 4. 2 blocs réels = valeur 1 dans Répétition exercice.'},
    B1:{code:'B1',pillar:'Barre Pilates',title:'Barre Pilates — corps entier',duration:'≈ 40–45 min',intensity:'Modérée',summary:'Séance complète où la barre et les bandes sont utilisées sur la majorité des mouvements.',purpose:'Renforcer dos, épaules, bras, tronc, fessiers et chaîne postérieure.',knee:'Squat optionnel et peu profond ; supprimer si douleur > 3/10.',rpe:'5–6/10',equipment:'Barre Pilates + bandes + tapis',visualMode:true,exercises:[
      {name:'Good Morning',time:'2 × 10–12',image:'assets/pilates_bar/good_morning.jpg',how:'Charnière de hanche, dos neutre, retour par les fessiers.',focus:'Chaîne postérieure.'},
      {name:'Seated Row',time:'2 × 12–15',image:'assets/pilates_bar/seated_row.jpg',how:'Tirer la barre vers le bas des côtes puis revenir lentement.',focus:'Dos, posture.'},
      {name:'Curl Biceps',time:'2 × 12–15',image:'assets/pilates_bar/curl_biceps.jpg',how:'Fléchir les coudes sans avancer les épaules.',focus:'Biceps.'},
      {name:'Standing Press',time:'2 × 10–12',image:'assets/pilates_bar/standing_press.jpg',how:'Pousser la barre vers l’avant puis revenir sous contrôle.',focus:'Pectoraux, triceps.'},
      {name:'Hip Flexion & Extension',time:'2 × 12 / côté',image:'assets/pilates_bar/hip_flex_ext.jpg',how:'Mouvement de hanche contrôlé, bassin stable.',focus:'Hanche, fessiers.',knee:'Faible amplitude.'},
      {name:'Glute Bridge avec barre',time:'2 × 12–15',image:'assets/pilates_bar/glute_bridge_bar.jpg',how:'Monter le bassin, serrer les fessiers puis redescendre.',focus:'Fessiers, ischios.',knee:'Genoux dans l’axe.'},
      {name:'Reverse Fly',time:'2 × 12–15',image:'assets/pilates_bar/reverse_fly.jpg',how:'Ouvrir les bras en contrôlant les omoplates.',focus:'Haut du dos.'},
      {name:'Squat assisté avec barre',time:'2 × 8–10 optionnel',image:'assets/pilates_bar/squat_bar.jpg',how:'Descendre seulement dans une amplitude confortable.',focus:'Quadriceps, fessiers.',knee:'Pas de flexion profonde.'}
    ]},
    B2:{code:'B2',pillar:'Barre Pilates',title:'Barre Pilates — stabilité hanche/genou',duration:'≈ 28–32 min',intensity:'Modérée',summary:'Chaîne postérieure, fessiers et stabilité avec la barre comme support principal.',purpose:'Entretenir les muscles utiles aux appuis et changements de direction sans impact important.',knee:'Priorité à la qualité et à une amplitude confortable.',rpe:'4–6/10',equipment:'Barre Pilates + bandes + tapis',visualMode:true,exercises:[
      {name:'Good Morning',time:'2 × 10',image:'assets/pilates_bar/good_morning.jpg',how:'Charnière de hanche lente, dos neutre.',focus:'Ischios, fessiers.'},
      {name:'Hip Flexion & Extension',time:'2 × 10 / côté',image:'assets/pilates_bar/hip_flex_ext.jpg',how:'Mouvement contrôlé, bassin stable.',focus:'Hanche, stabilité.',knee:'Amplitude courte.'},
      {name:'Glute Kickbacks',time:'2 × 10–12 / côté',image:'assets/pilates_bar/glute_kickbacks_bar.jpg',how:'Pousser le pied vers l’arrière sans cambrer.',focus:'Grand fessier.',knee:'Coussin sous le genou si besoin.'},
      {name:'Glute Bridge avec barre',time:'2 × 12',image:'assets/pilates_bar/glute_bridge_bar.jpg',how:'Monter le bassin et redescendre sous contrôle.',focus:'Fessiers, ischios.',knee:'Genoux alignés.'},
      {name:'Seated Row',time:'2 × 12',image:'assets/pilates_bar/seated_row.jpg',how:'Tirer vers les côtes, épaules basses.',focus:'Dos, posture.'},
      {name:'Lateral Raise',time:'2 × 10–12',image:'assets/pilates_bar/lateral_raise.jpg',how:'Élever les bras latéralement sans hausser les épaules.',focus:'Épaules.'}
    ]},
    B3:{code:'B3',pillar:'Barre Pilates',title:'Barre Pilates — haut du corps + tronc',duration:'≈ 30–35 min',intensity:'Modérée',summary:'Travail dos, épaules, bras et tronc en laissant les jambes récupérer.',purpose:'Entretenir le haut du corps et le gainage.',knee:'Quasiment aucune flexion de genou.',rpe:'4–5/10',equipment:'Barre Pilates + bandes',visualMode:true,exercises:[
      {name:'Curl Biceps',time:'2 × 12–15',image:'assets/pilates_bar/curl_biceps.jpg',how:'Curl contrôlé.',focus:'Biceps.'},
      {name:'Push Down Triceps',time:'2 × 12–15',image:'assets/pilates_bar/tricep_pushdown.jpg',how:'Étendre les coudes vers le bas.',focus:'Triceps.'},
      {name:'Lateral Raise',time:'2 × 10–12',image:'assets/pilates_bar/lateral_raise.jpg',how:'Élévation latérale contrôlée.',focus:'Épaules.'},
      {name:'Wide-Grip Barbell',time:'2 × 10–12',image:'assets/pilates_bar/wide_grip_barbell.jpg',how:'Monter la barre sans cambrer.',focus:'Épaules, gainage.'},
      {name:'Seated Row',time:'2 × 12–15',image:'assets/pilates_bar/seated_row.jpg',how:'Tirer vers les côtes.',focus:'Dos.'},
      {name:'Reverse Fly',time:'2 × 12',image:'assets/pilates_bar/reverse_fly.jpg',how:'Ouvrir les bras sans hausser les épaules.',focus:'Arrière d’épaule.'},
      {name:'Cable Crossover',time:'2 × 10 / côté',image:'assets/pilates_bar/cable_crossover.jpg',how:'Ramener le bras en diagonale, bassin stable.',focus:'Pectoraux, obliques.'}
    ]},
    B4:{code:'B4',pillar:'Barre Pilates',title:'Barre Pilates — activation courte',duration:'≈ 20–22 min',intensity:'Faible à modérée',summary:'Activation courte sans fatigue résiduelle importante.',purpose:'Activer le corps entier avant un week-end ou en reprise.',knee:'Pas de squat dans cette version.',rpe:'3–4/10',equipment:'Barre Pilates + bandes',visualMode:true,exercises:[
      {name:'Seated Row',time:'2 × 10',image:'assets/pilates_bar/seated_row.jpg',how:'Tirer vers les côtes.',focus:'Dos.'},
      {name:'Curl Biceps',time:'2 × 10',image:'assets/pilates_bar/curl_biceps.jpg',how:'Curl contrôlé.',focus:'Bras.'},
      {name:'Lateral Raise',time:'2 × 8–10',image:'assets/pilates_bar/lateral_raise.jpg',how:'Élévation courte et contrôlée.',focus:'Épaules.'},
      {name:'Hip Flexion & Extension',time:'2 × 8 / côté',image:'assets/pilates_bar/hip_flex_ext.jpg',how:'Petit mouvement de hanche, bassin stable.',focus:'Hanche, fessiers.',knee:'Faible amplitude.'},
      {name:'Glute Bridge avec barre',time:'2 × 10',image:'assets/pilates_bar/glute_bridge_bar.jpg',how:'Monter le bassin puis redescendre lentement.',focus:'Fessiers.',knee:'Genoux alignés.'}
    ]}
  };

  function v202Inject(){
    if(typeof LIBRARY!=='undefined') Object.assign(LIBRARY,v202Library);
    if(typeof state!=='undefined'){
      state.settings ||= {};
      state.plan ||= [];
      const existing=new Set(state.plan.map(p=>p.date));
      V202_PLAN.forEach(p=>{if(!existing.has(p.date)) state.plan.push({...p});});
      state.plan.sort((a,b)=>a.date.localeCompare(b.date));
      state.settings.seasonMode=true;
      state.settings.seasonStart=V202_SEASON_START;
      state.settings.apexVersion='2.0.2-season';
      try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(_e){}
    }
  }

  function v202Render(){
    v202Inject();
    try{ if(typeof renderLibrary==='function') renderLibrary(); }catch(e){console.error('V2.0.3 renderLibrary',e);}
    try{ if(typeof renderPlan==='function') renderPlan(); }catch(e){console.error('V2.0.3 renderPlan',e);}
    const version=document.querySelector('.version'); if(version) version.textContent='V2.0.3';
  }

  // Après chaque réception cloud, réinjecter immédiatement Saison + bibliothèque V2.
  if(typeof applyCloudPackageV19==='function'){
    const baseApply=applyCloudPackageV19;
    applyCloudPackageV19=function(pack,opts){
      const result=baseApply(pack,opts);
      v202Render();
      return result;
    };
  }
  if(typeof restoreFromCloud==='function'){
    const baseRestore=restoreFromCloud;
    restoreFromCloud=async function(){
      const r=await baseRestore.apply(this,arguments);
      v202Render();
      return r;
    };
  }

  // Le premier rendu V1.x a déjà eu lieu lorsque ce module est chargé.
  v202Render();
  setTimeout(v202Render,250);
  setTimeout(v202Render,1200); // couvre init Supabase / restauration automatique tardive
})();
