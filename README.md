# Aham — Cosmic Self-Inquiry

> *"Aham"* (अहम्) — Sanskrit for **"I Am"**. A private, offline-first daily operating system for the solo engineer who takes inner work as seriously as outer execution.

No cloud. No subscriptions. No data leaving your machine. Everything runs locally.

---

## What is Aham?

Aham is a personal journal and insight system built for one user — you. It combines daily journaling, mood & sleep tracking, goal setting, neurological health check-ins, and a local rules-based **Insight Engine** that gives you a single, specific directive based on your current state.

**Active Modules:**

| Tab | What it does |
|---|---|
| **Daily** | Journal entry, mood picker, sleep cycle, daily task list |
| **Targets** | Weekly & monthly goal tracking |
| **Insights** | Mood + sleep charts and the local Insight Engine |
| **Neuro Core** | Neurological health check-in (HRV, stress, brainwave patterns) |
| **Neuro Coach** | AI coaching via Google Gemini |

---

## Running the Web App

### Prerequisites

- **Node.js** ≥ 20
- A **Gemini API key** — get one free at [aistudio.google.com](https://aistudio.google.com)

### Setup

```bash
cd Aham-
npm install
```

Create a `.env` file in `Aham-/`:

```env
GEMINI_API_KEY=your_key_here
```

### Start

```bash
npm run dev
```

Opens at **[http://localhost:3000](http://localhost:3000)**

> The backend is a local Express server + SQLite (`aham.db` is created automatically in the project root on first run).

---

## Tech Stack

| | |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | TailwindCSS v4 |
| Charts | Recharts |
| Animations | Motion (Framer Motion v12) |
| Backend | Express.js |
| Database | SQLite via Better-SQLite3 |
| AI | Google Gemini (`@google/genai`) |

---

## Insight Engine

The Insight Engine (`src/services/InsightEngine.ts`) runs entirely **offline** with zero latency — no AI call, no network. It evaluates your current daily state against 8 priority rules and returns one specific, actionable directive.

Click **"Analyze Patterns"** in the Insights tab. The engine reads today's journal, mood, sleep, and time — and tells you exactly what to do next.

---

## Mobile & Desktop

Pre-built binaries are included in this repo for convenience.

### Android APK

> **[Aham-App/Aham-Offline-Sync.apk](Aham-App/Aham-Offline-Sync.apk)**
> Includes LAN sync — the mobile app can sync with your desktop over local Wi-Fi.

Install via ADB:
```bash
adb install Aham-App/Aham-Offline-Sync.apk
```
Or copy the `.apk` directly to your phone and install manually (enable *Install Unknown Apps* in settings).

---

### Linux Desktop (.deb)

> **[Aham-Desktop.deb](Aham-Desktop.deb)**

Install:
```bash
sudo dpkg -i Aham-Desktop.deb
```

The desktop app is a native Tauri window — no browser required.

---

## Data & Privacy

- All data is stored **on your device only**
- Web app writes to `aham.db` (SQLite) in the project directory
- Mobile/Desktop stores data in device-local IndexedDB (LocalForage)
- The LAN sync between mobile and desktop happens entirely over your local network — no cloud relay

---

> *You are not optimising a product. You are optimising a self.*
