"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ControlSidebar, { MockEarthquake } from "./components/ControlSidebar";
import { Locale } from "./components/translations";

const MapSkeleton = () => {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, 15000); // 15 seconds timeout
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-full flex bg-stone-50 relative select-none">
      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.8s infinite;
        }
      `}</style>

      {/* Skeleton Sidebar (Desktop) */}
      <div className="hidden md:flex flex-col w-[340px] h-full border-r border-stone-200 bg-stone-50 p-6 space-y-8 animate-pulse shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-stone-200 rounded-lg" />
          <div className="space-y-1.5 flex-1">
            <div className="w-24 h-4 bg-stone-200 rounded" />
            <div className="w-16 h-2 bg-stone-200 rounded" />
          </div>
        </div>
        <div className="h-px bg-stone-200" />
        <div className="space-y-4">
          <div className="w-32 h-3 bg-stone-200 rounded" />
          <div className="w-full h-8 bg-stone-100 rounded-lg" />
        </div>
        <div className="space-y-4">
          <div className="w-28 h-3 bg-stone-200 rounded" />
          <div className="w-full h-8 bg-stone-100 rounded-lg" />
        </div>
      </div>

      {/* Skeleton Map Canvas */}
      <div className="flex-1 h-full bg-stone-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
        <div className="absolute top-4 left-4 w-44 h-8 bg-stone-200 rounded-lg animate-pulse" />
        <div className="absolute top-4 right-4 w-40 h-28 bg-stone-200 rounded-xl animate-pulse" />

        <div className="absolute inset-0 flex items-center justify-center bg-stone-100/50 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-2xl shadow-xl max-w-sm text-center border border-stone-200">
            {!showRetry ? (
              <>
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-stone-200" />
                  <div className="absolute inset-0 rounded-full border-2 border-stone-900 border-t-transparent animate-spin" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase text-stone-600 block">
                    Memuat Peta Seismik...
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    Sedang menginisialisasi modul peta interaktif...
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <svg className="w-6 h-6 text-red-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase text-red-500 block">
                    Koneksi Lambat
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono leading-relaxed">
                    Modul peta membutuhkan waktu lama untuk memuat. Coba muat ulang halaman.
                  </span>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white font-bold text-xs rounded-lg shadow transition-all"
                >
                  Muat Ulang Halaman
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Dynamically import the Leaflet Map with SSR disabled
const MapCanvas = dynamic(() => import("./components/MapCanvas"), {
  ssr: false,
  loading: () => <MapSkeleton />
});

export default function Home() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }
  }, []);

  // Centralized Application State
  const [locale, setLocale] = useState<Locale>("id"); // Default to Indonesian
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [showEarthquakes, setShowEarthquakes] = useState<boolean>(true);
  const [earthquakeFilter, setEarthquakeFilter] = useState<"All" | "Mag 4+" | "Mag 6+">("All");
  const [showClimateRisk, setShowClimateRisk] = useState<boolean>(false);
  const [climateYear, setClimateYear] = useState<2026 | 2030 | 2040 | 2050>(2026);
  const [selectedEarthquake, setSelectedEarthquake] = useState<MockEarthquake | null>(null);
  const [showTectonicPlates, setShowTectonicPlates] = useState<boolean>(false);

  // New Feature States
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [showTimeTravel, setShowTimeTravel] = useState<boolean>(false);
  const [showStatsDashboard, setShowStatsDashboard] = useState<boolean>(false);

  // Final Feature States
  const [dataSource, setDataSource] = useState<"usgs" | "bmkg">("usgs");
  const [colorMode, setColorMode] = useState<"magnitude" | "depth">("magnitude");
  
  // Shared Earthquakes Pool for Sidebar Event List Panel
  const [earthquakesPool, setEarthquakesPool] = useState<MockEarthquake[]>([]);

  return (
    <div className="flex w-full h-full overflow-hidden bg-stone-50 relative select-none">
      {/* 1. Claude-style Control Sidebar Panel */}
      <ControlSidebar
        locale={locale}
        setLocale={setLocale}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        showEarthquakes={showEarthquakes}
        setShowEarthquakes={setShowEarthquakes}
        earthquakeFilter={earthquakeFilter}
        setEarthquakeFilter={setEarthquakeFilter}
        showClimateRisk={showClimateRisk}
        setShowClimateRisk={setShowClimateRisk}
        climateYear={climateYear}
        setClimateYear={setClimateYear}
        selectedEarthquake={selectedEarthquake}
        setSelectedEarthquake={setSelectedEarthquake}
        showTectonicPlates={showTectonicPlates}
        setShowTectonicPlates={setShowTectonicPlates}
        // New features
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        showTimeTravel={showTimeTravel}
        setShowTimeTravel={setShowTimeTravel}
        showStatsDashboard={showStatsDashboard}
        setShowStatsDashboard={setShowStatsDashboard}
        // Final features
        dataSource={dataSource}
        setDataSource={setDataSource}
        colorMode={colorMode}
        setColorMode={setColorMode}
        earthquakes={earthquakesPool}
      />

      {/* 2. Right Map Canvas Area */}
      <main className="flex-1 h-full relative overflow-hidden bg-slate-100">
        <MapCanvas
          locale={locale}
          sidebarCollapsed={sidebarCollapsed}
          showEarthquakes={showEarthquakes}
          earthquakeFilter={earthquakeFilter}
          showClimateRisk={showClimateRisk}
          climateYear={climateYear}
          selectedEarthquake={selectedEarthquake}
          setSelectedEarthquake={setSelectedEarthquake}
          showTectonicPlates={showTectonicPlates}
          // New features
          showHeatmap={showHeatmap}
          setShowHeatmap={setShowHeatmap}
          showTimeTravel={showTimeTravel}
          setShowTimeTravel={setShowTimeTravel}
          showStatsDashboard={showStatsDashboard}
          setShowStatsDashboard={setShowStatsDashboard}
          // Final features
          dataSource={dataSource}
          setDataSource={setDataSource}
          colorMode={colorMode}
          setColorMode={setColorMode}
          onDataLoaded={setEarthquakesPool}
        />
      </main>
    </div>
  );
}
