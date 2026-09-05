/* ==========================================================================
   citizen.js — Citizen portal: 8 screens rendered inside the phone frame.
   Each screenXxx() function is a self-contained "component" that returns
   an HTML string for its screen, driven by State (data.js/state.js) and
   t() translations (i18n.js).
   ========================================================================== */

function screenOnboard(){
  return `
    <div class="onboard">
      <div class="mark">R</div>
      <h1>RakshaNet</h1>
      <p class="sub">${t('tagline')}</p>
      <div class="illus">🌊🛶</div>
      <p class="tagline">${t('onboardLine1')}<br>${t('onboardLine2')}</p>
      <div class="lang-row">
        <button data-lang="en" class="${currentLang==='en'?'active':''}" onclick="setLang('en')">English</button>
        <button data-lang="bn" class="${currentLang==='bn'?'active':''}" onclick="setLang('bn')">বাংলা</button>
        <button data-lang="hi" class="${currentLang==='hi'?'active':''}" onclick="setLang('hi')">हिंदी</button>
      </div>
      <button class="btn-primary" onclick="showScreen('home')">${t('getStarted')}</button>
      <div class="dots"><span class="on"></span><span></span><span></span><span></span></div>
    </div>`;
}

function screenHome(){
  const rm = RISK_META[State.risk];
  return `
    <div class="screen-pad">
      <div class="greet"><h2>${t('goodMorning')}</h2><div class="avatar"></div></div>
      <div class="loc-row"><div><span class="k">${t('yourLocation')}</span><span class="v">Kolkata, West Bengal</span></div><button class="upd" onclick="updateLocation()">${t('update')}</button></div>
      <div class="risk-banner" style="background:${rm.banner};">
        <div class="lbl">${t('risk'+cap(State.risk))}</div>
        <div class="txt">${t('risk'+cap(State.risk)+'Desc')}</div>
        <span class="view-btn" onclick="showScreen('map')">${t('viewDetails')}</span>
      </div>
      <div class="qa-title">${t('quickActions')}</div>
      <div class="qa-grid">
        <div class="qa-item" onclick="showScreen('map')"><span class="ic">🗺️</span>${t('riskMap')}</div>
        <div class="qa-item" onclick="showScreen('route')"><span class="ic">🚗</span>${t('safeRoute')}</div>
        <div class="qa-item" onclick="showScreen('shelters')"><span class="ic">🏫</span>${t('safeShelters')}</div>
        <div class="qa-item rescue" onclick="showScreen('sos')"><span class="ic">🆘</span>${t('requestRescue')}</div>
        <div class="qa-item kit" onclick="showScreen('emergencykit')" role="button" tabindex="0"><span class="ic">🧰</span>${t('emergencyKit')}</div>
        <div class="qa-item" onclick="showScreen('alerts')"><span class="ic">🔔</span>${t('alertsNav')}</div>
      </div>
    </div>`;
}

let mapLayer = 'street';
let citizenLeafletMap = null;
let citizenBaseLayer = null;
const CITIZEN_CENTER = [22.5726, 88.3639];

function setCitizenMapLayer(layer){
  mapLayer = layer;
  if (!citizenLeafletMap) return showScreen('map');
  if (citizenBaseLayer) citizenLeafletMap.removeLayer(citizenBaseLayer);
  const isSatellite = layer === 'satellite';
  citizenBaseLayer = isSatellite
    ? L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {maxZoom:19, attribution:'Tiles © Esri'})
    : L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {maxZoom:19, attribution:'Tiles © Esri — Esri, DeLorme, NAVTEQ'});
  citizenBaseLayer.addTo(citizenLeafletMap);
  document.querySelectorAll('.map-layer-btn').forEach(b=>b.classList.toggle('active', b.dataset.layer===layer));
}
function openStreetView(){
  const [lat,lng] = CITIZEN_CENTER;
  window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`, '_blank', 'noopener');
}
function initCitizenMap(){
  const el=document.getElementById('citizenRealMap'); if(!el) return;
  if (typeof L==='undefined') { el.innerHTML='<div class="map-fallback"><b>Live map unavailable</b><span>Connect to the internet for street/satellite tiles.</span></div>'; return; }
  if(citizenLeafletMap){ citizenLeafletMap.remove(); citizenLeafletMap=null; }
  citizenLeafletMap=L.map('citizenRealMap',{zoomControl:false,attributionControl:true,preferCanvas:true}).setView(CITIZEN_CENTER,12.7);
  // Never place an opaque fallback over the map. If tiles fail, keep the map canvas visible and retry naturally.
  citizenBaseLayer = mapLayer === 'satellite'
    ? L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {maxZoom:19, attribution:'Tiles © Esri', crossOrigin:true})
    : L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {maxZoom:19, attribution:'Tiles © Esri — Esri, DeLorme, NAVTEQ', crossOrigin:true});
  citizenBaseLayer.on('tileerror',()=>{ el.classList.add('tiles-degraded'); });
  citizenBaseLayer.on('load',()=>{ el.classList.remove('tiles-degraded'); });
  citizenBaseLayer.addTo(citizenLeafletMap);

  const rm=RISK_META[State.risk];
  const riskCircle=L.circle(CITIZEN_CENTER,{radius:3200,color:rm.color,fillColor:rm.color,fillOpacity:.12,weight:2}).addTo(citizenLeafletMap).bindPopup(`<b>${State.risk.toUpperCase()} flood-risk zone</b><br>Dynamic demo risk overlay`);
  L.circle([22.5726,88.3639],{radius:650,color:'#2d74da',fillColor:'#2d74da',fillOpacity:.08,weight:1.5,dashArray:'6 6'}).addTo(citizenLeafletMap);
  L.circleMarker(CITIZEN_CENTER,{radius:8,color:'#fff',weight:3,fillColor:'#2d74da',fillOpacity:1}).addTo(citizenLeafletMap).bindPopup('<b>Your location</b><br>Kolkata Metropolitan Area');
  State.shelters.forEach(s=>L.marker([s.lat,s.lng],{icon:makeMapIcon('shelter')}).addTo(citizenLeafletMap).bindPopup(`<b>🏠 ${s.name}</b><br>${s.occ}/${s.cap} occupied · ${s.dist}`));
  BLOCKED_ROADS.forEach(r=>L.marker([r.lat,r.lng],{icon:makeMapIcon('road')}).addTo(citizenLeafletMap).bindPopup(`<b>🚧 ${r.name}</b><br>${r.status}`));
  const hospitals=[[22.5487,88.3433,'SSKM Hospital'],[22.5958,88.2636,'ILS Howrah']];
  hospitals.forEach(h=>L.marker([h[0],h[1]],{icon:makeMapIcon('hospital')}).addTo(citizenLeafletMap).bindPopup(`<b>🏥 ${h[2]}</b><br>Emergency support point`));
  setTimeout(()=>citizenLeafletMap.invalidateSize({pan:false}),120);
  setTimeout(()=>citizenLeafletMap.invalidateSize({pan:false}),500);
}
function makeMapIcon(type){
  const colors={shelter:'#18a463',hospital:'#e53935',road:'#596865'};
  const glyphs={shelter:'⌂',hospital:'+',road:'−'};
  return L.divIcon({className:'custom-map-icon',html:`<span style="background:${colors[type]}">${glyphs[type]}</span>`,iconSize:[30,30],iconAnchor:[15,15]});
}
let mapSheetDrag = null;
function toggleMapSheet(e){
  if(e) e.stopPropagation();
  const el=document.getElementById('mapBottomSheet');
  if(el) el.classList.toggle('expanded');
}
function initMapSheet(){
  const el=document.getElementById('mapBottomSheet'); if(!el) return;
  const grab=el.querySelector('.sheet-grab');
  const begin=(ev)=>{ const p=ev.touches?ev.touches[0]:ev; mapSheetDrag={y:p.clientY,startExpanded:el.classList.contains('expanded')}; };
  const move=(ev)=>{ if(!mapSheetDrag) return; ev.preventDefault(); };
  const end=(ev)=>{ if(!mapSheetDrag) return; const p=ev.changedTouches?ev.changedTouches[0]:ev; const dy=p.clientY-mapSheetDrag.y; if(Math.abs(dy)>25){ el.classList.toggle('expanded', dy<0); } mapSheetDrag=null; };
  grab.addEventListener('touchstart',begin,{passive:true}); grab.addEventListener('touchmove',move,{passive:false}); grab.addEventListener('touchend',end);
  grab.addEventListener('mousedown',begin); window.addEventListener('mouseup',end,{once:false});
}

function screenMap(){
  const rm=RISK_META[State.risk];
  setTimeout(()=>{ initCitizenMap(); initMapSheet(); },0);
  return `
    <div class="screen-map-page">
      <div class="map-header">
        <div class="map-brand"><div class="mini-mark">R</div><div><b>RakshaNet</b><span>Safer communities. Stronger tomorrow.</span></div></div>
        <div class="map-head-actions"><button class="map-circle-btn" onclick="showScreen('alerts')">🔔<i></i></button></div>
      </div>
      <div class="map-search"><span>⌕</span><input aria-label="Search location" placeholder="Search location (e.g. Howrah, Salt Lake)…"><button onclick="showScreen('map')">⌖</button></div>
      <div class="map-filter-row">
        <button class="map-filter active">All</button>
        <button class="map-filter">〰 Flood Risk</button>
        <button class="map-filter">⌂ Shelters</button>
        <button class="map-filter">⚠ Roads</button>
      </div>
      <div class="map-wrap real-map-shell">
        <div id="citizenRealMap"></div>
        <div class="map-layer-switch">
          <button class="map-layer-btn ${mapLayer==='street'?'active':''}" data-layer="street" onclick="setCitizenMapLayer('street')">Map</button>
          <button class="map-layer-btn ${mapLayer==='satellite'?'active':''}" data-layer="satellite" onclick="setCitizenMapLayer('satellite')">Satellite</button>
          <button class="map-layer-btn" onclick="openStreetView()">Street View</button>
        </div>
        <div class="map-zoom-tools"><button onclick="citizenLeafletMap && citizenLeafletMap.locate({setView:true,maxZoom:15})">⌾</button><button onclick="openStreetView()">👁</button></div>
        <div class="map-legend real">
          <div class="row"><span class="sw" style="background:#d3352d"></span>Flooded Area</div>
          <div class="row"><span class="sw" style="background:#e08b18"></span>High Risk Zone</div>
          <div class="row"><span class="sw" style="background:#22a862"></span>Shelter</div>
          <div class="row"><span class="sw" style="background:#e53935"></span>Hospital</div>
          <div class="row"><span class="sw" style="background:#6b7775"></span>Road Blocked</div>
          <div class="row"><span class="sw" style="background:#2d74da"></span>Your Location</div>
        </div>
        <div class="map-bottom-sheet collapsed" id="mapBottomSheet">
          <button class="sheet-grab" aria-label="Expand live conditions" onclick="toggleMapSheet(event)"></button>
          <div class="live-title"><b>Live Conditions · Kolkata</b><span><i></i> Live</span></div>
          <div class="condition-grid">
            <div><strong>💧 ${WATER_LEVEL_HISTORY[WATER_LEVEL_HISTORY.length-1].level.toFixed(1)} m</strong><small>Water level</small></div>
            <div><strong>🌧 Heavy</strong><small>Rainfall</small></div>
            <div><strong>🔔 ${State.sosRequests.length+9}</strong><small>Active alerts</small></div>
            <div><strong>🏠 ${State.shelters.filter(s=>s.occ<s.cap).length}</strong><small>Open shelters</small></div>
          </div>
          <div class="map-risk-callout" onclick="showScreen('waterlevel')"><div class="risk-icon">⚠</div><div><b>${State.risk==='critical'?'Critical':'High'} Flood Risk</b><span>Water level rising in Hooghly River</span></div><strong>›</strong></div>
        </div>
      </div>
    </div>`;
}

function screenRoute(){
  return `
    <div class="screen-topbar"><span class="back" onclick="showScreen('home')">←</span><h2>${t('safeRouteTitle')}</h2></div>
    <div class="screen-pad" style="padding-top:0;">
      <div class="route-field"><span class="dot from"></span><div><span class="k">${t('from')}</span>${t('yourLocationField')}</div></div>
      <div class="route-field"><span class="dot to"></span><div><span class="k">${t('to')}</span>${t('nearestShelter')}</div></div>
      <div class="route-card">
        <div class="title">${t('recommendedRoute')}</div>
        <div class="meta">2.4 km · 12 min</div>
        ${(State.risk==='high'||State.risk==='critical') ? `<div class="route-flag">${t('recalculated')}</div>` : ''}
        <div class="route-visual"><div class="route-line"></div></div>
        <ol class="route-steps">
          <li>1.<b>${t('step1')}</b></li>
          <li>2.<b>${t('step2')}</b></li>
          <li>3.<b>${t('step3')}</b></li>
          <li>4.<b>${t('step4')}</b></li>
        </ol>
      </div>
      <button class="btn-primary" onclick="showScreen('shelters')">${t('startNavigation')}</button>
    </div>`;
}

function screenShelters(){
  return `
    <div class="screen-topbar"><span class="back" onclick="showScreen('home')">←</span><h2>${t('safeSheltersTitle')}</h2></div>
    <div class="screen-pad" style="padding-top:0;">
      ${State.shelters.map(s=>{
        const pct = Math.round(s.occ/s.cap*100);
        const full = s.occ >= s.cap;
        return `<div class="shelter-card">
          <div class="top"><h3>${s.name}</h3><span class="dist">${s.dist}</span></div>
          <div class="caprow">${t('capacity')} ${s.cap} · ${t('occupied')} ${s.occ}</div>
          <div class="shelter-bar"><div class="fill" style="width:${pct}%;background:${full?'#d3352d':'#22a862'};"></div></div>
          <span class="status-pill ${full?'full':'avail'}">${full?t('full'):t('available')}</span>
        </div>`;
      }).join('')}
      <button class="btn-primary" onclick="showScreen('map')">${t('viewOnMap')}</button>
    </div>`;
}

function screenSOS(){
  return `
    <div class="screen-topbar"><span class="back" onclick="showScreen('home')">←</span><h2>${t('requestRescueScreenTitle')}</h2></div>
    <div class="screen-pad" style="padding-top:0;">
      <div class="sos-header"><div class="t">SOS</div><div class="s">${t('sosHeaderSub')}</div></div>
      <button class="voice-sos-btn" id="voiceSosBtn" onclick="startVoiceSOS()">${t('speakEmergency')}</button>
      <div class="form-row"><label>${t('peopleInNeed')}</label>
        <div class="stepper"><button onclick="adjustForm('people',-1)">−</button><span id="f-people">${form.people}</span><button onclick="adjustForm('people',1)">+</button></div></div>
      <div class="form-row"><label>${t('childrenLbl')}</label>
        <div class="stepper"><button onclick="adjustForm('children',-1)">−</button><span id="f-children">${form.children}</span><button onclick="adjustForm('children',1)">+</button></div></div>
      <div class="form-row"><label>${t('elderlyLbl')}</label>
        <div class="stepper"><button onclick="adjustForm('elderly',-1)">−</button><span id="f-elderly">${form.elderly}</span><button onclick="adjustForm('elderly',1)">+</button></div></div>
      <div class="form-row"><div class="toggle-row"><label style="margin:0;">${t('medicalEmergency')}</label>
        <div class="toggle ${form.medical?'on':''}" id="f-medical-toggle" onclick="toggleMedical()"></div></div></div>
      <div class="form-row"><label>${t('waterLevelLbl')}</label>
        <select class="select-real" onchange="form.waterLevelKey=this.value">
          ${WATER_LEVEL_KEYS.map(w=>`<option value="${w}" ${form.waterLevelKey===w?'selected':''}>${t(w)}</option>`).join('')}
        </select></div>
      <div class="form-row"><label>${t('additionalInfo')}</label>
        <textarea class="textarea-real" onchange="form.note=this.value">${form.note}</textarea></div>
      <button class="btn-sos" onclick="submitSOS()">${t('sendSOS')}</button>
    </div>`;
}

function screenSubmitted(){
  const r = window.__lastSubmission || { id:'SOS78945', score:92, severity:'critical', breakdown:[] };
  const sevClass = r.severity==='critical' ? 'crit' : r.severity==='high' ? 'high' : r.severity==='medium' ? 'med' : 'low';
  return `
    <div class="submitted">
      <div class="check-circle">✓</div>
      <h2>${t('sosSubmittedTitle')}</h2>
      <p>${t('sosSubmittedBody')}</p>
      <div class="req-id">#${r.id}</div>
      <div class="score-box">
        <div class="sh"><b>${t('aiPriorityScore')}</b><span class="val ${sevClass}">${r.score} · ${r.severity.toUpperCase()}</span></div>
        ${r.breakdown.map(b=>`<div class="score-chip"><span>${b[0]}</span><b>+${b[1]}</b></div>`).join('')}
      </div>
      <button class="btn-primary" onclick="switchToAdminForSos('${r.id}')">${t('trackAdmin')}</button>
      <button class="btn-outline" onclick="showScreen('home')">${t('backHome')}</button>
    </div>`;
}

function updateLocation(){
  toast('Location refreshed — Kolkata, West Bengal', 'good');
}

function screenEmergencyKit(){
  const items = [
    ['💧','Drinking water','Keep at least 2 litres per person.'],
    ['🔦','Flashlight','Carry a charged torch and spare batteries.'],
    ['🩹','First-aid kit','Bandages, antiseptic, essential medicines.'],
    ['🔋','Power bank','Keep phones charged for emergency alerts.'],
    ['📻','Emergency radio','Useful when mobile networks are unavailable.'],
    ['🍪','Dry food','Pack ready-to-eat food for 24–48 hours.']
  ];
  return `
    <div class="screen-topbar"><span class="back" onclick="showScreen('home')">←</span><h2>Emergency Kit</h2></div>
    <div class="screen-pad" style="padding-top:0;">
      <div class="kit-hero"><div class="kit-icon">🧰</div><div><b>Flood-ready essentials</b><p>Keep these items packed and accessible before evacuation becomes necessary.</p></div></div>
      <div class="kit-list">${items.map(i=>`<div class="kit-row"><span class="kit-row-icon">${i[0]}</span><div><b>${i[1]}</b><small>${i[2]}</small></div><span class="kit-check">✓</span></div>`).join('')}</div>
      <button class="btn-primary" onclick="toast('Emergency kit checklist saved locally', 'good')">✓ Save checklist</button>
      <button class="btn-outline" onclick="showScreen('sos')" style="margin-top:8px;">🆘 Request rescue</button>
    </div>`;
}

function screenAlerts(){
  return `
    <div class="screen-pad">
      <h2 style="font-family:var(--font-display);font-size:18px;margin:2px 0 12px;">${t('alertsTitle')}</h2>
      <div class="filter-row">
        <span class="chip active">${t('filterAll')}</span><span class="chip">${t('filterWeather')}</span>
        <span class="chip">${t('filterFlood')}</span><span class="chip">${t('filterOther')}</span>
      </div>
      <div class="alert-card red"><div class="ic">⚠️</div><div><h4>${t('alert1Title')}</h4><p>${t('alert1Body')}</p><time>${t('minsAgo')}</time></div></div>
      <div class="alert-card orange"><div class="ic">🌊</div><div><h4>${t('alert2Title')}</h4><p>${t('alert2Body')}</p><time>${t('minsAgo2')}</time></div></div>
      <div class="alert-card blue"><div class="ic">🚧</div><div><h4>${t('alert3Title')}</h4><p>${t('alert3Body')}</p><time>${t('hourAgo')}</time></div></div>
    </div>`;
}

function screenMore(){
  return `
    <div class="screen-pad">
      <h2 style="font-family:var(--font-display);font-size:18px;margin:2px 0 14px;">${t('moreTitle')}</h2>
      <div class="qa-grid" style="margin-bottom:18px;">
        <div class="qa-item" onclick="showScreen('waterlevel')"><span class="ic">📊</span>${t('waterLevelTitle')}</div>
        <div class="qa-item" onclick="showScreen('relief')"><span class="ic">📦</span>${t('reliefTitle')}</div>
        <div class="qa-item" onclick="showScreen('medical')"><span class="ic">🏥</span>${t('medicalTitle')}</div>
        <div class="qa-item" onclick="showScreen('situation')"><span class="ic">🌏</span>${t('situationRoomTitle')}</div>
        <div class="qa-item" onclick="showScreen('nophone')"><span class="ic">📵</span>${t('noPhoneTitle')}</div>
        <div class="qa-item" onclick="showScreen('a11y')"><span class="ic">♿</span>${t('accessibilityTitle')}</div>
      </div>
      <div class="ad-free-badge">✅ ${t('adFreeBadge')}</div>
      <div class="offline-badge">📴 ${t('workOffline')}</div>
    </div>`;
}

function waterTrend(){
  const n=WATER_LEVEL_HISTORY.length;
  if(n<2) return {dir:'steady',delta:0};
  const d=WATER_LEVEL_HISTORY[n-1].level-WATER_LEVEL_HISTORY[n-2].level;
  return {dir:d>0.04?'up':d<-0.04?'down':'steady',delta:d};
}
function setWaterMode(mode){ WATER_SIM_MODE=mode; startWaterSimulation(); showScreen('waterlevel'); }
function nextWaterReading(){
  const last=WATER_LEVEL_HISTORY[WATER_LEVEL_HISTORY.length-1].level;
  let delta=0;
  if(WATER_SIM_MODE==='rising') delta=0.18+Math.random()*0.18;
  else if(WATER_SIM_MODE==='falling') delta=-(0.16+Math.random()*0.16);
  else if(WATER_SIM_MODE==='steady') delta=(Math.random()-.5)*0.06;
  else delta=(Math.random()>.42?1:-1)*(0.06+Math.random()*0.13);
  const level=Math.max(.3,Math.min(5.8,last+delta));
  const now=new Date(); const label=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  WATER_LEVEL_HISTORY=[...WATER_LEVEL_HISTORY.slice(-7),{label,level:Number(level.toFixed(2))}];
  if(document.getElementById('waterChartLive')) showScreen('water');
}
function startWaterSimulation(){
  if(WATER_SIM_TIMER) clearInterval(WATER_SIM_TIMER);
  WATER_SIM_TIMER=setInterval(nextWaterReading,8000);
}
function screenWaterLevel(){
  const max=6,w=390,h=245,pad=38;
  const vals=WATER_LEVEL_HISTORY;
  const pts=vals.map((d,i)=>{const x=pad+(i/(Math.max(1,vals.length-1)))*(w-2*pad); const y=h-pad-(d.level/max)*(h-2*pad); return [x,y];});
  const path=pts.map((p,i)=>(i===0?'M':'L')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const area=path+` L ${pts[pts.length-1][0]},${h-pad} L ${pts[0][0]},${h-pad} Z`;
  const dangerY=h-pad-(DANGER_MARK_M/max)*(h-2*pad);
  const latest=vals[vals.length-1], tr=waterTrend(), isDanger=latest.level>=DANGER_MARK_M;
  const previous=vals.length>1?vals[vals.length-2].level:latest.level;
  const delta=latest.level-previous;
  const forecast=[0.2,0.35,0.28,0.1,-0.12,-0.25].map((d,i)=>Math.max(.4,Math.min(5.8,latest.level+d)));
  const trendText=tr.dir==='up'?`Rising ↑`:tr.dir==='down'?`Falling ↓`:'Stable →';
  return `
    <div class="water-page">
      <div class="water-head">
        <button class="water-back" onclick="showScreen('more')">←</button>
        <div><h2>Water Level</h2><span>${WATER_SENSOR_META.station}</span></div>
        <button class="water-bell" onclick="showScreen('alerts')">🔔<i></i></button>
      </div>
      <div class="water-live-card">
        <div class="water-live-top"><div><span>Current Water Level</span><div class="water-current ${isDanger?'danger':''}">〰 <b>${latest.level.toFixed(2)} m</b></div><strong class="water-direction ${tr.dir}">${trendText}</strong></div><div class="critical-badge ${isDanger?'show':'safe'}">⚠ ${isDanger?'CRITICAL':'MONITORING'}</div></div>
        <div class="water-meta"><span>Danger Mark: <b>${DANGER_MARK_M.toFixed(1)} m</b></span><span>${delta>=0?'+':''}${delta.toFixed(2)} m · Last hour</span><span><i></i> Live data</span></div>
      </div>
      <div class="water-metrics">
        <div><b>${delta>=0?'+':''}${delta.toFixed(2)} m</b><span>Change (last 1 hr)</span></div>
        <div><b>${trendText}</b><span>Trend</span></div>
        <div><b>${DANGER_MARK_M.toFixed(1)} m</b><span>Danger level</span></div>
        <div><b>✓</b><span>Sensor OK</span><small>${WATER_SENSOR_META.id}</small></div>
      </div>
      <div class="time-tabs"><button class="active">6H</button><button>24H</button><button>7D</button><button>30D</button></div>
      <div class="water-chart-card" id="waterChartLive">
        <div class="chart-title"><b>Water Level (m)</b><span>Updated just now</span></div>
        <div class="wl-chart-wrap">
          <svg viewBox="0 0 ${w} ${h}" class="wl-chart advanced" role="img" aria-label="Live water level trend">
            <defs><linearGradient id="waterFillV2" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#2f7fdb" stop-opacity=".25"/><stop offset="100%" stop-color="#2f7fdb" stop-opacity=".02"/></linearGradient></defs>
            ${[1,2,3,4,5].map(v=>{const y=h-pad-(v/max)*(h-2*pad);return `<line x1="${pad}" y1="${y}" x2="${w-pad}" y2="${y}" stroke="#e7eeeb" stroke-width="1"/><text x="8" y="${y+3}" font-size="8" fill="#71817d">${v}.0</text>`}).join('')}
            <line x1="${pad}" y1="${dangerY}" x2="${w-pad}" y2="${dangerY}" stroke="#ef3e36" stroke-width="2" stroke-dasharray="6 5"/>
            <rect x="${w-135}" y="${dangerY-18}" width="118" height="18" rx="8" fill="#ef3e36"/><text x="${w-76}" y="${dangerY-6}" text-anchor="middle" font-size="8" fill="#fff" font-weight="700">Danger Mark (4.0 m)</text>
            <path d="${area}" fill="url(#waterFillV2)"/>
            <path d="${path}" fill="none" stroke="#1671d9" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
            ${pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${i===pts.length-1?5:3.3}" fill="${i===pts.length-1&&isDanger?'#ef3e36':'#1671d9'}" stroke="#fff" stroke-width="1.5"/>`).join('')}
            <g><rect x="${Math.max(pts[pts.length-1][0]-46,70)}" y="${Math.max(pts[pts.length-1][1]-48,8)}" width="74" height="30" rx="8" fill="#142b31"/><text x="${Math.max(pts[pts.length-1][0]-9,107)}" y="${Math.max(pts[pts.length-1][1]-29,27)}" text-anchor="middle" font-size="10" fill="#fff" font-weight="700">${latest.level.toFixed(1)} m</text><text x="${Math.max(pts[pts.length-1][0]-9,107)}" y="${Math.max(pts[pts.length-1][1]-16,40)}" text-anchor="middle" font-size="7.5" fill="#b9c8c6">${latest.label}</text></g>
          </svg>
          <div class="wl-axis">${vals.map(d=>`<span>${d.label}</span>`).join('')}</div>
        </div>
        <div class="chart-legend"><span><i class="blue"></i>Water Level (m)</span><span><i class="redline"></i>Danger Mark</span><span><i class="forecast"></i>Forecast (Next 6h)</span></div>
      </div>
      <div class="water-alert ${isDanger?'danger':'safe'}"><div>⚠</div><div><b>${isDanger?'Water level has crossed the danger mark.':'Water level is below the danger mark.'}</b><span>${isDanger?'Low-lying areas may experience severe flooding.':'Monitoring continues and alerts will update automatically.'}</span></div></div>
      <div class="forecast-card"><div class="forecast-head"><b>◷ Forecast (Next 6 Hours)</b><span>Live model</span></div><div class="forecast-row">${forecast.map((v,i)=>`<div class="forecast-cell ${i===0?'selected':''}"><span>${3+i} PM</span><b>${v.toFixed(1)}m</b><small>${i<4?'↗':'↘'}</small></div>`).join('')}</div></div>
      <div class="water-insight-grid">
        <div class="water-insight"><span class="label">Rate of change</span><b>${delta>=0?'+':''}${(delta*60).toFixed(1)} cm/hr</b><p>Based on the latest sensor readings.</p></div>
        <div class="water-insight"><span class="label">Headroom to danger</span><b>${Math.max(0,DANGER_MARK_M-latest.level).toFixed(2)} m</b><p>${isDanger?'Threshold exceeded.':'Distance below the danger mark.'}</p></div>
        <div class="water-insight"><span class="label">Rainfall signal</span><b>Heavy · 72 mm</b><p>Demo rainfall feed for the last 6 hours.</p></div>
        <div class="water-insight"><span class="label">Sensor health</span><b>98% · Healthy</b><p>HG-KOL-01 reporting every 8 seconds.</p></div>
      </div>
      <div class="water-action-card"><b>What this means</b><p>${isDanger?'Water has crossed the configured danger mark. Low-lying zones should prepare for evacuation and rescue dispatch.':'Water is being monitored continuously. The system will escalate when the configured threshold is crossed.'}</p><div class="water-action-row"><button onclick="showScreen('map')">🗺 Affected areas</button><button onclick="showScreen('alerts')">🔔 Alert settings</button><button onclick="showScreen('shelters')">🏠 Shelters</button></div></div>
      <div class="water-actions"><button onclick="showScreen('map')">🗺 View Affected Areas</button><button class="primary" onclick="showScreen('alerts')">🔔 Get Alerts</button></div>
      <div class="wl-controls compact"><button class="danger" onclick="setWaterMode('rising')">🌧 Simulate rise</button><button class="primary" onclick="setWaterMode('auto')">⚡ Auto sensor</button><button onclick="setWaterMode('falling')">☀ Simulate fall</button></div>
      <div class="wl-sensor-row"><span>Gauge ID <b>${WATER_SENSOR_META.id}</b></span><span>Updates every <b>8 sec</b></span><span>Mode <b>${WATER_SIM_MODE.toUpperCase()}</b></span></div>
    </div>`;
}
startWaterSimulation();

function screenRelief(){
  return `
    <div class="screen-topbar"><span class="back" onclick="showScreen('more')">←</span><h2>${t('reliefTitle')}</h2></div>
    <div class="screen-pad" style="padding-top:0;">
      <p style="font-size:12px;color:var(--ink-600);margin:0 0 14px;">${t('reliefDesc')}</p>
      <div id="reliefConfirm"></div>
      ${RELIEF_CATEGORIES.map(c=>`
        <div class="relief-card">
          <div class="relief-ic">${c.icon}</div>
          <div class="relief-body">
            <h4>${c.name}</h4>
            <p>${c.available} ${c.unit} nearby</p>
          </div>
          <button class="relief-btn" onclick="requestSupply('${c.key}','${c.name}')">${t('requestSupplies')}</button>
        </div>`).join('')}
      <div class="qa-title" style="margin-top:16px;">${t('foodSupplyTitle')}</div>
      ${FOOD_SUPPLY_POINTS.map(f=>`
        <div class="shelter-card">
          <div class="top"><h3>${f.name}</h3><span class="dist">${f.dist}</span></div>
          <div class="caprow">${f.status} · Stock: ${f.stock}</div>
        </div>`).join('')}
    </div>`;
}

function screenMedical(){
  return `
    <div class="screen-topbar"><span class="back" onclick="showScreen('more')">←</span><h2>${t('medicalTitle')}</h2></div>
    <div class="screen-pad" style="padding-top:0;">
      ${MEDICAL_FACILITIES.map(m=>`
        <div class="medical-card">
          <div class="top"><h3>${m.name}</h3><span class="dist">${m.dist}</span></div>
          <div class="caprow"><span class="open247-pill">${t('open247')}</span> · ${m.beds} ${t('bedsAvailable')}</div>
          <a class="btn-primary call-btn" href="tel:${m.phone}">${t('callNow')} · ${m.phone}</a>
        </div>`).join('')}
    </div>`;
}

function screenSituation(){
  return `
    <div class="screen-topbar"><span class="back" onclick="showScreen('more')">←</span><h2>${t('situationRoomTitle')}</h2></div>
    <div class="screen-pad" style="padding-top:0;">
      <p style="font-size:12px;color:var(--ink-600);margin:0 0 14px;">${t('situationRoomDesc')}</p>
      ${SITUATION_FEED.map(s=>`
        <div class="situation-item sev-${s.severity}">
          <div class="sev-dot"></div>
          <div class="sit-body">
            <div class="sit-top"><b>${s.region}</b><span class="sit-hazard">${s.hazard}</span></div>
            <p>${s.update}</p>
            <time>${s.mins} ${t('updatedMinsAgo')}</time>
          </div>
        </div>`).join('')}
    </div>`;
}

function screenNoPhone(){
  return `
    <div class="screen-topbar"><span class="back" onclick="showScreen('more')">←</span><h2>${t('noPhoneTitle')}</h2></div>
    <div class="screen-pad" style="padding-top:0;">
      <div class="nophone-card">
        <div class="nophone-ic">📢</div>
        <p>${t('noPhoneDesc')}</p>
      </div>
    </div>`;
}

function screenA11y(){
  const p = getA11yPrefs();
  return `
    <div class="screen-topbar"><span class="back" onclick="showScreen('more')">←</span><h2>${t('accessibilityTitle')}</h2></div>
    <div class="screen-pad" style="padding-top:0;">
      <div class="form-row"><div class="toggle-row"><label style="margin:0;">${t('largeText')}</label>
        <div class="toggle ${p.largeText?'on':''}" id="btnLargeText" onclick="toggleLargeText()"></div></div></div>
      <div class="form-row"><div class="toggle-row"><label style="margin:0;">${t('highContrast')}</label>
        <div class="toggle ${p.highContrast?'on':''}" id="btnHighContrast" onclick="toggleHighContrast()"></div></div></div>
      <button class="btn-outline" onclick="speakCurrentScreen()">🔊 ${t('readAloud')}</button>
    </div>`;
}

function requestSupply(key, name){
  State.reliefRequests = State.reliefRequests || [];
  State.reliefRequests.unshift({ id:'REL'+Math.floor(Math.random()*90000+10000), item:name, key, qty:1, ts:Date.now() });
  const box = document.getElementById('reliefConfirm');
  if (box) box.innerHTML = `<div class="relief-confirm">${t('requestSent')} — ${name}</div>`;
  if (typeof renderAdmin === 'function') renderAdmin();
  toast(t('requestSent'), 'good');
}

const SCREEN_RENDERERS = {
  onboard: screenOnboard, home: screenHome, map: screenMap, route: screenRoute,
  shelters: screenShelters, sos: screenSOS, submitted: screenSubmitted, alerts: screenAlerts, emergencykit: screenEmergencyKit,
  more: screenMore, waterlevel: screenWaterLevel, relief: screenRelief, medical: screenMedical,
  situation: screenSituation, nophone: screenNoPhone, a11y: screenA11y
};

function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

let currentScreen = 'onboard';
function showScreen(name){
  currentScreen = name;
  document.getElementById('phone-screen').innerHTML = SCREEN_RENDERERS[name]();
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const navMap = { home:'home', map:'map', shelters:'shelters', alerts:'alerts', sos:'sos', more:'more',
    waterlevel:'more', relief:'more', medical:'more', situation:'more', nophone:'more', a11y:'more', emergencykit:'more' };
  const btn = document.querySelector(`.nav-item[data-screen="${navMap[name]||''}"]`);
  if (btn) btn.classList.add('active');
  document.getElementById('phone-screen').scrollTop = 0;
  if (name==='map') setTimeout(()=>{ if(citizenLeafletMap) citizenLeafletMap.invalidateSize(); },180);
}
function renderCurrentCitizenScreen(){
  if (document.getElementById('phone-screen')) showScreen(currentScreen);
}
function adjustForm(key, delta){
  form[key] = Math.max(0, form[key] + delta);
  document.getElementById('f-'+key).textContent = form[key];
}
function toggleMedical(){
  form.medical = !form.medical;
  document.getElementById('f-medical-toggle').classList.toggle('on', form.medical);
}
function cycleRisk(){
  const order = ['low','medium','high','critical'];
  setRisk(order[(order.indexOf(State.risk)+1) % order.length]);
}
function switchToAdminForSos(){
  document.querySelector('.tab-btn[data-view="admin-view"]').click();
  toast('Showing live Admin view — new request at top of priority list', 'good');
}
