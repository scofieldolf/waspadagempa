# 🗺️ Waspadagempa — Feature Roadmap & Recommendations

> Based on a thorough analysis of the existing codebase, current feature set, and best-in-class disaster monitoring platforms (BMKG, USGS, MAGMA Indonesia).

---

## ✅ What's Already Built
| Feature | Status |
|---|---|
| Real-time USGS Earthquake Data (API + 10min cache) | ✅ Done |
| Magnitude-colored & scaled map markers | ✅ Done |
| Tsunami Early Warning (pulsing ripple + alert banner) | ✅ Done |
| Climate Risk Timeline Slider (2026–2050) | ✅ Done |
| Safe Radius Calculator (Haversine + dashed line) | ✅ Done |
| Bilingual UI (Indonesian + English) | ✅ Done |
| Collapsible sidebar + legend overlay | ✅ Done |
| Earthquake detail cards in sidebar | ✅ Done |

---

## 🚀 Tier 1 — Quick Wins (1–2 days each)

### 1. 📡 Live Data Integration (Connect Real USGS Feed to Map)
**Gap:** The backend `/api/disaster` route fetches live USGS data correctly, but the map still renders hardcoded `MOCK_EARTHQUAKES`. The frontend is completely disconnected from the backend.

**Fix:** Wire `MapCanvas.tsx` to fetch from `/api/disaster` using `useEffect` + `useState`, replacing `MOCK_EARTHQUAKES` with live data.

```typescript
// In MapCanvas.tsx
const [earthquakes, setEarthquakes] = useState<MockEarthquake[]>([]);
useEffect(() => {
  fetch("/api/disaster")
    .then(r => r.json())
    .then(setEarthquakes);
}, []);
```
- **Difficulty:** 🟢 Easy
- **Impact:** 🔥 Critical — This is the most important missing feature. Without it, the app shows fictional data.

---

### 2. ⏱️ Live Data Auto-Refresh Indicator
**Description:** A small animated countdown pill in the sidebar showing how old the data is and auto-refreshing every 10 minutes.

**UI:** `📡 Data diperbarui 3m 22s lalu` with a subtle rotating arrow icon and click-to-refresh button.

- **Backend:** Already has `X-Cache-Age-Seconds` header — just read it.
- **Frontend:** A `useInterval` hook that increments a counter every second.
- **Difficulty:** 🟢 Easy
- **Impact:** ✅ High UX — Makes the app feel "alive" and builds trust.

---

### 3. 🏠 "My Location" GPS Pin
**Description:** A button that uses the browser's Geolocation API to place a pulsing blue dot marker at the user's real GPS location. The Safe Radius Calculator would automatically activate for the user's current location.

```typescript
navigator.geolocation.getCurrentPosition((pos) => {
  setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
});
```
- **Difficulty:** 🟢 Easy
- **Impact:** ✅ High — Transforms the Safe Radius Calculator from a general tool into a personal safety tool.

---

### 4. 🎨 Depth Visualization Mode Toggle
**Description:** A toggle in the sidebar to switch the color-coding of earthquake markers from **Magnitude mode** (current) to **Depth mode** — where shallow quakes (0-30km) are bright red (more destructive) and deep quakes (300km+) are deep blue (less surface impact).

- Color scale: `0km=rose-500, 70km=amber-500, 150km=stone-500, 300km+=sky-500`
- **Difficulty:** 🟢 Easy (just change `getMarkerOptions` logic)
- **Impact:** ✅ Medium — Adds educational depth and professional data analysis capability.

---

### 5. 📋 Exportable Event List Panel
**Description:** A scrollable list view at the bottom of the sidebar showing all active filtered earthquakes as compact rows with M, location, time, and a "Focus on Map" button for each. Allows users to browse events without clicking map markers.

- **Difficulty:** 🟡 Medium
- **Impact:** ✅ High — Critical for power users & mobile users where map clicking is harder.

---

## ⚡ Tier 2 — High Impact Features (3–7 days each)

### 6. 🌋 Tectonic Plate & Active Fault Line Overlay
**Description:** A new toggle layer in the sidebar that renders the Indo-Australian, Pacific, and Eurasian tectonic plate boundaries as permanent map overlays. Additionally, show Indonesia's major fault lines (Sunda Megathrust, Palu-Koro Fault, etc.) as labeled polylines.

- **Data Source:** USGS Hazard Map GeoJSON (free public data) or hardcoded major fault coordinates.
- **Implementation:** Add to `CLIMATE_RISK_AREAS`-style static coordinate arrays; render as `<Polyline>` with labels.
- **Difficulty:** 🟡 Medium
- **Impact:** 🔥 Very High — This is the #1 educational feature. Users understand *why* Indonesia is at risk.

---

### 7. 🔥 Seismic Activity Heatmap Mode
**Description:** A visual mode that overlays a color gradient heatmap showing earthquake density and concentration over the past 7/30/90 days. Hotspots glow orange/red; quiet areas stay cool/blue.

- **Tech:** Use `leaflet.heat` plugin or render custom `<svg>` gradient overlays using earthquake coordinate arrays.
- **Difficulty:** 🟡 Medium-Hard
- **Impact:** 🔥 Very High — Immediately reveals Indonesia's Ring of Fire pattern. Stunning visual.

---

### 8. ⏮️ "Time Travel" Playback — 7-Day Animation
**Description:** A timeline playback bar at the bottom of the map that lets users press ▶️ to animate seismic events from the past 7 days chronologically, watching markers appear and fade across the map.

- **Backend:** Extend `/api/disaster` to accept a `?range=7day` param, fetching from USGS's weekly feed.
- **Frontend:** Sort events by time, use `setInterval` to progressively add events to the rendered array.
- **Difficulty:** 🟡 Medium
- **Impact:** 🔥 Very High — Creates a "wow moment" — arguably the most shareable feature.

---

### 9. 🔔 Notifications & Alert Subscription Panel
**Description:** A bell icon in the header that opens a notification preferences panel where users set a custom magnitude threshold and radius. When new data loads and a qualifying event appears, show a toast notification in the corner.

- **Implementation:** Compare new fetch results with previous, fire in-app notifications using state diffing.
- **Difficulty:** 🟡 Medium
- **Impact:** ✅ High — Makes the app genuinely useful as a monitoring tool, not just a visualization.

---

### 10. 🌊 BMKG Integration (Indonesia Official Data)
**Description:** Add a second data source toggle that pulls from BMKG (Indonesia's official agency) in addition to the existing USGS feed. BMKG provides data for smaller local earthquakes that USGS might miss.

- **Endpoint:** `https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json`
- **Backend:** Create `/api/bmkg` route with the same caching + sanitization pattern as `/api/disaster`.
- **Difficulty:** 🟡 Medium
- **Impact:** 🔥 Critical for Indonesian users — BMKG is the authoritative source for Indonesian earthquakes.

---

### 11. 📊 Statistics Dashboard Panel
**Description:** A collapsible "Stats" section at the bottom of the sidebar showing real-time computed statistics from the current earthquake data:
- Total events (24h / 7d)
- Strongest event (magnitude + location)
- Average depth across all events
- Tsunami alert count
- Activity trend arrow (↑ more than usual / ↓ quieter than usual)

- **Difficulty:** 🟡 Medium
- **Impact:** ✅ High — Adds a data journalism / dashboard quality feel to the app.

---

## 🏆 Tier 3 — Advanced Features (Long-Term)

### 12. 📱 Progressive Web App (PWA) — Offline Support
**Description:** Configure the app as a Progressive Web App with:
- Installable to homescreen
- Cached map tiles for offline access
- Background sync for data refresh
- Push notifications for major events

- **Difficulty:** 🔴 Hard (requires service workers, manifest)
- **Impact:** 🔥 Critical for disaster preparedness — users might need data when offline.

---

### 13. 🤖 AI Earthquake Briefing Card
**Description:** After a major earthquake (Mag 6.0+) is detected, auto-generate a short, plain-language AI briefing explaining the event using a prompt to the Gemini API:
> "M6.4 earthquake detected near Sumatra. Based on its depth (12km) and location, here's what to know..."

- **Difficulty:** 🔴 Hard
- **Impact:** 🔥 Very High — Transforms raw data into actionable, accessible information.

---

### 14. 🗂️ Historical Earthquake Archive Search
**Description:** A search/filter panel to query the USGS Earthquake Catalog for historical events by:
- Date range picker
- Minimum magnitude
- Geographic bounding box
- Location name

- **Backend:** Proxy calls to `https://earthquake.usgs.gov/fdsnws/event/1/query`
- **Difficulty:** 🔴 Hard
- **Impact:** ✅ High — Turns the app into a research tool for students, researchers, journalists.

---

### 15. 🌐 Volcano Monitoring Layer
**Description:** Add a new data layer showing active Indonesian volcanoes (e.g., Merapi, Semeru, Krakatau) with their current alert status (Normal/Waspada/Siaga/Awas) from PVMBG (Center for Volcanology).

- **Data Source:** MAGMA Indonesia API (pvmbg.go.id)
- **Difficulty:** 🔴 Hard
- **Impact:** ✅ High — Indonesia has the most active volcanoes in the world; this is a natural extension.

---

## 🎯 Recommended Implementation Order

| Priority | Feature | Why First? |
|---|---|---|
| **1st** | Live Data Integration | The app uses mock data — this is critical |
| **2nd** | My Location GPS | Personal safety = emotional engagement |
| **3rd** | Live Refresh Indicator | Makes the app feel real-time |
| **4th** | Tectonic Fault Overlay | Highest educational/visual value |
| **5th** | BMKG Data Integration | Most relevant for Indonesian users |
| **6th** | Time Travel Playback | Biggest "wow" / shareable feature |
| **7th** | Stats Dashboard | Rounds out the professional dashboard feel |

> [!TIP]
> Start with **Live Data Integration** (#1) immediately — it's the highest value, lowest difficulty fix that transforms the app from a prototype to a real product.

> [!NOTE]
> Features #1 through #5 can all be built without any new npm packages using only existing dependencies (React-Leaflet, Lucide, Tailwind).
