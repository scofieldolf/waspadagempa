# Waspadagempa — Product Requirement Document (PRD)
> **Real-time Global Disaster & Climate Risk Map**  
> Built with a clean, content-first user interface inspired by Anthropic's Claude.

---

## 📄 Project Overview
**Waspadagempa** is a high-performance, full-stack web application designed to map real-time natural disasters and long-term climate risks. Focused heavily on the Indonesian region and the Pacific Ring of Fire, the platform translates complex geospatial data from global agencies into an elegant, minimalist dashboard.

The project demonstrates production-grade engineering practices including **data normalization**, **server-side caching**, and **geospatial rendering optimization**.

---

## ✨ Key Features & UI Design (Claude-Inspired)
The user interface adheres strictly to a minimalist, typographic-focused design aesthetic using a soft, distraction-free color palette (`Slate/Stone` tones).

*   **Collapsible Control Sidebar:** A clean, retractable left panel that houses all filter controls, toggles, and sliders, ensuring the map remains the core focus.
*   **Real-time Ring of Fire Monitor:** Fetches, filters, and renders earthquake data from the last 24 hours. Markers are dynamically scaled and colored based on Richter scale magnitudes.
*   **Climate Risk Timeline Slider:** An interactive temporal slider allows users to visualize projected coastal flooding and sea-level rise across Indonesia from 2026 up to 2050.
*   **Monochrome Minimalist Map:** Utilizing minimalist base layers to ensure disaster data visualization stands out clearly without visual clutter.

---

## 🛠️ Tech Stack & Architecture

### Frontend
*   **Framework:** Next.js (App Router)
*   **Mapping Library:** React-Leaflet & Leaflet.js
*   **Map Tiles:** CartoDB Positron (Light/Minimalist OpenStreetMap)
*   **Styling:** Tailwind CSS & Shadcn/ui Components (`Sidebar`, `SidebarCollapse`, custom toggles)

### Backend & Data Layer
*   **Architecture:** Next.js Serverless Route Handlers (API Routes)
*   **Data Feeds:** United States Geological Survey (USGS) API
*   **Geospatial Processing:** Server-side GeoJSON documentation and filtering

---

## ⚙️ Backend & Performance Optimizations
To ensure a seamless user experience and prevent frontend lag, the backend implements several critical engineering layers:

1. **Data Sanitization & Reduction:** Public APIs (like USGS) often return massive JSON payloads with redundant properties. The backend interceptor strips unused metadata, passing only essential coordinates, magnitude, and timestamps to the frontend, reducing bandwidth payload by up to 70%.
2. **Server-side Caching:** To prevent API rate-limiting and minimize latency, fetched data is cached in memory for 10 minutes. Subsequent user requests are served instantly from the cache rather than hitting external government servers repeatedly.
3. **CORS Handling & Security:** API routing acts as a secure reverse-proxy, eliminating Cross-Origin Resource Sharing (CORS) issues within the browser environment.

---

## 📁 Directory Structure
```text
waspadagempa/
├── app/
│   ├── api/
│   │   └── disaster/
│   │       └── route.ts       # Backend API, Caching & Data Sanitization
│   ├── components/
│   │   ├── MapCanvas.tsx      # Leaflet Map implementation with CartoDB Tiles
│   │   ├── ControlSidebar.tsx # Claude-style Sidebar with Shadcn components
│   │   └── translations.ts    # Language Localization support dictionary
│   ├── layout.tsx             # Global layout & elegant typography config
│   └── page.tsx               # Main Full-screen Application entry point
├── public/                    # Static assets & map markers
└── package.json
```
