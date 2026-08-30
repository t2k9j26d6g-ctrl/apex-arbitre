/* APEX V2.2.0 — profil, référentiel arbitre versionné, planificateur hebdomadaire adaptatif, match et VMA */
(function(){
  const V='2.2.0';
  state.settings ||= {};
  state.settings.profile ||= {};
  const p=state.settings.profile;
  p.age ??= '';
  p.height ??= '';
  p.weight ??= '';
  p.refereeLevel ??= 'FED2';
  p.refereeLevelCode ??= (p.refereeLevel==='Fédérale 2 / Fédérale 3' ? 'FED2' : p.refereeLevel);
  p.refereeReferenceSeason ??= '';
  p.goal ??= 'Maintien physique et performance arbitre';
  p.vma ??= '';
  p.sessionsMatchWeek ??= 3;
  p.sessionsNoMatchWeek ??= 4;
  p.matchCountsAsSession ??= true;
  state.settings.apexVersion='2.2.0-coach';



  // Référentiel arbitre versionné par saison : les codes restent stables même si les libellés changent.
  const REFEREE_LEVELS={
    '2026-2027':[
      {code:'PRO_TOP14',label:'Secteur professionnel — TOP 14'},
      {code:'PRO_PROD2',label:'Secteur professionnel — PRO D2'},
      {code:'NATIONALE',label:'Nationale'},
      {code:'FED1',label:'Fédérale 1'},
      {code:'FED2',label:'Fédérale 2'},
      {code:'FED3',label:'Fédérale 3'},
      {code:'REG1',label:'Régional 1'},
      {code:'REG2',label:'Régional 2'},
      {code:'REG3',label:'Régional 3'},
      {code:'OTHER',label:'Autre'}
    ]
  };
  function currentRefereeSeason(){
    const d=new Date(); const y=d.getFullYear(); const m=d.getMonth()+1;
    return m>=7?`${y}-${y+1}`:`${y-1}-${y}`;
  }
  function refereeCatalog(){
    const season=currentRefereeSeason();
    return {season,levels:REFEREE_LEVELS[season]||REFEREE_LEVELS['2026-2027']};
  }
  function refereeLabel(code){
    const {levels}=refereeCatalog(); return levels.find(x=>x.code===code)?.label||code||'À définir';
  }
  function renderRefereeLevelOptions(){
    const el=$('pLevel'); if(!el)return;
    const {season,levels}=refereeCatalog();
    const wanted=p.refereeLevelCode||p.refereeLevel||'FED2';
    el.innerHTML=levels.map(x=>`<option value="${x.code}">${x.label}</option>`).join('');
    el.value=levels.some(x=>x.code===wanted)?wanted:'OTHER';
    const hint=$('pLevelSeason'); if(hint)hint.textContent=`Référentiel saison ${season}`;
    p.refereeReferenceSeason=season;
  }

  function n(v){const x=Number(String(v??'').replace(',','.'));return Number.isFinite(x)?x:null}
  function mondayOf(dateStr){const d=parseLocal(dateStr||localToday());const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return isoDay(d)}
  function addDays(dateStr,days){const d=parseLocal(dateStr);d.setDate(d.getDate()+days);return isoDay(d)}
  function pctSpeed(vma,pct){const v=n(vma);return v?Math.round(v*pct*10)/10:null}
  function fmtSpeed(v){return v==null?'À définir':String(v).replace('.',',')+' km/h'}

  function refreshDynamicSessions(){
    const v=n(p.vma);
    const endurance=v?pctSpeed(v,.70):null;
    const frac=v?pctSpeed(v,1.00):null;
    const recovery=v?pctSpeed(v,.55):6;
    LIBRARY.V1={code:'V1',pillar:'Cardio',title:'Fractionné VMA tapis',duration:'≈ 34–38 min',intensity:'Élevée',domyos:true,
      summary:v?`Intervalles calibrés sur une VMA de travail de ${String(v).replace('.',',')} km/h.`:'Fractionné calibré sur la VMA de travail à renseigner dans le profil.',
      purpose:'Entretenir la puissance aérobie et la capacité à répéter des efforts soutenus utiles à l’arbitrage.',
      knee:'Séance à impact. APEX doit la protéger si le check-in est défavorable.',rpe:'7–8/10',
      domyosInput:{warmup:{duration:'10:00',speed:fmtSpeed(v?pctSpeed(v,.60):7)},high:{duration:'1:00',speed:fmtSpeed(frac||12)},low:{duration:'1:00',speed:fmtSpeed(recovery)},intervalSelect:5,intervalActual:6,exerciseRepeatSelect:1,exerciseActual:2,rest:{duration:'2:00',speed:fmtSpeed(recovery),incline:'0 %'},recovery:{duration:'8:00',speed:fmtSpeed(recovery)}},
      domyosNote:v?'Les vitesses sont calculées depuis ta VMA de travail. Ce réglage est un point de départ : le débrief et le check-in restent prioritaires.':'Renseigne d’abord ta VMA de travail dans Profil & semaine.'};
    LIBRARY.E1={code:'E1',pillar:'Cardio',title:'Endurance tapis / sortie longue',duration:'45–60 min',intensity:'Faible à modérée',domyos:true,
      summary:v?`Endurance autour de 70 % VMA, soit environ ${fmtSpeed(endurance)}.`:'Sortie longue à intensité conversationnelle, calibrable avec la VMA.',
      purpose:'Construire et entretenir la base aérobie sans accumuler une fatigue excessive.',
      knee:'Rester en aisance. Réduire durée ou vitesse si la gêne augmente.',rpe:'3–5/10',
      domyosInput:{warmup:{duration:'8:00',speed:fmtSpeed(v?pctSpeed(v,.55):6.5)},high:{duration:'35:00',speed:fmtSpeed(endurance||8.5)},low:{duration:'0:00',speed:'—'},intervalSelect:0,intervalActual:1,exerciseRepeatSelect:0,exerciseActual:1,rest:{duration:'0:00',speed:'—',incline:'0 %',unused:true},recovery:{duration:'7:00',speed:fmtSpeed(v?pctSpeed(v,.55):6.5)}},
      domyosNote:'Pour une sortie longue, privilégier l’aisance respiratoire. La vitesse issue de la VMA est indicative, pas une obligation.'};
  }
  refreshDynamicSessions();
  // La liste est construite au rendu pour suivre le référentiel de saison.

  window.saveApexProfile=function(){
    p.age=n($('pAge')?.value)||'';
    p.height=n($('pHeight')?.value)||'';
    p.weight=n($('pWeight')?.value)||'';
    p.refereeLevelCode=$('pLevel')?.value||'OTHER';
    p.refereeLevel=refereeLabel(p.refereeLevelCode);
    p.refereeReferenceSeason=currentRefereeSeason();
    p.goal=$('pGoal')?.value?.trim()||'';
    p.vma=n($('pVma')?.value)||'';
    p.sessionsMatchWeek=n($('pMatchSessions')?.value)||3;
    p.sessionsNoMatchWeek=n($('pNoMatchSessions')?.value)||4;
    p.matchCountsAsSession=$('pMatchCounts')?.checked!==false;
    refreshDynamicSessions();
    persist();
    renderApexProfile();
    alert('Profil APEX enregistré.');
  };

  window.renderApexProfile=function(){
    const host=$('profileSummary'); if(!host)return;
    const v=n(p.vma);
    host.innerHTML=`<div class="profile-kpis">
      <article><small>VMA de travail</small><b>${v?String(v).replace('.',',')+' km/h':'À définir'}</b></article>
      <article><small>Séances / semaine avec match</small><b>${p.sessionsMatchWeek}</b></article>
      <article><small>Séances / semaine sans match</small><b>${p.sessionsNoMatchWeek}</b></article>
      <article><small>Endurance cible</small><b>${v?fmtSpeed(pctSpeed(v,.70)):'À définir'}</b></article>
    </div>`;
    renderRefereeLevelOptions();
    const fields={pAge:p.age,pHeight:p.height,pWeight:p.weight,pGoal:p.goal,pVma:p.vma,pMatchSessions:p.sessionsMatchWeek,pNoMatchSessions:p.sessionsNoMatchWeek};
    Object.entries(fields).forEach(([id,val])=>{const el=$(id);if(el&&document.activeElement!==el)el.value=val??''});
    const mc=$('pMatchCounts');if(mc)mc.checked=p.matchCountsAsSession!==false;
  };

  function uniqueOffsets(offsets, matchDay){
    return offsets.filter((v,i,a)=>v>=0&&v<=6&&v!==matchDay&&a.indexOf(v)===i);
  }

  function buildTrainingTemplates(hasMatch, trainingNeeded){
    const matchTemplates=[
      {code:'B1',note:'Renforcement protecteur — priorité structurelle de la semaine.'},
      {code:'V1',note:'Fractionné VMA tapis — qualité cardio, à distance du match.'},
      {code:'E1',note:'Endurance tapis / sortie longue — base aérobie en aisance.'},
      {code:'C2',note:'Mobilité / récupération courte — fraîcheur avant ou après les charges.'},
      {code:'A5',note:'Récupération active — charge légère complémentaire.'},
      {code:'C1',note:'Mobilité générale — séance légère supplémentaire.'}
    ];
    const noMatchTemplates=[
      {code:'V1',note:'Fractionné VMA tapis — qualité cardio de la semaine.'},
      {code:'B1',note:'Renforcement protecteur — chaîne postérieure, gainage et stabilité.'},
      {code:'E1',note:'Endurance tapis / sortie longue — base aérobie.'},
      {code:'C2',note:'Mobilité / récupération courte.'},
      {code:'A5',note:'Récupération active — charge légère complémentaire.'},
      {code:'C1',note:'Mobilité générale — séance légère supplémentaire.'}
    ];
    return (hasMatch?matchTemplates:noMatchTemplates).slice(0,Math.max(0,trainingNeeded));
  }

  function assignTrainingDays(start, matchDay, templates, hasMatch){
    // Répartition pensée pour éviter de coller deux grosses charges et préserver la fraîcheur avant match.
    let offsets;
    if(hasMatch){
      offsets = matchDay===5 ? [1,3,0,4,2,6] : [2,4,0,5,1,3];
      // Avec 3 vraies séances avant match, l'endurance passe en début de semaine.
      if(templates.length>=3) offsets = matchDay===5 ? [3,1,0,4,2,6] : [3,1,0,5,2,4];
    }else{
      offsets=[1,3,5,6,0,2,4];
    }
    offsets=uniqueOffsets(offsets,hasMatch?matchDay:-1);
    return templates.map((t,i)=>({...t,date:addDays(start,offsets[i] ?? Math.min(6,i))}));
  }

  window.generateApexWeek=function(){
    const start=mondayOf($('weekStart')?.value||localToday());
    const hasMatch=$('weekHasMatch')?.checked!==false;
    const matchDay=+$('weekMatchDay')?.value||6; // 5=samedi, 6=dimanche
    const target=hasMatch?(+p.sessionsMatchWeek||3):(+p.sessionsNoMatchWeek||4);
    const matchCounts=p.matchCountsAsSession!==false;
    const trainingNeeded=hasMatch ? Math.max(0,target-(matchCounts?1:0)) : target;
    const templates=buildTrainingTemplates(hasMatch,trainingNeeded);
    const rows=assignTrainingDays(start,matchDay,templates,hasMatch);

    if(hasMatch){
      rows.push({date:addDays(start,matchDay),code:'MATCH',note:matchCounts?'Match / arbitrage — compté dans le volume hebdomadaire.':'Match / arbitrage — charge physique suivie par APEX, hors nombre de séances choisi.'});
    }

    rows.sort((a,b)=>a.date.localeCompare(b.date));
    const begin=start,end=addDays(start,6);
    state.plan=(state.plan||[]).filter(x=>x.date<begin||x.date>end);
    rows.forEach(x=>state.plan.push(x));
    state.plan.sort((a,b)=>a.date.localeCompare(b.date));
    state.settings.weekPlanner={start,hasMatch,matchDay,target,matchCounts,trainingNeeded,generatedAt:new Date().toISOString()};
    persist();
    renderApexWeekPreview();
    const msg=hasMatch
      ? `${trainingNeeded} séance(s) d’entraînement + match${matchCounts?' = '+target+' charge(s) comptée(s)':' (match hors compteur)'}.`
      : `${target} séance(s) d’entraînement planifiée(s).`;
    alert(`Semaine APEX générée : ${msg}`);
  };

  window.renderApexWeekPreview=function(){
    const host=$('weekPreview');if(!host)return;
    const start=mondayOf($('weekStart')?.value||state.settings.weekPlanner?.start||localToday());
    const end=addDays(start,6);
    const rows=(state.plan||[]).filter(x=>x.date>=start&&x.date<=end);
    if(!rows.length){host.innerHTML='<div class="empty">Aucune semaine générée pour cette période.</div>';return;}
    const wp=state.settings.weekPlanner||{};
    const trainingCount=rows.filter(x=>x.code!=='MATCH').length;
    const hasMatch=rows.some(x=>x.code==='MATCH');
    const recap=`<div class="week-recap"><b>${trainingCount} séance(s) d’entraînement${hasMatch?' + match':''}</b><small>${hasMatch?(wp.matchCounts?'Le match est compté dans le volume choisi.':'Le match est suivi comme charge, mais hors compteur de séances.'):'Semaine sans match.'}</small></div>`;
    host.innerHTML=recap+rows.map(x=>`<article><span>${fmtDate(x.date)}</span><b>${esc(x.code==='MATCH'?'MATCH / ARBITRAGE':(LIBRARY[x.code]?.title||x.code))}</b><small>${esc(x.note||'')}</small></article>`).join('');
  };

  // MATCH est une charge de calendrier, pas une fiche d'entraînement classique.
  const oldRenderPlan=renderPlan;
  renderPlan=function(){
    const today=localToday();
    $('planTimeline').innerHTML=(state.plan||[]).map(pn=>{
      if(pn.code==='MATCH'){
        const status=pn.date<today?'past':pn.date===today?'today':'';
        return `<article class="plan-row ${status}"><div class="datebox"><b>${fmtDate(pn.date).split(' ')[1]||fmtDate(pn.date)}</b><span>${fmtDate(pn.date).split(' ')[0]}</span></div><div class="plan-code">M</div><div class="plan-body"><h3>Match / arbitrage</h3><p>${esc(pn.note||'Charge match')}</p><small>Charge physique week-end prise en compte par APEX</small></div>${pn.date===today?'<span class="today-chip">AUJOURD’HUI</span>':''}</article>`;
      }
      const lib=LIBRARY[pn.code]||{};const status=pn.date<today?'past':pn.date===today?'today':pn.date===state.settings.testDate?'test':'';
      return `<article class="plan-row ${status}" onclick="openSession('${esc(pn.code)}')" role="button" tabindex="0"><div class="datebox"><b>${fmtDate(pn.date).split(' ')[1]||fmtDate(pn.date)}</b><span>${fmtDate(pn.date).split(' ')[0]}</span></div><div class="plan-code">${esc(pn.code)}</div><div class="plan-body"><h3>${esc(lib.title||pn.code)}</h3><p>${esc(pn.note||'')}</p><small>${esc(lib.duration||'')} · ${esc(lib.intensity||'')} · Cliquer pour ouvrir</small></div>${pn.date===today?'<span class="today-chip">AUJOURD’HUI</span>':'<span class="chevron">›</span>'}</article>`;
    }).join('');
  };

  // Synchronise aussi les nouveaux réglages du profil, sans changer les tables existantes.
  if(typeof pushLocalToCloudV19==='function'){
    const origPush=pushLocalToCloudV19;
    pushLocalToCloudV19=async function(opts){
      // Le moteur V1.9 envoie d'abord les données standard.
      const ok=await origPush(opts); if(!ok||!apexCloud||!apexCloudUser)return ok;
      try{
        const {data:existing}=await apexCloud.from('settings').select('settings_data').eq('user_id',apexCloudUser.id).maybeSingle();
        const settings_data={...(existing?.settings_data||{}),profile_v210:state.settings.profile||{},weekPlanner_v210:state.settings.weekPlanner||null};
        await apexCloud.from('settings').upsert({user_id:apexCloudUser.id,settings_data},{onConflict:'user_id'});
      }catch(e){console.warn('APEX V2.1 profile sync',e)}
      return ok;
    };
  }
  if(typeof applyCloudPackageV19==='function'){
    const origApply=applyCloudPackageV19;
    applyCloudPackageV19=function(pack,opts){
      const cp=pack?.settings?.settings_data?.profile_v210;
      const cw=pack?.settings?.settings_data?.weekPlanner_v210;
      origApply(pack,opts);
      if(cp){state.settings.profile={...(state.settings.profile||{}),...cp};Object.assign(p,state.settings.profile);refreshDynamicSessions()}
      if(cw)state.settings.weekPlanner=cw;
      localStorage.setItem(KEY,JSON.stringify(state));
      renderApexProfile();
    };
  }

  const oldRefresh=refreshAll;
  refreshAll=function(){oldRefresh();refreshDynamicSessions();renderApexProfile();renderApexWeekPreview()};

  document.addEventListener('DOMContentLoaded',()=>{
    const ws=$('weekStart');if(ws&&!ws.value)ws.value=mondayOf(localToday());
    renderApexProfile();renderApexWeekPreview();
  });
  setTimeout(()=>{const ws=$('weekStart');if(ws&&!ws.value)ws.value=mondayOf(localToday());renderApexProfile();renderApexWeekPreview();try{renderLibrary();renderPlan()}catch(e){}},0);
})();
