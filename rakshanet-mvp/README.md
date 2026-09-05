# RakshaNet — Urban Flood Disaster Management MVP

Smart India Hackathon project. AI-powered disaster risk, evacuation & rescue
platform. **This build is the Urban Flood MVP** — the architecture is
multi-hazard ready, but flood is the only fully implemented use case for v1.

No paid backend, no external APIs, no auth yet — by design. This is a
frontend-only, fully clickable, **installable, offline-first** MVP built to
be demoed on a laptop or phone with zero internet dependency once loaded.

## Run it

```bash
npx serve .
# or
python3 -m http.server 8000
```

Service workers require `http://` or `https://` (not `file://`) — use one of
the commands above rather than double-clicking `index.html` if you want to
test the offline/installable behaviour.

## Why this build is different (judge-facing pitch)

Most hackathon disaster apps assume the user has a phone, a data
connection, can read, and can type. In a real flood, none of those are
guaranteed. This build addresses that directly:

| Real-world constraint | What we built |
|---|---|
| Internet/mobile network goes down first in a flood | **Offline-first PWA** — service worker caches the whole app; SOS requests made offline are queued on-device and auto-sync the moment connectivity returns |
| Many affected households don't have a smartphone | **Community kiosk model** — same app runs on a shared device at shelters/relief camps; explained in-app under *More → Don't have a smartphone?* |
| Elderly / non-literate family members | **Voice mode** — 🔊 read-aloud (text-to-speech) on every screen, and 🎙️ speak-your-emergency (speech-to-text) on the SOS form, so nothing requires reading or typing |
| Language barriers | Full English / Bengali / Hindi UI, selectable at onboarding or any time from the top bar |
| Judging on accuracy, not just UI | Priority scoring is a transparent, explainable weighted model (not a black box) — defensible in Q&A, and designed to be swapped for a trained model behind the same interface later |

## What's demoable end-to-end

1. Citizen sees **HIGH flood risk** on the home screen (Kolkata, West Bengal).
2. Opens the **risk map** → colour-coded flood zones, with a **satellite
   view toggle** (clearly labelled as a simulated preview — real satellite
   integration, e.g. ISRO Bhuvan / Sentinel Hub, is a v2 API swap).
3. Checks **safe route** (avoids flooded roads), **water level trend graph**
   (danger-mark line), and **safe shelters** (live capacity).
4. Submits an **SOS** by typing *or by speaking* — a transparent AI-style
   priority score is computed either way (`js/scoring.js`).
5. Switches to the **Admin/Rescue Dashboard** — the SOS appears instantly,
   ranked by score, with a "Dispatch nearest team" action.
6. From **More**: request relief supplies (food/water/medical/blankets),
   find 24/7 medical facilities with one-tap calling, and view a live
   multi-region disaster feed (not just the user's own city).

A floating **Demo Controls** dock (bottom-right, ⚙) lets a judge change the
simulated risk level live and generate random incoming SOS requests without
you re-filling forms on stage.

## Project structure

```
index.html            Page shell — DOM skeleton, wires up all modules
manifest.json          PWA manifest (installable "Add to Home Screen")
service-worker.js      Offline app-shell caching + cache-first fetch strategy
icon.svg               App icon
css/styles.css         All styling — citizen phone UI + admin dashboard + a11y modes
js/
  i18n.js               English / Bengali / Hindi translations + t() helper
  data.js               Mock data: risk levels, shelters, medical, relief, situation feed
  scoring.js            AI-style rescue priority scoring engine (explainable)
  state.js               Central app state + actions (submitSOS, dispatchTeam, setRisk...)
  voice.js               Web Speech API: read-aloud (TTS) + voice SOS input (STT)
  offline.js              Online/offline detection, SOS offline queue, SW registration
  accessibility.js        Large-text and high-contrast modes
  citizen.js              14 citizen screens as render functions
  admin.js                Admin dashboard renderer (stats, map, SOS, relief, supply chain, feed)
  app.js                  Bootstrap: view switching, init
```

Each module has a single responsibility so a 3–5 person team can split work
cleanly.

## Citizen portal screens

Onboarding (language picker) → Home risk overview → Risk map (+ satellite
toggle) → Safe route → Safe shelters → SOS form (+ voice input) → SOS
confirmation (AI score breakdown) → Alerts → **More**: Water level graph,
Relief & essentials, 24/7 medical directory, Live disaster feed, No-phone
access info, Accessibility settings.

## Admin/Rescue dashboard

Fully working sidebar navigation across 10 real pages (not a static mockup):
Dashboard, Live Map, Incidents, SOS Requests, Rescue Teams, Shelters,
Roads & Blocks, Alerts, Reports, Settings. The Live Map (and the map panels
on Dashboard/Teams/Shelters/Roads) use **real Leaflet + OpenStreetMap
tiles** — actual Kolkata streets, not a placeholder gradient — with live
markers for shelters, rescue teams, SOS requests (colour-coded by AI
severity) and blocked roads. If the map tile CDN can't be reached (no
internet in the control room), it shows an honest offline notice instead
of a fake map.

## AI priority scoring (explainable, not a black box)

`computeScore()` in `js/scoring.js`:

- Base priority: 20
- People affected: up to +15 (3 pts/person)
- Children present: up to +16 (8 pts each)
- Elderly/disabled present: up to +16 (8 pts each)
- Medical emergency: +25
- Water level: Ankle +4 → Knee +10 → Waist +18 → Chest +26 → Submerged +34

Clamped to 100. Severity bands: ≥90 Critical, ≥70 High, ≥50 Medium, else
Low. Intentionally simple and defensible for judge Q&A; swap in a trained
model later without changing the UI contract (it still just returns
`{score, severity}`).

## What's genuinely functional right now vs. simulated

| Feature | Status |
|---|---|
| Offline app shell + SOS queueing | **Real** — service worker + localStorage, testable by disabling your network |
| Voice read-aloud / voice SOS input | **Real** — browser Web Speech API (best in Chrome/Edge; graceful fallback message elsewhere) |
| Language switching (EN/BN/HI) | **Real** — full UI translation |
| Accessibility (large text / high contrast) | **Real** |
| Water level graph, relief requests, medical directory, situation feed | Real interactive UI, **mock data** (no live sensors/DB yet) |
| Satellite map view | **Simulated preview**, clearly labelled in-app |
| SMS/USSD/missed-call access for feature phones | **Conceptual** — explained in-app as a planned channel, not wired to a telecom API yet |

## v2 backend plan

React/Next.js frontend, Node.js + Express backend, PostgreSQL, Mapbox/
OpenStreetMap + real satellite layer (Bhuvan/Sentinel Hub), Socket.IO for
live push updates, JWT auth for admin/rescue roles, SMS gateway (e.g.
Twilio/local telecom API) for feature-phone SOS via missed call or short
code.

## Tech used in this MVP

Vanilla HTML/CSS/JS — zero dependencies, zero build step. Web Speech API
for voice. Service Worker + Cache API + localStorage for offline. Fonts:
Fraunces (display), Inter (body), JetBrains Mono (data/IDs), Noto Sans
Bengali/Devanagari (i18n).
