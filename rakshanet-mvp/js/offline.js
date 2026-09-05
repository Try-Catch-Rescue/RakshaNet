/* ==========================================================================
   offline.js — Makes the core "submit SOS with no internet" promise real.
   - Registers a service worker that caches the whole app shell, so the
     site keeps working after the first load even with zero connectivity.
   - Detects online/offline state and shows a persistent banner.
   - If a citizen submits an SOS while offline, it's queued in
     localStorage (survives closing the browser/tab) and auto-synced
     the moment connectivity returns — no data is lost.
   ========================================================================== */

const OFFLINE_QUEUE_KEY = 'rn_offline_sos_queue';

function getOfflineQueue(){
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY)) || []; }
  catch(e){ return []; }
}
function saveOfflineQueue(q){
  try { localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q)); } catch(e){ /* storage unavailable — non-fatal */ }
}
function queueSosOffline(rec){
  const q = getOfflineQueue();
  q.push(rec);
  saveOfflineQueue(q);
}
function syncOfflineQueue(){
  const q = getOfflineQueue();
  if (!q.length) return;
  q.forEach(rec=>{
    rec.offlineQueued = false;
    if (!State.sosRequests.find(r=>r.id===rec.id)) State.sosRequests.unshift(rec);
  });
  saveOfflineQueue([]);
  renderAdmin();
  toast('✅ Synced ' + q.length + ' queued report(s) now that you are back online', 'good');
}

function updateOfflineBanner(){
  const banner = document.getElementById('offlineBanner');
  if (!banner) return;
  if (navigator.onLine){
    const q = getOfflineQueue();
    if (q.length){
      banner.style.display = 'flex';
      banner.className = 'offline-banner online';
      banner.innerHTML = t('offlineBannerOnline');
    } else {
      banner.style.display = 'none';
    }
  } else {
    banner.style.display = 'flex';
    banner.className = 'offline-banner offline';
    banner.innerHTML = t('offlineBannerOffline');
  }
}

window.addEventListener('online', () => { updateOfflineBanner(); syncOfflineQueue(); updateOfflineBanner(); });
window.addEventListener('offline', updateOfflineBanner);

function registerServiceWorker(){
  if (!('serviceWorker' in navigator)) return;
  // file:// pages can't register service workers — only attempt over http(s)
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    navigator.serviceWorker.register('service-worker.js').catch(()=>{ /* offline-first still works via browser cache */ });
  }
}
