"use client";

import { 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Thermometer, 
  AlertTriangle, 
  Waves,
  MapPin,
  Clock,
  Compass,
  Layers,
  Mountain,
  Flame,
  History,
  BarChart3,
  Database,
  Map
} from "lucide-react";
import { Locale, translations } from "./translations";

export interface MockEarthquake {
  id: string;
  lat: number;
  lng: number;
  mag: number;
  depth: number;
  location: string;
  time: string;
  tsunami: boolean;
}

interface ControlSidebarProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  showEarthquakes: boolean;
  setShowEarthquakes: (show: boolean) => void;
  earthquakeFilter: "All" | "Mag 4+" | "Mag 6+";
  setEarthquakeFilter: (filter: "All" | "Mag 4+" | "Mag 6+") => void;
  showClimateRisk: boolean;
  setShowClimateRisk: (show: boolean) => void;
  climateYear: 2026 | 2030 | 2040 | 2050;
  setClimateYear: (year: 2026 | 2030 | 2040 | 2050) => void;
  selectedEarthquake: MockEarthquake | null;
  setSelectedEarthquake: (eq: MockEarthquake | null) => void;
  showTectonicPlates: boolean;
  setShowTectonicPlates: (show: boolean) => void;
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
  earthquakes: MockEarthquake[];
}

export default function ControlSidebar({
  locale,
  setLocale,
  sidebarCollapsed,
  setSidebarCollapsed,
  showEarthquakes,
  setShowEarthquakes,
  earthquakeFilter,
  setEarthquakeFilter,
  showClimateRisk,
  setShowClimateRisk,
  climateYear,
  setClimateYear,
  selectedEarthquake,
  setSelectedEarthquake,
  showTectonicPlates,
  setShowTectonicPlates,
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
  earthquakes
}: ControlSidebarProps) {
  
  const years: (2026 | 2030 | 2040 | 2050)[] = [2026, 2030, 2040, 2050];
  const t = translations[locale];

  // Helper to get color code based on climate risk year severity progression
  const getYearColor = (yr: number) => {
    switch (yr) {
      case 2026: return "bg-emerald-500 text-emerald-500 border-emerald-500/20";
      case 2030: return "bg-amber-500 text-amber-500 border-amber-500/20";
      case 2040: return "bg-orange-500 text-orange-500 border-orange-500/20";
      case 2050: return "bg-rose-500 text-rose-500 border-rose-500/20";
      default: return "bg-stone-500 text-stone-500";
    }
  };

  // Filter local copy of earthquakes for the sidebar compact feed
  const filteredEvents = earthquakes.filter((eq) => {
    if (earthquakeFilter === "Mag 4+") return eq.mag >= 4.0;
    if (earthquakeFilter === "Mag 6+") return eq.mag >= 6.0;
    return true;
  });

  // Calculate compact marker color based on magnitude or depth for feed integration
  const getBadgeStyle = (eq: MockEarthquake) => {
    if (colorMode === "depth") {
      const depth = eq.depth;
      if (depth < 30) {
        return "bg-rose-600 border-rose-500/20 text-white";
      } else if (depth < 150) {
        return "bg-orange-500 border-orange-400/20 text-white";
      } else {
        return "bg-sky-600 border-sky-500/20 text-white";
      }
    } else {
      const mag = eq.mag;
      if (eq.tsunami) {
        return "bg-red-600 border-red-500/20 text-white animate-pulse";
      } else if (mag >= 6.0) {
        return "bg-rose-600 border-rose-500/20 text-white";
      } else if (mag >= 5.0) {
        return "bg-amber-600 border-amber-500/20 text-white";
      } else {
        return "bg-stone-600 border-stone-500/20 text-white";
      }
    }
  };

  return (
    <div className="relative flex h-full select-none z-[1001]">
      {/* Sidebar Panel Container */}
      <div
        className={`h-full bg-stone-50/95 backdrop-blur-md border-r border-stone-200/60 transition-all duration-300 ease-in-out flex flex-col shadow-xl shadow-stone-900/5 ${
          sidebarCollapsed ? "w-0 overflow-hidden border-r-0" : "w-[340px]"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-200/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#cc785c] flex items-center justify-center text-stone-50 shadow-md">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-950 font-serif leading-none">
                Waspadagempa
              </h1>
              <p className="text-[10px] text-stone-500 mt-1 uppercase tracking-wider font-semibold font-mono">
                {t.subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Elegant Language Pill Switcher */}
            <div className="flex bg-stone-100 p-0.5 rounded-md border border-stone-200/40 text-[10px] font-mono font-bold">
              <button
                onClick={() => setLocale("id")}
                className={`px-1.5 py-0.5 rounded transition-all duration-150 active:scale-95 ${
                  locale === "id"
                    ? "bg-white text-stone-950 shadow-sm border border-stone-200/10 font-bold"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                ID
              </button>
              <button
                onClick={() => setLocale("en")}
                className={`px-1.5 py-0.5 rounded transition-all duration-150 active:scale-95 ${
                  locale === "en"
                    ? "bg-white text-stone-950 shadow-sm border border-stone-200/10 font-bold"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1.5 rounded-md hover:bg-stone-200/50 text-stone-500 hover:text-stone-800 transition-all active:scale-95"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Earthquake Monitor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`p-1.5 rounded-md transition-colors ${showEarthquakes ? "bg-red-50 text-red-600" : "bg-stone-100 text-stone-400"}`}>
                  <Activity className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-stone-800 font-sans">{t.earthquakeMonitor}</span>
              </div>
              
              {/* Elegant Custom Switch */}
              <button
                onClick={() => setShowEarthquakes(!showEarthquakes)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  showEarthquakes ? "bg-stone-900" : "bg-stone-200"
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${
                    showEarthquakes ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {showEarthquakes && (
              <div className="pl-8 pt-1 space-y-4 animate-fadeIn">
                {/* 🌊 Segmented Data Source Controller */}
                <div className="space-y-2">
                  <span className="text-[11px] text-stone-500 uppercase font-bold tracking-wider block flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-stone-400" />
                    {t.dataSource}
                  </span>
                  <div className="flex gap-1.5 bg-stone-100/80 p-1 rounded-lg border border-stone-200/40 font-mono">
                    <button
                      onClick={() => setDataSource("usgs")}
                      className={`flex-1 text-[10px] text-center py-1 rounded-md transition-all duration-200 ${
                        dataSource === "usgs"
                          ? "bg-white text-stone-950 shadow-sm border border-stone-200/20 font-bold"
                          : "text-stone-400 hover:text-stone-700"
                      }`}
                    >
                      USGS (Global)
                    </button>
                    <button
                      onClick={() => setDataSource("bmkg")}
                      className={`flex-1 text-[10px] text-center py-1 rounded-md transition-all duration-200 ${
                        dataSource === "bmkg"
                          ? "bg-white text-stone-950 shadow-sm border border-stone-200/20 font-bold"
                          : "text-stone-400 hover:text-stone-700"
                      }`}
                    >
                      BMKG (Official)
                    </button>
                  </div>
                </div>

                {/* Magnitude Filter */}
                <div className="space-y-2">
                  <span className="text-[11px] text-stone-500 uppercase font-bold tracking-wider block">
                    {t.magnitudeFilter}
                  </span>
                  <div className="flex gap-1.5 bg-stone-100/80 p-1 rounded-lg border border-stone-200/40">
                    {(["All", "Mag 4+", "Mag 6+"] as const).map((filter) => {
                      const active = earthquakeFilter === filter;
                      return (
                        <button
                          key={filter}
                          onClick={() => setEarthquakeFilter(filter)}
                          className={`flex-1 text-center py-1 px-1.5 text-[10px] font-medium rounded-md transition-all duration-200 ${
                            active
                              ? "bg-white text-stone-950 shadow-sm border border-stone-200/20 font-semibold"
                              : "text-stone-500 hover:text-stone-800 hover:bg-white/40"
                          }`}
                        >
                          {filter === "All" ? t.all : filter}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 🎨 Map Color Mode Selector */}
                <div className="space-y-2">
                  <span className="text-[11px] text-stone-500 uppercase font-bold tracking-wider block flex items-center gap-1.5">
                    <Map className="w-3.5 h-3.5 text-stone-400" />
                    {t.colorMode}
                  </span>
                  <div className="flex gap-1.5 bg-stone-100/80 p-1 rounded-lg border border-stone-200/40">
                    <button
                      onClick={() => setColorMode("magnitude")}
                      className={`flex-1 text-[10px] text-center py-1.5 rounded-md transition-all duration-200 ${
                        colorMode === "magnitude"
                          ? "bg-white text-stone-950 shadow-sm border border-stone-200/20 font-semibold"
                          : "text-stone-500 hover:text-stone-850"
                      }`}
                    >
                      {t.colorMag}
                    </button>
                    <button
                      onClick={() => setColorMode("depth")}
                      className={`flex-1 text-[10px] text-center py-1.5 rounded-md transition-all duration-200 ${
                        colorMode === "depth"
                          ? "bg-white text-stone-950 shadow-sm border border-stone-200/20 font-semibold"
                          : "text-stone-500 hover:text-stone-850"
                      }`}
                    >
                      {t.colorDepth}
                    </button>
                  </div>
                </div>

                {/* 📋 Compact Seismic Event Feed Panel */}
                <div className="space-y-2 border-t border-stone-200/40 pt-4">
                  <span className="text-[11px] text-stone-500 uppercase font-bold tracking-wider block font-mono">
                    {t.eventList} ({filteredEvents.length})
                  </span>
                  <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {filteredEvents.length === 0 ? (
                      <p className="text-[11px] text-stone-400 font-semibold italic text-center py-4 bg-stone-100/30 rounded-lg">
                        {locale === "id" ? "Tidak ada gempa terdeteksi" : "No seismic events detected"}
                      </p>
                    ) : (
                      filteredEvents.map((eq) => (
                        <div 
                          key={eq.id}
                          onClick={() => setSelectedEarthquake(eq)}
                          className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                            selectedEarthquake?.id === eq.id
                              ? "bg-stone-950 text-stone-100 border-stone-950 shadow-md scale-[1.01]"
                              : "bg-stone-100/50 hover:bg-stone-100 text-stone-700 border-stone-200/40"
                          }`}
                        >
                          <div className="flex items-center space-x-2 overflow-hidden">
                            {/* Mag/Depth Badge */}
                            <div className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-sm ${getBadgeStyle(eq)}`}>
                              {eq.mag.toFixed(1)}
                            </div>
                            <div className="overflow-hidden leading-tight">
                              <p className={`text-[10px] font-bold truncate ${selectedEarthquake?.id === eq.id ? "text-stone-50" : "text-stone-850"}`}>
                                {eq.location.split(" of ")[1] || eq.location}
                              </p>
                              <span className="text-[9px] text-stone-400 font-mono">
                                {new Date(eq.time).toLocaleTimeString(locale === "id" ? "id-ID" : "en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })} ({eq.depth} km)
                              </span>
                            </div>
                          </div>

                          <button 
                            className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border transition-colors shrink-0 ${
                              selectedEarthquake?.id === eq.id
                                ? "border-stone-800 text-stone-400 bg-stone-900"
                                : "border-stone-200 text-stone-500 bg-white"
                            }`}
                          >
                            {t.focusMap}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-stone-200/50" />

          {/* Section 2: Climate Risk */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`p-1.5 rounded-md transition-colors ${showClimateRisk ? "bg-amber-50 text-amber-600" : "bg-stone-100 text-stone-400"}`}>
                  <Thermometer className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-stone-800 font-sans">{t.climateRisk}</span>
              </div>
              
              {/* Elegant Custom Switch */}
              <button
                onClick={() => setShowClimateRisk(!showClimateRisk)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  showClimateRisk ? "bg-stone-900" : "bg-stone-200"
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${
                    showClimateRisk ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {showClimateRisk && (
              <div className="pl-8 pt-1 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-500 uppercase font-bold tracking-wider">
                    {t.projectionYear}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${getYearColor(climateYear)} bg-white shadow-sm`}>
                    {climateYear}
                  </span>
                </div>

                {/* Minimalist Horizontal Slider */}
                <div className="relative pt-3 pb-2 px-1">
                  {/* Slider Track */}
                  <div className="absolute top-[17px] left-2 right-2 h-1 bg-stone-200 rounded-full" />
                  
                  {/* Active sliding line */}
                  <div 
                    className="absolute top-[17px] left-2 h-1 bg-stone-900 rounded-full transition-all duration-300"
                    style={{
                      width: `${(years.indexOf(climateYear) / (years.length - 1)) * 100}%`
                    }}
                  />

                  {/* Year marker dots */}
                  <div className="flex justify-between relative z-10">
                    {years.map((year) => {
                      const isSelected = climateYear === year;
                      return (
                        <button
                          key={year}
                          onClick={() => setClimateYear(year)}
                          className="flex flex-col items-center group focus:outline-none"
                        >
                          {/* Pin dot */}
                          <div 
                            className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm ${
                              isSelected 
                                ? "bg-stone-950 border-stone-950 scale-125" 
                                : "bg-stone-50 border-stone-300 hover:border-stone-400 group-hover:scale-110"
                            }`}
                          />
                          {/* Label */}
                          <span 
                            className={`text-[10px] mt-2 font-mono transition-all font-semibold ${
                              isSelected 
                                ? "text-stone-950 font-bold" 
                                : "text-stone-400 group-hover:text-stone-600"
                            }`}
                          >
                            {year}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Small indicator card explaining the selected year risk */}
                <div className="bg-stone-100/50 p-3 rounded-lg border border-stone-200/30 text-stone-600 text-xs leading-relaxed">
                  {climateYear === 2026 && <p>{t.climate2026}</p>}
                  {climateYear === 2030 && <p>{t.climate2030}</p>}
                  {climateYear === 2040 && <p>{t.climate2040}</p>}
                  {climateYear === 2050 && <p>{t.climate2050}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-stone-200/50" />

          {/* Section 3: Tectonic Plates & Fault Lines */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`p-1.5 rounded-md transition-colors ${showTectonicPlates ? "bg-orange-50 text-orange-600" : "bg-stone-100 text-stone-400"}`}>
                  <Mountain className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-stone-800 font-sans">{t.tectonicPlates}</span>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => setShowTectonicPlates(!showTectonicPlates)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  showTectonicPlates ? "bg-stone-900" : "bg-stone-200"
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${
                    showTectonicPlates ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {showTectonicPlates && (
              <div className="pl-8 pt-1 space-y-3 animate-fadeIn">
                <p className="text-[11px] text-stone-500 leading-relaxed">{t.tectonicDesc}</p>
                <div className="space-y-2">
                  {/* Plate boundaries */}
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] text-orange-500 uppercase font-bold tracking-wider shrink-0">{t.plateBoundary}</span>
                  </div>
                  {[
                    { label: t.sundaTrench, color: "bg-orange-400" },
                    { label: t.bandaArc, color: "bg-orange-300" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-[10px] text-stone-600">
                      <div className="flex items-center gap-0.5">
                        <div className={`w-3 h-[2px] ${item.color}`} />
                        <div className={`w-1.5 h-[2px] ${item.color} opacity-50`} />
                        <div className={`w-1 h-[2px] ${item.color}`} />
                      </div>
                      <span>{item.label}</span>
                    </div>
                  ))}

                  {/* Fault lines */}
                  <div className="flex items-center space-x-1.5 pt-1">
                    <span className="text-[9px] text-rose-500 uppercase font-bold tracking-wider shrink-0">{t.faultLines}</span>
                  </div>
                  {[
                    { label: t.sumatraFault },
                    { label: t.paluFault },
                    { label: t.floresThrust },
                    { label: t.sorong },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-[10px] text-stone-600">
                      <div className="w-5 h-[1.5px] bg-rose-500" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-stone-200/50" />

          {/* Section 4: Advanced Analysis */}
          <div className="space-y-4">
            <span className="text-[10px] text-stone-400 uppercase font-mono font-bold tracking-widest block mb-1">
              {locale === "id" ? "Analisis Tingkat Lanjut" : "Advanced Analysis"}
            </span>

            {/* Heatmap Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`p-1.5 rounded-md transition-colors ${showHeatmap ? "bg-orange-50 text-orange-600" : "bg-stone-100 text-stone-400"}`}>
                  <Flame className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-stone-800 font-sans">{t.heatmap}</span>
                </div>
              </div>

              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  showHeatmap ? "bg-stone-900" : "bg-stone-200"
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${
                    showHeatmap ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Time Travel Playback Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`p-1.5 rounded-md transition-colors ${showTimeTravel ? "bg-purple-50 text-purple-600" : "bg-stone-100 text-stone-400"}`}>
                  <History className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-stone-800 font-sans">{t.timeTravel}</span>
                </div>
              </div>

              <button
                onClick={() => setShowTimeTravel(!showTimeTravel)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  showTimeTravel ? "bg-stone-900" : "bg-stone-200"
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${
                    showTimeTravel ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Statistics Dashboard Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`p-1.5 rounded-md transition-colors ${showStatsDashboard ? "bg-emerald-50 text-emerald-600" : "bg-stone-100 text-stone-400"}`}>
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-stone-800 font-sans">{t.statsDashboard}</span>
                </div>
              </div>

              <button
                onClick={() => setShowStatsDashboard(!showStatsDashboard)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  showStatsDashboard ? "bg-stone-900" : "bg-stone-200"
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${
                    showStatsDashboard ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Detail Card Space (Condition: Selected Earthquake Details) */}
          {selectedEarthquake && (
            <div className="space-y-4 animate-fadeIn border-t border-stone-200/50 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-stone-500 uppercase font-bold tracking-wider">
                  {t.seismicDetails}
                </span>
                <button
                  onClick={() => setSelectedEarthquake(null)}
                  className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors font-medium"
                >
                  {t.clearSelection}
                </button>
              </div>

              {/* Detail Card */}
              <div className="bg-stone-900 text-stone-100 rounded-xl p-4.5 space-y-4 relative overflow-hidden shadow-lg border border-stone-850">
                {/* Background overlay design element */}
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
                  <Activity className="w-36 h-36 stroke-[1px]" />
                </div>

                {/* Magnitude Badge and Epicenter */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-stone-400 text-[10px] font-semibold uppercase tracking-wider">
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span>
                        {selectedEarthquake.location.split(" of ")[1] || 
                          (locale === "id" ? "Wilayah Indonesia" : "Indonesia Region")}
                      </span>
                    </div>
                    <h3 className="text-base font-bold font-serif leading-tight">
                      {selectedEarthquake.location}
                    </h3>
                  </div>
                  
                  {/* Magnitude indicator pill */}
                  <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg text-white font-mono font-bold shadow-md shadow-black/10 ${
                    selectedEarthquake.mag >= 6 
                      ? "bg-rose-600 border border-rose-500/20" 
                      : selectedEarthquake.mag >= 5 
                        ? "bg-amber-600 border border-amber-500/20" 
                        : "bg-stone-700 border border-stone-600/20"
                  }`}>
                    <span className="text-[10px] uppercase font-bold opacity-75 leading-none mb-0.5">M</span>
                    <span className="text-lg leading-none">{selectedEarthquake.mag.toFixed(1)}</span>
                  </div>
                </div>

                {/* Subdetails Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-stone-800/80 pt-3.5 relative z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] text-stone-400 font-semibold block uppercase tracking-wider font-mono">{t.depth}</span>
                    <span className="font-semibold text-stone-100 font-mono">{selectedEarthquake.depth} km</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-stone-400 font-semibold block uppercase tracking-wider font-mono">{t.tsunami}</span>
                    <span className="font-semibold flex items-center space-x-1 font-mono">
                      {selectedEarthquake.tsunami ? (
                        <>
                          <Waves className="w-3.5 h-3.5 text-blue-400 inline" />
                          <span className="text-blue-400 font-bold">{t.tsunamiWarning}</span>
                        </>
                      ) : (
                        <span className="text-stone-400">{t.none}</span>
                      )}
                    </span>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <span className="text-[10px] text-stone-400 font-semibold block uppercase tracking-wider font-mono">{t.occurrenceTime}</span>
                    <span className="font-mono text-stone-300 flex items-center space-x-1.5">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{new Date(selectedEarthquake.time).toLocaleString(locale === "id" ? "id-ID" : "en-US", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}</span>
                    </span>
                  </div>
                </div>

                {/* Warnings or Extra Details */}
                {selectedEarthquake.mag >= 6 && (
                  <div className="bg-rose-950/45 border border-rose-800/30 rounded-lg p-2.5 flex items-start space-x-2 text-[11px] text-rose-300 relative z-10">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="leading-normal">
                      {t.seismicWarning}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100/50 border-t border-stone-200/40 text-[11px] text-stone-400 flex items-center justify-between px-6 font-mono">
          <div className="flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5" />
            <span>{t.mapLayers}</span>
          </div>
          <span>v1.2.0</span>
        </div>
      </div>

      {/* Floating Toggle Button when Sidebar is Collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="absolute left-4 top-4 w-10 h-10 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-800 shadow-md border border-stone-200 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-40 focus:outline-none"
          title="Expand Sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
