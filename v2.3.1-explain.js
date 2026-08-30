/* APEX V2.3.1 — explication de la décision + contexte des séances déjà légères */
(function(){
  const V='2.3.1';
  state.settings ||= {};
  state.settings.apexVersion='2.3.1-explain';

  const LOW=new Set(['A5','C1','C2']);

  function readinessFactors(c){
    if(!c)return [];
    const factors=[];
    const base=+c.rhrBase||+state.settings.rhrBaseline||0;
    const delta=(base&&c.rhr)?(+c.rhr-base):0;
    const add=(weight,label,detail,tone='watch')=>factors.push({weight,label,detail,tone});

    if(c.knee>=6)add(35,'Genou',`${c.knee}/10 · priorité protection`,'risk');
    else if(c.knee>=4)add(20,'Genou',`${c.knee}/10 · sensible`,'watch');
    else if(c.knee>=2)add(7,'Genou',`${c.knee}/10 · à surveiller`,'ok');
    else add(1,'Genou',`${c.knee}/10 · favorable`,'good');

    if(delta>=8)add(20,'FC de repos',`+${delta} bpm vs habituel`,'risk');
    else if(delta>=5)add(10,'FC de repos',`+${delta} bpm vs habituel`,'watch');
    else if(base&&c.rhr)add(2,'FC de repos',`${delta>=0?'+':''}${delta} bpm vs habituel`,'good');

    if(c.sleep<65)add(22,'Sommeil',`${c.sleep}/100 · bas`,'risk');
    else if(c.sleep<80)add(10,'Sommeil',`${c.sleep}/100 · moyen`,'watch');
    else add(2,'Sommeil',`${c.sleep}/100 · favorable`,'good');

    if(c.fatigue>=7)add(20,'Fatigue',`${c.fatigue}/10 · élevée`,'risk');
    else if(c.fatigue>=5)add(9,'Fatigue',`${c.fatigue}/10 · modérée`,'watch');
    else add(2,'Fatigue',`${c.fatigue}/10 · basse`,'good');

    if(c.soreness>=7)add(12,'Courbatures',`${c.soreness}/10 · élevées`,'risk');
    else if(c.soreness>=5)add(6,'Courbatures',`${c.soreness}/10 · présentes`,'watch');
    else add(1,'Courbatures',`${c.soreness}/10 · faibles`,'good');

    if(c.motivation<=3)add(8,'Motivation',`${c.motivation}/10 · basse`,'watch');
    else if(c.motivation>=7)add(1,'Motivation',`${c.motivation}/10 · bonne`,'good');

    const penalizing=factors.filter(x=>x.weight>=6).sort((a,b)=>b.weight-a.weight);
    if(penalizing.length>=3)return penalizing.slice(0,3);
    const chosen=[...penalizing];
    const strengths=factors.filter(x=>!chosen.includes(x)&&x.tone==='good').sort((a,b)=>{
      const order={Sommeil:5,Genou:4,Motivation:3,'FC de repos':2,Fatigue:1,Courbatures:0};
      return (order[b.label]||0)-(order[a.label]||0);
    });
    for(const f of strengths){if(chosen.length>=3)break;chosen.push(f)}
    return chosen.slice(0,3);
  }

  window.apexReadinessFactors=readinessFactors;

  const baseDecisionFor=decisionFor;
  decisionFor=function(c,planned){
    const d=baseDecisionFor(c,planned);
    if(!c)return d;
    d.keyFactors=readinessFactors(c);

    const original=planned?.code||d.originalCode||d.planned||'';
    if(LOW.has(original) && d.zone==='RED'){
      const same=d.code===original;
      d.title=same?'Séance légère maintenue · vigilance':'Récupération déjà prévue · encore allégée';
      d.message=same
        ?'La séance prévue est déjà légère. Les signaux du jour justifient de rester strictement dans cette intensité, sans ajouter de charge.'
        :`La séance prévue (${LIBRARY[original]?.title||original}) est déjà légère. Mais les signaux du jour justifient un cran supplémentaire de protection : APEX propose ${LIBRARY[d.code]?.title||d.code}.`;
    }
    return d;
  };

  renderCheckinResult=function(c,d){
    const r=$('checkinResult');r.classList.remove('hidden');
    const s=computeReadiness(c);
    const modifiable=d.action&&['LIGHTEN','REPLACE','DEFER'].includes(d.action);
    const actionLabel=d.action==='DEFER'?'Décaler et appliquer':d.action==='LIGHTEN'?'Alléger et appliquer':'Remplacer et appliquer';
    const factors=(d.keyFactors||readinessFactors(c)).slice(0,3);
    const factorsHtml=factors.length?`<div class="decision-factors"><div class="decision-factors-head"><span class="eyebrow">CE QUI PÈSE LE PLUS AUJOURD’HUI</span><small>Les principaux facteurs qui expliquent la recommandation APEX.</small></div><div class="decision-factor-grid">${factors.map(f=>`<article class="decision-factor ${esc(f.tone)}"><b>${esc(f.label)}</b><span>${esc(f.detail)}</span></article>`).join('')}</div></div>`:'';

    r.innerHTML=`<div class="decision ${d.zone.toLowerCase()}"><div><span class="eyebrow">DÉCISION APEX · ${esc(d.action||'')}</span><h2>${esc(d.title)}</h2><p>${esc(d.message)}</p></div><div class="decision-score"><b>${s.score}</b><span>/100</span></div></div>
      ${factorsHtml}
      ${d.plannedTitle?`<div class="adaptive-compare"><div><small>PRÉVU</small><b>${esc(d.plannedTitle)}</b></div><span>→</span><div><small>PROPOSÉ</small><b>${esc(LIBRARY[d.code]?.title||d.code||'Aucune séance')}</b></div></div>`:''}
      <div class="recommend"><div><span class="code">${esc(d.code)}</span><h3>${esc(LIBRARY[d.code]?.title||'')}</h3><p>${esc(LIBRARY[d.code]?.summary||'')}</p></div>${d.action==='MATCH'||d.action==='MATCH_CAUTION'?'':`<button class="primary" onclick="markTraining('${d.code}')">Marquer réalisée</button>`}</div>
      ${d.why?.length?`<div class="reasonline"><b>Autres éléments :</b> ${d.why.map(esc).join(' • ')}</div>`:''}
      ${modifiable?`<div class="adaptive-actions"><button class="primary" onclick="applyApexAdaptation('${c.date}')">${actionLabel}</button><button class="ghost" onclick="keepApexPlan('${c.date}')">Conserver la séance prévue</button></div>`:''}`;
  };

  try{persist()}catch(e){localStorage.setItem(KEY,JSON.stringify(state))}
})();
