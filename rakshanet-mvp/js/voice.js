/* ==========================================================================
   voice.js — Accessibility via the browser's built-in Web Speech API.
   Two real, working features (Chrome/Edge; graceful fallback elsewhere):
     1. speakCurrentScreen() — reads the visible screen aloud (TTS),
        for people who can't read (elderly / non-literate users).
     2. startVoiceSOS() — lets a citizen SPEAK their emergency instead
        of typing, using speech-to-text with a simple keyword parser
        that fills the SOS form automatically.
   No internet required once the browser's voice engine is loaded —
   Web Speech synthesis works fully offline on most platforms.
   ========================================================================== */

const VOICE_LANG_MAP = { en: 'en-IN', bn: 'bn-IN', hi: 'hi-IN' };

function speakCurrentScreen(){
  if (!('speechSynthesis' in window)) { toast(t('voiceNotSupported'), 'bad'); return; }
  const screenEl = document.getElementById('phone-screen');
  if (!screenEl) return;
  const text = screenEl.innerText.replace(/\s+/g,' ').trim();
  if (!text) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = VOICE_LANG_MAP[currentLang] || 'en-IN';
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

function startVoiceSOS(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast(t('voiceNotSupported'), 'bad'); return; }

  const rec = new SR();
  rec.lang = VOICE_LANG_MAP[currentLang] || 'en-IN';
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  toast(t('listening'), 'good');
  const micBtn = document.getElementById('voiceSosBtn');
  if (micBtn) micBtn.classList.add('listening');

  rec.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    applyVoiceTranscriptToForm(transcript);
  };
  rec.onerror = () => { toast(t('voiceNotSupported'), 'bad'); };
  rec.onend = () => { if (micBtn) micBtn.classList.remove('listening'); };

  try { rec.start(); } catch(err) { toast(t('voiceNotSupported'), 'bad'); }
}

/* Lightweight multilingual keyword parser — fills the SOS form from speech
   instead of requiring the user to read/tap each field. Not full NLU,
   but enough to demo real hands-free triage input. */
function applyVoiceTranscriptToForm(transcript){
  const raw = transcript.toLowerCase();

  const numMatch = raw.match(/\d+/);
  if (numMatch) form.people = Math.max(1, parseInt(numMatch[0], 10));

  const childWords = ['child','baby','bacca','bachcha','শিশু','बच्चे','baby'];
  if (childWords.some(w => raw.includes(w))) form.children = Math.max(form.children, 1);

  const elderWords = ['elder','old man','old woman','buro','buri','বয়স্ক','बुजुर्ग'];
  if (elderWords.some(w => raw.includes(w))) form.elderly = Math.max(form.elderly, 1);

  const medWords = ['medical','sick','emergency','oshudh','chikitsa','চিকিৎসা','दवा','बीमार'];
  if (medWords.some(w => raw.includes(w))) form.medical = true;

  const waterWords = { waterOver:['submerged','head','above head','ডুবে','डूब'], waterChest:['chest','buk','छाती'],
                        waterWaist:['waist','komor','कमर'], waterKnee:['knee','hatu','घुटने'], waterAnkle:['ankle','gorali','टखने'] };
  for (const key in waterWords){
    if (waterWords[key].some(w => raw.includes(w))) { form.waterLevelKey = key; break; }
  }

  form.note = transcript;
  toast('🎙️ "' + transcript + '"', 'good');
  showScreen('sos'); // re-render so steppers/select reflect the parsed values
}
