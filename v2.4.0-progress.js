/* APEX V2.4.0 — suivi longitudinal : séances réalisées, charge, régularité et progression */
(function(){
  const V='2.4.0';
  state.settings ||= {};
  state.settings.apexVersion='2.4.0-progress';

  // Le match devient une charge enregistrable comme les autres séances, sans modifier le modèle cloud.
  LIBRARY.MATCH ||= {
    code:'MATCH',pillar:'Arbitrage',title:'Match / arbitrage',duration:'≈ 90 min',intensity:'Variable à élevée',domyos:false,
    summary:'Charge réelle du week-end : déplacements, accélérations, changements de direction et concentration.',
    purpose:'Intégrer le match dans la charge hebdomadaire réelle afin qu’APEX adapte les jours suivants.',
    knee:'Le débrief du match est important : renseigne surtout le RPE et la douleur du genou après la rencontre.',rpe:'6–9/10'
  };

  function addDaysV240(dateStr,days){const d=parseLocal(dateStr);d.setDate(d.getDate()+days);return isoDay(d)}
  function mondayV240(dateStr){const d=parseLocal(dateStr);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return isoDay(d)}
  function inRange(date,start,end){return date>=start&&date<=end}
  function completedLog(t){return t?.completed!==false}

  function durationMinutes(code){
    if(code==='MATCH')return 90;
    const raw=String(LIBRARY[code]?.duration||'').replace(',','.');
    let m=raw.match(/(\d{1,3}):(\d{2})/); if(m)return +m[1]+(+m[2]/60);
    m=raw.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/); if(m)return (+m[1]+ +m[2])/2;
    m=raw.match(/(\d+(?:\.\d+)?)/); return m?+m[1]:30;
  }
  function loadFor(t){
    const r=Number(t?.rpe); if(!Number.isFinite(r))return 0;
    const mins=Number(t?.durationActual)||durationMinutes(t?.code);
    const completion=t?.completed===false?.5:1;
    return Math.round(r*mins*completion);
  }
  function sumLoad(logs){return logs.reduce((a,t)=>a+loadFor(t),0)}
  function avg(arr,field){const xs=arr.map(x=>Number(x?.[field])).filter(Number.isFinite);return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null}
  function fmt1(n){return n==null?'—':String(Math.round(n*10)/10).replace('.',',')}

  function logsBetween(start,end){return (state.trainingLog||[]).filter(t=>inRange(t.date,start,end))}
  function plannedBetween(start,end){return (state.plan||[]).filter(p=>inRange(p.date,start,end)&&p.date<=localToday())}
  function adherence28(start,end){
    const planned=plannedBetween(start,end); if(!planned.length)return null;
    const doneDates=new Set((state.trainingLog||[]).filter(completedLog).map(t=>t.date));
    const done=planned.filter(p=>doneDates.has(p.date)).length;
    return Math.round(done/planned.length*100);
  }
  function weekRows(){
    const current=mondayV240(localToday());
    const rows=[];
    for(let i=5;i>=0;i--){
      const start=addDaysV240(current,-7*i),end=addDaysV240(start,6);
      const logs=logsBetween(start,end); const done=logs.filter(completedLog);
      rows.push({start,end,load:sumLoad(logs),done:done.length,rpe:avg(logs,'rpe'),knee:avg(logs,'kneeAfter')});
    }
    return rows;
  }
  function loadTrend(current,previous){
    if(!previous&&current)return 'Première référence';
    if(!previous&&!current)return 'Pas encore de charge';
    const pct=Math.round((current-previous)/previous*100);
    if(Math.abs(pct)<10)return `Stable (${pct>=0?'+':''}${pct} %)`;
    return `${pct>0?'En hausse':'En baisse'} (${pct>0?'+':''}${pct} %)`;
  }

  function renderLoadDashboard(){
    const host=$('loadDashboard'); if(!host)return;
    const today=localToday(), start7=addDaysV240(today,-6), prevStart=addDaysV240(today,-13), prevEnd=addDaysV240(today,-7), start28=addDaysV240(today,-27);
    const l7=logsBetween(start7,today), lp=logsBetween(prevStart,prevEnd), l28=logsBetween(start28,today);
    const load7=sumLoad(l7), loadPrev=sumLoad(lp), load28=sumLoad(l28), adh=adherence28(start28,today);
    const rpe=avg(l28,'rpe'), knee=avg(l28,'kneeAfter');
    host.innerHTML=`<div class="load-kpis">
      <article><small>Charge 7 jours</small><b>${load7}</b><span>${esc(loadTrend(load7,loadPrev))}</span></article>
      <article><small>Charge 28 jours</small><b>${load28}</b><span>${l28.length} débrief(s)</span></article>
      <article><small>Régularité 28 jours</small><b>${adh==null?'—':adh+' %'}</b><span>${adh==null?'Génère puis réalise quelques séances':'séances planifiées réalisées'}</span></article>
      <article><small>RPE moyen</small><b>${fmt1(rpe)}</b><span>sur 28 jours</span></article>
      <article><small>Genou après séance</small><b>${fmt1(knee)}${knee==null?'':' /10'}</b><span>moyenne 28 jours</span></article>
    </div>`;
  }

  function renderWeeklyHistory(){
    const host=$('weeklyLoadHistory'); if(!host)return;
    const rows=weekRows(), max=Math.max(1,...rows.map(x=>x.load));
    host.innerHTML=`<div class="week-load-chart">${rows.map((w,i)=>{
      const label=i===rows.length-1?'Cette semaine':fmtDate(w.start).replace(/^\S+\s/,'');
      const pct=Math.max(w.load?6:1,Math.round(w.load/max*100));
      return `<article class="week-load-row"><div class="week-load-label"><b>${esc(label)}</b><small>${w.done} séance(s) · RPE ${fmt1(w.rpe)} · genou ${fmt1(w.knee)}</small></div><div class="week-load-track"><i style="width:${pct}%"></i></div><strong>${w.load}</strong></article>`;
    }).join('')}</div>`;
  }

  function renderJournalV240(){
    const el=$('trainingLog'); if(!el)return;
    const logs=[...(state.trainingLog||[])].sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||'').localeCompare(a.createdAt||''));
    el.innerHTML=logs.length?logs.map(t=>`<div class="log-row v240"><span>${fmtDate(t.date)}</span><b>${esc(t.code)} · ${esc(t.title||LIBRARY[t.code]?.title||t.code)}${t.completed===false?' · arrêtée':''}</b><small>Charge <strong>${loadFor(t)}</strong> · RPE ${t.rpe??'—'} · genou ${t.kneeAfter??'—'}/10${t.breathing!=null?' · souffle '+t.breathing+'/10':''}${t.fcMax?' · FC max '+t.fcMax:''}${t.yoyoLevel?' · Yo-Yo '+esc(t.yoyoLevel):''}</small></div>`).join(''):'<div class="empty">Aucune séance enregistrée. Ouvre une séance ou un match puis marque-la comme réalisée.</div>';
  }

  const priorRenderProgress=renderProgress;
  renderProgress=function(){
    priorRenderProgress();
    const done=(state.trainingLog||[]).filter(completedLog).length;
    const stat=$('statTraining'); if(stat)stat.textContent=done;
    renderLoadDashboard();renderWeeklyHistory();renderJournalV240();
  };

  // Rend le match enregistrable directement dans Plan & saison.
  renderPlan=function(){
    const today=localToday();
    $('planTimeline').innerHTML=(state.plan||[]).map(pn=>{
      if(pn.code==='MATCH'){
        const status=pn.date<today?'past':pn.date===today?'today':'';
        const logs=(state.trainingLog||[]).filter(t=>t.date===pn.date&&t.code==='MATCH');
        const done=logs.some(completedLog);
        return `<article class="plan-row ${status} match-row"><div class="datebox"><b>${fmtDate(pn.date).split(' ')[1]||fmtDate(pn.date)}</b><span>${fmtDate(pn.date).split(' ')[0]}</span></div><div class="plan-code">M</div><div class="plan-body"><h3>Match / arbitrage ${done?'✓':''}</h3><p>${esc(pn.note||'Charge match')}</p><small>${done?'Charge enregistrée dans Progression.':'Après le match, enregistre le RPE et le genou pour intégrer la charge réelle.'}</small></div><button class="ghost match-log-btn" onclick="event.stopPropagation();markTraining('MATCH')">${done?'Ajouter un débrief':'Enregistrer le match'}</button>${pn.date===today?'<span class="today-chip">AUJOURD’HUI</span>':''}</article>`;
      }
      const lib=LIBRARY[pn.code]||{};const status=pn.date<today?'past':pn.date===today?'today':pn.date===state.settings.testDate?'test':'';
      const done=(state.trainingLog||[]).some(t=>t.date===pn.date&&t.code===pn.code&&completedLog(t));
      return `<article class="plan-row ${status}" onclick="openSession('${esc(pn.code)}')" role="button" tabindex="0"><div class="datebox"><b>${fmtDate(pn.date).split(' ')[1]||fmtDate(pn.date)}</b><span>${fmtDate(pn.date).split(' ')[0]}</span></div><div class="plan-code">${esc(pn.code)}</div><div class="plan-body"><h3>${esc(lib.title||pn.code)} ${done?'✓':''}</h3><p>${esc(pn.note||'')}</p><small>${done?'Séance enregistrée · ':''}${esc(lib.duration||'')} · ${esc(lib.intensity||'')} · Cliquer pour ouvrir</small></div>${pn.date===today?'<span class="today-chip">AUJOURD’HUI</span>':'<span class="chevron">›</span>'}</article>`;
    }).join('');
  };

  const oldRefresh=refreshAll;
  refreshAll=function(){oldRefresh();renderLoadDashboard();renderWeeklyHistory();renderJournalV240()};

  setTimeout(()=>{try{renderProgress();renderPlan()}catch(e){console.warn('APEX V2.4.0',e)}},0);
})();
