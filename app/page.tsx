"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import ControlSidebar, { MockEarthquake } from "./components/ControlSidebar";
import { Locale } from "./components/translations";

// Dynamically import the Leaflet Map with SSR disabled to prevent server-side compilation issues
const MapCanvas = dynamic(() => import("./components/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-stone-100/90 flex flex-col items-center justify-center text-stone-500 font-sans">
      <div className="flex flex-col items-center space-y-4">
        {/* Animated premium loading ring */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[3px] border-stone-200" />
          <div className="absolute inset-0 rounded-full border-[3px] border-stone-900 border-t-transparent animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <span className="text-xs font-bold font-mono tracking-widest uppercase text-stone-400 block">
            Initializing Map Engine
          </span>
          <span className="text-[10px] text-stone-400 font-mono">
            Loading interactive geographic overlays...
          </span>
        </div>
      </div>
    </div>
  )
});

export default function Home() {
  // Centralized Application State
  const [locale, setLocale] = useState<Locale>("id"); // Default to Indonesian
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [showEarthquakes, setShowEarthquakes] = useState<boolean>(true);
  const [earthquakeFilter, setEarthquakeFilter] = useState<"All" | "Mag 4+" | "Mag 6+">("All");
  const [showClimateRisk, setShowClimateRisk] = useState<boolean>(false);
  const [climateYear, setClimateYear] = useState<2026 | 2030 | 2040 | 2050>(2026);
  const [selectedEarthquake, setSelectedEarthquake] = useState<MockEarthquake | null>(null);

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
        />
      </main>
    </div>
  );
}
