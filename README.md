# RakshaNe# RakshaNet 🛟
### AI-Assisted Urban Flood Disaster Management Platform

**Smart India Hackathon — MVP Submission**

RakshaNet is an offline-first, multilingual disaster intelligence platform that connects citizens in flood-affected areas with rescue teams and control-room operators — no backend, no paid APIs, no login required to demo, and fully installable as a Progressive Web App.

> **Live demo path:** Citizen App → raise an SOS (by typing *or* by speaking) → Admin Dashboard → the request appears instantly, auto-prioritized by an explainable AI scoring model, ready for dispatch.

---

## Table of Contents

- [Why RakshaNet](#why-rakshanet)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Citizen App Walkthrough](#citizen-app-walkthrough)
- [Admin / Rescue Dashboard](#admin--rescue-dashboard)
- [AI Priority Scoring Engine](#ai-priority-scoring-engine)
- [Offline-First Architecture](#offline-first-architecture)
- [Accessibility & Inclusion](#accessibility--inclusion)
- [Judge Demo Mode](#judge-demo-mode)
- [What's Real vs. Simulated](#whats-real-vs-simulated)
- [Roadmap (v2)](#roadmap-v2)
- [License](#license)

---

## Why RakshaNet

Most disaster-response prototypes quietly assume the user has a smartphone, a stable data connection, can read fluently, and can type under stress. During an actual flood, none of these hold:

| Real-world constraint | RakshaNet's answer |
|---|---|
| Mobile networks fail first in a flood | **Offline-first PWA** — a service worker caches the entire app shell; SOS reports made offline are queued on-device and auto-sync the moment connectivity returns |
| Many affected households share one device | **Community kiosk model** — the same app runs on a shared device at a shelter or relief camp |
| Elderly or non-literate family members | **Voice mode** — read-aloud (text-to-speech) on every screen, and speak-your-emergency (speech-to-text) on the SOS form |
| Language barriers | Full **English / Bengali / Hindi** UI, switchable anytime |
| Judges scrutinizing "AI" claims | A transparent, **explainable weighted scoring model** — not a black box, and swappable for a trained model later without changing the interface contract |

---

## Key Features

- 📱 **Citizen App** — 14 screens covering onboarding, risk overview, live flood map, safe routes, shelters, SOS reporting, relief requests, medical directory, and a multi-region situation feed.
- 🚨 **One-tap / one-word SOS** — fill the form by typing or by speaking; either path produces an instant AI priority score.
- 🖥️ **Admin / Rescue Dashboard** — 10 fully working pages (Dashboard, Live Map, Incidents, SOS Requests, Rescue Teams, Shelters, Roads & Blocks, Alerts, Reports, Settings) with real Leaflet + OpenStreetMap tiles.
- 🧠 **Explainable AI scoring** — every SOS is ranked 0–100 with a visible point-by-point breakdown, banded into Low / Medium / High / Critical severity.
- 📶 **True offline support** — service worker + on-device queueing means a citizen can submit an SOS with zero connectivity; it auto-syncs the instant the network returns.
- 🗣️ **Voice accessibility** — Web Speech API for both text-to-speech and speech-to-text, with a lightweight multilingual keyword parser.
- 🌐 **i18n out of the box** — English, Bengali (বাংলা), and Hindi (हिंदी).
- ♿ **Accessibility modes** — large text and high-contrast toggles, persisted locally.
- 🎬 **Judge Demo Mode** — a scripted, one-click walkthrough that simulates a live incident end-to-end for stage presentations.

---

## Tech Stack

Vanilla HTML, CSS, and JavaScript — **zero build step, zero external runtime dependencies** beyond Leaflet for mapping.

| Concern | Technology |
|---|---|
| Mapping | Leaflet 1.9.4 + OpenStreetMap tiles |
| Voice (TTS/STT) | Web Speech API (`speechSynthesis`, `SpeechRecognition`) |
| Offline & installability | Service Worker (Cache API) + `localStorage` + Web App Manifest |
| Fonts | Fraunces (display), Inter (body), JetBrains Mono (data/IDs), Noto Sans Bengali/Devanagari (i18n) |

---

## Project Structure

```
rakshanet-mvp/
├── index.html              Page shell — DOM skeleton, wires up all modules
├── manifest.json           PWA manifest (installable "Add to Home Screen")
├── service-worker.js       Offline app-shell caching + cache-first fetch strategy
├── icon.svg                App icon
├── css/
│   └── styles.css          All styling — citizen UI, admin dashboard, a11y modes
└── js/
    ├── i18n.js             English / Bengali / Hindi translations + t() helper
    ├── data.js             Mock data: risk levels, shelters, medical, relief, situation feed
    ├── scoring.js          Explainable AI-style rescue priority scoring engine
    ├── state.js            Central app state + actions (submitSOS, dispatchTeam, setRisk...)
    ├── voice.js            Web Speech API: read-aloud (TTS) + voice SOS input (STT)
    ├── offline.js          Online/offline detection, SOS offline queue, SW registration
    ├── accessibility.js    Large-text and high-contrast modes
    ├── citizen.js          14 citizen screens as render functions
    ├── admin.js            Admin dashboard renderer (stats, map, SOS, relief, supply chain, feed)
    └── app.js              Bootstrap: view switching, demo dock wiring, init
```

Each module owns a single responsibility, so a 3–5 person team can split work cleanly across the codebase.

---

## Getting Started

Service workers require `http://` or `https://` — **don't** open `index.html` directly with `file://` if you want to test offline/installable behaviour.

```bash
# Option 1
npx serve .

# Option 2
python3 -m http.server 8000
```

Then open the printed local URL in Chrome or Edge (best support for the Web Speech API).

---

## Citizen App Walkthrough

```
Onboarding (language picker)
   → Home (risk overview)
   → Risk map (+ satellite toggle)
   → Safe route
   → Safe shelters
   → SOS form (type or speak)
   → SOS confirmation (AI score breakdown)
   → Alerts
   → More: water level graph · relief & essentials · 24/7 medical directory ·
            live disaster feed · no-smartphone access info · accessibility settings
```

---

## Admin / Rescue Dashboard

A fully working sidebar with 10 real pages — not a static mockup:

**Dashboard · Live Map · Incidents · SOS Requests · Rescue Teams · Shelters · Roads & Blocks · Alerts · Reports · Settings**

The Live Map and related map panels use **real Leaflet + OpenStreetMap tiles** (actual Kolkata streets), with live markers for shelters, rescue teams, SOS requests (colour-coded by AI severity), and blocked roads. If the tile CDN is unreachable, the dashboard shows an honest offline notice rather than a fake map.

---

## AI Priority Scoring Engine

`computeScore()` in `js/scoring.js` — deterministic and fully explainable, so it can be defended in front of judges:

| Factor | Contribution |
|---|---|
| Base priority | +20 |
| People affected | up to +15 (3 pts/person) |
| Children present | up to +16 (8 pts each) |
| Elderly/disabled present | up to +16 (8 pts each) |
| Medical emergency | +25 |
| Water level | Ankle +4 → Knee +10 → Waist +18 → Chest +26 → Submerged +34 |

Score is clamped to 100, then banded into severity:

- **≥ 90** → Critical
- **≥ 70** → High
- **≥ 50** → Medium
- **< 50** → Low

The function's contract is intentionally simple — `{ score, severity, breakdown }` — so a trained ML model can be swapped in later behind the same interface without touching the UI.

---

## Offline-First Architecture

1. On first load (with internet), `service-worker.js` caches the entire app shell (`APP_SHELL`).
2. Once cached, RakshaNet works with **zero connectivity** — critical for flood zones where mobile networks fail first.
3. If a citizen submits an SOS while offline, it's queued in `localStorage` via `queueSosOffline()` and marked `offlineQueued: true`.
4. The moment the browser fires an `online` event, `syncOfflineQueue()` pushes every queued report into `State.sosRequests` and notifies the user — no data is lost.

---

## Accessibility & Inclusion

- **Read-aloud** (`speakCurrentScreen()`) — converts the visible screen to speech via `speechSynthesis`, for elderly or non-literate users.
- **Voice SOS** (`startVoiceSOS()`) — speech-to-text with a lightweight multilingual keyword parser that auto-fills the SOS form (people count, children, elderly, medical need, water level).
- **Large text** and **high contrast** modes, toggled from Settings and persisted across sessions.
- **Full i18n** — English / Bengali / Hindi, switchable at onboarding or from the top bar at any time.

---

## Judge Demo Mode

A single **▶ Judge Demo** button runs a scripted ~8-second simulation so the whole flow can be shown on stage without manually filling forms:

1. Risk escalates from Medium → High.
2. Two incoming SOS requests are simulated.
3. The view auto-switches to the Admin Dashboard.
4. The judge is prompted to prioritize the highest-severity SOS and dispatch a team.

A floating **Demo Controls** dock (⚙, bottom-right) also lets a judge manually set the risk level or generate a random incoming SOS at any time.

---

## What's Real vs. Simulated

| Feature | Status |
|---|---|
| Offline app shell + SOS queueing | **Real** — service worker + `localStorage`, testable by disabling your network |
| Voice read-aloud / voice SOS input | **Real** — browser Web Speech API (best in Chrome/Edge; graceful fallback elsewhere) |
| Language switching (EN/BN/HI) | **Real** — full UI translation |
| Accessibility (large text / high contrast) | **Real** |
| Water level graph, relief requests, medical directory, situation feed | Real interactive UI, **mock data** (no live sensors/DB yet) |
| Satellite map view | **Simulated preview**, clearly labelled in-app |
| SMS/USSD/missed-call access for feature phones | **Conceptual** — explained in-app, not yet wired to a telecom API |

---

## Roadmap (v2)

- React/Next.js frontend, Node.js + Express backend, PostgreSQL
- Real satellite layer (ISRO Bhuvan / Sentinel Hub) alongside OpenStreetMap
- Socket.IO for live push updates between citizens and the control room
- JWT-based auth for admin/rescue roles
- SMS gateway (Twilio or a local telecom API) for feature-phone SOS via missed call or short code
- Swap the explainable scoring model for a trained ML model behind the same `{score, severity}` contract

---

## License

Built for **Smart India Hackathon**. Add your team's license of choice here (e.g. MIT) before public release.
