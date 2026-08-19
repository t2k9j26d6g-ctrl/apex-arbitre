const KEY='apex_v1_data';
const TEST_DATE='2026-08-29';
const TODAY_OVERRIDE=null;
const state=JSON.parse(localStorage.getItem(KEY)||'{}');
state.persons ||= []; state.assessments ||= []; state.sessions ||= [];
state.checkins ||= []; state.trainingLog ||= []; state.decisions ||= []; state.settings ||= {};
state.settings.testDate ||= TEST_DATE;
state.settings.rhrBaseline ||= '';
state.plan ||= createDefaultPlan();

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const uid=p=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
const isoDay=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const localToday=()=>TODAY_OVERRIDE||isoDay();
const parseLocal=s=>new Date(s+'T12:00:00+02:00');
const fmtDate=s=>parseLocal(s).toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'2-digit'});
const diffDays=(a,b)=>Math.round((parseLocal(b)-parseLocal(a))/86400000);
const persist=()=>{localStorage.setItem(KEY,JSON.stringify(state));refreshAll()};
function go(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(id).classList.add('active');document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===id));refreshAll()}
document.querySelectorAll('.nav').forEach(n=>n.onclick=()=>go(n.dataset.view));

const LIBRARY={
 A2:{code:'A2',pillar:'Cardio',title:'Simulation Yo-Yo sur tapis',duration:'≈ 34–36 min',intensity:'Élevée',domyos:true,summary:'Séance tapis rapprochant le rythme effort/récupération du Yo-Yo dans les limites de programmation E-Connected.',purpose:'Créer une contrainte cardio spécifique et répétée avec des récupérations courtes. Le tapis ne reproduit ni les demi-tours ni la progression exacte du vrai Yo-Yo.',knee:'Séance exigeante. Si le genou réagit défavorablement au check-in ou pendant la séance, APEX doit privilégier l’allègement ou l’arrêt.',rpe:'7–8/10',domyosInput:{
  warmup:{duration:'10:00',speed:'7,0 km/h'},
  high:{duration:'0:50',speed:'12,5 km/h'},
  low:{duration:'0:20',speed:'6,5 km/h'},
  intervalSelect:5,intervalActual:6,
  exerciseRepeatSelect:2,exerciseActual:3,
  rest:{duration:'1:30',speed:'7,0 km/h',incline:'0 %'},
  recovery:{duration:'8:00',speed:'6,0 km/h'}
 },domyosNote:'Format volontairement simple et réellement programmable. E-Connected impose une vitesse haute fixe à l’intérieur d’une séance : A2 reproduit donc surtout le rythme effort/récupération et la répétition des blocs, pas la montée progressive exacte du Yo-Yo.'},
 A3:{code:'A3',pillar:'Cardio',title:'Fractionné spécifique tapis',duration:'42:50',intensity:'Élevée',domyos:true,summary:'Deux blocs identiques de 6 passages rapides, déjà vérifiés visuellement dans E-Connected.',purpose:'Développer la capacité à répéter des efforts rapides avec une séance simple à programmer et à reproduire.',knee:'Séance à impact : APEX la protège en priorité si le genou ou la récupération sont défavorables.',rpe:'7–8/10',domyosInput:{
  warmup:{duration:'10:00',speed:'7,0 km/h'},
  high:{duration:'0:50',speed:'12,0 km/h'},
  low:{duration:'0:50',speed:'6,5 km/h'},
  intervalSelect:5,intervalActual:6,
  exerciseRepeatSelect:1,exerciseActual:2,
  rest:{duration:'2:50',speed:'7,0 km/h',incline:'0 %'},
  recovery:{duration:'10:00',speed:'6,0 km/h'}
 },domyosNote:'Durée totale exacte : 42 min 50 s. IMPORTANT : dans E-Connected, la valeur de répétition correspond aux répétitions supplémentaires. Pour 6 passages réels, sélectionner 5. Pour 2 blocs réels, sélectionner 1.'},
 A4:{code:'A4',pillar:'Cardio',title:'Rappel spécifique court tapis',duration:'≈ 25–27 min',intensity:'Modérée +',domyos:true,summary:'Dernier rappel court : conserver le rythme sans créer de fatigue résiduelle importante.',purpose:'Entretenir vitesse, rythme et confiance à l’approche du test.',knee:'Volume volontairement réduit. Stopper si une douleur inhabituelle apparaît ou augmente.',rpe:'6–7/10',domyosInput:{
  warmup:{duration:'8:00',speed:'7,0 km/h'},
  high:{duration:'0:50',speed:'11,5 km/h'},
  low:{duration:'0:50',speed:'6,5 km/h'},
  intervalSelect:5,intervalActual:6,
  exerciseRepeatSelect:0,exerciseActual:1,
  rest:{duration:'0:50',speed:'6,5 km/h',incline:'0 %',unused:true},
  recovery:{duration:'8:00',speed:'6,0 km/h'}
 },domyosNote:'Un seul bloc de 6 passages. La rubrique « Répétition exercice » reste à 0 : le bloc n’est pas répété. Les paramètres de repos entre exercices sont donc sans effet.'},
 A5:{code:'A5',pillar:'Récupération',title:'Récupération active',duration:'25–35 min',intensity:'Faible',summary:'Marche active ou cardio sans impact, en restant à une intensité conversationnelle.',purpose:'Faire circuler, récupérer et conserver une activité légère.',knee:'Aucune recherche de performance. La séance doit laisser le genou identique ou plus confortable qu’au départ.',rpe:'2–3/10',steps:['5 min très faciles','15–20 min à intensité conversationnelle','5–10 min très faciles','C2 en complément uniquement si cela apporte du confort']},
 Y1:{code:'Y1',pillar:'Test spécifique',title:'Vrai Yo-Yo terrain',duration:'Selon niveau',intensity:'Très élevée',summary:'Une seule répétition réelle avant le test officiel, avec bips, navettes et changements de direction.',purpose:'Valider la tolérance aux navettes, aux relances et à la montée progressive d’intensité que le tapis ne peut pas reproduire.',knee:'Les demi-tours augmentent la contrainte mécanique. Le test doit être interrompu si une douleur inhabituelle apparaît ou s’accentue.',rpe:'Test maximal',steps:['Échauffement habituel et progressif','Lancer la bande sonore officielle du test utilisé','Effectuer les navettes et changements de direction réels','Noter le niveau atteint et les sensations','Récupération active et retour au calme']},
 B1:{code:'B1',pillar:'Renforcement',title:'Pilates / renforcement protecteur',duration:'≈ 42 min',intensity:'Faible à modérée',summary:'Séance complète avec barre Pilates et bandes : centre, fessiers, chaîne postérieure, haut du corps et contrôle du bassin.',purpose:'Renforcer l’ensemble du corps sans ajouter de charge d’impact importante, tout en conservant un travail protecteur autour du genou.',knee:'Rester dans une amplitude confortable. Pas de flexion profonde forcée, pas de douleur articulaire croissante. Adapter ou supprimer un exercice si nécessaire.',rpe:'4–5/10',equipment:'Barre Pilates + bandes de résistance + tapis',exercises:[
  {name:'Respiration + engagement du centre',time:'4 min',setup:'Allongé sur le dos, genoux fléchis, pieds au sol.',how:'Respirer lentement. À l’expiration, engager doucement la sangle abdominale sans plaquer fortement le dos.',focus:'Mise en route, respiration, contrôle.'},
  {name:'Pont fessier contrôlé',time:'5 min',setup:'Dos au sol, pieds largeur bassin. Barre posée au niveau du bassin si confortable, bandes sans tension excessive.',how:'Monter le bassin en poussant dans les talons, marquer 1 seconde en haut puis redescendre lentement. 3 séries de 10 à 12.',focus:'Fessiers et chaîne postérieure.',knee:'Garder les genoux alignés avec les pieds.'},
  {name:'Rowing assis avec la barre',time:'5 min',setup:'Assis jambes confortablement placées, bandes tendues devant soi.',how:'Tirer la barre vers le bas des côtes, épaules basses, puis revenir lentement. 3 × 10 à 12.',focus:'Dos, posture, omoplates.'},
  {name:'Développé poitrine allongé',time:'5 min',setup:'Allongé, barre au-dessus de la poitrine, bandes réglées avec tension modérée.',how:'Pousser la barre sans verrouiller les coudes puis revenir sous contrôle. 3 × 10 à 12.',focus:'Pectoraux, triceps, stabilité du tronc.'},
  {name:'Extension de hanche avec bandes',time:'5 min',setup:'Debout avec appui stable si besoin, pied engagé dans la sangle.',how:'Amener une jambe légèrement vers l’arrière sans cambrer. 10 à 12 répétitions par côté, 2 à 3 séries.',focus:'Fessiers.',knee:'Jambe d’appui légèrement déverrouillée, amplitude petite et stable.'},
  {name:'Abduction de hanche contrôlée',time:'5 min',setup:'Debout avec appui, bande sur le pied de la jambe travaillée.',how:'Écarter la jambe sur le côté sans incliner le buste. 10 à 12 par côté, 2 séries.',focus:'Moyen fessier, stabilité latérale.',knee:'Ne pas chercher une grande amplitude.'},
  {name:'Dead bug assisté / bras avec barre',time:'4 min',setup:'Allongé, hanches et genoux dans une position confortable ou pieds au sol.',how:'Maintenir le centre engagé pendant de petits mouvements de bras avec la barre. Alterner lentement.',focus:'Gainage sans charge sur le genou.'},
  {name:'Retour au calme + mobilité douce',time:'4 min',setup:'Au sol ou assis.',how:'Respiration, mobilité douce hanches/chevilles et relâchement de la chaîne postérieure.',focus:'Récupération.'}
 ]},
 B2:{code:'B2',pillar:'Renforcement',title:'Pilates court + stabilité',duration:'≈ 25 min',intensity:'Modérée',summary:'Version courte les jours où l’on veut entretenir le renforcement sans laisser de fatigue résiduelle.',purpose:'Entretenir gainage, fessiers, stabilité et haut du corps avec un volume réduit.',knee:'Tout travail debout reste assisté si nécessaire. Réduire immédiatement l’amplitude si le genou devient inconfortable.',rpe:'4–6/10',equipment:'Barre Pilates + bandes de résistance + tapis',exercises:[
  {name:'Respiration + centre',time:'3 min',setup:'Allongé ou assis.',how:'Respiration lente et engagement abdominal doux.',focus:'Mise en route.'},
  {name:'Pont fessier',time:'4 min',setup:'Dos au sol, pieds au sol.',how:'2 à 3 × 10 répétitions lentes.',focus:'Fessiers, chaîne postérieure.',knee:'Alignement genou-pied.'},
  {name:'Rowing avec barre',time:'4 min',setup:'Assis, bandes en tension modérée.',how:'3 × 10 répétitions contrôlées.',focus:'Dos et posture.'},
  {name:'Extension de hanche debout',time:'4 min',setup:'Avec appui stable.',how:'2 × 10 par côté.',focus:'Fessiers.',knee:'Petite amplitude et jambe d’appui souple.'},
  {name:'Stabilité unipodale assistée',time:'3 min',setup:'Près d’un support fixe.',how:'Tenir 20 à 30 s par côté, 2 passages. Utiliser la barre uniquement comme repère si elle est stable.',focus:'Proprioception et stabilité.',knee:'Abandonner si douleur ou sensation d’instabilité.'},
  {name:'Développé poitrine ou épaules léger',time:'4 min',setup:'Assis ou allongé selon confort.',how:'2 × 10 à 12, mouvement lent.',focus:'Haut du corps.'},
  {name:'Mobilité / relâchement',time:'3 min',setup:'Position confortable.',how:'Respiration et mobilité douce.',focus:'Fin de séance.'}
 ]},
 C1:{code:'C1',pillar:'Mobilité',title:'Mobilité générale',duration:'12–18 min',intensity:'Très faible',summary:'Mobilité douce des chevilles, hanches, chaîne postérieure et genou.',purpose:'Entretenir l’aisance de mouvement et limiter la raideur.',knee:'Toujours dans une amplitude confortable.',rpe:'1–2/10',steps:['Chevilles','Hanches','Chaîne postérieure','Genou en amplitude confortable','Respiration / relâchement']},
 C2:{code:'C2',pillar:'Mobilité',title:'Mobilité / récupération courte',duration:'8–12 min',intensity:'Très faible',summary:'Version courte conçue pour les jours de fatigue ou en complément.',purpose:'Bouger sans charger.',knee:'Aucune douleur provoquée.',rpe:'1–2/10',steps:['Mobilité très douce','Respiration','Relâchement des jambes']},
 M1:{code:'M1',pillar:'Mental / TOP',title:'Projection test + respiration',duration:'8–10 min',intensity:'Mentale',summary:'Respiration contrôlée et répétition mentale du départ, des changements de rythme et de la montée de l’effort.',purpose:'Préparer la situation réelle et le contrôle de l’activation.',rpe:'—',steps:['Respiration contrôlée','Projection du départ','Projection de la montée de l’effort','Repère simple de confiance','Retour au calme']},
 M2:{code:'M2',pillar:'Mental / TOP',title:'Activation veille de test',duration:'5–7 min',intensity:'Mentale',summary:'Projection courte, positive et simple la veille du test.',purpose:'Arriver avec une représentation claire et une activation maîtrisée.',rpe:'—',steps:['Respiration brève','Projection positive du test','Mot-clé / signe-signal','Fin rapide : ne pas surcharger']},
 T1:{code:'T1',pillar:'Test',title:'TEST OFFICIEL YO-YO',duration:'Épreuve',intensity:'Maximale',summary:'Jour du test officiel : aucune charge supplémentaire intense.',purpose:'Objectif du cycle.',knee:'Échauffement habituel, écoute des sensations et aucune séance intense ajoutée.',rpe:'Maximal',steps:['Échauffement habituel','Test officiel','Retour au calme','Noter résultat et sensations']}
};

function createDefaultPlan(){return [
 {date:'2026-08-17',code:'C1',note:'Point de départ APEX. Si la séance du jour a déjà été validée/réalisée, elle reste conservée dans tes données.'},
 {date:'2026-08-18',code:'A3',note:'Fractionné spécifique tapis, avec un seul bloc d’échauffement programmable.'},
 {date:'2026-08-19',code:'B1',note:'Pilates / renforcement protecteur.'},
 {date:'2026-08-20',code:'A5',note:'Récupération active + C2 si utile.'},
 {date:'2026-08-21',code:'C2',note:'Veille du vrai Yo-Yo : mobilité très légère, pas de charge.'},
 {date:'2026-08-22',code:'Y1',note:'VRAI YO-YO terrain le week-end : unique répétition complète avant le test officiel.'},
 {date:'2026-08-23',code:'A5',note:'Récupération après le vrai Yo-Yo.'},
 {date:'2026-08-24',code:'B1',note:'Renforcement/Pilates contrôlé, volume raisonnable.'},
 {date:'2026-08-25',code:'A2',note:'Simulation Yo-Yo sur tapis : séance progressive la plus proche possible du test avec E-Connected.'},
 {date:'2026-08-26',code:'C1',note:'Mobilité + récupération.'},
 {date:'2026-08-27',code:'A4',note:'Dernier rappel spécifique court sur tapis + M1 si disponibilité.'},
 {date:'2026-08-28',code:'C2',note:'Très léger + M2. Objectif : fraîcheur et confiance.'},
 {date:'2026-08-29',code:'T1',note:'Test officiel.'}
]}
function migrateToV13(){
 const target='1.3';
 if(state.settings.apexVersion===target)return;
 // V1.4 ne réinitialise aucune donnée utilisateur : elle enrichit uniquement l’interface et la bibliothèque.
 state.settings.apexVersion=target;
 localStorage.setItem(KEY,JSON.stringify(state));
}
migrateToV13();
function resetPlan(){if(confirm('Réinitialiser le plan APEX V1.4 jusqu’au test ?')){state.plan=createDefaultPlan();persist()}}
function latestCheckin(){return [...state.checkins].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt))[0]||null}
function todayCheckin(){return state.checkins.find(c=>c.date===localToday())||null}
function plannedFor(date=localToday()){return state.plan.find(p=>p.date===date)||null}

function computeReadiness(c){
 if(!c)return null;
 const sleep=clamp(c.sleep||0,0,100);
 const base=+c.rhrBase||+state.settings.rhrBaseline||0;
 const delta=(base&&c.rhr)?c.rhr-base:0;
 let score=100;
 const reasons=[];
 if(sleep<65){score-=22;reasons.push('sommeil bas');} else if(sleep<80){score-=10;reasons.push('sommeil moyen');}
 if(delta>=8){score-=20;reasons.push(`FC repos +${delta} bpm`);} else if(delta>=5){score-=10;reasons.push(`FC repos +${delta} bpm`);}
 if(c.fatigue>=7){score-=20;reasons.push('fatigue élevée');} else if(c.fatigue>=5){score-=9;reasons.push('fatigue modérée');}
 if(c.soreness>=7){score-=12;reasons.push('courbatures élevées');} else if(c.soreness>=5){score-=6;reasons.push('courbatures présentes');}
 if(c.knee>=6){score-=35;reasons.push('douleur genou élevée');} else if(c.knee>=4){score-=20;reasons.push('genou sensible');} else if(c.knee>=2){score-=7;reasons.push('genou à surveiller');}
 if(c.motivation<=3){score-=8;reasons.push('motivation basse');}
 score=clamp(Math.round(score),0,100);
 let zone=score>=80?'GREEN':score>=60?'ORANGE':'RED';
 if(c.knee>=6)zone='RED';
 if(c.knee>=4&&zone==='GREEN')zone='ORANGE';
 return {score,zone,reasons,delta};
}
function decisionFor(c,planned){
 if(!c)return {zone:'NEUTRAL',title:'Check-in nécessaire',code:planned?.code||'',message:'Renseigne les données du matin pour qu’APEX adapte la journée.',why:[]};
 const r=computeReadiness(c); const p=planned?LIBRARY[planned.code]:null; let code=p?.code||'C1'; let title='Plan maintenu'; let message='Les indicateurs permettent de conserver la séance prévue.';
 if(r.zone==='RED'){
   title='Protection / récupération'; code=c.knee>=6?'C2':'A5'; message=c.knee>=6?'Pas de séance d’impact proposée aujourd’hui. Mobilité très douce uniquement si elle est confortable ; si la douleur est inhabituelle, importante ou s’aggrave, fais évaluer le genou.':'La charge du jour est réduite. Objectif : récupérer plutôt que forcer une séance clé.';
 } else if(r.zone==='ORANGE' && p && ['A2','A3','A4','Y1'].includes(p.code)){
   title='Séance spécifique allégée'; code=c.knee>=4?'A5':'A4'; message=c.knee>=4?'Le cardio d’impact est remplacé par de la récupération active pour protéger le genou.':'Le volume est réduit : on entretient les qualités utiles sans chercher la séance maximale.';
 } else if(r.zone==='ORANGE' && p?.code==='B2'){
   title='Renforcement allégé'; code='B1'; message='On conserve le renforcement mais avec une version plus contrôlée et moins exigeante.';
 }
 if(planned?.code==='T1'){title='Jour du test';code='T1';message='Aucune charge supplémentaire : échauffement habituel, test, puis récupération.'}
 return {zone:r.zone,score:r.score,title,code,message,why:r.reasons,planned:p?.code||'',plannedTitle:p?.title||''};
}
function saveCheckin(){
 const sleep=+$('cSleep').value, rhr=+$('cRhr').value, rhrBase=+$('cRhrBase').value;
 if(!sleep||sleep<1||sleep>100)return alert('Indique le score de sommeil de ta montre sur 100.');
 const c={id:uid('c'),date:localToday(),sleep,rhr:rhr||null,rhrBase:rhrBase||null,knee:+$('cKnee').value,fatigue:+$('cFatigue').value,soreness:+$('cSoreness').value,motivation:+$('cMotivation').value,weight:+$('cWeight').value||null,kneeNote:$('cKneeNote').value.trim(),note:$('cNote').value.trim(),createdAt:new Date().toISOString()};
 if(rhrBase)state.settings.rhrBaseline=rhrBase;
 const idx=state.checkins.findIndex(x=>x.date===c.date); if(idx>=0)state.checkins[idx]=c; else state.checkins.push(c);
 const d=decisionFor(c,plannedFor(c.date));
 state.decisions=state.decisions.filter(x=>x.date!==c.date); state.decisions.push({id:uid('d'),date:c.date,checkinId:c.id,...d,createdAt:new Date().toISOString()});
 persist();renderCheckinResult(c,d);renderCockpit();
}
function renderCheckinResult(c,d){const r=$('checkinResult');r.classList.remove('hidden');const s=computeReadiness(c);r.innerHTML=`<div class="decision ${d.zone.toLowerCase()}"><div><span class="eyebrow">DÉCISION APEX</span><h2>${esc(d.title)}</h2><p>${esc(d.message)}</p></div><div class="decision-score"><b>${s.score}</b><span>/100</span></div></div><div class="recommend"><div><span class="code">${esc(d.code)}</span><h3>${esc(LIBRARY[d.code]?.title||'')}</h3><p>${esc(LIBRARY[d.code]?.summary||'')}</p></div><button class="primary" onclick="markTraining('${d.code}')">Marquer réalisée</button></div>${d.why.length?`<div class="reasonline"><b>Pourquoi :</b> ${d.why.map(esc).join(' • ')}</div>`:''}<div class="medical-note">APEX utilise des garde-fous d’entraînement prudents. Pour l’arthrose du genou, les recommandations cliniques insistent sur l’exercice adapté et sur le fait de réduire/arrêter une activité qui provoque une douleur importante ou persistante ; l’application ne pose aucun diagnostic.</div>`;}
function markTraining(code){const lib=LIBRARY[code];if(!lib)return;const rpe=prompt('RPE / difficulté ressentie après la séance (1 à 10) ?','5');if(rpe===null)return;const kneeAfter=prompt('Douleur genou après la séance (0 à 10) ?','');state.trainingLog.push({id:uid('t'),date:localToday(),code,title:lib.title,rpe:+rpe||null,kneeAfter:kneeAfter===''?null:+kneeAfter,createdAt:new Date().toISOString()});persist();alert('Séance enregistrée. APEX utilisera cet historique dans la progression.')}

function renderCockpit(){
 const c=todayCheckin()||latestCheckin(); const sameDay=c?.date===localToday(); const p=plannedFor(); const d=sameDay?decisionFor(c,p):decisionFor(null,p); const box=$('cockpitDecision');
 const zone=d.zone.toLowerCase(); box.innerHTML=`<div class="decision-main ${zone}"><div class="status-dot"></div><div class="decision-copy"><span class="eyebrow">AUJOURD'HUI · ${fmtDate(localToday())}</span><h2>${esc(d.title)}</h2><p>${esc(d.message)}</p><div class="decision-session"><span class="code">${esc(d.code||p?.code||'—')}</span><div><b>${esc(LIBRARY[d.code]?.title||LIBRARY[p?.code]?.title||'Check-in à faire')}</b><small>${esc(LIBRARY[d.code]?.duration||'')}</small></div></div></div>${d.score!=null?`<div class="big-score"><b>${d.score}</b><span>readiness</span></div>`:''}</div>`;
 const snap=$('morningSnapshot'); if(!c){snap.innerHTML='<div class="empty">Aucune donnée. Fais le check-in du matin.</div>';$('readinessBadge').textContent='À renseigner';$('readinessBadge').className='badge neutral';}
 else {const rr=computeReadiness(c);$('readinessBadge').textContent=`${sameDay?'Aujourd’hui':'Dernier'} · ${rr.score}/100`;$('readinessBadge').className='badge '+rr.zone.toLowerCase();snap.innerHTML=metric('😴','Sommeil',`${c.sleep}/100`)+metric('❤️','FC repos',c.rhr?`${c.rhr} bpm`:'—')+metric('🦵','Genou',`${c.knee}/10`)+metric('⚡','Fatigue',`${c.fatigue}/10`)+metric('💪','Motivation',`${c.motivation}/10`)+metric('🏋️','Courbatures',`${c.soreness}/10`);}
 const days=diffDays(localToday(),state.settings.testDate);$('goalSnapshot').innerHTML=`<div class="goal-ring"><b>J-${Math.max(0,days)}</b><span>avant test</span></div><div><b>Test officiel Yo-Yo</b><p>Samedi 29 août 2026</p><p class="muted">Priorité : arriver préparé mais frais, en protégeant le genou.</p></div>`;
}
const metric=(icon,label,value)=>`<div class="metric"><i>${icon}</i><div><b>${esc(value)}</b><span>${esc(label)}</span></div></div>`;
function openSession(code){
 const x=LIBRARY[code]; if(!x)return;
 const modal=$('sessionModal');
 $('sessionModalContent').innerHTML=`
   <div class="session-sheet-head">
     <div><span class="code large">${esc(x.code)}</span><span class="tag">${esc(x.pillar)}</span></div>
     <button class="modal-close" onclick="closeSession()" aria-label="Fermer">×</button>
   </div>
   <h1>${esc(x.title)}</h1>
   <div class="session-facts"><span>⏱ <b>${esc(x.duration)}</b></span><span>⚡ <b>${esc(x.intensity)}</b></span><span>📊 RPE cible <b>${esc(x.rpe||'—')}</b></span>${x.domyos?'<span>📱 <b>Domyos E-Connected</b></span>':''}</div>
   <p class="session-summary">${esc(x.summary||'')}</p>
   ${x.domyos?renderDomyosProgram(x):renderSteps(x)}
   <div class="session-detail-grid">
     <div class="session-info"><span class="eyebrow">OBJECTIF</span><p>${esc(x.purpose||'')}</p></div>
     ${x.knee?`<div class="session-info warning"><span class="eyebrow">GENOU / VIGILANCE</span><p>${esc(x.knee)}</p></div>`:''}
   </div>
   <div class="modal-actions"><button class="ghost" onclick="closeSession()">Fermer</button><button class="primary" onclick="markTraining('${esc(x.code)}')">✓ Séance terminée</button></div>`;
 modal.classList.add('open'); document.body.classList.add('modal-open');
}
function closeSession(){$('sessionModal').classList.remove('open');document.body.classList.remove('modal-open')}
function renderDomyosProgram(x){const d=x.domyosInput;return `<section class="domyos-box"><div class="domyos-head"><div><span class="eyebrow">SAISIE ÉCRAN PAR ÉCRAN</span><h2>Domyos E-Connected</h2></div><span class="badge">ordre exact de l’app</span></div><div class="domyos-warning"><b>Règle E-Connected</b><span>La valeur « répétition » indique le nombre de répétitions supplémentaires : sélectionner <b>5</b> produit <b>6 passages réels</b>.</span></div><div class="domyos-steps">
${domyosStep(1,'Échauffement',[['Durée',d.warmup.duration],['Vitesse',d.warmup.speed]],'Un seul bloc programmable.')}
${domyosStep(2,'Intervalle Haut',[['Durée',d.high.duration],['Vitesse',d.high.speed]])}
${domyosStep(3,'Intervalle Bas',[['Durée',d.low.duration],['Vitesse',d.low.speed]])}
${domyosStep(4,"Nombre d’intervalle",[['Valeur à sélectionner',String(d.intervalSelect)],['Résultat réel',d.intervalActual+' passages']],`Pour obtenir ${d.intervalActual} passages, sélectionner ${d.intervalSelect}.`)}
${domyosStep(5,'Répétition exercice',[['Valeur à sélectionner',String(d.exerciseRepeatSelect)],['Résultat réel',d.exerciseActual+' bloc'+(d.exerciseActual>1?'s':'')],['Temps repos',d.rest.duration],['Vitesse repos',d.rest.speed],['Inclinaison repos',d.rest.incline]],d.rest.unused?'Les paramètres de repos sont sans effet car le bloc n’est pas répété.':`Pour obtenir ${d.exerciseActual} blocs au total, sélectionner ${d.exerciseRepeatSelect}.`)}
${domyosStep(6,'Récupération',[['Durée',d.recovery.duration],['Vitesse',d.recovery.speed]])}
</div><p class="domyos-note">${esc(x.domyosNote||'')}</p></section>`}
function domyosStep(n,title,rows,note=''){return `<article class="domyos-step"><div class="domyos-step-title"><span>${n}</span><h3>${esc(title)}</h3></div><div class="domyos-values">${rows.map(([k,v])=>`<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>${note?`<p>${esc(note)}</p>`:''}</article>`}
function renderSteps(x){if(x.exercises)return renderExerciseSheet(x);return `<section class="steps-box"><span class="eyebrow">DÉROULÉ</span><ol>${(x.steps||[]).map(v=>`<li>${esc(v)}</li>`).join('')}</ol></section>`}
function renderExerciseSheet(x){return `<section class="exercise-sheet"><div class="exercise-head"><div><span class="eyebrow">FICHE PILATES</span><h2>${esc(x.code)} · déroulé complet</h2></div><span class="badge">${esc(x.equipment||'')}</span></div><div class="exercise-list">${x.exercises.map((e,i)=>`<article class="exercise-card"><div class="exercise-num">${i+1}</div><div class="exercise-main"><div class="exercise-title"><h3>${esc(e.name)}</h3><b>${esc(e.time)}</b></div><p><strong>Installation :</strong> ${esc(e.setup)}</p><p><strong>Exécution :</strong> ${esc(e.how)}</p><p><strong>Cible :</strong> ${esc(e.focus)}</p>${e.knee?`<p class="exercise-knee"><strong>Genou :</strong> ${esc(e.knee)}</p>`:''}</div></article>`).join('')}</div></section>`}
function renderPlan(){const today=localToday();$('planTimeline').innerHTML=state.plan.map(p=>{const lib=LIBRARY[p.code]||{};const status=p.date<today?'past':p.date===today?'today':p.date===state.settings.testDate?'test':'';return `<article class="plan-row ${status}" onclick="openSession('${esc(p.code)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter')openSession('${esc(p.code)}')"><div class="datebox"><b>${fmtDate(p.date).split(' ')[1]||fmtDate(p.date)}</b><span>${fmtDate(p.date).split(' ')[0]}</span></div><div class="plan-code">${esc(p.code)}</div><div class="plan-body"><h3>${esc(lib.title||p.code)}</h3><p>${esc(p.note)}</p><small>${esc(lib.duration||'')} · ${esc(lib.intensity||'')} · Cliquer pour ouvrir</small></div>${p.date===today?'<span class="today-chip">AUJOURD’HUI</span>':'<span class="chevron">›</span>'}</article>`}).join('')}
function renderLibrary(){$('sessionLibrary').innerHTML=Object.values(LIBRARY).map(x=>`<article class="lib-card compact" onclick="openSession('${esc(x.code)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter')openSession('${esc(x.code)}')"><div class="lib-top"><span class="code">${esc(x.code)}</span><span class="tag">${esc(x.pillar)}</span></div><h2>${esc(x.title)}</h2><p class="lib-summary">${esc(x.summary||'')}</p><div class="lib-footer"><span>${esc(x.duration)} · ${esc(x.intensity)}</span>${x.domyos?'<span class="domyos-chip">📱 Domyos</span>':''}<b>Voir la séance ›</b></div></article>`).join('')}
function spark(values,max=100,invert=false){if(!values.length)return '<div class="empty">Pas encore assez de données.</div>';return `<div class="spark">${values.slice(-10).map(v=>{const h=Math.max(6,Math.round((v/max)*100));return `<i style="height:${h}%" title="${v}"></i>`}).join('')}</div><div class="spark-labels"><span>ancien</span><span>récent</span></div>`}
function renderProgress(){const cs=[...state.checkins].sort((a,b)=>a.date.localeCompare(b.date));$('statCheckins').textContent=state.checkins.length;$('statTraining').textContent=state.trainingLog.length;$('statMental').textContent=state.sessions.length;$('statDays').textContent=Math.max(0,diffDays(localToday(),state.settings.testDate));$('sleepTrend').innerHTML=spark(cs.map(c=>c.sleep),100);$('kneeTrend').innerHTML=spark(cs.map(c=>c.knee),10);$('trainingLog').innerHTML=state.trainingLog.length?[...state.trainingLog].reverse().map(t=>`<div class="log-row"><span>${fmtDate(t.date)}</span><b>${esc(t.code)} · ${esc(t.title)}</b><small>RPE ${t.rpe??'—'} · genou après ${t.kneeAfter??'—'}/10</small></div>`).join(''):'<div class="empty">Aucune séance encore marquée comme réalisée.</div>'}
function renderMental(){const count=state.assessments.length,sessions=state.sessions.length;$('legacyMental').innerHTML=`<div class="panel"><div class="panel-head"><h2>Moteur Mental hérité de V1.1</h2><span class="badge">${count} bilan(s)</span></div><p>Les données précédentes sont toujours présentes : ${count} bilan(s) et ${sessions} séance(s) enregistrée(s). Cette V1.2 ne les supprime pas.</p><p class="muted">La prochaine évolution pourra reconnecter l’éditeur détaillé V1.1 ici, avec un plan d’intervention multi-approches (TOP, préparation mentale, motivation, habitudes et coaching).</p></div>`}
function renderHistory(){$('decisionHistory').innerHTML=state.decisions.length?[...state.decisions].sort((a,b)=>b.date.localeCompare(a.date)).map(d=>`<article><div class="history-head"><span class="badge ${d.zone.toLowerCase()}">${esc(d.zone)}</span><small>${fmtDate(d.date)}</small></div><h2>${esc(d.title)}</h2><p><b>${esc(d.code)}</b> · ${esc(LIBRARY[d.code]?.title||'')}</p><p>${esc(d.message)}</p><div class="meta">Readiness ${d.score??'—'}/100 ${d.why?.length?'• '+d.why.map(esc).join(' • '):''}</div></article>`).join(''):'<div class="panel empty">Aucune décision enregistrée. Le premier check-in créera l’historique.</div>'}
function hydrateCheckin(){const c=todayCheckin()||null;if(c){$('cSleep').value=c.sleep;$('cRhr').value=c.rhr||'';$('cRhrBase').value=c.rhrBase||state.settings.rhrBaseline||'';$('cKnee').value=c.knee;$('cFatigue').value=c.fatigue;$('cSoreness').value=c.soreness;$('cMotivation').value=c.motivation;$('cWeight').value=c.weight||'';$('cKneeNote').value=c.kneeNote||'';$('cNote').value=c.note||'';}else if(state.settings.rhrBaseline){$('cRhrBase').value=state.settings.rhrBaseline}}

function exportBackup(){
 const payload={app:'APEX Arbitre',version:'1.9',exportedAt:new Date().toISOString(),data:state};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`APEX_sauvegarde_${localToday()}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}
function importBackup(input){
 const file=input.files&&input.files[0];if(!file)return;
 const reader=new FileReader();reader.onload=()=>{try{
   const parsed=JSON.parse(reader.result);const data=parsed.data||parsed;
   if(!data||typeof data!=='object')throw new Error('format');
   if(!confirm('Importer cette sauvegarde APEX ? Les données actuelles seront remplacées par la sauvegarde sélectionnée.')){input.value='';return;}
   localStorage.setItem(KEY,JSON.stringify(data));location.reload();
 }catch(e){alert('Sauvegarde APEX illisible ou invalide.');input.value='';}};reader.readAsText(file);
}
function refreshAll(){const days=Math.max(0,diffDays(localToday(),state.settings.testDate));$('testCountdown').textContent=days===0?'Jour du test':`Test J-${days}`;renderCockpit();renderPlan();renderLibrary();renderProgress();renderMental();renderHistory();hydrateCheckin()}
refreshAll();

/* =========================================================
   APEX V1.5 — moteur adaptatif + boucle d'apprentissage
   Mise à jour non destructive : conserve apex_v1_data.
   ========================================================= */
function migrateToV15(){
  state.settings ||= {};
  state.settings.apexVersion='1.5';
  state.settings.learningEnabled = state.settings.learningEnabled ?? true;
  state.settings.lastPlanAdaptation ||= null;
  state.trainingLog ||= [];
  localStorage.setItem(KEY,JSON.stringify(state));
}
migrateToV15();

function resetPlan(){
  if(confirm('Réinitialiser uniquement le plan APEX V1.5 jusqu’au test ? Tes check-ins, séances réalisées et historiques seront conservés.')){
    state.plan=createDefaultPlan();
    state.settings.lastPlanAdaptation=null;
    persist();
  }
}

function getNextCheckinAfter(date){
  return [...state.checkins].filter(c=>c.date>date).sort((a,b)=>a.date.localeCompare(b.date))[0]||null;
}
function getCheckinOn(date){return state.checkins.find(c=>c.date===date)||null}
function avg(arr){const n=arr.filter(v=>Number.isFinite(v));return n.length?n.reduce((a,b)=>a+b,0)/n.length:null}
function sessionProfile(code){
  const logs=state.trainingLog.filter(t=>t.code===code).slice(-5);
  if(!logs.length)return {count:0,load:'unknown',avgRpe:null,avgKnee:null,avgNextKneeDelta:null};
  const deltas=[];
  logs.forEach(t=>{
    const before=getCheckinOn(t.date); const next=getNextCheckinAfter(t.date);
    if(before&&next&&diffDays(t.date,next.date)<=2) deltas.push((+next.knee||0)-(+before.knee||0));
  });
  const r=avg(logs.map(t=>+t.rpe)); const k=avg(logs.map(t=>Number.isFinite(+t.kneeAfter)?+t.kneeAfter:NaN)); const nd=avg(deltas);
  let load='normal';
  if((r!=null&&r>=8)||(k!=null&&k>=4)||(nd!=null&&nd>=2))load='high';
  else if((r!=null&&r<=5)&&(k==null||k<=2)&&(nd==null||nd<=0))load='well_tolerated';
  return {count:logs.length,load,avgRpe:r,avgKnee:k,avgNextKneeDelta:nd};
}

function computeReadiness(c){
  if(!c)return null;
  const sleep=clamp(+c.sleep||0,0,100);
  const base=+c.rhrBase||+state.settings.rhrBaseline||0;
  const delta=(base&&c.rhr)?(+c.rhr-base):0;
  let score=100; const reasons=[];
  if(sleep<65){score-=22;reasons.push('sommeil bas');} else if(sleep<80){score-=10;reasons.push('sommeil moyen');}
  if(delta>=8){score-=20;reasons.push(`FC repos +${delta} bpm`);} else if(delta>=5){score-=10;reasons.push(`FC repos +${delta} bpm`);}
  if(c.fatigue>=7){score-=20;reasons.push('fatigue élevée');} else if(c.fatigue>=5){score-=9;reasons.push('fatigue modérée');}
  if(c.soreness>=7){score-=12;reasons.push('courbatures élevées');} else if(c.soreness>=5){score-=6;reasons.push('courbatures présentes');}
  if(c.knee>=6){score-=35;reasons.push('douleur genou élevée');} else if(c.knee>=4){score-=20;reasons.push('genou sensible');} else if(c.knee>=2){score-=7;reasons.push('genou à surveiller');}
  if(c.motivation<=3){score-=8;reasons.push('motivation basse');}
  score=clamp(Math.round(score),0,100);
  let zone=score>=80?'GREEN':score>=60?'ORANGE':'RED';
  if(c.knee>=6)zone='RED'; if(c.knee>=4&&zone==='GREEN')zone='ORANGE';
  return {score,zone,reasons,delta};
}

function decisionFor(c,planned){
  if(!c)return {zone:'NEUTRAL',title:'Check-in nécessaire',code:planned?.code||'',message:'Renseigne les données du matin pour qu’APEX adapte la journée.',why:[]};
  const r=computeReadiness(c); const p=planned?LIBRARY[planned.code]:null;
  let code=p?.code||'C1', title='Plan maintenu', message='Les indicateurs du matin permettent de conserver la séance prévue.';
  const why=[...r.reasons];
  const profile=p?sessionProfile(p.code):null;
  let learnedPenalty=0;
  if(profile?.load==='high' && ['A2','A3','A4','Y1','B1','B2'].includes(p.code)){
    learnedPenalty=8;
    why.push(`${p.code} a été exigeante pour toi lors des séances précédentes`);
  }
  let adjustedScore=clamp(r.score-learnedPenalty,0,100);
  let zone=adjustedScore>=80?'GREEN':adjustedScore>=60?'ORANGE':'RED';
  if(c.knee>=6)zone='RED'; if(c.knee>=4&&zone==='GREEN')zone='ORANGE';
  if(zone==='RED'){
    title='Protection / récupération'; code=c.knee>=6?'C2':'A5';
    message=c.knee>=6?'Pas de séance d’impact proposée aujourd’hui. Mobilité très douce uniquement si elle est confortable.':'La charge du jour est réduite : priorité à la récupération et à la fraîcheur.';
  } else if(zone==='ORANGE' && p && ['A2','A3','A4','Y1'].includes(p.code)){
    title='Séance spécifique allégée'; code=c.knee>=4?'A5':'A4';
    message=c.knee>=4?'Le cardio d’impact est remplacé aujourd’hui pour protéger le genou.':'APEX réduit le volume spécifique aujourd’hui en tenant compte de ton état et de tes réactions précédentes.';
  } else if(zone==='ORANGE' && p && ['B1','B2'].includes(p.code)){
    title='Renforcement contrôlé'; code=p.code==='B2'?'B1':p.code;
    message='Le renforcement reste possible, mais avec priorité au contrôle, à l’amplitude confortable et sans recherche de fatigue.';
  }
  if(planned?.code==='T1'){title='Jour du test';code='T1';message='Aucune charge supplémentaire : échauffement habituel, test, puis récupération.';}
  return {zone,score:adjustedScore,title,code,message,why,planned:p?.code||'',plannedTitle:p?.title||'',learned:profile};
}

function computePrepIndex(){
  const c=todayCheckin()||latestCheckin();
  const done=code=>state.trainingLog.some(t=>t.code===code && t.completed!==false);
  let specific=25 + (done('A3')?20:0) + (done('A2')?20:0) + (done('Y1')?35:0);
  specific=clamp(specific,0,100);
  let physical=65, freshness=65, mental=65;
  if(c){
    physical=clamp(Math.round(100-(+c.knee||0)*8-(+c.fatigue||0)*4-(+c.soreness||0)*3),0,100);
    const rr=computeReadiness(c); const rhrScore=clamp(100-Math.max(0,rr.delta)*5,30,100);
    freshness=clamp(Math.round((+c.sleep||0)*.65+rhrScore*.35),0,100);
    mental=clamp(Math.round((+c.motivation||0)*10),0,100);
  }
  const y=[...state.trainingLog].reverse().find(t=>t.code==='Y1');
  if(y&&Number.isFinite(+y.confidence))mental=clamp(Math.round(mental*.65+(+y.confidence*10)*.35),0,100);
  if(y?.completed===true)specific=Math.max(specific,80);
  if(y?.completed===false)specific=Math.min(specific,65);
  const total=Math.round(specific*.40+physical*.25+freshness*.20+mental*.15);
  return {total,specific,physical,freshness,mental};
}
function prepBar(label,value,icon){return `<div class="prep-row"><div class="prep-label"><span>${icon} ${esc(label)}</span><b>${value}/100</b></div><div class="prep-track"><i style="width:${value}%"></i></div></div>`}
function renderPrepIndex(){
  const p=computePrepIndex();
  const badge=$('prepBadge'), box=$('prepIndex'); if(!badge||!box)return;
  badge.textContent=`${p.total}/100`; badge.className='badge '+(p.total>=80?'green':p.total>=60?'orange':'neutral');
  box.innerHTML=`<div class="prep-layout"><div class="prep-total"><b>${p.total}</b><span>/100</span><small>indice APEX</small></div><div class="prep-bars">${prepBar('Capacité spécifique',p.specific,'🏃')}${prepBar('Disponibilité physique',p.physical,'🦵')}${prepBar('Fraîcheur',p.freshness,'😴')}${prepBar('Préparation mentale',p.mental,'🧠')}</div></div><p class="prep-disclaimer">Cet indice sert à piloter le cycle APEX. Il ne prédit pas à lui seul la réussite du test et ne remplace pas ton résultat au vrai Yo-Yo.</p>`;
}

function askNumber(label,def='',min=null,max=null){
  const raw=prompt(label,def); if(raw===null)return {cancel:true}; if(raw.trim()==='')return {value:null}; const n=Number(raw.replace(',','.')); if(!Number.isFinite(n)||(min!=null&&n<min)||(max!=null&&n>max)){alert(`Valeur invalide${min!=null?` (${min} à ${max})`:''}.`);return askNumber(label,def,min,max)} return {value:n};
}
function markTraining(code){
  const lib=LIBRARY[code]; if(!lib)return;
  const completed=confirm('As-tu terminé la séance prévue ?\n\nOK = oui · Annuler = non / arrêt anticipé');
  const r=askNumber('RPE / difficulté ressentie (1 à 10) ?','5',1,10); if(r.cancel)return;
  const k=askNumber('Douleur genou juste après la séance (0 à 10) ?','',0,10); if(k.cancel)return;
  const resp=askNumber('Difficulté respiratoire / souffle (0 à 10) ?','',0,10); if(resp.cancel)return;
  const fcAvg=askNumber('FC moyenne si tu l’as (facultatif, laisser vide sinon) ?','',30,230); if(fcAvg.cancel)return;
  const fcMax=askNumber('FC maximale si tu l’as (facultatif, laisser vide sinon) ?','',30,240); if(fcMax.cancel)return;
  let extra={};
  if(code==='Y1'){
    const level=prompt('Niveau / palier atteint au vrai Yo-Yo (écris-le comme indiqué sur ton protocole) ?',''); if(level===null)return;
    const limiting=prompt('Facteur principal de limitation ?\nExemples : souffle, jambes, rythme, relances/demi-tours, genou, objectif atteint',''); if(limiting===null)return;
    const confidence=askNumber('Confiance pour le test officiel après ce Yo-Yo (0 à 10) ?','7',0,10); if(confidence.cancel)return;
    extra={yoyoLevel:level.trim(),limitingFactor:limiting.trim(),confidence:confidence.value};
  }
  const note=prompt('Commentaire séance (facultatif) ?',''); if(note===null)return;
  const log={id:uid('t'),date:localToday(),code,title:lib.title,completed,rpe:r.value,kneeAfter:k.value,breathing:resp.value,fcAvg:fcAvg.value,fcMax:fcMax.value,note:note.trim(),...extra,createdAt:new Date().toISOString()};
  state.trainingLog.push(log);
  if(code==='Y1')adaptPlanAfterYoyo(log);
  persist();
  closeSession();
  alert(code==='Y1'?'Vrai Yo-Yo enregistré. APEX a recalculé le cap de la dernière semaine sans modifier tes données passées.':'Séance enregistrée. APEX comparera cette charge avec tes prochains check-ins.');
}

function adaptPlanAfterYoyo(log){
  const factor=(log.limitingFactor||'').toLowerCase();
  const knee=+log.kneeAfter||0;
  let changes={}, explanation='';
  if(knee>=4 || /genou|douleur/.test(factor)){
    changes={'2026-08-24':'C1','2026-08-25':'A5','2026-08-26':'C1','2026-08-27':'A4'};
    explanation='Tolérance du genou prioritaire : charge réduite après Y1, avec maintien d’un rappel court seulement si les check-ins suivants le permettent.';
  } else if(log.completed && /objectif|atteint|ok|aucun/.test(factor)){
    changes={'2026-08-24':'B2','2026-08-25':'A4','2026-08-26':'C1','2026-08-27':'A4'};
    explanation='Y1 rassurant : APEX cesse de chercher une forte progression et privilégie fraîcheur + rappels courts.';
  } else if(/jambes|musculaire|fatigue/.test(factor)){
    changes={'2026-08-24':'A5','2026-08-25':'B2','2026-08-26':'C1','2026-08-27':'A4'};
    explanation='Limitation surtout musculaire : récupération et stabilité avant un dernier rappel court.';
  } else {
    changes={'2026-08-24':'B1','2026-08-25':'A2','2026-08-26':'C1','2026-08-27':'A4'};
    explanation='Y1 indique encore un intérêt à conserver une stimulation spécifique contrôlée le 25/08, puis à alléger nettement.';
  }
  state.plan=state.plan.map(p=>changes[p.date]?{...p,code:changes[p.date],note:`Plan adapté après Y1 · ${explanation}`} : p);
  state.settings.lastPlanAdaptation={date:new Date().toISOString(),source:'Y1',explanation,changes};
}

function adaptiveInsights(){
  const codes=['A2','A3','A4','B1','B2'];
  const rows=codes.map(code=>({code,...sessionProfile(code)})).filter(x=>x.count);
  if(!rows.length)return '<div class="empty">APEX a besoin de quelques séances réalisées et de check-ins le lendemain pour apprendre tes réactions personnelles.</div>';
  return `<div class="learning-grid">${rows.map(x=>{const status=x.load==='high'?'Charge forte pour toi':x.load==='well_tolerated'?'Bien tolérée':'Tolérance habituelle';return `<article class="learning-card ${x.load}"><div><span class="code">${x.code}</span><b>${esc(status)}</b></div><small>${x.count} séance(s) analysée(s)</small><p>RPE moy. <b>${x.avgRpe!=null?x.avgRpe.toFixed(1):'—'}</b> · genou après <b>${x.avgKnee!=null?x.avgKnee.toFixed(1):'—'}</b>${x.avgNextKneeDelta!=null?` · variation genou au check-in suivant <b>${x.avgNextKneeDelta>=0?'+':''}${x.avgNextKneeDelta.toFixed(1)}</b>`:''}</p></article>`}).join('')}</div>`;
}

function renderCockpit(){
  const c=todayCheckin()||latestCheckin(); const sameDay=c?.date===localToday(); const p=plannedFor(); const d=sameDay?decisionFor(c,p):decisionFor(null,p); const box=$('cockpitDecision');
  const zone=d.zone.toLowerCase(); box.innerHTML=`<div class="decision-main ${zone}"><div class="status-dot"></div><div class="decision-copy"><span class="eyebrow">AUJOURD'HUI · ${fmtDate(localToday())}</span><h2>${esc(d.title)}</h2><p>${esc(d.message)}</p><div class="decision-session" onclick="${d.code?`openSession('${esc(d.code)}')`:''}" style="cursor:${d.code?'pointer':'default'}"><span class="code">${esc(d.code||p?.code||'—')}</span><div><b>${esc(LIBRARY[d.code]?.title||LIBRARY[p?.code]?.title||'Check-in à faire')}</b><small>${esc(LIBRARY[d.code]?.duration||'')}${d.code?' · ouvrir la fiche ›':''}</small></div></div>${d.learned?.count?`<div class="learning-note">APEX connaît déjà ${d.learned.count} retour(s) sur ${esc(d.planned||d.code)}${d.learned.load==='high'?' et la considère comme une charge forte pour toi.':d.learned.load==='well_tolerated'?' et elle a été bien tolérée.':'.'}</div>`:''}</div>${d.score!=null?`<div class="big-score"><b>${d.score}</b><span>readiness</span></div>`:''}</div>`;
  const snap=$('morningSnapshot'); if(!c){snap.innerHTML='<div class="empty">Aucune donnée. Fais le check-in du matin.</div>';$('readinessBadge').textContent='À renseigner';$('readinessBadge').className='badge neutral';}
  else {const rr=computeReadiness(c);$('readinessBadge').textContent=`${sameDay?'Aujourd’hui':'Dernier'} · ${rr.score}/100`;$('readinessBadge').className='badge '+rr.zone.toLowerCase();snap.innerHTML=metric('😴','Sommeil',`${c.sleep}/100`)+metric('❤️','FC repos',c.rhr?`${c.rhr} bpm`:'—')+metric('🦵','Genou',`${c.knee}/10`)+metric('⚡','Fatigue',`${c.fatigue}/10`)+metric('💪','Motivation',`${c.motivation}/10`)+metric('🏋️','Courbatures',`${c.soreness}/10`);}
  const days=diffDays(localToday(),state.settings.testDate); let adapt=state.settings.lastPlanAdaptation?.explanation||'';
  $('goalSnapshot').innerHTML=`<div class="goal-ring"><b>J-${Math.max(0,days)}</b><span>avant test</span></div><div><b>Test officiel Yo-Yo</b><p>Samedi 29 août 2026</p><p class="muted">Priorité : arriver préparé mais frais, en protégeant le genou.</p>${adapt?`<p class="adapt-note"><b>Dernière adaptation :</b> ${esc(adapt)}</p>`:''}</div>`;
  renderPrepIndex();
}

function renderProgress(){
  const cs=[...state.checkins].sort((a,b)=>a.date.localeCompare(b.date));$('statCheckins').textContent=state.checkins.length;$('statTraining').textContent=state.trainingLog.length;$('statMental').textContent=state.sessions.length;$('statDays').textContent=Math.max(0,diffDays(localToday(),state.settings.testDate));$('sleepTrend').innerHTML=spark(cs.map(c=>c.sleep),100);$('kneeTrend').innerHTML=spark(cs.map(c=>c.knee),10);
  const ai=$('adaptiveInsights'); if(ai)ai.innerHTML=adaptiveInsights();
  $('trainingLog').innerHTML=state.trainingLog.length?[...state.trainingLog].reverse().map(t=>`<div class="log-row"><span>${fmtDate(t.date)}</span><b>${esc(t.code)} · ${esc(t.title)}${t.completed===false?' · arrêtée':''}</b><small>RPE ${t.rpe??'—'} · genou après ${t.kneeAfter??'—'}/10${t.breathing!=null?' · souffle '+t.breathing+'/10':''}${t.fcMax?' · FC max '+t.fcMax:''}${t.yoyoLevel?' · Yo-Yo '+esc(t.yoyoLevel):''}</small></div>`).join(''):'<div class="empty">Aucune séance encore marquée comme réalisée.</div>';
}

function exportBackup(){
 const payload={app:'APEX Arbitre',version:'1.5',exportedAt:new Date().toISOString(),data:state};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`APEX_sauvegarde_${localToday()}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}

refreshAll();


/* =========================================================
   APEX V1.6 — mobile + mode exécution
   Non destructif : même clé apex_v1_data.
   ========================================================= */
(function(){
  state.settings ||= {};
  state.settings.apexVersion='1.6';
  state.settings.mobileExecution=true;
  localStorage.setItem(KEY,JSON.stringify(state));
})();

// Bibliothèque Pilates V1.6 : chaque exercice possède un visuel correspondant.
Object.assign(LIBRARY,{
 B1:{code:'B1',pillar:'Renforcement',title:'Pilates / renforcement protecteur',duration:'≈ 36–42 min',intensity:'Faible à modérée',summary:'Séance complète visuelle : fessiers, hanches, dos, gainage et mobilité avec un minimum d’impact.',purpose:'Renforcer le corps de façon contrôlée, protéger le genou par le travail des fessiers et du tronc, et conserver une bonne mobilité.',knee:'Aucune douleur articulaire croissante. Réduire l’amplitude, la tension ou supprimer un mouvement si le genou devient inconfortable.',rpe:'4–5/10',equipment:'Tapis + barre Pilates + bandes',visualMode:true,exercises:[
  {name:'Bridge + abduction',time:'3 × 10–12',image:'assets/pilates/bridge_abduction.jpg',setup:'Allongé, pieds au sol, bande au-dessus des genoux.',how:'Monter le bassin, puis ouvrir légèrement les genoux contre la bande avant de revenir.',focus:'Fessiers, ischios, stabilité du bassin.',knee:'Genoux alignés avec les pieds ; ouverture petite et contrôlée.'},
  {name:'Clamshell',time:'3 × 12 / côté',image:'assets/pilates/clamshell.jpg',setup:'Allongé sur le côté, genoux fléchis, pieds joints, bande au-dessus des genoux.',how:'Ouvrir le genou supérieur sans faire rouler le bassin, puis refermer lentement.',focus:'Moyen fessier, stabilité de hanche.',knee:'Le mouvement vient de la hanche ; aucune torsion du genou.'},
  {name:'Rowing assis',time:'3 × 10–12',image:'assets/pilates/rowing_assis.jpg',setup:'Assis, jambes confortables, bandes tendues devant soi.',how:'Tirer la barre vers le bas des côtes, épaules basses, puis revenir lentement.',focus:'Dos, posture, omoplates.'},
  {name:'Planche sur genoux',time:'3 × 25–40 s',image:'assets/pilates/planche_genoux.jpg',setup:'Avant-bras au sol, genoux sur tapis ou coussin, bassin aligné.',how:'Engager le centre et maintenir le tronc stable en respirant normalement.',focus:'Gainage profond, stabilité du tronc.',knee:'Mettre un coussin sous les genoux si l’appui est sensible.'},
  {name:'Bird-dog',time:'3 × 8–10 / côté',image:'assets/pilates/bird_dog.jpg',setup:'À quatre pattes, dos neutre.',how:'Allonger bras et jambe opposés sans tourner le bassin. Revenir puis changer de côté.',focus:'Gainage, fessiers, coordination.',knee:'Appui doux sur tapis ; amplitude réduite si nécessaire.'},
  {name:'Roll-up assisté',time:'2 × 6–8',image:'assets/pilates/roll_up.jpg',setup:'Allongé, barre tenue au-dessus du buste, tension légère.',how:'Enrouler progressivement le tronc pour monter puis redescendre vertèbre par vertèbre.',focus:'Abdominaux, contrôle, mobilité du rachis.'}
 ]},
 B2:{code:'B2',pillar:'Renforcement',title:'Renforcement court + stabilité',duration:'≈ 24–28 min',intensity:'Modérée',summary:'Circuit visuel court pour entretenir fessiers, chaîne postérieure, anti-rotation et stabilité sans fatigue résiduelle importante.',purpose:'Entretenir le renforcement utile à l’arbitrage quand la priorité reste la fraîcheur.',knee:'Mouvements contrôlés et amplitude confortable. Le pas latéral reste peu fléchi si le genou est sensible.',rpe:'4–6/10',equipment:'Tapis + barre Pilates + bandes',visualMode:true,exercises:[
  {name:'Demi-pont',time:'3 × 12–15',image:'assets/pilates/demi_pont.jpg',setup:'Allongé, pieds au sol largeur bassin.',how:'Soulever modérément le bassin, serrer les fessiers puis redescendre sous contrôle.',focus:'Fessiers, ischios, lombaires.',knee:'Conserver les genoux dans l’axe des pieds.'},
  {name:'Monster walk',time:'2 × 8–10 pas / côté',image:'assets/pilates/monster_walk.jpg',setup:'Bande au-dessus des genoux, buste haut, flexion très légère.',how:'Faire de petits pas latéraux sans laisser les genoux rentrer vers l’intérieur.',focus:'Moyen fessier, stabilité de hanche.',knee:'Très faible flexion ; arrêter si le genou n’apprécie pas.'},
  {name:'Good morning',time:'3 × 10–12',image:'assets/pilates/good_morning.jpg',setup:'Barre sur les épaules, pieds largeur bassin, genoux déverrouillés.',how:'Basculer le buste depuis les hanches en gardant le dos neutre, puis revenir.',focus:'Ischios, fessiers, chaîne postérieure.'},
  {name:'Pallof press',time:'3 × 8–10 / côté',image:'assets/pilates/pallof_press.jpg',setup:'Debout stable, bande tirant latéralement au niveau du sternum.',how:'Pousser les mains devant soi sans laisser le tronc tourner, revenir lentement.',focus:'Gainage anti-rotation, obliques, stabilité.'},
  {name:'Bird-dog',time:'2 × 8 / côté',image:'assets/pilates/bird_dog.jpg',setup:'À quatre pattes, dos neutre.',how:'Allonger bras et jambe opposés puis revenir lentement.',focus:'Fessiers, gainage, équilibre.',knee:'Coussin sous les genoux si besoin.'},
  {name:'Roll-up assisté',time:'2 × 6',image:'assets/pilates/roll_up.jpg',setup:'Allongé avec la barre et une tension légère.',how:'Monter puis redescendre lentement en contrôlant le tronc.',focus:'Abdominaux, contrôle, mobilité.'}
 ]}
});

let EXEC={code:null,index:0,type:null};
function ensureV16Ui(){
 if(document.getElementById('executionOverlay'))return;
 const overlay=document.createElement('div'); overlay.id='executionOverlay'; overlay.className='execution-overlay';
 overlay.innerHTML='<div id="executionContent" class="execution-content"></div>'; document.body.appendChild(overlay);
 const debrief=document.createElement('div'); debrief.id='debriefOverlay'; debrief.className='execution-overlay';
 debrief.innerHTML='<div id="debriefContent" class="execution-content"></div>'; document.body.appendChild(debrief);
 const bottom=document.createElement('nav'); bottom.className='mobile-bottom-nav';
 bottom.innerHTML=`<button onclick="closeExecution();go('cockpit')">⌂<span>Aujourd’hui</span></button><button onclick="closeExecution();go('plan')">▦<span>Plan</span></button><button onclick="closeExecution();go('library')">▶<span>Séances</span></button><button onclick="closeExecution();go('progress')">↗<span>Progrès</span></button><button onclick="closeExecution();go('sync')">☁<span>Sync</span></button>`;
 document.body.appendChild(bottom);
 const today=document.createElement('button'); today.className='floating-today'; today.textContent='⌂ Aujourd’hui'; today.onclick=()=>{closeExecution();go('cockpit')}; document.body.appendChild(today);
}
ensureV16Ui();

// Fiche séance V1.6 avec accès direct aux modes d'exécution.
function openSession(code){
 const x=LIBRARY[code]; if(!x)return; const modal=$('sessionModal');
 const executeButton=x.domyos?`<button class="primary execute-big" onclick="startDomyos('${esc(code)}')">📱 Mode programmation E-Connected</button>`:x.visualMode?`<button class="primary execute-big" onclick="startPilates('${esc(code)}')">▶ Mode séance avec images</button>`:'';
 $('sessionModalContent').innerHTML=`<div class="session-sheet-head"><div><span class="code large">${esc(x.code)}</span><span class="tag">${esc(x.pillar)}</span></div><button class="modal-close" onclick="closeSession()">×</button></div><h1>${esc(x.title)}</h1><div class="session-facts"><span>⏱ <b>${esc(x.duration)}</b></span><span>⚡ <b>${esc(x.intensity)}</b></span><span>📊 RPE <b>${esc(x.rpe||'—')}</b></span></div><p class="session-summary">${esc(x.summary||'')}</p>${executeButton}${x.domyos?renderDomyosProgram(x):renderSteps(x)}<div class="session-detail-grid"><div class="session-info"><span class="eyebrow">OBJECTIF</span><p>${esc(x.purpose||'')}</p></div>${x.knee?`<div class="session-info warning"><span class="eyebrow">GENOU / VIGILANCE</span><p>${esc(x.knee)}</p></div>`:''}</div><div class="modal-actions"><button class="ghost" onclick="closeSession()">Fermer</button><button class="primary" onclick="markTraining('${esc(x.code)}')">✓ Débrief de séance</button></div>`;
 modal.classList.add('open');document.body.classList.add('modal-open');
}

function closeExecution(){const o=document.getElementById('executionOverlay');if(o)o.classList.remove('open');document.body.classList.remove('execution-open')}
function startPilates(code){closeSession();EXEC={code,index:0,type:'pilates'};document.getElementById('executionOverlay').classList.add('open');document.body.classList.add('execution-open');renderPilatesExecution()}
function renderPilatesExecution(){
 const x=LIBRARY[EXEC.code], e=x.exercises[EXEC.index], total=x.exercises.length;
 $('executionContent').innerHTML=`<header class="exec-head"><button onclick="closeExecution()">←</button><div><small>${esc(x.code)} · ${esc(x.title)}</small><b>Exercice ${EXEC.index+1} / ${total}</b></div><button onclick="markTraining('${esc(x.code)}')">✓</button></header><main class="pilates-exec"><div class="exec-progress"><i style="width:${((EXEC.index+1)/total)*100}%"></i></div><h1>${esc(e.name)}</h1><div class="photo-frame"><img src="${esc(e.image)}" alt="${esc(e.name)}"></div><div class="exec-dose">${esc(e.time)}</div><section><h3>Installation</h3><p>${esc(e.setup)}</p></section><section><h3>Exécution</h3><p>${esc(e.how)}</p></section><section><h3>Cible</h3><p>${esc(e.focus)}</p></section>${e.knee?`<section class="exec-knee"><h3>🦵 Vigilance genou</h3><p>${esc(e.knee)}</p></section>`:''}</main><footer class="exec-nav"><button ${EXEC.index===0?'disabled':''} onclick="EXEC.index--;renderPilatesExecution()">← Précédent</button>${EXEC.index<total-1?`<button class="primary" onclick="EXEC.index++;renderPilatesExecution()">Suivant →</button>`:`<button class="primary" onclick="markTraining('${esc(x.code)}')">Terminer la séance ✓</button>`}</footer>`;
}
function startDomyos(code){closeSession();EXEC={code,index:0,type:'domyos'};document.getElementById('executionOverlay').classList.add('open');document.body.classList.add('execution-open');renderDomyosExecution()}
function domyosExecSteps(x){const d=x.domyosInput;return [
 {n:1,title:'Échauffement',rows:[['Durée',d.warmup.duration],['Vitesse',d.warmup.speed]],note:'Un seul bloc programmable.'},
 {n:2,title:'Intervalle Haut',rows:[['Durée',d.high.duration],['Vitesse',d.high.speed]]},
 {n:3,title:'Intervalle Bas',rows:[['Durée',d.low.duration],['Vitesse',d.low.speed]]},
 {n:4,title:"Nombre d’intervalle",rows:[['Valeur à sélectionner',String(d.intervalSelect)],['Résultat réel',d.intervalActual+' passages']],note:`Dans E-Connected, la valeur est le nombre de répétitions supplémentaires.`},
 {n:5,title:'Répétition exercice',rows:[['Valeur à sélectionner',String(d.exerciseRepeatSelect)],['Résultat réel',d.exerciseActual+' bloc'+(d.exerciseActual>1?'s':'')],['Temps repos',d.rest.duration],['Vitesse repos',d.rest.speed],['Inclinaison',d.rest.incline]],note:d.rest.unused?'Bloc non répété : laisser 0.':'Même règle : la valeur sélectionnée correspond aux répétitions supplémentaires.'},
 {n:6,title:'Récupération',rows:[['Durée',d.recovery.duration],['Vitesse',d.recovery.speed]]}
]}
function renderDomyosExecution(){const x=LIBRARY[EXEC.code],steps=domyosExecSteps(x),s=steps[EXEC.index];$('executionContent').innerHTML=`<header class="exec-head"><button onclick="closeExecution()">←</button><div><small>${esc(x.code)} · Programmation E-Connected</small><b>Étape ${s.n} / 6</b></div><button onclick="markTraining('${esc(x.code)}')">✓</button></header><main class="domyos-exec"><div class="exec-progress"><i style="width:${(s.n/6)*100}%"></i></div><div class="domyos-big-number">${s.n}</div><h1>${esc(s.title)}</h1><div class="domyos-big-values">${s.rows.map(([k,v])=>`<article><small>${esc(k)}</small><b>${esc(v)}</b></article>`).join('')}</div>${s.note?`<div class="exec-tip">${esc(s.note)}</div>`:''}</main><footer class="exec-nav"><button ${EXEC.index===0?'disabled':''} onclick="EXEC.index--;renderDomyosExecution()">← Précédent</button>${EXEC.index<5?`<button class="primary" onclick="EXEC.index++;renderDomyosExecution()">Suivant →</button>`:`<button class="primary" onclick="markTraining('${esc(x.code)}')">Séance programmée ✓</button>`}</footer>`}

// Débrief express V1.6 (remplace les prompts successifs).
function markTraining(code){
 const x=LIBRARY[code]; if(!x)return; closeExecution(); closeSession();
 const d=document.getElementById('debriefOverlay'); d.classList.add('open'); document.body.classList.add('execution-open');
 $('debriefContent').innerHTML=`<header class="exec-head"><button onclick="closeDebrief()">←</button><div><small>Débrief express</small><b>${esc(code)} · ${esc(x.title)}</b></div><span></span></header><main class="debrief-form"><h1>Comment s’est passée la séance ?</h1><label>Séance terminée ?<select id="dbCompleted"><option value="true">Oui</option><option value="false">Non / arrêt anticipé</option></select></label>${rangeField('dbRpe','RPE / effort perçu',5,1,10)}${rangeField('dbKnee','Douleur genou après',0,0,10)}${rangeField('dbBreath','Difficulté respiratoire',3,0,10)}<div class="db-grid"><label>FC moyenne (optionnel)<input id="dbFcAvg" type="number" inputmode="numeric" placeholder="bpm"></label><label>FC max (optionnel)<input id="dbFcMax" type="number" inputmode="numeric" placeholder="bpm"></label></div>${code==='Y1'?`<label>Niveau / palier Yo-Yo<input id="dbYoyo" type="text" placeholder="niveau atteint"></label><label>Facteur limitant<input id="dbLimit" type="text" placeholder="souffle, jambes, genou, rythme..."></label>${rangeField('dbConfidence','Confiance pour le test officiel',7,0,10)}`:''}<label>Commentaire (optionnel)<textarea id="dbNote" placeholder="Sensations, point à retenir..."></textarea></label></main><footer class="exec-nav"><button onclick="closeDebrief()">Annuler</button><button class="primary" onclick="saveDebrief('${esc(code)}')">Enregistrer ✓</button></footer>`;
 bindRanges();
}
function rangeField(id,label,value,min,max){return `<label class="range-label"><span>${esc(label)} <b id="${id}Val">${value}/${max}</b></span><input id="${id}" type="range" min="${min}" max="${max}" value="${value}" oninput="document.getElementById('${id}Val').textContent=this.value+'/${max}'"></label>`}
function bindRanges(){}
function closeDebrief(){document.getElementById('debriefOverlay').classList.remove('open');document.body.classList.remove('execution-open')}
function saveDebrief(code){
 const lib=LIBRARY[code], completed=$('dbCompleted').value==='true';
 const log={id:uid('t'),date:localToday(),code,title:lib.title,completed,rpe:+$('dbRpe').value,kneeAfter:+$('dbKnee').value,breathing:+$('dbBreath').value,fcAvg:+$('dbFcAvg').value||null,fcMax:+$('dbFcMax').value||null,note:$('dbNote').value.trim(),createdAt:new Date().toISOString()};
 if(code==='Y1'){log.yoyoLevel=$('dbYoyo').value.trim();log.limitingFactor=$('dbLimit').value.trim();log.confidence=+$('dbConfidence').value;if(typeof adaptPlanAfterYoyo==='function')adaptPlanAfterYoyo(log)}
 state.trainingLog.push(log);persist();closeDebrief();alert('Débrief enregistré. APEX utilisera ces données pour adapter la suite.');
}

// Rendre les fiches Pilates classiques visuelles aussi.
function renderExerciseSheet(x){return `<section class="exercise-sheet"><div class="exercise-head"><div><span class="eyebrow">FICHE PILATES</span><h2>${esc(x.code)} · aperçu</h2></div><span class="badge">${esc(x.equipment||'')}</span></div><div class="exercise-list visual-list">${x.exercises.map((e,i)=>`<article class="exercise-card visual-card"><div class="exercise-num">${i+1}</div><img src="${esc(e.image||'')}" alt="${esc(e.name)}"><div class="exercise-main"><div class="exercise-title"><h3>${esc(e.name)}</h3><b>${esc(e.time)}</b></div><p>${esc(e.how)}</p>${e.knee?`<p class="exercise-knee"><strong>Genou :</strong> ${esc(e.knee)}</p>`:''}</div></article>`).join('')}</div></section>`}

// Petit raccourci depuis le cockpit : la séance du jour s'ouvre en un clic.
const _renderCockpitV16=renderCockpit;
renderCockpit=function(){_renderCockpitV16(); const p=plannedFor(); const c=todayCheckin(); if(p&&LIBRARY[p.code]){const host=$('cockpitDecision'); if(host&&!host.querySelector('.cockpit-open-session')) host.insertAdjacentHTML('beforeend',`<button class="primary cockpit-open-session" onclick="openSession('${esc((c?decisionFor(c,p).code:p.code)||p.code)}')">▶ Ouvrir la séance du jour</button>`)} renderPrepIndex();}

refreshAll();

/* =========================================================
   APEX V1.7 MIGRATION — Supabase / multi-appareils
   IMPORTANT : aucune migration automatique de apex_v1_data.
   La V1.6 locale reste la source de vérité à ce stade.
   ========================================================= */
const APEX_SUPABASE_URL='https://dnyjybitsybeakavxicj.supabase.co';
const APEX_SUPABASE_PUBLISHABLE_KEY='sb_publishable_sT2_0SvMQNR1v9_7irAfHA_UKne0hE9';
let apexCloud=null;
let apexCloudUser=null;

function initV17State(){
  state.settings ||= {};
  state.settings.apexVersion='1.7-migration';
  state.settings.cloud ||= {enabled:false,lastTestAt:null,lastTestOk:false};
  localStorage.setItem(KEY,JSON.stringify(state));
}
initV17State();

function cloudSetResult(id,type,text){
  const el=$(id); if(!el)return;
  el.className='cloud-result '+type;
  el.textContent=text;
}
function renderLocalMigrationPreview(){
  const el=$('localMigrationPreview'); if(!el)return;
  el.innerHTML=`
    <article><b>${state.checkins?.length||0}</b><span>check-in(s) locaux</span></article>
    <article><b>${state.trainingLog?.length||0}</b><span>séance(s) / débrief(s)</span></article>
    <article><b>${state.decisions?.length||0}</b><span>décision(s) APEX</span></article>
    <article><b>${state.plan?.length||0}</b><span>jour(s) de planning</span></article>`;
}
function updateCloudUi(){
  const logged=!!apexCloudUser;
  const out=$('cloudAuthLoggedOut'), inside=$('cloudAuthLoggedIn'), badge=$('cloudAuthBadge'), top=$('cloudTopStatus'), btn=$('cloudTestBtn');
  if(out)out.classList.toggle('hidden',logged);
  if(inside)inside.classList.toggle('hidden',!logged);
  if(badge){badge.textContent=logged?'Connecté':'Non connecté';badge.className='badge '+(logged?'green':'neutral')}
  if(top){top.textContent=logged?'CLOUD OK':'LOCAL';top.className='cloud-top-status '+(logged?'online':'local')}
  if(btn)btn.disabled=!logged;
  const migBtn=$('cloudMigrationBtn');
  if(migBtn)migBtn.disabled=!(logged && state.settings?.cloud?.lastTestOk);
  if(logged && $('cloudUserEmail'))$('cloudUserEmail').textContent=apexCloudUser.email||apexCloudUser.id;
  renderLocalMigrationPreview();
}
async function initCloud(){
  renderLocalMigrationPreview();
  try{
    if(!window.supabase?.createClient){
      cloudSetResult('cloudTestResult','error','La bibliothèque Supabase n’a pas pu être chargée. Vérifie la connexion Internet puis recharge APEX.');
      const top=$('cloudTopStatus'); if(top){top.textContent='CLOUD ?';top.className='cloud-top-status error'}
      return;
    }
    apexCloud=window.supabase.createClient(APEX_SUPABASE_URL,APEX_SUPABASE_PUBLISHABLE_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
    });
    const {data:{session},error}=await apexCloud.auth.getSession();
    if(error)throw error;
    apexCloudUser=session?.user||null;
    updateCloudUi();
    if(apexCloudUser) await cloudReadProfile();
    apexCloud.auth.onAuthStateChange(async(_event,sessionNow)=>{
      apexCloudUser=sessionNow?.user||null;
      updateCloudUi();
      if(apexCloudUser) await cloudReadProfile();
    });
  }catch(err){
    console.error('APEX cloud init',err);
    cloudSetResult('cloudTestResult','error','Initialisation cloud impossible : '+(err?.message||err));
  }
}
async function cloudSignIn(){
  if(!apexCloud){cloudSetResult('cloudTestResult','error','Client Supabase indisponible. Recharge la page avec une connexion Internet.');return}
  const email=($('cloudEmail')?.value||'').trim();
  const password=$('cloudPassword')?.value||'';
  if(!email||!password){alert('Renseigne ton e-mail et ton mot de passe APEX.');return}
  const badge=$('cloudAuthBadge'); if(badge){badge.textContent='Connexion…';badge.className='badge neutral'}
  const {data,error}=await apexCloud.auth.signInWithPassword({email,password});
  if(error){
    apexCloudUser=null;updateCloudUi();
    cloudSetResult('cloudProfileResult','error','Connexion refusée : '+error.message);
    alert('Connexion APEX impossible : '+error.message);return;
  }
  apexCloudUser=data.user; if($('cloudPassword'))$('cloudPassword').value='';
  updateCloudUi(); await cloudReadProfile();
}
async function cloudSignOut(){
  if(apexCloud)await apexCloud.auth.signOut();
  apexCloudUser=null;updateCloudUi();
  cloudSetResult('cloudTestResult','neutral','Connecte-toi d’abord.');
}
async function cloudReadProfile(){
  if(!apexCloud||!apexCloudUser)return false;
  cloudSetResult('cloudProfileResult','neutral','Lecture du profil sécurisé…');
  const {data,error}=await apexCloud.from('profiles').select('id,display_name,apex_version,updated_at').eq('id',apexCloudUser.id).single();
  if(error){
    cloudSetResult('cloudProfileResult','error','Profil non lisible via la session utilisateur : '+error.message);
    return false;
  }
  cloudSetResult('cloudProfileResult','ok',`Profil RLS lu avec succès : ${data.display_name||'—'} · ${data.apex_version||'—'} · UID ${data.id.slice(0,8)}…`);
  return true;
}
async function runCloudRoundTripTest(){
  if(!apexCloud||!apexCloudUser){alert('Connecte-toi d’abord.');return}
  const btn=$('cloudTestBtn'); if(btn){btn.disabled=true;btn.textContent='Test en cours…'}
  const badge=$('cloudTestBadge'); if(badge){badge.textContent='Test…';badge.className='badge neutral'}
  cloudSetResult('cloudTestResult','neutral','Étape 1/3 : vérification du profil RLS…');
  try{
    const profileOk=await cloudReadProfile(); if(!profileOk)throw new Error('Le profil ne peut pas être lu avec la session authentifiée.');
    cloudSetResult('cloudTestResult','neutral','Étape 2/3 : écriture d’un marqueur technique dans tes settings…');
    const {data:existing,error:readErr}=await apexCloud.from('settings').select('settings_data,target_test_date,target_name,usual_resting_hr').eq('user_id',apexCloudUser.id).maybeSingle();
    if(readErr)throw readErr;
    const marker={at:new Date().toISOString(),device:navigator.userAgent.includes('Mobile')?'mobile':'desktop',appVersion:'1.7-migration'};
    const merged={...(existing?.settings_data||{}),v17_connection_test:marker};
    const row={
      user_id:apexCloudUser.id,
      target_test_date:existing?.target_test_date||state.settings.testDate||TEST_DATE,
      target_name:existing?.target_name||'Test Yo-Yo 29/08/2026',
      usual_resting_hr:existing?.usual_resting_hr||(+state.settings.rhrBaseline||null),
      settings_data:merged
    };
    const {error:writeErr}=await apexCloud.from('settings').upsert(row,{onConflict:'user_id'});
    if(writeErr)throw writeErr;
    cloudSetResult('cloudTestResult','neutral','Étape 3/3 : relecture depuis Supabase…');
    const {data:back,error:backErr}=await apexCloud.from('settings').select('settings_data,updated_at').eq('user_id',apexCloudUser.id).single();
    if(backErr)throw backErr;
    const returned=back?.settings_data?.v17_connection_test;
    if(!returned?.at)throw new Error('Le marqueur écrit n’a pas été retrouvé.');
    state.settings.cloud={...(state.settings.cloud||{}),enabled:state.settings.cloud?.enabled||false,lastTestAt:returned.at,lastTestOk:true,migratedAt:state.settings.cloud?.migratedAt||null};
    localStorage.setItem(KEY,JSON.stringify(state));
    if(badge){badge.textContent='VALIDÉ';badge.className='badge green'}
    cloudSetResult('cloudTestResult','ok',`Test réussi. Authentification, RLS, écriture et relecture fonctionnent. Marqueur cloud : ${new Date(returned.at).toLocaleString('fr-FR')}. Tu peux maintenant lancer la migration manuelle.`); updateCloudUi();
  }catch(err){
    console.error('APEX cloud round trip',err);
    state.settings.cloud={...(state.settings.cloud||{}),enabled:state.settings.cloud?.enabled||false,lastTestAt:new Date().toISOString(),lastTestOk:false};
    localStorage.setItem(KEY,JSON.stringify(state));
    if(badge){badge.textContent='ÉCHEC';badge.className='badge orange'}
    cloudSetResult('cloudTestResult','error','Test interrompu : '+(err?.message||err));
  }finally{
    if(btn){btn.disabled=!apexCloudUser;btn.textContent='Relancer le test sécurisé'}
  }
}



/* =========================================================
   APEX V1.7 — migration locale -> Supabase
   Non destructive : conserve apex_v1_data et crée une copie
   de sécurité locale avant tout envoi.
   ========================================================= */
function cloudBackupBeforeMigration(){
  const snapshot={createdAt:new Date().toISOString(),data:JSON.parse(JSON.stringify(state))};
  localStorage.setItem('apex_v17_pre_migration_backup',JSON.stringify(snapshot));
  return snapshot;
}
function decisionForDate(date){return (state.decisions||[]).find(d=>d.date===date)||null}
function mapCheckinToCloud(c){
  const r=computeReadiness(c), d=decisionForDate(c.date);
  return {
    user_id:apexCloudUser.id,
    checkin_date:c.date,
    sleep_score:c.sleep??null,
    resting_hr:c.rhr??null,
    usual_resting_hr:c.rhrBase??(+state.settings.rhrBaseline||null),
    knee_pain:c.knee??null,
    fatigue:c.fatigue??null,
    soreness:c.soreness??null,
    motivation:c.motivation??null,
    weight_kg:c.weight??null,
    readiness_score:r?.score??null,
    readiness_state:r?.zone??null,
    knee_note:c.kneeNote||null,
    general_note:c.note||null,
    apex_decision:d||{},
    raw_data:c||{}
  };
}
function mapPlanToCloud(p){const lib=LIBRARY[p.code]||{};return {
  user_id:apexCloudUser.id, plan_date:p.date, workout_code:p.code||null,
  workout_name:lib.title||p.code||null, status:p.date<localToday()?'past':'planned',
  source:'apex-local-migration', plan_data:p||{}
}}
function mapWorkoutToCloud(t){
  return {
    user_id:apexCloudUser.id,
    workout_date:t.date,
    workout_code:t.code,
    workout_name:t.title||LIBRARY[t.code]?.title||t.code,
    completed:t.completed!==false,
    duration_seconds:t.durationSeconds??null,
    distance_km:t.distanceKm??null,
    rpe:t.rpe??null,
    knee_pain_after:t.kneeAfter??null,
    breathing_difficulty:t.breathing??null,
    avg_hr:t.fcAvg??null,
    max_hr:t.fcMax??null,
    avg_speed_kmh:t.avgSpeed??null,
    max_speed_kmh:t.maxSpeed??null,
    calories:t.calories??null,
    changed_during_session:!!t.changedDuringSession,
    change_note:t.changeNote||null,
    comment:t.note||null,
    specific_result:t.code==='Y1'?{yoyoLevel:t.yoyoLevel||null,limitingFactor:t.limitingFactor||null,confidence:t.confidence??null}:{},
    raw_data:{...t,apex_local_id:t.id||null}
  };
}
async function migrateWorkoutLogs(){
  const logs=state.trainingLog||[]; if(!logs.length)return 0;
  const {data:remote,error:readErr}=await apexCloud.from('workout_feedback').select('id,raw_data').eq('user_id',apexCloudUser.id);
  if(readErr)throw readErr;
  const existing=new Set((remote||[]).map(r=>r.raw_data?.apex_local_id).filter(Boolean));
  const rows=logs.filter(t=>!existing.has(t.id)).map(mapWorkoutToCloud);
  if(!rows.length)return 0;
  const {error}=await apexCloud.from('workout_feedback').insert(rows); if(error)throw error;
  return rows.length;
}
async function migrateLocalToCloud(){
  if(!apexCloud||!apexCloudUser){alert('Connecte-toi d’abord.');return}
  if(!state.settings?.cloud?.lastTestOk){alert('Le test sécurisé doit être validé avant la migration.');return}
  if(!confirm(`Migrer maintenant vers Supabase : ${state.checkins.length} check-in(s), ${state.trainingLog.length} débrief(s) et ${state.plan.length} jour(s) de planning ?\n\nLes données locales resteront conservées.`))return;
  const btn=$('cloudMigrationBtn'), badge=$('cloudMigrationBadge');
  if(btn){btn.disabled=true;btn.textContent='Migration en cours…'}
  if(badge){badge.textContent='EN COURS';badge.className='badge neutral'}
  cloudSetResult('cloudMigrationResult','neutral','Création de la sauvegarde locale de sécurité…');
  try{
    cloudBackupBeforeMigration();
    cloudSetResult('cloudMigrationResult','neutral','1/4 · Envoi des check-ins et décisions…');
    const checkRows=(state.checkins||[]).map(mapCheckinToCloud);
    if(checkRows.length){const {error}=await apexCloud.from('checkins').upsert(checkRows,{onConflict:'user_id,checkin_date'});if(error)throw error;}
    cloudSetResult('cloudMigrationResult','neutral','2/4 · Envoi du planning…');
    const planRows=(state.plan||[]).map(mapPlanToCloud);
    if(planRows.length){const {error}=await apexCloud.from('plans').upsert(planRows,{onConflict:'user_id,plan_date'});if(error)throw error;}
    cloudSetResult('cloudMigrationResult','neutral','3/4 · Envoi des séances / débriefs…');
    const insertedLogs=await migrateWorkoutLogs();
    cloudSetResult('cloudMigrationResult','neutral','4/4 · Mise à jour des réglages et vérification…');
    const {data:existing,error:readErr}=await apexCloud.from('settings').select('settings_data').eq('user_id',apexCloudUser.id).maybeSingle(); if(readErr)throw readErr;
    const now=new Date().toISOString();
    const settingsData={...(existing?.settings_data||{}),migration_v17:{at:now,localCheckins:state.checkins.length,localWorkouts:state.trainingLog.length,localPlans:state.plan.length}};
    const {error:setErr}=await apexCloud.from('settings').upsert({user_id:apexCloudUser.id,target_test_date:state.settings.testDate||TEST_DATE,target_name:'Test Yo-Yo 29/08/2026',usual_resting_hr:+state.settings.rhrBaseline||null,settings_data:settingsData},{onConflict:'user_id'});if(setErr)throw setErr;
    state.settings.cloud={...(state.settings.cloud||{}),enabled:false,lastTestOk:true,migratedAt:now};
    localStorage.setItem(KEY,JSON.stringify(state));
    const counts=await verifyCloudMigration(true);
    if(badge){badge.textContent='MIGRÉ';badge.className='badge green'}
    cloudSetResult('cloudMigrationResult','ok',`Migration réussie. Cloud : ${counts.checkins} check-in(s), ${counts.workouts} séance(s)/débrief(s), ${counts.plans} jour(s) de planning. ${insertedLogs} nouveau(x) débrief(s) ajouté(s) pendant cette migration. Les données locales sont toujours présentes.`);
  }catch(err){
    console.error('APEX migration',err);
    if(badge){badge.textContent='ÉCHEC';badge.className='badge orange'}
    cloudSetResult('cloudMigrationResult','error','Migration interrompue : '+(err?.message||err)+'. Aucune donnée locale n’a été supprimée.');
  }finally{if(btn){btn.disabled=false;btn.textContent='Migrer mes données vers Supabase'}}
}
async function verifyCloudMigration(silent=false){
  if(!apexCloud||!apexCloudUser){if(!silent)alert('Connecte-toi d’abord.');return {checkins:0,workouts:0,plans:0}}
  const [c,w,p]=await Promise.all([
    apexCloud.from('checkins').select('id',{count:'exact',head:true}).eq('user_id',apexCloudUser.id),
    apexCloud.from('workout_feedback').select('id',{count:'exact',head:true}).eq('user_id',apexCloudUser.id),
    apexCloud.from('plans').select('id',{count:'exact',head:true}).eq('user_id',apexCloudUser.id)
  ]);
  const err=c.error||w.error||p.error;if(err)throw err;
  const counts={checkins:c.count||0,workouts:w.count||0,plans:p.count||0};
  const el=$('cloudRemotePreview');if(el)el.innerHTML=`<article><b>${counts.checkins}</b><span>check-in(s) cloud</span></article><article><b>${counts.workouts}</b><span>séance(s) / débrief(s) cloud</span></article><article><b>${counts.plans}</b><span>jour(s) de planning cloud</span></article><article><b>${state.settings?.cloud?.migratedAt?'✓':'—'}</b><span>migration locale marquée</span></article>`;
  if(!silent)cloudSetResult('cloudMigrationResult','ok',`Vérification cloud : ${counts.checkins} check-in(s), ${counts.workouts} séance(s)/débrief(s), ${counts.plans} jour(s) de planning.`);
  return counts;
}

// Complète refreshAll sans modifier le moteur V1.6.
const refreshAllV16=refreshAll;
refreshAll=function(){refreshAllV16();renderLocalMigrationPreview();updateCloudUi()};

// Démarrage cloud après chargement complet de l’interface locale.
setTimeout(initCloud,0);

/* =========================================================
   APEX V1.7 SYNC PILOTE — Cloud -> appareil
   Restaurer manuellement un nouvel appareil depuis Supabase.
   ========================================================= */
function initV17SyncState(){
  state.settings ||= {};
  state.settings.apexVersion='1.7-sync-pilot';
  state.settings.cloud ||= {};
  localStorage.setItem(KEY,JSON.stringify(state));
}
initV17SyncState();

function updateCloudPullUi(){
  const b=$('cloudPullBtn');
  if(b)b.disabled=!apexCloudUser;
  if(!apexCloudUser)cloudSetResult('cloudPullResult','neutral','Connecte-toi d’abord.');
}

async function fetchCloudPackage(){
  if(!apexCloud||!apexCloudUser)throw new Error('Compte APEX non connecté.');
  const uid=apexCloudUser.id;
  const [c,w,p,s]=await Promise.all([
    apexCloud.from('checkins').select('*').eq('user_id',uid).order('checkin_date',{ascending:true}),
    apexCloud.from('workout_feedback').select('*').eq('user_id',uid).order('workout_date',{ascending:true}).order('created_at',{ascending:true}),
    apexCloud.from('plans').select('*').eq('user_id',uid).order('plan_date',{ascending:true}),
    apexCloud.from('settings').select('*').eq('user_id',uid).maybeSingle()
  ]);
  const err=c.error||w.error||p.error||s.error;if(err)throw err;
  return {checkins:c.data||[],workouts:w.data||[],plans:p.data||[],settings:s.data||null};
}

function cloudCheckinToLocal(r){
  const raw=r.raw_data&&Object.keys(r.raw_data).length?r.raw_data:null;
  return raw||{
    id:'c_cloud_'+r.id,
    date:r.checkin_date,
    sleep:r.sleep_score,
    rhr:r.resting_hr,
    rhrBase:r.usual_resting_hr,
    knee:r.knee_pain,
    fatigue:r.fatigue,
    soreness:r.soreness,
    motivation:r.motivation,
    weight:r.weight_kg==null?null:Number(r.weight_kg),
    kneeNote:r.knee_note||'',
    note:r.general_note||'',
    createdAt:r.created_at
  };
}
function cloudWorkoutToLocal(r){
  const raw=r.raw_data&&Object.keys(r.raw_data).length?{...r.raw_data}:{};
  delete raw.apex_local_id;
  return {
    id:raw.id||r.raw_data?.apex_local_id||('t_cloud_'+r.id),
    date:raw.date||r.workout_date,
    code:raw.code||r.workout_code,
    title:raw.title||r.workout_name||LIBRARY[r.workout_code]?.title||r.workout_code,
    completed:raw.completed??r.completed,
    durationSeconds:raw.durationSeconds??r.duration_seconds,
    distanceKm:raw.distanceKm??(r.distance_km==null?null:Number(r.distance_km)),
    rpe:raw.rpe??r.rpe,
    kneeAfter:raw.kneeAfter??r.knee_pain_after,
    breathing:raw.breathing??r.breathing_difficulty,
    fcAvg:raw.fcAvg??r.avg_hr,
    fcMax:raw.fcMax??r.max_hr,
    avgSpeed:raw.avgSpeed??(r.avg_speed_kmh==null?null:Number(r.avg_speed_kmh)),
    maxSpeed:raw.maxSpeed??(r.max_speed_kmh==null?null:Number(r.max_speed_kmh)),
    calories:raw.calories??r.calories,
    changedDuringSession:raw.changedDuringSession??r.changed_during_session,
    changeNote:raw.changeNote||r.change_note||'',
    note:raw.note||r.comment||'',
    yoyoLevel:raw.yoyoLevel||r.specific_result?.yoyoLevel||'',
    limitingFactor:raw.limitingFactor||r.specific_result?.limitingFactor||'',
    confidence:raw.confidence??r.specific_result?.confidence??null,
    createdAt:raw.createdAt||r.created_at
  };
}
function cloudPlanToLocal(r){
  return r.plan_data&&Object.keys(r.plan_data).length?r.plan_data:{date:r.plan_date,code:r.workout_code,note:''};
}
function cloudDecisionRows(rows){
  return rows.map(r=>r.apex_decision).filter(d=>d&&Object.keys(d).length).map((d,i)=>({id:d.id||('d_cloud_'+i),...d}));
}

async function previewCloudData(){
  try{
    const pack=await fetchCloudPackage();
    const el=$('cloudPullPreview');
    if(el)el.innerHTML=`<article><b>${pack.checkins.length}</b><span>check-in(s)</span></article><article><b>${pack.workouts.length}</b><span>séance(s) / débrief(s)</span></article><article><b>${pack.plans.length}</b><span>jour(s) de planning</span></article><article><b>${cloudDecisionRows(pack.checkins).length}</b><span>décision(s) APEX</span></article>`;
    cloudSetResult('cloudPullResult','ok',`Cloud lisible : ${pack.checkins.length} check-in(s), ${pack.workouts.length} séance(s)/débrief(s), ${pack.plans.length} jour(s) de planning.`);
    return pack;
  }catch(err){cloudSetResult('cloudPullResult','error','Lecture cloud impossible : '+(err?.message||err));throw err}
}

async function restoreFromCloud(){
  if(!apexCloud||!apexCloudUser){alert('Connecte-toi d’abord.');return}
  if(!confirm('Charger les données APEX depuis Supabase sur cet appareil ?\n\nUne sauvegarde locale de sécurité sera créée avant remplacement des blocs synchronisés.'))return;
  const btn=$('cloudPullBtn'),badge=$('cloudPullBadge');
  if(btn){btn.disabled=true;btn.textContent='Chargement du cloud…'}
  if(badge){badge.textContent='EN COURS';badge.className='badge neutral'}
  try{
    const snapshot={createdAt:new Date().toISOString(),data:JSON.parse(JSON.stringify(state))};
    localStorage.setItem('apex_v17_pre_cloud_restore_backup',JSON.stringify(snapshot));
    cloudSetResult('cloudPullResult','neutral','Lecture des données Supabase…');
    const pack=await fetchCloudPackage();
    if(!pack.checkins.length&&!pack.workouts.length&&!pack.plans.length)throw new Error('Le cloud ne contient aucune donnée APEX à restaurer.');

    // Conserve volontairement les blocs non encore synchronisés par le schéma V1.7.
    const preserved={persons:state.persons||[],assessments:state.assessments||[],sessions:state.sessions||[]};
    state.checkins=pack.checkins.map(cloudCheckinToLocal);
    state.trainingLog=pack.workouts.map(cloudWorkoutToLocal);
    state.plan=pack.plans.map(cloudPlanToLocal);
    state.decisions=cloudDecisionRows(pack.checkins);
    state.persons=preserved.persons;state.assessments=preserved.assessments;state.sessions=preserved.sessions;
    state.settings ||= {};
    if(pack.settings?.target_test_date)state.settings.testDate=pack.settings.target_test_date;
    if(pack.settings?.usual_resting_hr!=null)state.settings.rhrBaseline=pack.settings.usual_resting_hr;
    if(pack.settings?.settings_data?.lastPlanAdaptation)state.settings.lastPlanAdaptation=pack.settings.settings_data.lastPlanAdaptation;
    state.settings.cloud={...(state.settings.cloud||{}),enabled:true,lastPullAt:new Date().toISOString(),lastTestOk:true,migratedAt:pack.settings?.settings_data?.migration_v17?.at||state.settings.cloud?.migratedAt||null};
    state.settings.apexVersion='1.7-sync-pilot';
    localStorage.setItem(KEY,JSON.stringify(state));
    refreshAll();renderLocalMigrationPreview();
    const el=$('cloudPullPreview');if(el)el.innerHTML=`<article><b>${state.checkins.length}</b><span>check-in(s) restaurés</span></article><article><b>${state.trainingLog.length}</b><span>séance(s) restaurée(s)</span></article><article><b>${state.plan.length}</b><span>jour(s) restauré(s)</span></article><article><b>${state.decisions.length}</b><span>décision(s) restaurée(s)</span></article>`;
    if(badge){badge.textContent='RESTAURÉ';badge.className='badge green'}
    cloudSetResult('cloudPullResult','ok','Restauration réussie. Cet appareil utilise maintenant une copie locale reconstruite depuis Supabase. La sauvegarde précédente reste disponible dans le navigateur.');
  }catch(err){
    console.error('APEX cloud restore',err);
    if(badge){badge.textContent='ÉCHEC';badge.className='badge orange'}
    cloudSetResult('cloudPullResult','error','Restauration interrompue : '+(err?.message||err)+'. Les données locales précédentes n’ont pas été supprimées sans sauvegarde.');
  }finally{if(btn){btn.disabled=!apexCloudUser;btn.textContent='Charger mes données depuis le cloud'}}
}

// Complète l’UI cloud existante.
const updateCloudUiV17Migration=updateCloudUi;
updateCloudUi=function(){updateCloudUiV17Migration();updateCloudPullUi()};
setTimeout(updateCloudPullUi,100);


/* =========================================================
   APEX V1.8 PILOTE — arbitrage utilisateur après check-in
   APEX recommande ; l'utilisateur décide si une adaptation
   remplace réellement la séance initialement planifiée.
   Non destructif : les décisions V1.7 restent compatibles.
   ========================================================= */
function decisionStoredForDate(date){
  return [...(state.decisions||[])].reverse().find(d=>d.date===date)||null;
}
function decisionIsAdaptation(d){
  return !!(d && d.planned && d.code && d.code!==d.planned);
}
function decisionEffectiveCode(d){
  if(!d)return '';
  if(d.userDecision==='refused' && d.planned)return d.planned;
  return d.effectiveCode||d.code||d.planned||'';
}
function decisionChoiceLabel(d){
  if(!d)return '';
  if(!decisionIsAdaptation(d))return 'Plan maintenu par APEX';
  if(d.userDecision==='accepted')return 'Adaptation APEX acceptée';
  if(d.userDecision==='refused')return 'Adaptation refusée — séance initiale maintenue';
  return 'Adaptation proposée — décision à confirmer';
}
function stampDecisionChoice(date,choice){
  const i=(state.decisions||[]).findIndex(d=>d.date===date);
  if(i<0)return;
  const d=state.decisions[i];
  if(!decisionIsAdaptation(d))return;
  let reason='';
  if(choice==='refused'){
    reason=prompt('Pourquoi souhaites-tu maintenir la séance initiale ? (facultatif)','')||'';
    if(!confirm(`Maintenir ${d.planned} · ${LIBRARY[d.planned]?.title||d.planned} malgré la recommandation APEX ?\n\nAPEX conservera l’alerte et enregistrera ton choix.`))return;
  }
  d.userDecision=choice;
  d.userDecisionAt=new Date().toISOString();
  d.userDecisionReason=reason.trim();
  d.effectiveCode=choice==='refused'?d.planned:d.code;
  d.choiceLabel=decisionChoiceLabel(d);
  state.decisions[i]=d;
  persist();
  const c=getCheckinOn(date)||todayCheckin();
  if(c)renderCheckinResult(c,d);
  renderCockpit();renderHistory();
}
function acceptApexAdaptation(date){stampDecisionChoice(date,'accepted')}
function refuseApexAdaptation(date){stampDecisionChoice(date,'refused')}

// Enrichit chaque nouvelle décision au moment du check-in, sans toucher aux anciens historiques.
const saveCheckinV17=saveCheckin;
saveCheckin=function(){
  saveCheckinV17();
  const date=localToday();
  const i=(state.decisions||[]).findIndex(d=>d.date===date);
  if(i>=0){
    const d=state.decisions[i];
    if(decisionIsAdaptation(d)){
      d.userDecision='pending';d.effectiveCode=d.code;d.choiceLabel=decisionChoiceLabel(d);
    }else{
      d.userDecision='not_needed';d.effectiveCode=d.code||d.planned;d.choiceLabel='Plan maintenu par APEX';
    }
    state.decisions[i]=d;persist();
    const c=todayCheckin();if(c)renderCheckinResult(c,d);
    renderCockpit();renderHistory();
  }
};

renderCheckinResult=function(c,d){
  const r=$('checkinResult');if(!r)return;r.classList.remove('hidden');
  const s=computeReadiness(c),adapt=decisionIsAdaptation(d),effective=decisionEffectiveCode(d);
  const planned=d.planned&&LIBRARY[d.planned]?LIBRARY[d.planned]:null;
  const rec=d.code&&LIBRARY[d.code]?LIBRARY[d.code]:null;
  let choice='';
  if(adapt && (!d.userDecision || d.userDecision==='pending')){
    choice=`<div class="apex-arbitration"><div class="arb-compare"><article><small>SÉANCE PRÉVUE</small><span class="code">${esc(d.planned)}</span><b>${esc(planned?.title||d.planned)}</b></article><div class="arb-arrow">→</div><article class="recommended"><small>RECOMMANDATION APEX</small><span class="code">${esc(d.code)}</span><b>${esc(rec?.title||d.code)}</b></article></div><p>APEX recommande un changement, mais la décision finale reste la tienne.</p><div class="arb-actions"><button class="primary" onclick="acceptApexAdaptation('${esc(d.date)}')">✓ Accepter l’adaptation</button><button class="ghost warn" onclick="refuseApexAdaptation('${esc(d.date)}')">↺ Maintenir ${esc(d.planned)}</button></div></div>`;
  }else if(adapt){
    choice=`<div class="choice-confirm ${d.userDecision==='refused'?'refused':'accepted'}"><b>${esc(decisionChoiceLabel(d))}</b><span>Séance effective : ${esc(effective)} · ${esc(LIBRARY[effective]?.title||'')}</span>${d.userDecisionReason?`<small>Motif : ${esc(d.userDecisionReason)}</small>`:''}</div>`;
  }
  r.innerHTML=`<div class="decision ${d.zone.toLowerCase()}"><div><span class="eyebrow">DÉCISION APEX</span><h2>${esc(d.title)}</h2><p>${esc(d.message)}</p></div><div class="decision-score"><b>${s.score}</b><span>/100</span></div></div>${choice}<div class="recommend"><div><span class="code">${esc(effective)}</span><h3>${esc(LIBRARY[effective]?.title||'')}</h3><p>${esc(LIBRARY[effective]?.summary||'')}</p></div><button class="primary" onclick="openSession('${esc(effective)}')">Ouvrir la séance</button></div>${d.why?.length?`<div class="reasonline"><b>Pourquoi :</b> ${d.why.map(esc).join(' • ')}</div>`:''}<div class="medical-note">APEX formule une recommandation d’entraînement, pas un diagnostic. Si tu maintiens une séance malgré une alerte, la recommandation initiale reste tracée dans l’historique.</div>`;
};

renderHistory=function(){
  const host=$('decisionHistory');if(!host)return;
  host.innerHTML=state.decisions.length?[...state.decisions].sort((a,b)=>b.date.localeCompare(a.date)).map(d=>{
    const eff=decisionEffectiveCode(d),adapt=decisionIsAdaptation(d),label=d.choiceLabel||decisionChoiceLabel(d);
    return `<article class="history-decision ${d.userDecision||''}"><div class="history-head"><span class="badge ${String(d.zone||'neutral').toLowerCase()}">${esc(d.zone||'—')}</span><small>${fmtDate(d.date)}</small></div><h2>${esc(label)}</h2>${adapt?`<div class="history-choice"><span>Prévu <b>${esc(d.planned)}</b></span><span>APEX <b>${esc(d.code)}</b></span><span>Effectif <b>${esc(eff)}</b></span></div>`:`<p><b>${esc(eff)}</b> · ${esc(LIBRARY[eff]?.title||'')}</p>`}<p>${esc(d.message||'')}</p>${d.userDecisionReason?`<p class="user-reason"><b>Ton motif :</b> ${esc(d.userDecisionReason)}</p>`:''}<div class="meta">Readiness ${d.score??'—'}/100 ${d.why?.length?'• '+d.why.map(esc).join(' • '):''}</div></article>`;
  }).join(''):'<div class="panel empty">Aucune décision enregistrée. Le premier check-in créera l’historique.</div>';
};

renderCockpit=function(){
  const c=todayCheckin()||latestCheckin(),sameDay=c?.date===localToday(),p=plannedFor();
  let d=sameDay?(decisionStoredForDate(localToday())||decisionFor(c,p)):decisionFor(null,p);
  const effective=decisionEffectiveCode(d)||p?.code||'';
  const box=$('cockpitDecision');if(box){
    const zone=String(d.zone||'neutral').toLowerCase(),adapt=decisionIsAdaptation(d);
    const choiceNote=adapt?`<div class="cockpit-choice ${d.userDecision||'pending'}"><b>${esc(decisionChoiceLabel(d))}</b>${d.userDecision==='pending'?`<span>Confirme ton choix dans le check-in du matin.</span>`:`<span>Séance retenue : ${esc(effective)}</span>`}</div>`:'';
    box.innerHTML=`<div class="decision-main ${zone}"><div class="status-dot"></div><div class="decision-copy"><span class="eyebrow">AUJOURD'HUI · ${fmtDate(localToday())}</span><h2>${esc(d.title)}</h2><p>${esc(d.message)}</p>${choiceNote}<div class="decision-session" onclick="${effective?`openSession('${esc(effective)}')`:''}" style="cursor:${effective?'pointer':'default'}"><span class="code">${esc(effective||'—')}</span><div><b>${esc(LIBRARY[effective]?.title||'Check-in à faire')}</b><small>${esc(LIBRARY[effective]?.duration||'')}${effective?' · ouvrir la fiche ›':''}</small></div></div></div>${d.score!=null?`<div class="big-score"><b>${d.score}</b><span>readiness</span></div>`:''}</div>`;
    if(effective&&!box.querySelector('.cockpit-open-session'))box.insertAdjacentHTML('beforeend',`<button class="primary cockpit-open-session" onclick="openSession('${esc(effective)}')">▶ Ouvrir la séance du jour</button>`);
  }
  const snap=$('morningSnapshot');if(snap){if(!c){snap.innerHTML='<div class="empty">Aucune donnée. Fais le check-in du matin.</div>';$('readinessBadge').textContent='À renseigner';$('readinessBadge').className='badge neutral';}else{const rr=computeReadiness(c);$('readinessBadge').textContent=`${sameDay?'Aujourd’hui':'Dernier'} · ${rr.score}/100`;$('readinessBadge').className='badge '+rr.zone.toLowerCase();snap.innerHTML=metric('😴','Sommeil',`${c.sleep}/100`)+metric('❤️','FC repos',c.rhr?`${c.rhr} bpm`:'—')+metric('🦵','Genou',`${c.knee}/10`)+metric('⚡','Fatigue',`${c.fatigue}/10`)+metric('💪','Motivation',`${c.motivation}/10`)+metric('🏋️','Courbatures',`${c.soreness}/10`);}}
  const days=diffDays(localToday(),state.settings.testDate),adaptNote=state.settings.lastPlanAdaptation?.explanation||'';
  if($('goalSnapshot'))$('goalSnapshot').innerHTML=`<div class="goal-ring"><b>J-${Math.max(0,days)}</b><span>avant test</span></div><div><b>Test officiel Yo-Yo</b><p>Samedi 29 août 2026</p><p class="muted">Priorité : arriver préparé mais frais, en protégeant le genou.</p>${adaptNote?`<p class="adapt-note"><b>Dernière adaptation :</b> ${esc(adaptNote)}</p>`:''}</div>`;
  renderPrepIndex();
};

// Affiche la décision déjà enregistrée quand on revient sur le check-in du jour.
const hydrateCheckinV17=hydrateCheckin;
hydrateCheckin=function(){
  hydrateCheckinV17();
  const c=todayCheckin(),d=decisionStoredForDate(localToday());
  if(c&&d)renderCheckinResult(c,d);
};

state.settings.apexVersion='1.8-pilot';
persist();
setTimeout(()=>{renderCockpit();renderHistory();hydrateCheckin()},0);

/* =========================================================
   APEX V1.9 — synchronisation automatique multi-appareils
   Principe :
   - localStorage reste le cache local rapide ;
   - Supabase conserve la copie centrale ;
   - une modification locale déclenche un envoi différé ;
   - au retour dans APEX, le cloud est vérifié ;
   - en cas de hors-ligne, la modification reste marquée "à envoyer".
   Les boutons manuels V1.7 restent disponibles en secours.
   ========================================================= */
let apexV19SyncBusy=false;
let apexV19SyncTimer=null;
let apexV19BootDone=false;
let apexV19ApplyingCloud=false;

function v19DeviceId(){
  let id=localStorage.getItem('apex_device_id');
  if(!id){id='dev_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);localStorage.setItem('apex_device_id',id)}
  return id;
}
function v19DeviceLabel(){
  const ua=navigator.userAgent||'';
  if(/iPhone/i.test(ua))return 'iPhone';
  if(/iPad/i.test(ua))return 'iPad';
  if(/Macintosh|Mac OS X/i.test(ua))return 'Mac';
  if(/Windows/i.test(ua))return 'Windows';
  if(/Android/i.test(ua))return 'Android';
  return 'Navigateur';
}
function v19CloudState(){
  state.settings ||= {};
  state.settings.cloud ||= {};
  const c=state.settings.cloud;
  if(c.autoSync==null)c.autoSync=true;
  c.deviceId ||= v19DeviceId();
  return c;
}
function v19FmtTime(v){
  if(!v)return '—';
  const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
}
function v19LocalHasSyncedData(){return !!((state.checkins?.length||0)||(state.trainingLog?.length||0)||(state.plan?.length||0));}
function v19Online(){return navigator.onLine!==false;}
function v19SaveCloudMeta(){localStorage.setItem(KEY,JSON.stringify(state));renderV19SyncUi();}

function renderV19SyncUi(message=null,type='neutral'){
  const c=v19CloudState(), logged=!!apexCloudUser, online=v19Online();
  const badge=$('autoSyncBadge'), toggle=$('autoSyncToggleBtn'), now=$('syncNowBtn');
  const st=$('autoSyncState'), push=$('autoSyncLastPush'), pull=$('autoSyncLastPull'), dev=$('autoSyncDevice'), top=$('cloudTopStatus');
  if(st)st.textContent=!online?'Hors ligne':!logged?'Non connecté':!c.autoSync?'Manuelle':apexV19SyncBusy?'Synchronisation…':c.dirty?'En attente d’envoi':'À jour';
  if(push)push.textContent=v19FmtTime(c.lastPushAt);
  if(pull)pull.textContent=v19FmtTime(c.lastPullAt);
  if(dev)dev.textContent=`${v19DeviceLabel()} · ${String(c.deviceId||'').slice(-6)}`;
  if(toggle){toggle.disabled=!logged;toggle.textContent=c.autoSync?'Suspendre la synchro auto':'Activer la synchro automatique';}
  if(now)now.disabled=!logged||apexV19SyncBusy;
  if(badge){
    let label='NON CONNECTÉ',cls='neutral';
    if(logged&&!online){label='HORS LIGNE';cls='neutral'}
    else if(logged&&!c.autoSync){label='MANUELLE';cls='neutral'}
    else if(logged&&apexV19SyncBusy){label='SYNC…';cls='neutral'}
    else if(logged&&c.dirty){label='À ENVOYER';cls='orange'}
    else if(logged&&c.autoSync){label='ACTIVE';cls='green'}
    badge.textContent=label;badge.className='badge '+cls;
  }
  if(top){
    if(!logged){top.textContent='LOCAL';top.className='cloud-top-status local'}
    else if(!online){top.textContent='HORS LIGNE';top.className='cloud-top-status offline'}
    else if(apexV19SyncBusy){top.textContent='SYNC…';top.className='cloud-top-status syncing'}
    else if(c.dirty){top.textContent='À ENVOYER';top.className='cloud-top-status queued'}
    else{top.textContent='SYNC ✓';top.className='cloud-top-status online'}
  }
  if(message)cloudSetResult('autoSyncResult',type,message);
  else if(!logged)cloudSetResult('autoSyncResult','neutral','Connecte-toi à ton compte APEX pour activer la synchronisation.');
  else if(!online)cloudSetResult('autoSyncResult','neutral','APEX continue localement. Les changements seront envoyés dès le retour du réseau.');
  else if(c.dirty)cloudSetResult('autoSyncResult','neutral','Une modification locale attend son envoi vers Supabase.');
  else if(c.autoSync)cloudSetResult('autoSyncResult','ok','Synchronisation automatique active. Les changements locaux sont envoyés au cloud et APEX vérifie les données au retour dans l’application.');
  else cloudSetResult('autoSyncResult','neutral','Synchronisation automatique suspendue. Les commandes manuelles restent disponibles.');
}

function v19MarkDirty(){
  if(apexV19ApplyingCloud)return;
  const c=v19CloudState();
  c.dirty=true;c.localChangedAt=new Date().toISOString();
  localStorage.setItem(KEY,JSON.stringify(state));
  renderV19SyncUi();
  scheduleV19AutoPush();
}

// Toute future action qui utilise persist() devient synchronisable automatiquement.
const persistV18ForV19=persist;
persist=function(){
  if(!apexV19ApplyingCloud){const c=v19CloudState();c.dirty=true;c.localChangedAt=new Date().toISOString();}
  persistV18ForV19();
  renderV19SyncUi();
  if(!apexV19ApplyingCloud)scheduleV19AutoPush();
};

function scheduleV19AutoPush(delay=900){
  const c=v19CloudState();
  if(!c.autoSync||!apexCloudUser||!v19Online()||apexV19ApplyingCloud)return;
  clearTimeout(apexV19SyncTimer);
  apexV19SyncTimer=setTimeout(()=>pushLocalToCloudV19({reason:'auto'}),delay);
}

async function pushLocalToCloudV19({reason='manual'}={}){
  const c=v19CloudState();
  if(!apexCloud||!apexCloudUser)return false;
  if(!v19Online()){c.dirty=true;v19SaveCloudMeta();return false;}
  if(apexV19SyncBusy)return false;
  apexV19SyncBusy=true;renderV19SyncUi('Envoi des dernières modifications vers Supabase…','neutral');
  try{
    const checkRows=(state.checkins||[]).map(mapCheckinToCloud);
    if(checkRows.length){const {error}=await apexCloud.from('checkins').upsert(checkRows,{onConflict:'user_id,checkin_date'});if(error)throw error;}
    const planRows=(state.plan||[]).map(p=>({...mapPlanToCloud(p),source:'apex-v19-auto'}));
    if(planRows.length){const {error}=await apexCloud.from('plans').upsert(planRows,{onConflict:'user_id,plan_date'});if(error)throw error;}
    await migrateWorkoutLogs();

    const {data:existing,error:readErr}=await apexCloud.from('settings').select('settings_data,target_test_date,target_name,usual_resting_hr').eq('user_id',apexCloudUser.id).maybeSingle();
    if(readErr)throw readErr;
    const now=new Date().toISOString();
    const settingsData={
      ...(existing?.settings_data||{}),
      lastPlanAdaptation:state.settings.lastPlanAdaptation||null,
      sync_v19:{last_write_at:now,device_id:c.deviceId,device_label:v19DeviceLabel(),reason,app_version:'1.9'}
    };
    const {error:setErr}=await apexCloud.from('settings').upsert({
      user_id:apexCloudUser.id,
      target_test_date:state.settings.testDate||TEST_DATE,
      target_name:existing?.target_name||'Test Yo-Yo 29/08/2026',
      usual_resting_hr:+state.settings.rhrBaseline||null,
      settings_data:settingsData
    },{onConflict:'user_id'});
    if(setErr)throw setErr;

    c.dirty=false;c.lastPushAt=now;c.lastCloudSeenAt=now;c.lastSyncError=null;c.enabled=true;
    localStorage.setItem(KEY,JSON.stringify(state));
    renderV19SyncUi(`Synchronisé vers le cloud à ${v19FmtTime(now)}.`,'ok');
    return true;
  }catch(err){
    console.error('APEX V1.9 push',err);
    c.dirty=true;c.lastSyncError=String(err?.message||err);localStorage.setItem(KEY,JSON.stringify(state));
    renderV19SyncUi('Envoi différé : '+c.lastSyncError+'. Les données restent conservées sur cet appareil.','error');
    return false;
  }finally{apexV19SyncBusy=false;renderV19SyncUi();}
}

function applyCloudPackageV19(pack,{reason='auto'}={}){
  const c=v19CloudState();
  const preserved={persons:state.persons||[],assessments:state.assessments||[],sessions:state.sessions||[]};
  apexV19ApplyingCloud=true;
  try{
    state.checkins=pack.checkins.map(cloudCheckinToLocal);
    state.trainingLog=pack.workouts.map(cloudWorkoutToLocal);
    state.plan=pack.plans.map(cloudPlanToLocal);
    state.decisions=cloudDecisionRows(pack.checkins);
    state.persons=preserved.persons;state.assessments=preserved.assessments;state.sessions=preserved.sessions;
    state.settings ||= {};
    if(pack.settings?.target_test_date)state.settings.testDate=pack.settings.target_test_date;
    if(pack.settings?.usual_resting_hr!=null)state.settings.rhrBaseline=pack.settings.usual_resting_hr;
    if(pack.settings?.settings_data?.lastPlanAdaptation)state.settings.lastPlanAdaptation=pack.settings.settings_data.lastPlanAdaptation;
    const cloudWrite=pack.settings?.settings_data?.sync_v19?.last_write_at||pack.settings?.updated_at||new Date().toISOString();
    state.settings.cloud={...(state.settings.cloud||{}),enabled:true,autoSync:state.settings.cloud?.autoSync!==false,dirty:false,lastPullAt:new Date().toISOString(),lastCloudSeenAt:cloudWrite,lastSyncError:null,deviceId:c.deviceId};
    state.settings.apexVersion='1.9-sync';
    localStorage.setItem(KEY,JSON.stringify(state));
  }finally{apexV19ApplyingCloud=false;}
  refreshAll();renderLocalMigrationPreview();renderV19SyncUi(`Données cloud reçues (${reason}) : ${state.checkins.length} check-in(s), ${state.trainingLog.length} débrief(s), ${state.plan.length} jour(s) de planning.`,'ok');
}

async function pullCloudToLocalV19({force=false,reason='auto'}={}){
  const c=v19CloudState();
  if(!apexCloud||!apexCloudUser||!v19Online()||apexV19SyncBusy)return false;
  // Une modification locale non envoyée gagne d'abord le droit d'être poussée.
  if(c.dirty&&!force){const ok=await pushLocalToCloudV19({reason:'pre-pull'});if(!ok)return false;}
  if(apexV19SyncBusy)return false;
  apexV19SyncBusy=true;renderV19SyncUi('Vérification des données cloud…','neutral');
  try{
    const pack=await fetchCloudPackage();
    const cloudWrite=pack.settings?.settings_data?.sync_v19?.last_write_at||pack.settings?.updated_at||null;
    const lastSeen=c.lastCloudSeenAt||null;
    const localEmpty=!v19LocalHasSyncedData();
    const newer=force||localEmpty||!lastSeen||(cloudWrite&&new Date(cloudWrite)>new Date(lastSeen));
    if(newer){
      const snapshot={createdAt:new Date().toISOString(),reason:'v19_auto_pull',data:JSON.parse(JSON.stringify(state))};
      localStorage.setItem('apex_v19_pre_auto_pull_backup',JSON.stringify(snapshot));
      applyCloudPackageV19(pack,{reason});
    }else{
      c.lastPullAt=new Date().toISOString();c.lastSyncError=null;localStorage.setItem(KEY,JSON.stringify(state));
      renderV19SyncUi('Cloud vérifié : cet appareil possède déjà la version la plus récente.','ok');
    }
    return true;
  }catch(err){
    console.error('APEX V1.9 pull',err);c.lastSyncError=String(err?.message||err);localStorage.setItem(KEY,JSON.stringify(state));
    renderV19SyncUi('Vérification cloud impossible : '+c.lastSyncError+'. Les données locales restent utilisables.','error');
    return false;
  }finally{apexV19SyncBusy=false;renderV19SyncUi();}
}

async function syncNowV19(){
  if(!apexCloudUser){alert('Connecte-toi d’abord à ton compte APEX.');return;}
  if(!v19Online()){alert('Pas de connexion réseau actuellement. Tes données restent stockées localement.');return;}
  const c=v19CloudState();
  if(c.dirty){const ok=await pushLocalToCloudV19({reason:'manual-sync'});if(!ok)return;}
  await pullCloudToLocalV19({force:true,reason:'synchronisation manuelle'});
}

function toggleAutoSync(){
  const c=v19CloudState();c.autoSync=!c.autoSync;localStorage.setItem(KEY,JSON.stringify(state));renderV19SyncUi();
  if(c.autoSync&&apexCloudUser&&v19Online())v19AfterAuthentication();
}

async function v19AfterAuthentication(){
  if(!apexCloudUser||apexV19BootDone||!v19Online())return;
  const c=v19CloudState();if(!c.autoSync){renderV19SyncUi();return;}
  apexV19BootDone=true;
  try{
    if(!v19LocalHasSyncedData()){
      await pullCloudToLocalV19({force:true,reason:'nouvel appareil'});
    }else if(c.dirty){
      await pushLocalToCloudV19({reason:'reconnexion'});
      await pullCloudToLocalV19({reason:'reconnexion'});
    }else{
      await pullCloudToLocalV19({reason:'ouverture'});
    }
  }finally{setTimeout(()=>{apexV19BootDone=false},1200);}
}

// Le profil RLS lu avec succès devient le déclencheur d'une première synchro.
const cloudReadProfileV18ForV19=cloudReadProfile;
cloudReadProfile=async function(){
  const ok=await cloudReadProfileV18ForV19();
  renderV19SyncUi();
  if(ok)setTimeout(v19AfterAuthentication,50);
  return ok;
};

// Complète l'UI cloud existante.
const updateCloudUiV18ForV19=updateCloudUi;
updateCloudUi=function(){updateCloudUiV18ForV19();renderV19SyncUi();};

window.addEventListener('online',()=>{renderV19SyncUi('Connexion retrouvée. APEX reprend la synchronisation…','neutral');setTimeout(v19AfterAuthentication,100);scheduleV19AutoPush(200)});
window.addEventListener('offline',()=>renderV19SyncUi('Connexion perdue. APEX continue en local et mettra les changements en attente.','neutral'));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&apexCloudUser&&v19CloudState().autoSync&&v19Online())setTimeout(()=>pullCloudToLocalV19({reason:'retour dans APEX'}),150)});
window.addEventListener('focus',()=>{if(apexCloudUser&&v19CloudState().autoSync&&v19Online())setTimeout(()=>pullCloudToLocalV19({reason:'retour dans APEX'}),200)});

state.settings.apexVersion='1.9-sync';
v19CloudState();
localStorage.setItem(KEY,JSON.stringify(state));
setTimeout(()=>{renderV19SyncUi();if(apexCloudUser)v19AfterAuthentication();},150);


/* =========================================================
   APEX V1.9.1 — feedback d'actions et horodatages persistants
   Les actions cloud changent visuellement d'état et conservent
   la date/heure de la dernière exécution réussie.
   ========================================================= */
function v191Now(){return new Date().toISOString();}
function v191Cloud(){return v19CloudState();}
function v191Persist(){localStorage.setItem(KEY,JSON.stringify(state));}
function v191SetMeta(key,value=v191Now()){const c=v191Cloud();c[key]=value;v191Persist();renderV191ActionFeedback();}
function v191Short(v){return v19FmtTime(v);}
function v191Button(id,text,disabled=null){const b=$(id);if(!b)return;if(text!=null)b.textContent=text;if(disabled!=null)b.disabled=disabled;}
function v191Result(id,kind,prefix,at,extra=''){
  if(!at)return;
  cloudSetResult(id,kind,`${prefix} : ${v191Short(at)}${extra?'. '+extra:''}`);
}
function renderV191ActionFeedback(){
  const c=v191Cloud(), logged=!!apexCloudUser;
  // Test sécurisé
  const testBadge=$('cloudTestBadge');
  if(c.lastTestOk&&c.lastTestAt){
    if(testBadge){testBadge.textContent='VALIDÉ';testBadge.className='badge green';}
    v191Button('cloudTestBtn',`Test validé ✓ · ${v191Short(c.lastTestAt)}`,!logged);
    if(!$('cloudTestResult')?.classList.contains('error'))v191Result('cloudTestResult','ok','Dernier test sécurisé validé',c.lastTestAt,'Authentification, RLS, écriture et relecture opérationnelles.');
  }else v191Button('cloudTestBtn','Lancer le test sécurisé',!logged);

  // Envoi manuel appareil -> cloud
  if(c.lastManualPushAt){
    v191Button('cloudMigrationBtn',`Envoyé au cloud ✓ · ${v191Short(c.lastManualPushAt)}`,!logged||!c.lastTestOk);
    if(!$('cloudMigrationResult')?.classList.contains('error'))v191Result('cloudMigrationResult','ok','Dernier envoi manuel',c.lastManualPushAt,'Les données locales restent conservées.');
  }
  // Vérification cloud
  if(c.lastCloudVerifyAt){
    v191Button('cloudVerifyBtn',`Cloud vérifié ✓ · ${v191Short(c.lastCloudVerifyAt)}`,!logged);
  }
  // Prévisualisation cloud
  if(c.lastCloudPreviewAt){
    v191Button('cloudPreviewBtn',`Prévisualisé ✓ · ${v191Short(c.lastCloudPreviewAt)}`,!logged);
  }
  // Chargement cloud -> appareil
  if(c.lastManualPullAt){
    v191Button('cloudPullBtn',`Données chargées ✓ · ${v191Short(c.lastManualPullAt)}`,!logged);
    if(!$('cloudPullResult')?.classList.contains('error'))v191Result('cloudPullResult','ok','Dernier chargement depuis le cloud',c.lastManualPullAt,'Une sauvegarde locale de sécurité a été créée avant chargement.');
  }

  // Synchro auto : état explicite + date d'activation/désactivation
  const toggle=$('autoSyncToggleBtn');
  if(toggle){
    toggle.disabled=!logged;
    if(c.autoSync){
      toggle.textContent='Synchro automatique activée ✓ — Désactiver';
      toggle.title=c.autoSyncEnabledAt?`Activée le ${v191Short(c.autoSyncEnabledAt)}`:'Synchronisation automatique active';
    }else{
      toggle.textContent='Activer la synchro automatique';
      toggle.title=c.autoSyncDisabledAt?`Désactivée le ${v191Short(c.autoSyncDisabledAt)}`:'Activer la synchronisation automatique';
    }
  }
  const now=$('syncNowBtn');
  if(now&&c.lastManualSyncAt&&!apexV19SyncBusy)now.textContent=`Synchronisé ✓ · ${v191Short(c.lastManualSyncAt)}`;
}

// Wrappers d'actions : on ne change pas la logique V1.9, seulement le feedback persistant.
const v191RunCloudRoundTripTest=runCloudRoundTripTest;
runCloudRoundTripTest=async function(){
  await v191RunCloudRoundTripTest();
  const c=v191Cloud();
  if(c.lastTestOk&&c.lastTestAt){c.lastTestAt=c.lastTestAt||v191Now();v191Persist();}
  renderV191ActionFeedback();
};

const v191MigrateLocalToCloud=migrateLocalToCloud;
migrateLocalToCloud=async function(){
  const before=v191Cloud().lastPushAt||null;
  await v191MigrateLocalToCloud();
  const c=v191Cloud();
  // Une migration réussie positionne migratedAt ; on l'utilise comme preuve de succès.
  if(c.migratedAt){c.lastManualPushAt=v191Now();v191Persist();}
  renderV191ActionFeedback();
};

const v191VerifyCloudMigration=verifyCloudMigration;
verifyCloudMigration=async function(silent=false){
  const counts=await v191VerifyCloudMigration(silent);
  if(apexCloudUser){const c=v191Cloud();c.lastCloudVerifyAt=v191Now();v191Persist();}
  renderV191ActionFeedback();
  return counts;
};

const v191PreviewCloudData=previewCloudData;
previewCloudData=async function(){
  const pack=await v191PreviewCloudData();
  const c=v191Cloud();c.lastCloudPreviewAt=v191Now();v191Persist();renderV191ActionFeedback();
  return pack;
};

const v191RestoreFromCloud=restoreFromCloud;
restoreFromCloud=async function(){
  const prior=v191Cloud().lastPullAt||null;
  await v191RestoreFromCloud();
  const c=v191Cloud();
  if(c.lastPullAt&&c.lastPullAt!==prior){c.lastManualPullAt=c.lastPullAt;v191Persist();}
  renderV191ActionFeedback();
};

const v191ToggleAutoSync=toggleAutoSync;
toggleAutoSync=function(){
  const was=!!v191Cloud().autoSync;
  v191ToggleAutoSync();
  const c=v191Cloud(),at=v191Now();
  if(!was&&c.autoSync)c.autoSyncEnabledAt=at;
  if(was&&!c.autoSync)c.autoSyncDisabledAt=at;
  v191Persist();renderV19SyncUi();renderV191ActionFeedback();
  cloudSetResult('autoSyncResult',c.autoSync?'ok':'neutral',c.autoSync?`Synchronisation automatique activée le ${v191Short(at)}.`:`Synchronisation automatique désactivée le ${v191Short(at)}. Les commandes manuelles restent disponibles.`);
};

const v191SyncNowV19=syncNowV19;
syncNowV19=async function(){
  v191Button('syncNowBtn','Synchronisation en cours…',true);
  await v191SyncNowV19();
  if(apexCloudUser&&v19Online()&&!v191Cloud().lastSyncError){const c=v191Cloud();c.lastManualSyncAt=v191Now();v191Persist();}
  renderV19SyncUi();renderV191ActionFeedback();
};

// Complète les rendus V1.9 afin que les états persistent après F5/navigation.
const v191RenderV19SyncUi=renderV19SyncUi;
renderV19SyncUi=function(message=null,type='neutral'){
  v191RenderV19SyncUi(message,type);
  renderV191ActionFeedback();
};
const v191UpdateCloudUi=updateCloudUi;
updateCloudUi=function(){v191UpdateCloudUi();renderV191ActionFeedback();};

state.settings.apexVersion='1.9.1-feedback';
v191Persist();
setTimeout(renderV191ActionFeedback,250);

/* =========================================================
   APEX V2.0 — SAISON RUGBY + PILATES BAR
   - Le test du 29/08 reste un jalon.
   - Le plan continue après le test en mode maintien saison.
   - B1/B2/B3/B4 utilisent réellement la barre Pilates et les bandes.
   - Migration non destructive : aucune donnée antérieure au 30/08 n'est écrasée.
   ========================================================= */
const APEX_V2_VERSION='2.0-season';
const SEASON_START='2026-08-30';
const SEASON_PLAN=[
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

Object.assign(LIBRARY,{
 S1:{code:'S1',pillar:'Cardio saison',title:'Entretien aérobie arbitre',duration:'35–45 min',intensity:'Modérée',summary:'Séance d’endurance facile à modérée pour conserver une base cardio pendant la saison.',purpose:'Maintenir l’endurance sans accumuler de fatigue, en restant capable de parler par phrases courtes.',knee:'Course confortable ou marche rapide selon le genou. Aucun objectif de vitesse si la douleur augmente.',rpe:'4–5/10',steps:['8–10 min très faciles','20–25 min à allure confortable et régulière','5–10 min de retour au calme','Noter RPE, genou et souffle']},
 S2:{code:'S2',pillar:'Cardio saison',title:'Intermittent entretien arbitre',duration:'≈ 31 min',intensity:'Modérée +',domyos:true,summary:'Fractionné d’entretien plus court que A3, destiné à conserver la capacité à répéter les efforts pendant la saison.',purpose:'Entretenir rythme, relances et tolérance aux efforts répétés sans chercher un pic de forme.',knee:'Ne pas utiliser comme séance de rattrapage après un match exigeant. APEX peut la remplacer par A5/C2 selon le check-in.',rpe:'6–7/10',domyosInput:{warmup:{duration:'8:00',speed:'7,0 km/h'},high:{duration:'0:50',speed:'11,5 km/h'},low:{duration:'0:50',speed:'6,5 km/h'},intervalSelect:4,intervalActual:5,exerciseRepeatSelect:1,exerciseActual:2,rest:{duration:'2:50',speed:'7,0 km/h',incline:'0 %'},recovery:{duration:'7:30',speed:'6,0 km/h'}},domyosNote:'Entretien saison : 5 passages réels par bloc = valeur 4 dans E-Connected. 2 blocs réels = valeur 1 dans « Répétition exercice ».'},
 B1:{code:'B1',pillar:'Barre Pilates',title:'Barre Pilates — corps entier',duration:'≈ 40–45 min',intensity:'Modérée',summary:'Séance complète où la barre et les bandes sont utilisées sur la majorité des mouvements.',purpose:'Renforcer dos, épaules, bras, tronc, fessiers et chaîne postérieure pour soutenir la saison d’arbitrage.',knee:'Le squat est optionnel et peu profond. Si le genou est sensible, le remplacer par Hip Flexion & Extension ou Glute Bridge.',rpe:'5–6/10',equipment:'Barre Pilates + bandes + tapis',visualMode:true,exercises:[
  {name:'Good Morning',time:'2 × 10–12',image:'assets/pilates_bar/good_morning.jpg',setup:'Debout, barre sur les épaules, bandes sous les pieds.',how:'Pousser les hanches en arrière, dos neutre, puis revenir en contractant fessiers et ischios.',focus:'Chaîne postérieure, contrôle du bassin.'},
  {name:'Seated Row',time:'2 × 12–15',image:'assets/pilates_bar/seated_row.jpg',setup:'Assis, bandes en tension, barre tenue devant soi.',how:'Tirer la barre vers le bas des côtes, épaules basses, retour lent.',focus:'Dos, posture, omoplates.'},
  {name:'Curl Biceps',time:'2 × 12–15',image:'assets/pilates_bar/curl_biceps.jpg',setup:'Debout sur les bandes, barre devant les cuisses.',how:'Fléchir les coudes sans avancer les épaules puis redescendre lentement.',focus:'Biceps, contrôle du haut du corps.'},
  {name:'Standing Press',time:'2 × 10–12',image:'assets/pilates_bar/standing_press.jpg',setup:'Debout stable, barre à hauteur de poitrine.',how:'Pousser la barre vers l’avant puis revenir sous contrôle.',focus:'Pectoraux, triceps, gainage.'},
  {name:'Hip Flexion & Extension',time:'2 × 12 / côté',image:'assets/pilates_bar/hip_flex_ext.jpg',setup:'Debout avec appui si besoin, bande reliée au pied.',how:'Effectuer un mouvement contrôlé de hanche sans balancer le bassin.',focus:'Fessiers, hanche, stabilité.',knee:'Jambe d’appui souple, faible amplitude.'},
  {name:'Glute Bridge avec barre',time:'2 × 12–15',image:'assets/pilates_bar/glute_bridge_bar.jpg',setup:'Allongé, pieds dans les sangles, barre stabilisée avec les mains.',how:'Monter le bassin, serrer les fessiers puis redescendre lentement.',focus:'Fessiers, ischios, bassin.',knee:'Genoux dans l’axe des pieds.'},
  {name:'Reverse Fly',time:'2 × 12–15',image:'assets/pilates_bar/reverse_fly.jpg',setup:'Debout, tension modérée des bandes.',how:'Ouvrir les bras en contrôlant les omoplates puis revenir lentement.',focus:'Haut du dos, épaules postérieures.'},
  {name:'Squat assisté avec barre',time:'2 × 8–10 optionnel',image:'assets/pilates_bar/squat_bar.jpg',setup:'Barre sur les épaules, pieds stables.',how:'Descendre seulement dans une amplitude confortable puis remonter en poussant dans les pieds.',focus:'Quadriceps, fessiers, stabilité.',knee:'Optionnel. Pas de flexion profonde. Supprimer si douleur > 3/10.'}
 ]},
 B2:{code:'B2',pillar:'Barre Pilates',title:'Barre Pilates — stabilité hanche/genou',duration:'≈ 28–32 min',intensity:'Modérée',summary:'Séance orientée chaîne postérieure, fessiers et stabilité, avec la barre comme support principal.',purpose:'Entretenir les muscles qui soutiennent les appuis et les changements de direction sans ajouter beaucoup d’impact.',knee:'Priorité à la qualité du mouvement. Aucune douleur croissante pendant les exercices debout.',rpe:'4–6/10',equipment:'Barre Pilates + bandes + tapis',visualMode:true,exercises:[
  {name:'Good Morning',time:'2 × 10',image:'assets/pilates_bar/good_morning.jpg',setup:'Barre sur les épaules, bandes sous les pieds.',how:'Charnière de hanche lente, dos neutre.',focus:'Ischios, fessiers.'},
  {name:'Hip Flexion & Extension',time:'2 × 10 / côté',image:'assets/pilates_bar/hip_flex_ext.jpg',setup:'Debout avec appui possible.',how:'Mouvement de hanche contrôlé, bassin stable.',focus:'Hanche, fessiers, stabilité.',knee:'Amplitude courte et stable.'},
  {name:'Glute Kickbacks',time:'2 × 10–12 / côté',image:'assets/pilates_bar/glute_kickbacks_bar.jpg',setup:'À quatre pattes, bande reliée au pied.',how:'Pousser le pied vers l’arrière sans cambrer le dos.',focus:'Grand fessier.',knee:'Coussin sous le genou d’appui si nécessaire.'},
  {name:'Glute Bridge avec barre',time:'2 × 12',image:'assets/pilates_bar/glute_bridge_bar.jpg',setup:'Allongé, pieds stables.',how:'Monter le bassin et redescendre sous contrôle.',focus:'Fessiers, ischios.',knee:'Genoux alignés.'},
  {name:'Seated Row',time:'2 × 12',image:'assets/pilates_bar/seated_row.jpg',setup:'Assis, barre reliée aux bandes.',how:'Tirer vers les côtes, épaules basses.',focus:'Dos, posture.'},
  {name:'Lateral Raise',time:'2 × 10–12',image:'assets/pilates_bar/lateral_raise.jpg',setup:'Debout, barre/bandes en tension légère.',how:'Élever les bras latéralement sans hausser les épaules.',focus:'Épaules, stabilité du tronc.'}
 ]},
 B3:{code:'B3',pillar:'Barre Pilates',title:'Barre Pilates — haut du corps + tronc',duration:'≈ 30–35 min',intensity:'Modérée',summary:'Séance sans charge importante sur les jambes, utile entre deux journées physiques.',purpose:'Entretenir dos, épaules, bras et gainage tout en laissant les membres inférieurs récupérer.',knee:'Quasiment aucune flexion de genou nécessaire.',rpe:'4–5/10',equipment:'Barre Pilates + bandes',visualMode:true,exercises:[
  {name:'Curl Biceps',time:'2 × 12–15',image:'assets/pilates_bar/curl_biceps.jpg',setup:'Debout sur les bandes.',how:'Curl contrôlé, coudes près du corps.',focus:'Biceps.'},
  {name:'Push Down Triceps',time:'2 × 12–15',image:'assets/pilates_bar/tricep_pushdown.jpg',setup:'Barre en tension devant le buste.',how:'Étendre les coudes vers le bas sans bouger les épaules.',focus:'Triceps.'},
  {name:'Lateral Raise',time:'2 × 10–12',image:'assets/pilates_bar/lateral_raise.jpg',setup:'Debout stable.',how:'Élever les bras jusqu’à une hauteur confortable.',focus:'Épaules.'},
  {name:'Wide-Grip Barbell',time:'2 × 10–12',image:'assets/pilates_bar/wide_grip_barbell.jpg',setup:'Prise large, bandes sous les pieds.',how:'Monter la barre au-dessus de la tête sans cambrer.',focus:'Épaules, haut du dos, gainage.'},
  {name:'Seated Row',time:'2 × 12–15',image:'assets/pilates_bar/seated_row.jpg',setup:'Assis, bandes en tension.',how:'Tirer vers les côtes, retour lent.',focus:'Dos, posture.'},
  {name:'Reverse Fly',time:'2 × 12',image:'assets/pilates_bar/reverse_fly.jpg',setup:'Debout, légère inclinaison si confortable.',how:'Ouvrir les bras sans hausser les épaules.',focus:'Arrière d’épaule, omoplates.'},
  {name:'Cable Crossover',time:'2 × 10 / côté',image:'assets/pilates_bar/cable_crossover.jpg',setup:'Debout, bande en diagonale.',how:'Ramener le bras en diagonale en gardant le bassin stable.',focus:'Pectoraux, obliques, contrôle.'}
 ]},
 B4:{code:'B4',pillar:'Barre Pilates',title:'Barre Pilates — activation courte',duration:'≈ 20–22 min',intensity:'Faible à modérée',summary:'Séance courte pour entretenir le tonus ou préparer un week-end d’arbitrage sans fatigue résiduelle.',purpose:'Activer le corps entier avec peu de volume.',knee:'Aucun exercice ne doit augmenter la douleur. Pas de squat dans cette version.',rpe:'3–4/10',equipment:'Barre Pilates + bandes',visualMode:true,exercises:[
  {name:'Seated Row',time:'2 × 10',image:'assets/pilates_bar/seated_row.jpg',setup:'Assis, bandes en tension légère.',how:'Tirer vers les côtes puis revenir lentement.',focus:'Dos, posture.'},
  {name:'Curl Biceps',time:'2 × 10',image:'assets/pilates_bar/curl_biceps.jpg',setup:'Debout sur les bandes.',how:'Curl contrôlé.',focus:'Bras.'},
  {name:'Lateral Raise',time:'2 × 8–10',image:'assets/pilates_bar/lateral_raise.jpg',setup:'Debout stable.',how:'Élévation latérale courte et contrôlée.',focus:'Épaules.'},
  {name:'Hip Flexion & Extension',time:'2 × 8 / côté',image:'assets/pilates_bar/hip_flex_ext.jpg',setup:'Avec appui si besoin.',how:'Petit mouvement de hanche, bassin stable.',focus:'Hanche, fessiers.',knee:'Faible amplitude.'},
  {name:'Glute Bridge avec barre',time:'2 × 10',image:'assets/pilates_bar/glute_bridge_bar.jpg',setup:'Allongé.',how:'Monter le bassin puis redescendre lentement.',focus:'Fessiers, chaîne postérieure.',knee:'Genoux alignés.'}
 ]}
});

function migrateToV20(){
 state.settings ||= {};
 state.plan ||= [];
 state.settings.seasonMode = state.settings.seasonMode ?? true;
 state.settings.seasonStart ||= SEASON_START;
 state.settings.seasonGoal ||= 'Maintien physique pour la saison rugby';
 const existing=new Set(state.plan.map(p=>p.date));
 SEASON_PLAN.forEach(p=>{if(!existing.has(p.date))state.plan.push({...p});});
 state.plan.sort((a,b)=>a.date.localeCompare(b.date));
 state.settings.apexVersion=APEX_V2_VERSION;
 localStorage.setItem(KEY,JSON.stringify(state));
}
migrateToV20();

function resetPlan(){
 if(confirm('Réinitialiser le plan APEX V2.0 ? Les check-ins, séances réalisées, historiques et données cloud restent conservés.')){
   const past=state.plan.filter(p=>p.date<SEASON_START);
   state.plan=[...createDefaultPlan(),...SEASON_PLAN].filter((p,i,a)=>a.findIndex(x=>x.date===p.date)===i).sort((a,b)=>a.date.localeCompare(b.date));
   persist();
 }
}

function renderPlan(){
 const today=localToday();
 let lastPhase='';
 $('planTimeline').innerHTML=state.plan.map(p=>{
   const lib=LIBRARY[p.code]||{};
   const phase=p.date<=TEST_DATE?'Préparation test':'Saison rugby';
   const divider=phase!==lastPhase?`<div class="phase-divider"><span>${phase}</span>${phase==='Saison rugby'?'<small>Maintenir • récupérer • rester disponible pour arbitrer</small>':'<small>Objectif : test Yo-Yo du 29/08</small>'}</div>`:'';
   lastPhase=phase;
   const status=p.date<today?'past':p.date===today?'today':p.date===state.settings.testDate?'test':'';
   return `${divider}<article class="plan-row ${status}" onclick="openSession('${esc(p.code)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter')openSession('${esc(p.code)}')"><div class="datebox"><b>${fmtDate(p.date).split(' ')[1]||fmtDate(p.date)}</b><span>${fmtDate(p.date).split(' ')[0]}</span></div><div class="plan-code">${esc(p.code)}</div><div class="plan-body"><h3>${esc(lib.title||p.code)}</h3><p>${esc(p.note)}</p><small>${esc(lib.duration||'')} · ${esc(lib.intensity||'')} · Cliquer pour ouvrir</small></div>${p.date===today?'<span class="today-chip">AUJOURD’HUI</span>':'<span class="chevron">›</span>'}</article>`;
 }).join('');
}

const v20PreviousRenderCockpit=renderCockpit;
renderCockpit=function(){
 v20PreviousRenderCockpit();
 const today=localToday(),after=today>TEST_DATE;
 if($('goalSnapshot')){
   const adapt=state.settings.lastPlanAdaptation?.explanation||'';
   if(after){
     $('goalSnapshot').innerHTML=`<div class="goal-ring"><b>SAISON</b><span>maintien</span></div><div><b>Objectif saison rugby</b><p>Rester disponible, mobile et suffisamment entraîné toute la saison.</p><p class="muted">APEX alterne cardio, barre Pilates, mobilité et récupération selon tes check-ins et ta charge réelle.</p>${adapt?`<p class="adapt-note"><b>Dernière adaptation :</b> ${esc(adapt)}</p>`:''}</div>`;
   }
 }
};

const v20PreviousRenderProgress=renderProgress;
renderProgress=function(){
 v20PreviousRenderProgress();
 const after=localToday()>TEST_DATE;
 if(after&&$('statDays')){$('statDays').textContent=state.plan.filter(p=>p.date>=localToday()).length;if($('statDaysLabel'))$('statDaysLabel').textContent='séances planifiées à venir';}
};

const v20PreviousRefreshAll=refreshAll;
refreshAll=function(){
 v20PreviousRefreshAll();
 const after=localToday()>TEST_DATE;
 if($('testCountdown'))$('testCountdown').textContent=after?'Mode Saison':(diffDays(localToday(),TEST_DATE)===0?'Jour du test':`Test J-${Math.max(0,diffDays(localToday(),TEST_DATE))}`);
 if(document.querySelector('.version'))document.querySelector('.version').textContent='V2.0';
};

// Le mode adaptatif sait aussi alléger les nouvelles séances saison.
const v20PrevDecisionFor=decisionFor;
decisionFor=function(c,planned){
 const d=v20PrevDecisionFor(c,planned),p=planned?LIBRARY[planned.code]:null;
 if(!planned||planned.date<=TEST_DATE)return d;
 if(d.zone==='RED'&&p&&['S1','S2','B1','B2','B3','B4'].includes(p.code)){
   return {...d,title:'Récupération saison',code:'A5',message:'APEX remplace la charge prévue par une récupération active afin de préserver ta disponibilité pour la saison.'};
 }
 if(d.zone==='ORANGE'&&p&&['S2','B1'].includes(p.code)){
   return {...d,title:'Charge saison allégée',code:p.code==='S2'?'S1':'B4',message:'APEX réduit la charge du jour sans supprimer complètement l’entraînement.'};
 }
 return d;
};

state.settings.apexVersion=APEX_V2_VERSION;
localStorage.setItem(KEY,JSON.stringify(state));
refreshAll();
