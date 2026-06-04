"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polygon, useMapEvents, Polyline, Circle } from "react-leaflet";
import L from "leaflet";
import { MockEarthquake } from "./ControlSidebar";
import { 
  Clock, Waves, Compass, AlertCircle, MapPin, AlertTriangle, Radar, RefreshCw,
  Play, Pause, BarChart3, Sparkles, ChevronUp, ChevronDown, Check, Copy, X, Navigation
} from "lucide-react";
import { Locale, translations } from "./translations";
import { calculateDistance } from "../utils/geo";

// Geographic bounding box for Indonesia & Ring of Fire region
const INDONESIA_BBOX = { minLat: -20, maxLat: 30, minLng: 80, maxLng: 155 };

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

// Major Plate Boundary Lines (orange dashed — subduction / convergent)
const PLATE_BOUNDARIES: { name: string; coords: [number, number][]; color: string }[] = [
  {
    name: "Sunda Trench (Java Trench)",
    color: "#f97316", // orange-500
    coords: [
      [6.5, 93.5], [4.0, 94.5], [2.0, 95.5], [0.0, 96.0],
      [-2.0, 97.5], [-4.5, 100.5], [-6.5, 103.5],
      [-8.0, 107.0], [-9.0, 110.5], [-10.0, 113.5],
      [-10.5, 116.5], [-10.5, 119.5], [-10.0, 122.0],
      [-9.5, 124.5], [-9.0, 127.0], [-9.0, 129.0],
      [-8.5, 131.5]
    ]
  },
  {
    name: "Banda Arc",
    color: "#fb923c", // orange-400
    coords: [
      [-6.5, 124.0], [-7.0, 126.0], [-7.5, 128.0],
      [-7.0, 130.5], [-6.0, 132.5], [-5.0, 133.5],
      [-4.0, 134.0], [-3.0, 134.5], [-2.0, 135.0]
    ]
  },
  {
    name: "Philippine Trench",
    color: "#fdba74", // orange-300
    coords: [
      [16.0, 127.0], [14.0, 127.5], [11.5, 127.0],
      [9.0, 126.5], [7.0, 126.5], [5.0, 126.5],
      [3.0, 127.0], [1.5, 127.5]
    ]
  }
];

// Active Fault Lines (rose/red — strike-slip & thrust faults)
const ACTIVE_FAULTS: { name: string; coords: [number, number][]; color: string; dashArray?: string }[] = [
  {
    name: "Great Sumatran Fault (Semangko)",
    color: "#f43f5e", // rose-500
    coords: [
      [5.8, 95.8], [4.5, 96.5], [3.0, 97.5], [1.5, 98.8],
      [0.0, 100.0], [-1.5, 101.2], [-3.0, 102.5],
      [-4.5, 103.8], [-5.8, 105.2]
    ]
  },
  {
    name: "Palu-Koro Fault",
    color: "#e11d48", // rose-600
    coords: [
      [0.5, 120.0], [0.0, 120.1], [-0.5, 120.2],
      [-1.0, 120.3], [-1.5, 120.6], [-2.0, 121.0],
      [-2.5, 121.5], [-3.0, 122.0]
    ]
  },
  {
    name: "Flores Thrust Fault",
    color: "#be123c", // rose-700
    dashArray: "6 4",
    coords: [
      [-7.5, 114.0], [-7.8, 116.0], [-8.0, 118.0],
      [-8.2, 120.0], [-8.3, 122.0], [-8.0, 124.0]
    ]
  },
  {
    name: "Sorong Fault",
    color: "#fb7185", // rose-400
    coords: [
      [-1.8, 130.0], [-1.3, 132.5], [-0.8, 135.0],
      [-0.3, 137.0], [0.2, 139.0], [0.5, 141.0]
    ]
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
  showTectonicPlates: boolean;
  // New features
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;
  showTimeTravel: boolean;
  setShowTimeTravel: (show: boolean) => void;
  showStatsDashboard: boolean;
  setShowStatsDashboard: (show: boolean) => void;
  // Final features
  dataSource: "usgs" | "bmkg";
  setDataSource: (source: "usgs" | "bmkg") => void;
  colorMode: "magnitude" | "depth";
  setColorMode: (mode: "magnitude" | "depth") => void;
  onDataLoaded?: (eqs: MockEarthquake[]) => void;
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

// Component to listen to map zoom changes and propagate back to parent state
function MapZoomListener({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
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
  setSelectedEarthquake,
  showTectonicPlates,
  showHeatmap,
  setShowHeatmap,
  showTimeTravel,
  setShowTimeTravel,
  showStatsDashboard,
  setShowStatsDashboard,
  dataSource,
  setDataSource,
  colorMode,
  setColorMode,
  onDataLoaded
}: MapCanvasProps) {
  
  const t = translations[locale];

  // Map Zoom State
  const [zoom, setZoom] = useState<number>(5);

  // Zoom-sensitive sizing helpers to prevent clutter when zoomed out
  const zoomFactor = zoom <= 4 ? 0.8 : zoom === 5 ? 1.4 : zoom === 6 ? 2.2 : zoom === 7 ? 3.0 : zoom === 8 ? 4.2 : 5.5;
  const baseOffset = zoom <= 4 ? 0.5 : zoom === 5 ? 1.0 : zoom === 6 ? 1.5 : zoom === 7 ? 2.0 : zoom === 8 ? 2.5 : 3.0;

  // Safe Radius Calculator State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Live Earthquake Data State
  const [earthquakes, setEarthquakes] = useState<MockEarthquake[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // In-App Toast Alerts state
  const [toastAlert, setToastAlert] = useState<MockEarthquake | null>(null);

  // Legend Collapsible State
  const [legendExpanded, setLegendExpanded] = useState<boolean>(true);

  // --- ⏳ Time Travel Playback States & Logic ---
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2); // 1x, 2x, 5x, 10x

  // Sort active earthquakes chronologically (earliest first)
  const chronologicalEarthquakes = useMemo(() => {
    return [...earthquakes].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [earthquakes]);

  // Adjust playbackIndex to end of list when Time Travel triggers
  useEffect(() => {
    if (showTimeTravel) {
      setPlaybackIndex(Math.max(0, chronologicalEarthquakes.length - 1));
      setIsPlaying(false);
    }
  }, [showTimeTravel, chronologicalEarthquakes.length]);

  // Playback timer stepper
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && showTimeTravel && chronologicalEarthquakes.length > 0) {
      const intervalMs = playbackSpeed === 1 
        ? 1500 
        : playbackSpeed === 2 
          ? 800 
          : playbackSpeed === 5 
            ? 300 
            : 100;

      timer = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= chronologicalEarthquakes.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, showTimeTravel, playbackSpeed, chronologicalEarthquakes.length]);

  // Calculate which earthquakes are active at the current playback step
  const activeEarthquakePool = showTimeTravel
    ? chronologicalEarthquakes.slice(0, playbackIndex + 1)
    : earthquakes;

  const latestPlaybackEqId = showTimeTravel && chronologicalEarthquakes[playbackIndex]
    ? chronologicalEarthquakes[playbackIndex].id
    : null;

  // --- 📊 Statistics Panel & AI Briefing States ---
  const [statsExpanded, setStatsExpanded] = useState<boolean>(true);
  const [loadingBriefing, setLoadingBriefing] = useState<boolean>(false);
  const [briefingContent, setBriefingContent] = useState<string | null>(null);
  const [showBriefingModal, setShowBriefingModal] = useState<boolean>(false);
  const [copiedBriefing, setCopiedBriefing] = useState<boolean>(false);

  // Auto-collapse panels on mobile to keep viewport clean
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setStatsExpanded(false);
      setLegendExpanded(false);
    }
  }, []);

  // Fetch live earthquake data from USGS or BMKG proxy
  const fetchEarthquakes = useCallback(async (period: "day" | "week" = "day", source: "usgs" | "bmkg" = "usgs") => {
    setIsLoading(true);
    setDataError(null);
    try {
      const url = source === "bmkg" 
        ? "/api/bmkg" 
        : `/api/disaster?period=${period}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: MockEarthquake[] = await res.json();
      
      // Filter to Indonesia & Ring of Fire bounding box
      const regional = data.filter(
        (eq) =>
          eq.lat >= INDONESIA_BBOX.minLat &&
          eq.lat <= INDONESIA_BBOX.maxLat &&
          eq.lng >= INDONESIA_BBOX.minLng &&
          eq.lng <= INDONESIA_BBOX.maxLng
      );
      setEarthquakes(regional);
      
      // Propagate shared earthquakes list back up to home layout for sidebar synchronization!
      if (onDataLoaded) onDataLoaded(regional);
      setLastUpdated(new Date());
    } catch {
      setDataError(locale === "id" ? "Gagal memuat data seismik" : "Failed to load seismic data");
    } finally {
      setIsLoading(false);
    }
  }, [locale, onDataLoaded]);

  // Auto-fetch on mount, when Time Travel period shifts, or when active Data Source changes
  useEffect(() => {
    fetchEarthquakes(showTimeTravel ? "week" : "day", dataSource);
    const interval = setInterval(() => {
      fetchEarthquakes(showTimeTravel ? "week" : "day", dataSource);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEarthquakes, showTimeTravel, dataSource]);

  // Push top-right absolute Toast Alert when a new highly significant event is fetched
  useEffect(() => {
    if (earthquakes.length > 0 && lastUpdated) {
      // Find the strongest quake or any tsunami warning in the current feed
      const strongQuake = earthquakes.find(q => q.mag >= 6.0 || q.tsunami);
      if (strongQuake) {
        setToastAlert(strongQuake);
        const timer = setTimeout(() => setToastAlert(null), 10000); // show for 10 seconds
        return () => clearTimeout(timer);
      }
    }
  }, [earthquakes, lastUpdated]);

  // Trigger browser GPS Geolocation pin positioning
  const locateUserGps = () => {
    if (!navigator.geolocation) {
      alert(t.gpsError);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng });
      },
      () => {
        alert(t.gpsError);
      }
    );
  };

  // Format last updated readout
  const formatLastUpdated = (date: Date): string => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return locale === "id" ? "Baru saja" : "Just now";
    if (diffMins < 60) return locale === "id" ? `${diffMins}m lalu` : `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return locale === "id" ? `${diffHours}j lalu` : `${diffHours}h ago`;
  };

  // Filter live earthquake data based on magnitude filter criteria
  const filteredEarthquakes = activeEarthquakePool.filter((eq) => {
    if (!showEarthquakes) return false;
    if (earthquakeFilter === "Mag 4+") return eq.mag >= 4.0;
    if (earthquakeFilter === "Mag 6+") return eq.mag >= 6.0;
    return true;
  });

  // Calculate nearest earthquake to user clicked/GPS location
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



  // Calculate statistics metrics dynamically
  const statsTotal = filteredEarthquakes.length;
  let statsMaxMag = 0;
  let statsMaxLoc = "N/A";
  let statsTsunami = 0;
  let statsTotalDepth = 0;

  let sectorSumatra = 0;
  let sectorJava = 0;
  let sectorSulawesi = 0;
  let sectorBanda = 0;
  let sectorPapua = 0;
  let sectorOthers = 0;

  filteredEarthquakes.forEach((eq) => {
    if (eq.mag > statsMaxMag) {
      statsMaxMag = eq.mag;
      statsMaxLoc = eq.location;
    }
    if (eq.tsunami) statsTsunami++;
    statsTotalDepth += eq.depth;

    const loc = eq.location.toLowerCase();
    const isSumatra = loc.includes("sumatra") || loc.includes("sumatera") || loc.includes("aceh") || loc.includes("mentawai") || loc.includes("nias") || loc.includes("sumut") || loc.includes("sumbar") || loc.includes("sumsel") || loc.includes("bengkulu") || loc.includes("jambi") || loc.includes("lampung") || loc.includes("riau") || loc.includes("kepri") || loc.includes("bangka") || loc.includes("belitung") || loc.includes("simeulue") || loc.includes("tapanuli") || loc.includes("nias");
    const isJava = loc.includes("java") || loc.includes("jawa") || loc.includes("sunda") || loc.includes("banten") || loc.includes("jakarta") || loc.includes("jabar") || loc.includes("jateng") || loc.includes("jatim") || loc.includes("diy") || loc.includes("yogyakarta") || loc.includes("jember") || loc.includes("banyuwangi") || loc.includes("malang") || loc.includes("blitar") || loc.includes("tulungagung") || loc.includes("trenggalek") || loc.includes("pacitan") || loc.includes("pangandaran") || loc.includes("tasikmalaya") || loc.includes("garut") || loc.includes("cianjur") || loc.includes("sukabumi") || loc.includes("lebak") || loc.includes("pandeglang") || loc.includes("serang") || loc.includes("semarang") || loc.includes("cilacap") || loc.includes("kebumen") || loc.includes("purworejo") || loc.includes("bantul") || loc.includes("gunungkidul") || loc.includes("kulonprogo");
    const isSulawesi = loc.includes("sulawesi") || loc.includes("gorontalo") || loc.includes("minahasa") || loc.includes("palu") || loc.includes("sulsel") || loc.includes("sulteng") || loc.includes("sulut") || loc.includes("sultra") || loc.includes("sulbar") || loc.includes("makassar") || loc.includes("manado") || loc.includes("kendari") || loc.includes("poso") || loc.includes("luwu") || loc.includes("toraja") || loc.includes("mamuju") || loc.includes("donggala") || loc.includes("tolitoli") || loc.includes("buol") || loc.includes("morowali") || loc.includes("banggai");
    const isBanda = loc.includes("banda") || loc.includes("maluku") || loc.includes("seram") || loc.includes("ambon") || loc.includes("moluccas") || loc.includes("halmahera") || loc.includes("ternate") || loc.includes("tidore") || loc.includes("morotai") || loc.includes("sula") || loc.includes("buru") || loc.includes("tual") || loc.includes("dobo") || loc.includes("saumlaki");
    const isPapua = loc.includes("papua") || loc.includes("irian") || loc.includes("biak") || loc.includes("jayapura") || loc.includes("sorong") || loc.includes("manokwari") || loc.includes("fakfak") || loc.includes("kaimana") || loc.includes("nabire") || loc.includes("mimika") || loc.includes("timika") || loc.includes("merauke") || loc.includes("serui") || loc.includes("yapen") || loc.includes("waropen") || loc.includes("supiori") || loc.includes("sarmi") || loc.includes("bintuni") || loc.includes("rajaampat");

    if (isSumatra) {
      sectorSumatra++;
    } else if (isJava) {
      sectorJava++;
    } else if (isSulawesi) {
      sectorSulawesi++;
    } else if (isBanda) {
      sectorBanda++;
    } else if (isPapua) {
      sectorPapua++;
    } else {
      sectorOthers++;
    }
  });

  const statsAvgDepth = statsTotal > 0 ? (statsTotalDepth / statsTotal).toFixed(1) : "0.0";

  // Trigger server-side AI briefing using Gemini proxy
  const generateAIBriefing = async () => {
    setLoadingBriefing(true);
    setCopiedBriefing(false);
    try {
      const response = await fetch("/api/briefing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          earthquakes: filteredEarthquakes,
          locale
        })
      });

      if (!response.ok) throw new Error("Briefing failed");
      const data = await response.json();
      
      setBriefingContent(data.briefing);
      setShowBriefingModal(true);
    } catch (err) {
      console.error(err);
      const fallback = locale === "id"
        ? `# ⚠️ Kegagalan Penghubung AI\n\nSistem tidak dapat menghubungi generator kecerdasan buatan. Silakan periksa koneksi Anda.`
        : `# ⚠️ AI Briefing Connection Interrupted\n\nUnable to establish link with the briefing generator. Please check your connection.`;
      setBriefingContent(fallback);
      setShowBriefingModal(true);
    } finally {
      setLoadingBriefing(false);
    }
  };

  const copyBriefingText = () => {
    if (briefingContent) {
      navigator.clipboard.writeText(briefingContent);
      setCopiedBriefing(true);
      setTimeout(() => setCopiedBriefing(false), 2000);
    }
  };

  // Simple renderer for bold markdowns
  const renderBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-stone-950 font-sans">{part}</strong>;
      }
      return part;
    });
  };

  // Calculate polygon visual styles dynamically for Climate Risk Years
  const getClimateAreaStyles = (area: ClimateRiskArea) => {
    const progressionIndex = climateYear === 2026 ? 0.25 : climateYear === 2030 ? 0.45 : climateYear === 2040 ? 0.70 : 0.95;
    
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

  // Helper to dynamically size and color earthquake markers based on magnitude or depth
  const getMarkerOptions = (eq: MockEarthquake) => {
    const isSelected = selectedEarthquake?.id === eq.id;
    const mag = eq.mag;
    const depth = eq.depth;
    
    // Circle radius scaling based on magnitude and current zoom level
    const radius = isSelected 
      ? (mag * zoomFactor) + baseOffset + 5 
      : (mag * zoomFactor) + baseOffset;

    let color = "#78716c"; // stone
    let fillColor = "#a8a29e";
    
    // Color Mode Swapper logic
    if (colorMode === "depth") {
      if (depth < 30) {
        color = "#e11d48"; // bright crimson for shallow quakes (highly dangerous)
        fillColor = "#f43f5e";
      } else if (depth < 150) {
        color = "#d97706"; // intermediate orange/amber
        fillColor = "#fb923c";
      } else {
        color = "#0284c7"; // deep blue sky
        fillColor = "#38bdf8";
      }
    } else {
      // standard magnitude colors
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
    }

    // Dynamic blending layer when Heatmap is active
    const activeFillOpacity = showHeatmap ? 0.25 : 0.5;
    const activeStrokeOpacity = showHeatmap ? 0.35 : 0.75;

    return {
      radius,
      color,
      fillColor,
      fillOpacity: isSelected ? 0.75 : activeFillOpacity,
      weight: isSelected ? 2.5 : 1.5,
      opacity: isSelected ? 0.95 : activeStrokeOpacity,
      className: isSelected ? "marker-active-pulse" : ""
    };
  };

  return (
    <div className="w-full h-full relative">

      {/* Full-screen Loading Overlay — shown only on the very first load */}
      {isLoading && earthquakes.length === 0 && (
        <div className="absolute inset-0 z-[600] bg-stone-50/90 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center space-y-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-stone-200" />
              <div className="absolute inset-0 rounded-full border-2 border-stone-800 border-t-transparent animate-spin" />
            </div>
            <span className="text-[11px] font-mono font-bold text-stone-500 uppercase tracking-widest">
              {locale === "id" ? "Memuat Data Seismik..." : "Loading Seismic Data..."}
            </span>
          </div>
        </div>
      )}

      {/* Live Data Status Indicator — top-left of map */}
      <div className={`absolute top-4 ${sidebarCollapsed ? "left-16" : "left-4"} z-[500] pointer-events-none flex flex-col space-y-2 items-start transition-[left] duration-300`}>
        <div className="pointer-events-auto flex items-center space-x-2 bg-stone-50/95 backdrop-blur-md border border-stone-200/60 px-3 py-1.5 rounded-lg shadow-sm font-mono text-[10px]">
          {isLoading ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-stone-500 uppercase font-bold tracking-wider">
                {locale === "id" ? "Memuat..." : "Loading..."}
              </span>
            </>
          ) : dataError ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-red-600 uppercase font-bold tracking-wider">
                {locale === "id" ? "Gagal" : "Error"}
              </span>
              <span className="text-stone-200">|</span>
              <button
                onClick={() => fetchEarthquakes(showTimeTravel ? "week" : "day", dataSource)}
                className="text-stone-500 hover:text-stone-800 underline transition-colors font-semibold"
              >
                {locale === "id" ? "Coba lagi" : "Retry"}
              </button>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 uppercase font-bold tracking-wider">Live ({dataSource.toUpperCase()})</span>
              <span className="text-stone-200">|</span>
              <span className="text-stone-600 font-semibold">
                {earthquakes.length} {locale === "id" ? "kejadian" : "events"}
              </span>
              {lastUpdated && (
                <>
                  <span className="text-stone-200">|</span>
                  <span className="text-stone-400">{formatLastUpdated(lastUpdated)}</span>
                </>
              )}
              <button
                onClick={() => fetchEarthquakes(showTimeTravel ? "week" : "day", dataSource)}
                title={locale === "id" ? "Perbarui data" : "Refresh data"}
                className="ml-0.5 text-stone-400 hover:text-stone-800 transition-colors active:scale-90"
              >
                <RefreshCw className="w-2.5 h-2.5" />
              </button>
            </>
          )}
        </div>

        {/* 🏠 floating navigation GPS locate button */}
        <button
          onClick={locateUserGps}
          className="pointer-events-auto bg-stone-900 text-stone-100 hover:bg-black font-sans text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center space-x-1.5 shadow-md hover:shadow-lg active:scale-95 transition-all border border-stone-800"
        >
          <Navigation className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.myLocation}</span>
        </button>
      </div>
      
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

        {/* Dynamic Zoom Listener */}
        <MapZoomListener onZoomChange={setZoom} />

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

        {/* ============ TECTONIC PLATES & FAULT LINES OVERLAY ============ */}
        {showTectonicPlates && (
          <>
            {/* Plate Boundary Lines — dashed orange */}
            {PLATE_BOUNDARIES.map((boundary) => (
              <Polyline
                key={boundary.name}
                positions={boundary.coords as [number, number][]}
                color={boundary.color}
                weight={2.5}
                opacity={0.75}
                dashArray="10 6"
              >
                <Popup>
                  <div className="p-3 min-w-[180px]">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-3 h-[2px] rounded" style={{ backgroundColor: boundary.color }} />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-orange-600">Plate Boundary</span>
                    </div>
                    <p className="font-semibold text-sm text-stone-900">{boundary.name}</p>
                    <p className="text-[10px] text-stone-500 mt-1">Subduction / convergent tectonic boundary</p>
                  </div>
                </Popup>
              </Polyline>
            ))}

            {/* Active Fault Lines — solid/dashed rose */}
            {ACTIVE_FAULTS.map((fault) => (
              <Polyline
                key={fault.name}
                positions={fault.coords as [number, number][]}
                color={fault.color}
                weight={2}
                opacity={0.85}
                dashArray={fault.dashArray}
              >
                <Popup>
                  <div className="p-3 min-w-[180px]">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-3 h-[1.5px] rounded" style={{ backgroundColor: fault.color }} />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600">Active Fault</span>
                    </div>
                    <p className="font-semibold text-sm text-stone-900">{fault.name}</p>
                    <p className="text-[10px] text-stone-500 mt-1">High seismic hazard zone — click for details</p>
                  </div>
                </Popup>
              </Polyline>
            ))}
          </>
        )}

        {/* ============ 🌋 SEISMIC ACTIVITY HEATMAP OVERLAY ============ */}
        {showHeatmap &&
          filteredEarthquakes.map((eq) => {
            const heatRadius = eq.mag * 30000; // scaled in meters
            const heatColor = eq.mag >= 6.0 
              ? "#ef4444" 
              : eq.mag >= 5.0 
                ? "#f97316" 
                : "#fbbf24";
            return (
              <Circle
                key={`heatmap-${eq.id}`}
                center={[eq.lat, eq.lng]}
                radius={heatRadius}
                pathOptions={{
                  fillColor: heatColor,
                  color: "transparent",
                  fillOpacity: 0.08, // Translucent additive opacity layers
                  weight: 0
                }}
              />
            );
          })}

        {/* User GPS Location Marker */}
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={8}
            color="#4f46e5" // indigo-600 GPS locator pin
            fillColor="#6366f1"
            fillOpacity={0.8}
            weight={2.5}
            className="marker-active-pulse"
          >
            <Popup>
              <div className="p-2 text-center leading-none font-sans">
                <span className="text-[9px] font-bold uppercase text-indigo-600 block mb-1">GPS Location</span>
                <span className="text-[10px] font-semibold text-stone-750 font-mono">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        )}

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
                  radius={(eq.mag * zoomFactor) + baseOffset}
                  color="#ef4444"
                  fillColor="#ef4444"
                  weight={1}
                  className="tsunami-marker-pulse"
                />
              )}

              {/* Chronological active wave pulse for Time Travel active point */}
              {eq.id === latestPlaybackEqId && (
                <CircleMarker
                  center={[eq.lat, eq.lng]}
                  radius={((eq.mag * zoomFactor) + baseOffset) * 1.5 + 4}
                  color="#a855f7" // Purple wave
                  fillColor="#a855f7"
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

        {/* Click location marker reference line */}
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

      {/* 📊 Bottom-Left Panels Container (Playback Controller & Statistics Dashboard) */}
      {(showTimeTravel || showStatsDashboard) && (
        <div className="absolute bottom-6 left-4 right-4 md:left-6 md:right-auto md:w-[300px] z-[500] pointer-events-none flex flex-col gap-3">
          
          {/* ⏳ Time Travel Playback Controller */}
          {showTimeTravel && chronologicalEarthquakes.length > 0 && (
            <div className="pointer-events-auto bg-stone-50/95 backdrop-blur-md border border-stone-200/60 py-3 px-4 rounded-xl shadow-lg flex flex-col gap-3 font-sans animate-fadeIn">
              {/* Controls: Play/Pause/Speed & Current Time */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center transition-all border active:scale-95 shadow-sm cursor-pointer ${
                      isPlaying 
                        ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600" 
                        : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200"
                    }`}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current animate-pulse" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  </button>

                  {/* Playback speed pills */}
                  <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200/40 text-[9px] font-mono font-bold">
                    {([1, 2, 5, 10] as const).map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-1.5 py-0.5 rounded transition-all duration-150 active:scale-95 cursor-pointer ${
                          playbackSpeed === speed
                            ? "bg-white text-stone-900 shadow-sm border border-stone-200/10 font-bold"
                            : "text-stone-400 hover:text-stone-700"
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Event Timestamp Indicator */}
                <div className="flex flex-col items-end text-right font-mono justify-center leading-none">
                  <span className="text-[8px] text-purple-600 font-bold uppercase tracking-wider flex items-center gap-0.5 mb-0.5 justify-end">
                    <Clock className="w-2.5 h-2.5 text-purple-500 animate-spin-slow" />
                    {isPlaying ? t.playbackActive : t.playbackPaused}
                  </span>
                  <span className="text-[10px] font-bold text-stone-850">
                    {chronologicalEarthquakes[playbackIndex]
                      ? new Date(chronologicalEarthquakes[playbackIndex].time).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
                          month: "short",
                          day: "numeric"
                        })
                      : "..."}
                  </span>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="w-full flex items-center space-x-2.5">
                <input
                  type="range"
                  min={0}
                  max={chronologicalEarthquakes.length - 1}
                  value={playbackIndex}
                  onChange={(e) => {
                    setPlaybackIndex(parseInt(e.target.value));
                    setIsPlaying(false); // Stop playback upon manual seek
                  }}
                  className="flex-1 h-1 bg-stone-200 rounded-full appearance-none cursor-pointer accent-stone-900 hover:accent-stone-950 focus:outline-none"
                />
                <span className="text-[9px] text-stone-400 font-mono shrink-0">
                  {playbackIndex + 1}/{chronologicalEarthquakes.length}
                </span>
              </div>

              {/* Detailed Hour/Time line at the bottom */}
              <div className="text-[9px] text-stone-400 font-mono border-t border-stone-200/50 pt-1.5 flex justify-between w-full">
                <span>{locale === "id" ? "Waktu Kejadian:" : "Event Time:"}</span>
                <span className="font-bold text-stone-600">
                  {chronologicalEarthquakes[playbackIndex]
                    ? new Date(chronologicalEarthquakes[playbackIndex].time).toLocaleTimeString(locale === "id" ? "id-ID" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit"
                      }) + (locale === "id" ? " WIB" : " Local")
                    : "..."}
                </span>
              </div>
            </div>
          )}

          {/* 📊 Collapsible Statistics Dashboard Panel */}
          {showStatsDashboard && (
            <div className="pointer-events-auto bg-stone-50/95 backdrop-blur-md border border-stone-200/60 rounded-xl shadow-lg font-sans flex flex-col overflow-hidden animate-fadeIn">
              {/* Header */}
              <div 
                onClick={() => setStatsExpanded(!statsExpanded)}
                className="p-3.5 border-b border-stone-200/50 flex items-center justify-between cursor-pointer hover:bg-stone-100/50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-stone-700" />
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">
                    {t.statsDashboard}
                  </span>
                </div>
                <button className="text-stone-400 hover:text-stone-700">
                  {statsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>

              {/* Collapsible Content */}
              {statsExpanded && (
                <div className="p-4 space-y-4 max-h-[60vh] md:max-h-[380px] overflow-y-auto">
                  {/* Quick Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-stone-100/60 border border-stone-200/20 p-2.5 rounded-lg text-center font-mono">
                      <span className="text-[9px] text-stone-400 font-bold block uppercase">{t.totalEvents}</span>
                      <span className="text-lg font-bold text-stone-900">{statsTotal}</span>
                    </div>
                    <div className="bg-stone-100/60 border border-stone-200/20 p-2.5 rounded-lg text-center font-mono relative overflow-hidden">
                      <span className="text-[9px] text-stone-400 font-bold block uppercase">{t.maxMagnitude}</span>
                      <span className="text-lg font-bold text-rose-600">M {statsMaxMag > 0 ? statsMaxMag.toFixed(1) : "0.0"}</span>
                    </div>
                    <div className="bg-stone-100/60 border border-stone-200/20 p-2.5 rounded-lg text-center font-mono">
                      <span className="text-[9px] text-stone-400 font-bold block uppercase">{t.avgDepth}</span>
                      <span className="text-lg font-bold text-stone-850">{statsAvgDepth} km</span>
                    </div>
                    <div className="bg-stone-100/60 border border-stone-200/20 p-2.5 rounded-lg text-center font-mono">
                      <span className="text-[9px] text-stone-400 font-bold block uppercase">{t.tsunamiAlerts}</span>
                      <span className={`text-lg font-bold ${statsTsunami > 0 ? "text-red-500 animate-pulse font-bold" : "text-stone-500"}`}>
                        {statsTsunami}
                      </span>
                    </div>
                  </div>

                  {/* Sector Stress Distribution Chart */}
                  <div className="space-y-2 border-t border-stone-200/50 pt-3">
                    <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider font-mono block">
                      {t.sectorDist}
                    </span>
                    <div className="space-y-2 text-[10px]">
                      {[
                        { name: locale === "id" ? "Sektor Sumatra" : "Sumatra Sector", count: sectorSumatra, color: "bg-orange-500" },
                        { name: locale === "id" ? "Sektor Jawa" : "Java Sector", count: sectorJava, color: "bg-amber-500" },
                        { name: locale === "id" ? "Sektor Sulawesi" : "Sulawesi Sector", count: sectorSulawesi, color: "bg-rose-500" },
                        { name: locale === "id" ? "Laut Banda" : "Banda Sea", count: sectorBanda, color: "bg-red-500" },
                        { name: locale === "id" ? "Sektor Papua" : "Papua Sector", count: sectorPapua, color: "bg-stone-500" },
                      ].map((sector) => {
                        const percentage = statsTotal > 0 ? (sector.count / statsTotal) * 100 : 0;
                        return (
                          <div key={sector.name} className="space-y-1">
                            <div className="flex justify-between font-mono text-[9px] font-semibold text-stone-600">
                              <span>{sector.name}</span>
                              <span>{sector.count} ({Math.round(percentage)}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-stone-200/60 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${sector.color} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sparkling AI Briefing Trigger Button */}
                  <div className="pt-2 border-t border-stone-200/50">
                    <button
                      onClick={generateAIBriefing}
                      disabled={loadingBriefing}
                      className="w-full bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white hover:from-black hover:to-stone-950 font-sans text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center space-x-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all relative overflow-hidden group disabled:opacity-75 disabled:pointer-events-none"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow group-hover:scale-110 transition-transform" />
                      <span>
                        {loadingBriefing 
                          ? (locale === "id" ? "Menganalisis..." : "Analyzing...") 
                          : t.generateBriefing}
                      </span>
                      
                      {/* Subtle pulsing background glow */}
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none animate-pulse" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ✨ AI Briefing Report Markdown Modal */}
      {showBriefingModal && briefingContent && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm animate-fadeIn pointer-events-auto">
          <div className="bg-stone-50 border border-stone-250 rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden font-sans relative">
            
            {/* Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-100/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#cc785c] flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-stone-950 uppercase tracking-wider font-mono leading-none">
                    {t.briefingTitle}
                  </h3>
                  <p className="text-[9px] text-stone-400 font-mono mt-1">Google Gemini AI Engine</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBriefingModal(false)}
                className="p-1.5 rounded-md hover:bg-stone-200/80 text-stone-400 hover:text-stone-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Markdown Area */}
            <div className="p-6 flex-1 overflow-y-auto font-sans leading-relaxed text-xs md:text-sm text-stone-850 space-y-3">
              <div className="prose select-text space-y-3">
                {briefingContent.split("\n").map((line, idx) => {
                  const trimmed = line.trim();
                  
                  if (trimmed.startsWith("# ")) {
                    return <h1 key={idx} className="text-base font-bold font-serif text-stone-950 border-b border-stone-200 pb-1 mt-4">{trimmed.replace("# ", "")}</h1>;
                  }
                  if (trimmed.startsWith("## ")) {
                    return <h2 key={idx} className="text-xs font-bold font-serif text-stone-950 mt-3.5 flex items-center gap-1">{trimmed.replace("## ", "")}</h2>;
                  }
                  if (trimmed.startsWith("### ")) {
                    return <h3 key={idx} className="text-xs font-bold text-stone-900 mt-3">{trimmed.replace("### ", "")}</h3>;
                  }
                  if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                    const text = trimmed.substring(2);
                    return (
                      <li key={idx} className="ml-4 list-disc text-stone-700 py-0.5">
                        {renderBoldText(text)}
                      </li>
                    );
                  }
                  if (trimmed.startsWith("> [!")) {
                    return null;
                  }
                  if (line.startsWith("> *") || line.startsWith("> ")) {
                    return (
                      <blockquote key={idx} className="border-l-4 border-amber-400 bg-amber-50/50 p-2.5 rounded-r-lg text-[10px] text-amber-900 font-semibold italic my-2 leading-normal">
                        {renderBoldText(line.replace(/^>\s*\**|\**$/g, ""))}
                      </blockquote>
                    );
                  }
                  if (trimmed === "---") {
                    return <hr key={idx} className="border-t border-stone-200/80 my-3" />;
                  }
                  if (trimmed.length === 0) return null;

                  return <p key={idx} className="text-stone-600 text-xs leading-relaxed">{renderBoldText(line)}</p>;
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200 flex items-center justify-end space-x-2.5 bg-stone-100/30">
              <button
                onClick={copyBriefingText}
                className="px-4.5 py-1.5 border border-stone-250 hover:bg-stone-100 text-stone-700 font-bold text-[11px] rounded-lg flex items-center space-x-1.5 transition-all active:scale-95 shadow-sm"
              >
                {copiedBriefing ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowBriefingModal(false)}
                className="px-4.5 py-1.5 bg-stone-900 hover:bg-black text-white font-bold text-[11px] rounded-lg transition-all active:scale-95 shadow-sm"
              >
                {t.closeBriefing}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🔔 Floating top-center Absolute Toast Notifications Overlay */}
      {toastAlert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto bg-stone-50/95 backdrop-blur-md border border-red-200 p-4 rounded-xl shadow-xl w-[280px] font-sans flex flex-col space-y-2.5 animate-fadeIn border-l-4 border-l-red-500">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider font-mono">
                {toastAlert.tsunami ? t.alertTsunami : t.alertMajor}
              </span>
            </div>
            <button 
              onClick={() => setToastAlert(null)}
              className="text-stone-400 hover:text-stone-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="leading-tight space-y-0.5">
            <p className="text-xs font-bold text-stone-950 font-serif">M {toastAlert.mag.toFixed(1)} — {toastAlert.location}</p>
            <p className="text-[9px] text-stone-500 font-mono">
              {locale === "id" ? "Kedalaman: " : "Depth: "}{toastAlert.depth} km | {new Date(toastAlert.time).toLocaleTimeString(locale === "id" ? "id-ID" : "en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedEarthquake(toastAlert);
                setToastAlert(null); // dismiss
              }}
              className="flex-1 py-1 text-center bg-stone-950 hover:bg-black text-white rounded text-[10px] font-bold shadow-sm transition-all"
            >
              {t.focusMap}
            </button>
            <button
              onClick={() => setToastAlert(null)}
              className="py-1 px-2.5 border border-stone-200 hover:bg-stone-100 text-stone-600 rounded text-[10px] font-semibold transition-all"
            >
              {locale === "id" ? "Abaikan" : "Dismiss"}
            </button>
          </div>
        </div>
      )}

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

        </div>

      {/* Legend Overlay — Floating Top-Right on both Mobile and Desktop to avoid overlapping other panels */}
      {(showEarthquakes || showClimateRisk || showTectonicPlates || showHeatmap) && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[500] pointer-events-auto bg-stone-50/95 backdrop-blur-md border border-stone-200/60 p-3.5 rounded-xl shadow-lg text-stone-800 w-[180px] md:w-[210px] flex flex-col space-y-3 font-sans animate-fadeIn">
          {/* Legend Title / Collapsible Toggle */}
          <div 
            onClick={() => setLegendExpanded(!legendExpanded)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-stone-500 animate-spin-slow" />
              <span className="text-[11px] font-bold text-stone-900 uppercase tracking-wider font-mono">{t.legend}</span>
            </div>
            <button className="text-stone-400 hover:text-stone-700 transition-colors">
              {legendExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {legendExpanded && (
            <>
              {/* Magnitude vs Depth Legend */}
              {showEarthquakes && (
                <div className="space-y-1.5">
                  <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">
                    {colorMode === "depth" ? t.colorDepth : t.magnitude}
                  </span>
                  
                  {colorMode === "depth" ? (
                    <div className="flex flex-col gap-1 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-600" />
                        <span className="text-stone-600 font-medium">{t.shallow}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-orange-600" />
                        <span className="text-stone-600 font-medium">{t.intermediate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-sky-600" />
                        <span className="text-stone-600 font-medium">{t.deep}</span>
                      </div>
                    </div>
                  ) : (
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
                  )}
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

              {/* Tectonic Plates Legend */}
              {showTectonicPlates && (
                <div className="space-y-1.5 border-t border-stone-200/50 pt-2.5">
                  <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">{t.tectonicPlates}</span>
                  <div className="flex flex-col gap-1.5 text-[10px]">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 shrink-0">
                        <div className="w-2.5 h-[2px] bg-orange-500" />
                        <div className="w-1 h-[2px] bg-orange-500 opacity-40" />
                        <div className="w-1.5 h-[2px] bg-orange-500" />
                      </div>
                      <span className="text-stone-600 font-medium">{t.plateBoundary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-[1.5px] bg-rose-500 shrink-0" />
                      <span className="text-stone-600 font-medium">{t.faultLines}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Seismic Heatmap Legend */}
              {showHeatmap && (
                <div className="space-y-1.5 border-t border-stone-200/50 pt-2.5">
                  <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">{t.heatmapToggle}</span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="w-4 h-4 rounded bg-rose-600/20 border border-rose-500/10 shrink-0" />
                    <span className="text-stone-600 font-medium">{locale === "id" ? "Zona Stres Kepadatan" : "Seismic Density Hotspot"}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
