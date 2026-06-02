# Implementation Plan - GPS, Depth Colors, Event List, BMKG Integration & Alerts

This plan outlines the final, high-impact features to completely fulfill the Waspadagempa feature roadmap and provide a best-in-class seismological dashboard.

---

## Goal Description

We will add a suite of advanced features to close the remaining feature roadmap:
1. **🏠 "My Location" GPS Pin:** Integrate browser Geolocation API to place a pulsing blue GPS indicator and automatically run the Safe Radius Calculator from the user's actual location.
2. **🎨 Depth Visualization Mode:** A toggle to color-code epicenters based on focal depth (Shallow < 30km in bright red, Intermediate in orange, Deep in blue) with a dynamic legend switcher.
3. **📋 Seismic Event List Panel:** A compact, scrollable list of active earthquakes inside the sidebar, featuring focal action buttons to snap-center the map and open popups.
4. **🌊 BMKG Official Indonesia Data Source:** An API route `/api/bmkg` that fetches, normalizes, and caches Indonesia's official BMKG seismic feed, with a sidebar toggle to switch data sources.
5. **🔔 In-App Toast Alerts:** Push top-right toast alerts whenever a new major earthquake (M6.0+ or tsunami potential) is detected in the feed.

---

## Proposed Changes

We will modify 5 existing files and create 1 new server route.

### 1. Backend proxy upgrades

#### [NEW] [route.ts (BMKG)](file:///c:/Users/I%20MADE%20ANANDA%20RYAN/Desktop/Waspadagempa/app/api/bmkg/route.ts)
- Create a server route `/api/bmkg` to proxy `https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json`.
- Normalize the BMKG XML/JSON response down to the standard `MockEarthquake` schema:
  - Parse coordinates (latitude, longitude) and convert BMKG custom format (e.g. `6.45 LS`, `101.25 BT`) to floats.
  - Parse magnitude, depth, location, time, and tsunami flags.
  - Implement a 5-minute in-memory cache to save BMKG bandwidth.

---

### 2. Localization Dictionary

#### [MODIFY] [translations.ts](file:///c:/Users/I%20MADE%20ANANDA%20RYAN/Desktop/Waspadagempa/app/components/translations.ts)
- Add bilingual Indonesian & English keys for all new controls:
  - Source toggle (`dataSource`, `sourceUsgs`, `sourceBmkg`).
  - GPS pin (`myLocation`, `gpsError`).
  - Depth colors (`colorMode`, `colorMag`, `colorDepth`, `shallow`, `intermediate`, `deep`).
  - Event list (`eventList`, `focusMap`, `viewDetails`).
  - Alerts (`alertMajor`, `alertTsunami`).

---

### 3. Application State & Layout

#### [MODIFY] [page.tsx](file:///c:/Users/I%20MADE%20ANANDA%20RYAN/Desktop/Waspadagempa/app/page.tsx)
- Lift state to manage:
  - `dataSource: "usgs" | "bmkg"` (default `"usgs"`)
  - `colorMode: "magnitude" | "depth"` (default `"magnitude"`)
- Pass these down to `ControlSidebar` and `MapCanvas` to coordinate live updates.

#### [MODIFY] [ControlSidebar.tsx](file:///c:/Users/I%20MADE%20ANANDA%20RYAN/Desktop/Waspadagempa/app/components/ControlSidebar.tsx)
- **Data Source Switcher:** Add a segmented control at the top of Section 1: `USGS (Global)` vs `BMKG (RI)`.
- **Color Mode Selector:** Add a toggle in the Magnitude Filter subsection to switch between "Magnitude Mode" and "Depth Mode".
- **Seismic Event List:** Append a beautiful scrollable event list below the filters, showing magnitude badges, sector labels, relative times, and snapping focus buttons.

---

### 4. Interactive Map & Overlays

#### [MODIFY] [MapCanvas.tsx](file:///c:/Users/I%20MADE%20ANANDA%20RYAN/Desktop/Waspadagempa/app/components/MapCanvas.tsx)
- **BMKG Loading Engine:** Adjust `fetchEarthquakes` to call `/api/bmkg` or `/api/disaster` depending on active `dataSource`.
- **"My Location" GPS Button:**
  - Place a floating locator button (`Locate Me`) with a navigation target arrow at the bottom right.
  - On click, draw a pulsing blue GPS `<CircleMarker>` and automatically set the coordinates as the `userLocation` reference.
- **Depth Color-Coding:**
  - Update `getMarkerOptions` to dynamically compute colors based on focal depth if `colorMode === "depth"`:
    - **Shallow (<30km):** Glowing Crimson Red (#ef4444) — highest structural danger.
    - **Intermediate (30-150km):** Amber Orange (#f97316).
    - **Deep (>150km):** Ocean Sky Blue (#0ea5e9).
  - Dynamically update the Legend Overlay on the right to show the corresponding Depth gradient.
- **In-App Toast Alerts:**
  - Implement a `usePrevious` effect to compare fetched event IDs. If a new event with Mag >= 6.0 or tsunami generated appears, push a beautiful glassmorphic, top-right absolute sliding toast alert!

---

## Verification Plan

### Automated & Manual Verification
1. **TypeScript Build:**
   - Run dev check (`npm run build`) to guarantee absolute zero typing errors or compilation issues.
2. **API Verification:**
   - Call `/api/bmkg` directly to check normalized output syntax compatibility with USGS models.
3. **UI Integration Flow Tests:**
   - Toggle Data Source to BMKG and verify map markers, statistics, and Gemini reports update instantly.
   - Toggle Color Scheme to Depth Mode and check marker color transitions and legend switch.
   - Click "My Location" to test Geolocation popup and Haversine dashed-line calculations.
   - Trigger mock toast notifications to test layout overlays and slide-in animations.
