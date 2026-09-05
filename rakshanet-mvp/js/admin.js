/* ==========================================================================
   admin.js — Rescue/Admin command-center: a real multi-page dashboard.
   Sidebar nav (index.html) calls setAdminPage('map' | 'sos' | 'teams' ...),
   which swaps the content of #adminMain — same "one function per page"
   pattern as citizen.js's SCREEN_RENDERERS.

   Live map uses real Leaflet + OpenStreetMap tiles (no API key needed).
   If the tile CDN can't be reached (no internet), it shows an honest
   offline fallback instead of pretending to have a map.
   ========================================================================== */

const KOLKATA = [22.5726, 88.3639];

const ADMIN_PAGE_TITLES = {
  dashboard:'Dashboard', map:'Live Map', incidents:'Incidents', sos:'SOS Requests',
  teams:'Rescue Teams', shelters:'Shelters', roads:'Roads & Blocks', alerts:'Alerts',
  reports:'Reports', settings:'Settings'
};
const ADMIN_PAGE_SUBS = {
  dashboard:'Monitor. Prioritize. Respond. — Kolkata Metropolitan Region',
  map:'Real-time incident, shelter and rescue-team positions',
  incidents:'All active flood incidents, newest first',
  sos:'Every citizen SOS request, AI-ranked by priority score',
  teams:'Rescue team roster and live status',
  shelters:'Capacity and occupancy across all registered shelters',
  roads:'Roads currently blocked or restricted by flooding',
  alerts:'System and weather alerts for the control room',
  reports:'Summary statistics for this incident window',
  settings:'Control-room preferences'
};

let currentAdminPage = 'dashboard';
const leafletMaps = {};

function setAdminPage(page){
  currentAdminPage = page;
  document.querySelectorAll('.admin-nav a').forEach(a=>a.classList.toggle('active', a.dataset.page===page));
  document.getElementById('adminPageTitle').textContent = ADMIN_PAGE_TITLES[page];
  document.getElementById('adminPageSub').textContent = ADMIN_PAGE_SUBS[page];
  renderAdminPage();
}

// Called by state.js/citizen.js whenever data changes (submitSOS, dispatchTeam,
// setRisk, generateRandomSOS, resetDemo...) — re-renders whichever page is open.
function renderAdmin(){ renderAdminPage(); }

function renderAdminPage(){
  const root = document.getElementById('adminMain');
  if (!root) return; // admin view not yet in DOM
  root.innerHTML = ADMIN_PAGE_RENDERERS[currentAdminPage]();
  document.getElementById('navSosCount').textContent = State.sosRequests.filter(r=>!r.assigned).length;
  requestAnimationFrame(() => { if (ADMIN_PAGE_INIT[currentAdminPage]) ADMIN_PAGE_INIT[currentAdminPage](); });
}

/* ---------------- Leaflet real-map helpers ---------------- */

function destroyMap(containerId){
  if (leafletMaps[containerId]) { leafletMaps[containerId].remove(); delete leafletMaps[containerId]; }
}

function createDisasterMap(containerId, zoom){
  const el = document.getElementById(containerId);
  if (!el) return null;
  if (typeof L === 'undefined') { el.innerHTML = offlineMapNotice(); return null; }
  destroyMap(containerId);
  let map;
  try {
    map = L.map(containerId, { attributionControl:true }).setView(KOLKATA, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  } catch(e){ el.innerHTML = offlineMapNotice(); return null; }
  leafletMaps[containerId] = map;
  populateDisasterMap(map);
  setTimeout(()=>map.invalidateSize(), 80);
  return map;
}

function offlineMapNotice(){
  return `<div class="map-offline-notice">📡 Map tiles need an internet connection to load.<br><span>The admin control room normally has connectivity — the citizen app stays fully usable offline regardless.</span></div>`;
}

function emojiIcon(emoji, size){
  size = size || 26;
  return L.divIcon({ html:`<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45));">${emoji}</div>`, className:'emoji-marker', iconSize:[size,size], iconAnchor:[size/2, size] });
}

function hashJitter(id, spread){
  spread = spread || 0.05;
  let h = 0;
  for (let i=0;i<id.length;i++) h = (h*31 + id.charCodeAt(i)) >>> 0;
  const rx = ((h % 1000)/1000 - 0.5) * spread;
  const ry = (((Math.floor(h/1000)) % 1000)/1000 - 0.5) * spread;
  return [rx, ry];
}

function populateDisasterMap(map){
  L.marker(KOLKATA, {icon: emojiIcon('📍',24)}).addTo(map).bindPopup('<b>You are here</b><br>Control Room HQ');

  const rm = RISK_META[State.risk];
  L.circle(KOLKATA, { radius: 4000, color: rm.color, fillColor: rm.color, fillOpacity: 0.18, weight:1.5 }).addTo(map)
    .bindPopup('Current risk zone: <b>' + State.risk.toUpperCase() + '</b>');

  State.shelters.forEach(s=>{
    L.marker([s.lat, s.lng], {icon: emojiIcon('🏫',22)}).addTo(map)
      .bindPopup(`<b>${s.name}</b><br>${s.occ}/${s.cap} occupied${s.occ>=s.cap?' — FULL':''}`);
  });
  State.teams.forEach(tm=>{
    L.marker([tm.lat, tm.lng], {icon: emojiIcon('🚑',22)}).addTo(map)
      .bindPopup(`<b>${tm.name}</b><br>${tm.status} · ${tm.dist}`);
  });
  State.sosRequests.forEach(r=>{
    const [dx,dy] = hashJitter(r.id);
    const icon = r.severity==='critical'?'🔴':r.severity==='high'?'🟠':r.severity==='medium'?'🟡':'🟢';
    L.marker([KOLKATA[0]+dx, KOLKATA[1]+dy], {icon: emojiIcon(icon,18)}).addTo(map)
      .bindPopup(`<b>#${r.id}</b> · ${r.labelKey}<br>Priority score: <b>${r.score}</b>${r.assigned?'<br>✓ Team dispatched':''}`);
  });
  BLOCKED_ROADS.forEach(rd=>{
    L.marker([rd.lat, rd.lng], {icon: emojiIcon('🚧',20)}).addTo(map).bindPopup(`<b>${rd.name}</b><br>${rd.status}`);
  });
}

/* ---------------- shared bits ---------------- */

function statGridHTML(){
  const liveCritical = State.sosRequests.filter(r=>r.severity==='critical').length;
  const liveHigh = State.sosRequests.filter(r=>r.severity==='high').length;
  const liveMedium = State.sosRequests.filter(r=>r.severity==='medium'||r.severity==='low').length;
  const total = State.seed.total + State.sosRequests.length;
  const critical = State.seed.critical + liveCritical;
  const high = State.seed.high + liveHigh;
  const medium = State.seed.medium + liveMedium;
  const availableTeams = State.teams.filter(t=>!t.busy).length;
  return `
    <div class="stat-grid">
      <div class="stat-card"><div class="lbl">Total Incidents</div><div class="num">${total}</div></div>
      <div class="stat-card crit"><div class="lbl">🔴 Critical</div><div class="num">${critical}</div></div>
      <div class="stat-card high"><div class="lbl">🟠 High</div><div class="num">${high}</div></div>
      <div class="stat-card med"><div class="lbl">🟡 Medium</div><div class="num">${medium}</div></div>
      <div class="stat-card teams"><div class="lbl">🚑 Teams Available</div><div class="num">${availableTeams}/${State.teams.length}</div></div>
    </div>`;
}

function sosListHTML(list){
  const sorted = [...list].sort((a,b)=> (a.assigned - b.assigned) || (b.score - a.score));
  return sorted.length ? sorted.map(r=>`
    <div class="sos-item sev-${r.severity} ${r.assigned?'assigned':''}">
      <div class="sos-badge">${r.icon}</div>
      <div class="sos-body">
        <span class="id">#${r.id}${r.offlineQueued?' · 📴 queued offline':''}</span>
        <h4>${r.labelKey}</h4>
        <p>${r.people} people · ${t(r.waterLevelKey)}${r.medical?' · Medical':''}</p>
        ${r.assigned ? '<span style="font-size:9.5px;color:#7fe0ab;font-weight:700;">✓ Team dispatched</span>' : `<button class="dispatch-btn" onclick="dispatchTeam('${r.id}')">Dispatch nearest team</button>`}
      </div>
      <div class="sos-score">${r.score}</div>
    </div>`).join('') : `<div class="empty-note">No active SOS requests</div>`;
}

function teamListHTML(){
  return State.teams.map(tm=>`
    <div class="team-item">
      <div class="ic">🚑</div>
      <div><h4>${tm.name}</h4><div class="status ${tm.busy?'on':''}">● ${tm.status}</div></div>
      <div class="dist">${tm.dist}</div>
    </div>`).join('');
}

function shelterDonutBits(){
  const availCount = State.shelters.filter(s=>s.occ < s.cap*0.8).length;
  const partialCount = State.shelters.filter(s=>s.occ >= s.cap*0.8 && s.occ < s.cap).length;
  const fullCount = State.shelters.filter(s=>s.occ >= s.cap).length;
  const n = State.shelters.length;
  const pctAvail = Math.round(availCount/n*100), pctPartial = Math.round(partialCount/n*100), pctFull = 100-pctAvail-pctPartial;
  return { availCount, partialCount, fullCount, pctAvail, pctPartial, pctFull };
}

/* ---------------- page renderers ---------------- */

function pageDashboard(){
  const d = shelterDonutBits();
  return `
    ${statGridHTML()}
    <div class="admin-grid">
      <div class="panel">
        <div class="panel-head"><h3>Live Disaster Map</h3><span class="count">${State.risk.toUpperCase()} RISK</span></div>
        <div class="admin-map" id="adminMapDash"></div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Top Priority SOS Requests</h3><span class="count">AI-ranked</span></div>
        <div>${sosListHTML(State.sosRequests)}</div>
      </div>
    </div>
    <div class="bottom-grid">
      <div class="panel">
        <div class="panel-head"><h3>Rescue Teams</h3></div>
        <div>${teamListHTML()}</div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Shelter &amp; Road Status</h3></div>
        <div class="donut-row" style="margin-bottom:16px;">
          <div class="donut" style="background:conic-gradient(#22a862 0 ${d.pctAvail}%, #e08b18 ${d.pctAvail}% ${d.pctAvail+d.pctPartial}%, #d3352d ${d.pctAvail+d.pctPartial}% 100%);"></div>
          <div class="donut-legend">
            <div class="row"><span class="sw" style="background:#22a862"></span>Available <b>${d.availCount} (${d.pctAvail}%)</b></div>
            <div class="row"><span class="sw" style="background:#e08b18"></span>Partially filled <b>${d.partialCount} (${d.pctPartial}%)</b></div>
            <div class="row"><span class="sw" style="background:#d3352d"></span>Full <b>${d.fullCount} (${d.pctFull}%)</b></div>
          </div>
        </div>
        <div class="donut-row">
          <div class="donut" style="background:conic-gradient(#22a862 0 58%, #d3352d 58% 84%, #d0a400 84% 100%);"></div>
          <div class="donut-legend">
            <div class="row"><span class="sw" style="background:#22a862"></span>Open <b>70 (58%)</b></div>
            <div class="row"><span class="sw" style="background:#d3352d"></span>Blocked <b>${BLOCKED_ROADS.length} (26%)</b></div>
            <div class="row"><span class="sw" style="background:#d0a400"></span>Risky <b>19 (16%)</b></div>
          </div>
        </div>
      </div>
    </div>
    <div class="admin-grid" style="grid-template-columns:1fr 1fr 1fr;">
      <div class="panel">
        <div class="panel-head"><h3>📦 Relief Requests</h3><span class="count">${(State.reliefRequests||[]).length}</span></div>
        <div>${(State.reliefRequests||[]).length ? State.reliefRequests.map(r=>`<div class="team-item"><div class="ic">📦</div><div><h4>${r.item}</h4><div class="status">#${r.id}</div></div></div>`).join('') : '<div class="empty-note">No relief requests yet</div>'}</div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>🍚 Food Supply Chain</h3></div>
        <div>${FOOD_SUPPLY_POINTS.map(f=>`<div class="team-item"><div class="ic">🍚</div><div><h4>${f.name}</h4><div class="status ${f.stock==='High'?'on':''}">${f.status}</div></div><div class="dist">${f.dist}</div></div>`).join('')}</div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>🌏 Live Disaster Feed</h3></div>
        <div>${SITUATION_FEED.map(s=>`<div class="team-item"><div class="ic">${s.severity==='critical'?'🔴':s.severity==='high'?'🟠':s.severity==='medium'?'🟡':'🟢'}</div><div><h4>${s.region}</h4><div class="status">${s.hazard} · ${s.update}</div></div><div class="dist">${s.mins}m</div></div>`).join('')}</div>
      </div>
    </div>`;
}

function pageMap(){
  return `
    <div class="panel">
      <div class="panel-head"><h3>Live Disaster Map — full view</h3><span class="count">${State.risk.toUpperCase()} RISK</span></div>
      <div class="admin-map admin-map-full" id="adminMapFull"></div>
      <div class="map-legend-static">
        <span><i style="background:#d3352d"></i>Critical SOS</span>
        <span><i style="background:#e08b18"></i>High SOS</span>
        <span><i style="background:#d0a400"></i>Medium SOS</span>
        <span><i style="background:#22a862"></i>Low SOS</span>
        <span>🏫 Shelter</span><span>🚑 Rescue team</span><span>🚧 Blocked road</span>
      </div>
    </div>`;
}

function pageIncidents(){
  return `<div class="panel"><div class="panel-head"><h3>All Incidents</h3><span class="count">${State.sosRequests.length}</span></div>${sosListHTML(State.sosRequests)}</div>`;
}

function pageSos(){
  return `<div class="panel"><div class="panel-head"><h3>SOS Requests</h3><span class="count">${State.sosRequests.filter(r=>!r.assigned).length} pending</span></div>${sosListHTML(State.sosRequests)}</div>`;
}

function pageTeams(){
  return `
    <div class="admin-grid">
      <div class="panel"><div class="panel-head"><h3>Team Roster</h3></div><div>${teamListHTML()}</div></div>
      <div class="panel"><div class="panel-head"><h3>Team Locations</h3></div><div class="admin-map" id="adminMapTeams"></div></div>
    </div>`;
}

function pageShelters(){
  return `
    <div class="admin-grid">
      <div class="panel"><div class="panel-head"><h3>Shelters</h3></div>
        ${State.shelters.map(s=>{
          const pct = Math.round(s.occ/s.cap*100); const full = s.occ>=s.cap;
          return `<div class="shelter-card">
            <div class="top"><h3>${s.name}</h3><span class="dist">${pct}% full</span></div>
            <div class="caprow">Capacity ${s.cap} · Occupied ${s.occ}</div>
            <div class="shelter-bar"><div class="fill" style="width:${pct}%;background:${full?'#d3352d':'#22a862'};"></div></div>
            <span class="status-pill ${full?'full':'avail'}">${full?'Full':'Available'}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="panel"><div class="panel-head"><h3>Shelter Locations</h3></div><div class="admin-map" id="adminMapShelters"></div></div>
    </div>`;
}

function pageRoads(){
  return `
    <div class="admin-grid">
      <div class="panel"><div class="panel-head"><h3>Blocked / Restricted Roads</h3><span class="count">${BLOCKED_ROADS.length}</span></div>
        ${BLOCKED_ROADS.map(r=>`<div class="shelter-card"><div class="top"><h3>${r.name}</h3><span class="dist">${r.dist}</span></div><div class="caprow">${r.status}</div></div>`).join('')}
      </div>
      <div class="panel"><div class="panel-head"><h3>Road Map</h3></div><div class="admin-map" id="adminMapRoads"></div></div>
    </div>`;
}

function pageAlerts(){
  return `<div class="panel"><div class="panel-head"><h3>Alerts</h3><span class="count">${ADMIN_ALERTS.length}</span></div>
    ${ADMIN_ALERTS.map(a=>`
      <div class="alert-card ${a.severity==='critical'||a.severity==='high'?'red':'orange'}">
        <div class="ic">⚠️</div><div><h4>${a.title}</h4><p>${a.body}</p><time>${a.mins} min ago</time></div>
      </div>`).join('')}
  </div>`;
}

function pageReports(){
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Today'];
  const vals = [14,22,18,31,27,45, State.seed.total + State.sosRequests.length];
  const max = Math.max(...vals);
  const resolved = State.sosRequests.filter(r=>r.assigned).length;
  const pending = State.sosRequests.filter(r=>!r.assigned).length;
  return `
    <div class="admin-grid">
      <div class="panel">
        <div class="panel-head"><h3>Incidents — last 7 days</h3></div>
        <div class="bar-chart">
          ${vals.map((v,i)=>`<div class="bar-col"><div class="bar" style="height:${Math.round(v/max*100)}%;"></div><span>${days[i]}</span></div>`).join('')}
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>SOS Response Summary</h3></div>
        <div class="report-stat"><span>Resolved / dispatched</span><b style="color:#7fe0ab;">${resolved}</b></div>
        <div class="report-stat"><span>Pending</span><b style="color:#f6b673;">${pending}</b></div>
        <div class="report-stat"><span>Avg. AI priority score</span><b>${State.sosRequests.length ? Math.round(State.sosRequests.reduce((a,r)=>a+r.score,0)/State.sosRequests.length) : 0}</b></div>
        <div class="report-stat"><span>Relief requests</span><b>${(State.reliefRequests||[]).length}</b></div>
        <div class="report-stat"><span>Est. avg dispatch time</span><b>6.4 min</b></div>
      </div>
    </div>`;
}

function pageSettings(){
  return `
    <div class="panel" style="max-width:420px;">
      <div class="panel-head"><h3>Control Room Settings</h3></div>
      <div class="settings-row"><span>Sound alerts for new critical SOS</span><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
      <div class="settings-row"><span>Auto-refresh dashboard</span><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
      <div class="settings-row"><span>Show offline-queued SOS badges</span><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
      <button class="demo-action reset" style="margin-top:14px;width:100%;" onclick="resetDemo()">↺ Reset demo data</button>
    </div>`;
}

const ADMIN_PAGE_RENDERERS = {
  dashboard: pageDashboard, map: pageMap, incidents: pageIncidents, sos: pageSos,
  teams: pageTeams, shelters: pageShelters, roads: pageRoads, alerts: pageAlerts,
  reports: pageReports, settings: pageSettings
};

const ADMIN_PAGE_INIT = {
  dashboard: () => createDisasterMap('adminMapDash', 12),
  map:       () => createDisasterMap('adminMapFull', 13),
  teams:     () => createDisasterMap('adminMapTeams', 12),
  shelters:  () => createDisasterMap('adminMapShelters', 12),
  roads:     () => createDisasterMap('adminMapRoads', 12)
};
