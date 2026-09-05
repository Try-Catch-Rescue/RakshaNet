/* ==========================================================================
   accessibility.js — For users who can't easily read small/normal text
   (elderly relatives, low vision). Two toggles, persisted locally so the
   preference survives a reload without needing an account.
   ========================================================================== */

const A11Y_KEY = 'rn_a11y_prefs';

function getA11yPrefs(){
  try { return JSON.parse(localStorage.getItem(A11Y_KEY)) || { largeText:false, highContrast:false }; }
  catch(e){ return { largeText:false, highContrast:false }; }
}
function saveA11yPrefs(p){
  try { localStorage.setItem(A11Y_KEY, JSON.stringify(p)); } catch(e){}
}
function applyA11yPrefs(){
  const p = getA11yPrefs();
  document.body.classList.toggle('a11y-large', p.largeText);
  document.body.classList.toggle('a11y-contrast', p.highContrast);
  const bl = document.getElementById('btnLargeText'); if (bl) bl.classList.toggle('active', p.largeText);
  const bc = document.getElementById('btnHighContrast'); if (bc) bc.classList.toggle('active', p.highContrast);
}
function toggleLargeText(){
  const p = getA11yPrefs(); p.largeText = !p.largeText; saveA11yPrefs(p); applyA11yPrefs();
}
function toggleHighContrast(){
  const p = getA11yPrefs(); p.highContrast = !p.highContrast; saveA11yPrefs(p); applyA11yPrefs();
}
