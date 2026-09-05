/* ==========================================================================
   app.js — Bootstrap: view switching, demo-control dock wiring, init.
   ========================================================================== */

function switchView(btn){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.view).classList.add('active');
  if (btn.dataset.view === 'admin-view') renderAdmin();
}

function toggleDock(){
  document.getElementById('demoDock').classList.toggle('collapsed');
}

// Robust interaction fallback: any element declaring data-screen remains clickable
// even if an inline handler is lost during a screen re-render.
document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-screen]');
  if (target && typeof showScreen === 'function') {
    event.preventDefault();
    showScreen(target.dataset.screen);
  }
});
document.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.qa-item[role=button]')) {
    event.preventDefault();
    event.target.click();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#riskBtns button').forEach(b=>b.classList.toggle('active', b.dataset.lvl===State.risk));
  applyA11yPrefs();
  showScreen('onboard');
  renderAdmin();
  updateOfflineBanner();
  registerServiceWorker();
  if (navigator.onLine) syncOfflineQueue();
});


let judgeDemoRunning = false;
function startJudgeDemo(){
  if(judgeDemoRunning) return;
  judgeDemoRunning = true;
  const btn = document.querySelector('.judge-demo-btn');
  if(btn){ btn.disabled = true; btn.textContent = '● Simulation running'; }
  const story = document.querySelectorAll('.story-step');
  const activate = (i) => story.forEach((x,n)=>x.classList.toggle('active', n===i));
  toast('Judge Demo started — simulating a live flood incident', 'good');
  activate(0);
  setRisk('medium');
  setTimeout(()=>{ activate(1); setRisk('high'); generateRandomSOS(); }, 1800);
  setTimeout(()=>{ activate(2); generateRandomSOS(); }, 3600);
  setTimeout(()=>{ activate(3); document.querySelector('.tab-btn[data-view="admin-view"]').click(); toast('Command Center: prioritize the highest-risk SOS and dispatch a team', 'good'); }, 5400);
  setTimeout(()=>{
    judgeDemoRunning = false;
    if(btn){ btn.disabled = false; btn.textContent = '▶ Judge Demo'; }
  }, 7600);
}
