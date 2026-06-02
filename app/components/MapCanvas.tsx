"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polygon, useMapEvents, Polyline } from "react-leaflet";
import L from "leaflet";
import { MockEarthquake } from "./ControlSidebar";
import { Clock, Waves, Compass, AlertCircle, MapPin, AlertTriangle, Radar } from "lucide-react";
import { Locale, translations } from "./translations";
import { calculateDistance } from "../utils/geo";

// Mock Earthquake Data centered around Indonesia
const MOCK_EARTHQUAKES: MockEarthquake[] = [
  {
    id: "eq-001",
    lat: 1.223,
    lng: 97.452,
    mag: 6.4,
    depth: 12,
    location: "94 km W of Gunungsitoli, Sumatra",
    time: "2026-06-02T12:15:30.000Z",
    tsunami: true
  },
  {
    id: "eq-002",
    lat: -6.842,
    lng: 107.143,
    mag: 4.8,
    depth: 8,
    location: "8 km NW of Cianjur, West Java",
    time: "2026-06-02T04:22:15.000Z",
    tsunami: false
  },
  {
    id: "eq-003",
    lat: -0.897,
    lng: 119.822,
    mag: 5.6,
    depth: 18,
    location: "15 km S of Palu, Central Sulawesi",
    time: "2026-06-01T23:04:45.000Z",
    tsunami: false
  },
  {
    id: "eq-004",
    lat: -6.211,
    lng: 130.485,
    mag: 6.9,
    depth: 142,
    location: "280 km SE of Ambon, Banda Sea",
    time: "2026-06-01T15:42:00.000Z",
    tsunami: true
  },
  {
    id: "eq-005",
    lat: -2.532,
    lng: 140.684,
    mag: 4.2,
    depth: 25,
    location: "12 km NE of Jayapura, Papua",
    time: "2026-05-31T09:18:22.000Z",
    tsunami: false
  }
];

// Mock Climate Risk Area coordinates with translation keys
interface ClimateRiskArea {
  nameKey: "jakartaZone" | "sumatraZone" | "kalimantanZone" | "surabayaZone";
  descKey: "jakartaDesc" | "sumatraDesc" | "kalimantanDesc" | "surabayaDesc";
  coordinates: [number, number][];
  riskGrowthFactor: number;
}

const CLIMATE_RISK_AREAS: ClimateRiskArea[] = [
  {
    nameKey: "jakartaZone",
    descKey: "jakartaDesc",
    coordinates: [
      [-6.08, 106.75],
      [-6.07, 106.82],
      [-6.09, 106.90],
      [-6.13, 106.92],
      [-6.14, 106.80],
      [-6.12, 106.74]
    ],
    riskGrowthFactor: 1.8
  },
  {
    nameKey: "sumatraZone",
    descKey: "sumatraDesc",
    coordinates: [
      [3.75, 98.60],
      [3.85, 98.70],
      [3.78, 98.80],
      [3.62, 98.72],
      [3.68, 98.55]
    ],
    riskGrowthFactor: 1.4
  },
  {
    nameKey: "kalimantanZone",
    descKey: "kalimantanDesc",
    coordinates: [
      [-2.80, 113.80],
      [-2.50, 114.30],
      [-2.90, 114.70],
      [-3.30, 114.50],
      [-3.20, 113.90]
    ],
    riskGrowthFactor: 2.2
  },
  {
    nameKey: "surabayaZone",
    descKey: "surabayaDesc",
    coordinates: [
      [-7.15, 112.65],
      [-7.18, 112.78],
      [-7.23, 112.82],
      [-7.26, 112.72],
      [-7.21, 112.64]
    ],
    riskGrowthFactor: 1.5
  }
];

interface MapCanvasProps {
  locale: Locale;
  sidebarCollapsed: boolean;
  showEarthquakes: boolean;
  earthquakeFilter: "All" | "Mag 4+" | "Mag 6+";
  showClimateRisk: boolean;
  climateYear: 2026 | 2030 | 2040 | 2050;
  selectedEarthquake: MockEarthquake | null;
  setSelectedEarthquake: (eq: MockEarthquake | null) => void;
}

// Component to handle map centering when selected earthquake changes
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 6.5, {
        animate: true,
        duration: 1.2
      });
    }
  }, [lat, lng, map]);
  return null;
}

// Component to handle map container resizing when sidebar collapsed state shifts
function MapResizeTrigger({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: true });
    }, 320); // 320ms matching sidebar width transition duration (300ms)
    return () => clearTimeout(timer);
  }, [sidebarCollapsed, map]);
  return null;
}

// Component to handle map clicks and propagate coordinates back to parent
interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function MapCanvas({
  locale,
  sidebarCollapsed,
  showEarthquakes,
  earthquakeFilter,
  showClimateRisk,
  climateYear,
  selectedEarthquake,
  setSelectedEarthquake
}: MapCanvasProps) {
  
  const t = translations[locale];

  // Safe Radius Calculator State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Filter mock earthquakes based on user criteria
  const filteredEarthquakes = MOCK_EARTHQUAKES.filter((eq) => {
    if (!showEarthquakes) return false;
    if (earthquakeFilter === "Mag 4+") return eq.mag >= 4.0;
    if (earthquakeFilter === "Mag 6+") return eq.mag >= 6.0;
    return true;
  });

  // Calculate nearest earthquake to user clicked location
  let nearestEarthquake: MockEarthquake | null = null;
  let nearestDistance = Infinity;

  if (userLocation && filteredEarthquakes.length > 0) {
    for (const eq of filteredEarthquakes) {
      const dist = calculateDistance(userLocation.lat, userLocation.lng, eq.lat, eq.lng);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestEarthquake = eq;
      }
    }
  }

  const activeNearestEarthquake = nearestEarthquake;

  // Calculate polygon visual styles dynamically for Climate Risk Years
  const getClimateAreaStyles = (area: ClimateRiskArea) => {
    // Scaling color and opacity from 2026 to 2050
    const progressionIndex = climateYear === 2026 ? 0.25 : climateYear === 2030 ? 0.45 : climateYear === 2040 ? 0.70 : 0.95;
    
    // Risk severity score based on year progress and local growth factor
    const intensity = progressionIndex * area.riskGrowthFactor;
    
    let fillColor = "#10b981"; // emerald for 2026
    let strokeColor = "#059669";
    
    if (climateYear === 2030) {
      fillColor = "#f59e0b"; // amber
      strokeColor = "#d97706";
    } else if (climateYear === 2040) {
      fillColor = "#f97316"; // orange
      strokeColor = "#ea580c";
    } else if (climateYear === 2050) {
      fillColor = "#ef4444"; // red/rose
      strokeColor = "#dc2626";
    }

    return {
      fillColor,
      color: strokeColor,
      fillOpacity: Math.min(0.2 + progressionIndex * 0.45, 0.75),
      weight: 1.5 + progressionIndex * 1.5,
      dashArray: climateYear === 2050 ? "4 4" : undefined
    };
  };

  // Helper to dynamically size and color earthquake markers based on magnitude
  const getMarkerOptions = (eq: MockEarthquake) => {
    const isSelected = selectedEarthquake?.id === eq.id;
    const mag = eq.mag;
    
    // Circle radius scaling based on magnitude
    const radius = isSelected 
      ? (mag * 3.5) + 6 
      : (mag * 3.5) + 2;

    let color = "#78716c"; // stone
    let fillColor = "#a8a29e";
    
    if (eq.tsunami) {
      color = "#ef4444"; // glowing crimson red for tsunami threat
      fillColor = "#f87171"; // soft red fill
    } else if (mag >= 6.0) {
      color = "#dc2626"; // rose-600
      fillColor = "#f87171"; // red-400
    } else if (mag >= 5.0) {
      color = "#d97706"; // amber-600
      fillColor = "#fbbf24"; // amber-400
    } else {
      color = "#57534e"; // stone-600
      fillColor = "#78716c"; // stone-500
    }

    return {
      radius,
      color,
      fillColor,
      fillOpacity: isSelected ? 0.75 : 0.5,
      weight: isSelected ? 2.5 : 1.5,
      className: isSelected ? "marker-active-pulse" : ""
    };
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[-2.5489, 118.0149]} // Centered on Indonesia
        zoom={5}
        minZoom={4}
        maxZoom={10}
        zoomControl={false} // Disable default so we can place it on the right
        className="w-full h-full"
      >
        {/* Recenter control hook */}
        {selectedEarthquake && (
          <MapRecenter lat={selectedEarthquake.lat} lng={selectedEarthquake.lng} />
        )}

        {/* Dynamic Resize hook */}
        <MapResizeTrigger sidebarCollapsed={sidebarCollapsed} />

        {/* Safe Radius Click Handler */}
        <MapClickHandler
          onMapClick={(lat, lng) => {
            setUserLocation({ lat, lng });
          }}
        />

        {/* Minimalist CartoDB Positron base tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Climate Risk Overlays */}
        {showClimateRisk &&
          CLIMATE_RISK_AREAS.map((area, idx) => {
            const styles = getClimateAreaStyles(area);
            return (
              <Polygon
                key={`climate-risk-${idx}`}
                positions={area.coordinates}
                pathOptions={styles}
              >
                <Popup closeButton={false}>
                  <div className="p-3.5 max-w-[240px] space-y-2 bg-stone-50 text-stone-900">
                    <div className="flex items-center space-x-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                      <AlertCircle className="w-3.5 h-3.5 text-stone-500" />
                      <span>{t.riskZone}</span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 leading-tight font-serif">
                      {t[area.nameKey]}
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {t[area.descKey]}
                    </p>
                    <div className="pt-2 border-t border-stone-200/50 flex items-center justify-between text-[10px] font-semibold text-stone-500 font-mono">
                      <span>{t.projectionYear}:</span>
                      <span className="font-bold text-stone-950 uppercase">{climateYear} {t.projectionModel}</span>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

        {/* Seismic Activity Markers */}
        {filteredEarthquakes.map((eq) => {
          const markerOpts = getMarkerOptions(eq);
          const isSelected = selectedEarthquake?.id === eq.id;
          
          return (
            <React.Fragment key={eq.id}>
              {/* Tsunami Outer Rippling Circle Marker Overlay */}
              {eq.tsunami && (
                <CircleMarker
                  center={[eq.lat, eq.lng]}
                  radius={(eq.mag * 3.5) + 2}
                  color="#ef4444"
                  fillColor="#ef4444"
                  weight={1}
                  className="tsunami-marker-pulse"
                />
              )}

              <CircleMarker
                center={[eq.lat, eq.lng]}
                {...markerOpts}
                eventHandlers={{
                  click: () => {
                    setSelectedEarthquake(eq);
                  }
                }}
              >
                <Popup closeButton={false}>
                  {/* Premium unbordered Popup inside map */}
                  <div className="p-3.5 max-w-[260px] space-y-3 bg-stone-50 text-stone-900 font-sans">
                    {/* Tsunami Minimalist Alert Badge */}
                    {eq.tsunami && (
                      <div className="bg-red-50 border border-red-200/50 rounded-lg p-2 flex items-center space-x-1.5 text-[9px] text-red-700 font-bold uppercase tracking-wider animate-pulse leading-none">
                        <Waves className="w-3.5 h-3.5 text-red-600 flex-shrink-0 animate-bounce" />
                        <span>{locale === "id" ? "Potensi Tsunami / Tsunami Alert" : "Tsunami Alert Generated"}</span>
                      </div>
                    )}

                    {/* Magnitude indicator line */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider font-mono">
                        {eq.location.includes("Sumatra") 
                          ? (locale === "id" ? "Sektor Sumatra" : "Sumatra Sector") 
                          : eq.location.includes("Java") 
                            ? (locale === "id" ? "Sektor Jawa" : "Java Sector")
                            : eq.location.includes("Sulawesi")
                              ? (locale === "id" ? "Sektor Sulawesi" : "Sulawesi Sector")
                              : eq.location.includes("Banda Sea")
                                ? (locale === "id" ? "Laut Banda" : "Banda Sea")
                                : (locale === "id" ? "Sektor Papua" : "Papua Sector")}
                      </span>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white ${
                        eq.mag >= 6 
                          ? "bg-rose-600" 
                          : eq.mag >= 5 
                            ? "bg-amber-600" 
                            : "bg-stone-600"
                      }`}>
                        M {eq.mag.toFixed(1)}
                      </div>
                    </div>

                    {/* Epicenter Title */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold font-serif text-stone-950 leading-tight">
                        {eq.location}
                      </h4>
                      <p className="text-[10px] text-stone-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {new Date(eq.time).toLocaleTimeString(locale === "id" ? "id-ID" : "en-US", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })} {locale === "id" ? "WIB" : "Local"}
                      </p>
                    </div>

                    {/* Details Quick Specs */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-stone-100/50 p-2 rounded-lg border border-stone-200/20 font-mono">
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">{t.depth}</span>
                        <span className="font-bold text-stone-700">{eq.depth} km</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">{t.tsunami}</span>
                        <span className={`font-bold ${eq.tsunami ? "text-blue-500 font-bold" : "text-stone-500"}`}>
                          {eq.tsunami ? (locale === "id" ? "Peringatan" : "Warning") : t.none}
                        </span>
                      </div>
                    </div>

                    {/* Details Card Activator */}
                    <button
                      onClick={() => setSelectedEarthquake(eq)}
                      className={`w-full py-1.5 text-center text-xs font-semibold rounded-md border transition-all duration-200 shadow-sm ${
                        isSelected
                          ? "bg-stone-950 text-white border-stone-950"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-950"
                      }`}
                    >
                      {isSelected ? t.activeFocus : t.focusDetails}
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* User Click Location Marker & Polyline to Nearest Epicenter */}
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={6}
            color="#1c1917" // stone-900
            fillColor="#78716c" // stone-500
            fillOpacity={0.8}
            weight={2}
          />
        )}

        {userLocation && activeNearestEarthquake && (
          <Polyline
            positions={[
              [userLocation.lat, userLocation.lng],
              [activeNearestEarthquake.lat, activeNearestEarthquake.lng]
            ]}
            pathOptions={{
              color: "#78716c", // stone-500 gray
              weight: 1.5,
              dashArray: "5, 5",
              opacity: 0.8
            }}
          />
        )}
      </MapContainer>

      {/* Floating Overlays Container on bottom-right of Map */}
      <div className="absolute bottom-6 right-6 z-[500] pointer-events-none flex flex-col items-end space-y-3">
        {/* Safe Radius Calculator Card */}
        {userLocation && activeNearestEarthquake && (
          <div className="pointer-events-auto bg-stone-900/95 text-stone-100 backdrop-blur-md border border-stone-850 p-4 rounded-xl shadow-lg w-[240px] flex flex-col space-y-2.5 font-sans animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Radar className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="text-[11px] font-bold text-stone-200 uppercase tracking-wider font-mono">
                  {t.nearestEarthquake}
                </span>
              </div>
              <button
                onClick={() => setUserLocation(null)}
                className="text-[10px] text-stone-400 hover:text-white transition-colors font-semibold"
              >
                {t.clearDistance}
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">
                {t.distanceToNearest}
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-white">
                  {nearestDistance.toLocaleString(locale === "id" ? "id-ID" : "en-US")}
                </span>
                <span className="text-xs font-semibold text-stone-400 font-mono">km</span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800/80 flex items-center space-x-1.5">
              {nearestDistance < 100 ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">
                    {t.statusWaspada}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">
                    {t.statusAman}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Legend Overlay */}
        {(showEarthquakes || showClimateRisk) && (
          <div className="pointer-events-auto bg-stone-50/95 backdrop-blur-md border border-stone-200/60 p-4 rounded-xl shadow-lg text-stone-800 max-w-[210px] flex flex-col space-y-3 font-sans">
            <div className="flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-stone-500 animate-spin-slow" />
              <span className="text-[11px] font-bold text-stone-900 uppercase tracking-wider font-mono">{t.legend}</span>
            </div>
            
            {/* Earthquake Legend */}
            {showEarthquakes && (
              <div className="space-y-1.5">
                <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">{t.magnitude}</span>
                <div className="flex flex-col gap-1 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400 border border-rose-600" />
                    <span className="text-stone-600 font-medium">{locale === "id" ? "Parah (Mag 6.0+)" : "Mag 6.0+ (Severe)"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600" />
                    <span className="text-stone-600 font-medium">{locale === "id" ? "Sedang (Mag 5.0+)" : "Mag 5.0+ (Moderate)"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-500 border border-stone-600" />
                    <span className="text-stone-600 font-medium">{locale === "id" ? "Ringan (Mag < 5.0)" : "Mag < 5.0 (Minor)"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Climate Risk Legend */}
            {showClimateRisk && (
              <div className="space-y-1.5 border-t border-stone-200/50 pt-2.5">
                <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">{t.climateRiskLegend}</span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <div className="flex-1 h-2 rounded bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 border border-stone-200/30" />
                  <span className="text-stone-500 font-mono font-bold uppercase">{climateYear}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
