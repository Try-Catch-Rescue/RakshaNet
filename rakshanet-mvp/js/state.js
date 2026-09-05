/* ==========================================================================
   state.js — Central app state + mutation actions.
   In-memory only for this MVP (per the "no backend yet" scope). Every
   action below is the seam where a real API call would go in v2:
     setRisk()        -> GET /api/risk?location=...
     submitSOS()       -> POST /api/sos
     dispatchTeam()     -> POST /api/rescue-teams/:id/dispatch
     generateRandomSOS() -> (demo-only, simulates concurrent citizen load)
   ========================================================================== */

const State = seedState();
let sosCounter = 78946;
const form = { people:4, children:1, elderly:1, medical:true, waterLevelKey:'waterChest', note:'We are stuck in our house. Need immediate help.' };

function setRisk(lvl){
  State.risk = lvl;
  document.querySelectorAll('#riskBtns button').forEach(b=>b.classList.toggle('active', b.dataset.lvl===lvl));
  const canvas = document.querySelector('.map-canvas');
  if(canvas){
    canvas.setAttribute('data-analyzing', t('analyzing'));
    canvas.classList.add('analyzing');
    setTimeout(()=>{ canvas.classList.remove('analyzing'); canvas.style.background = RISK_META[lvl].mapGrad; }, 700);
  }
  renderCurrentCitizenScreen();
  renderAdmin();
  toast('Risk level updated → ' + RISK_META[lvl].key.toUpperCase(), 'good');
}

function submitSOS(){
  const { score, severity, breakdown } = computeScore(form);
  const id = 'SOS' + (sosCounter++);
  const label = form.medical ? 'Medical Emergency' : (form.children > 0 ? 'Child at Risk' : 'Flood Emergency');
  const rec = { id, labelKey:label, people:form.people, children:form.children, elderly:form.elderly,
    medical:form.medical, waterLevelKey:form.waterLevelKey, score, severity, assigned:false,
    icon:severityIcon(severity), offlineQueued: !navigator.onLine };

  if (navigator.onLine){
    State.sosRequests.unshift(rec);
    // reflect load on nearest shelter capacity — shows the system reacting live
    const s = State.shelters[Math.floor(Math.random()*State.shelters.length)];
    s.occ = Math.min(s.cap, s.occ + Math.ceil(form.people/2));
    renderAdmin();
    toast('New SOS ' + id + ' received — priority score ' + score, severity==='critical' ? 'bad' : 'good');
  } else {
    queueSosOffline(rec);
    toast('📴 No connection — SOS saved on this device and will send automatically once online', 'bad');
  }

  window.__lastSubmission = { id, score, severity, breakdown };
  updateOfflineBanner();
  showScreen('submitted');
}

function dispatchTeam(sosId){
  const req = State.sosRequests.find(r=>r.id===sosId);
  const team = State.teams.find(t=>!t.busy);
  if(!req) return;
  if(!team){ toast('No available teams — all rescue units are deployed', 'bad'); return; }
  req.assigned = true;
  team.busy = true;
  team.status = 'En route';
  renderAdmin();
  toast(team.name + ' dispatched to ' + req.id, 'good');
}

function generateRandomSOS(){
  const f = {
    people: 1 + Math.floor(Math.random()*6),
    children: Math.random()>0.5 ? Math.floor(Math.random()*3) : 0,
    elderly: Math.random()>0.5 ? Math.floor(Math.random()*2) : 0,
    medical: Math.random()>0.7,
    waterLevelKey: WATER_LEVEL_KEYS[Math.floor(Math.random()*WATER_LEVEL_KEYS.length)]
  };
  const { score, severity } = computeScore(f);
  const id = 'SOS' + (sosCounter++);
  const label = RANDOM_SOS_LABELS[Math.floor(Math.random()*RANDOM_SOS_LABELS.length)];
  State.sosRequests.unshift({ id, labelKey:label, ...f, score, severity, assigned:false, icon:severityIcon(severity) });
  renderAdmin();
  toast('📡 Incoming SOS ' + id + ' — score ' + score, severity==='critical' ? 'bad' : 'good');
}

function resetDemo(){
  const fresh = seedState();
  State.sosRequests = fresh.sosRequests;
  State.teams = fresh.teams;
  State.shelters = fresh.shelters;
  State.reliefRequests = fresh.reliefRequests;
  setRisk('high');
  renderAdmin();
  toast('Demo reset', 'good');
}

function toast(msg, kind){
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || 'good');
  el.textContent = msg;
  document.getElementById('toastWrap').appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(),300); }, 2600);
}
