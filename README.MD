# Waspadagempa 🌍

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green?style=flat-square&logo=leaflet)](https://leafletjs.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=flat-square&logo=vercel)](https://vercel.com/)

An interactive, high-performance, full-stack disaster monitor and climate risk tracking application for the Indonesian archipelago and the Pacific Ring of Fire. 

Designed with a clean, content-first user interface inspired by **Anthropic's Claude**, utilizing elegant typography, soft stone tones, and fully responsive layouts.

---

## ✨ Features

### 🌎 Geospatial Maps Interface
- **Seismic Event Tracking:** Real-time seismic monitor that plots events onto an elegant, light-monochrome **CartoDB Positron** base map.
- **Pulsing SVG Visuals:** Magnitude markers dynamically scale in radius and color-gradient (emerald to warning rose) depending on Richter scale severities.
- **Temporal Climate Timelines (2026–2050):** Drag or tap to slide through decades to witness semi-transparent coastal submersion hazards and sea-level rise models expand and deepen in real-time.
- **Borderless Click Focus:** Tap map markers to open unbordered, premium shadow-dressed Leaflet popups and automatically center the viewport.

### 🌓 Dashboard Control Center
- **Collapsible Control Sidebar:** Retractable panels toggle map focus dynamically. An automated **Map invalidation size mechanism** forces Leaflet to redraw dynamically, wiping out grey void visual bugs instantly.
- **Language Switcher (Bilingual ID/EN):** Full locale dictionary mapping that defaults to **Bahasa Indonesia** to fit the local brand, with a seamless, micro-animated toggle to switch to English.
- **Obsidian Details Card:** Clicked events generate dark, glowing report panels detailing epicenter ranges, local occurrence clocks, depth, and immediate tsunami alerts.

### ⚙️ High-Speed Backend API
- **In-Memory Caching (10-minute lifespans):** In-memory cache proxies the official USGS API, delivering map payloads in **`< 1ms`** while preventing rate-limiting.
- **Resilient Fallback Mode:** Outages or network issues on upstream government servers are caught safely, automatically serving the expired local cache as a failover.
- **70% Bandwidth Sanitization:** Strips redundant administrative metadata from massive raw GeoJSON outputs before sending, drastically saving user bandwidth.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (Strict typing enabled)
- **Styling:** Tailwind CSS v4.0 (CSS-first engine) & Lucide React (Sleek icons)
- **Mapping:** React-Leaflet & Leaflet.js

---

## 🚀 Quick Start (Local Setup)

Get the project running on your computer in less than a minute:

### 1. Clone the repository
```bash
git clone https://github.com/scofieldolf/waspadagempa.git
cd waspadagempa
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser to explore the dashboard!

---

## 📁 Repository Overview
```text
waspadagempa/
├── app/
│   ├── api/
│   │   └── disaster/
│   │       └── route.ts       # Backend Caching, Sanitization & Resilient Fallbacks
│   ├── components/
│   │   ├── ControlSidebar.tsx # Off-white Dashboard Controls & Bilingual UI
│   │   ├── MapCanvas.tsx      # Leaflet Core Map, SVG Circles & Climate Overlays
│   │   └── translations.ts    # Complete EN & ID translation maps
│   ├── globals.css            # Leaflet overrides, pulse animations & scrollbars
│   ├── layout.tsx             # Global layout & metadata configurations
│   └── page.tsx               # Central state synchronization & dynamic import
├── prd.md                     # Internal Product Requirement Document (PRD)
└── package.json               # Package scripts & dependencies
```

---

## 🤝 Pair Programming
Developed with 🤍 in collaboration with **Antigravity**, a pair-programming agentic AI coding companion.