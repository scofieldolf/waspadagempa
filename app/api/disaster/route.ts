import { NextResponse } from "next/server";

export interface NormalizedEarthquake {
  id: string;
  lat: number;
  lng: number;
  mag: number;
  location: string;
  time: string;
  tsunami: boolean;
  depth: number;
}

interface USGSFeature {
  id?: string;
  geometry?: {
    coordinates?: [number, number, number];
  };
  properties?: {
    mag?: number;
    place?: string;
    time?: number;
    tsunami?: number;
  };
}

interface BMKGGempaItem {
  DateTime?: string;
  Coordinates?: string;
  Magnitude?: string;
  Kedalaman?: string;
  Wilayah?: string;
  Potensi?: string;
}

// In-Memory cache state variables for both Day and Week periods
let cachedDayData: NormalizedEarthquake[] | null = null;
let lastFetchedDayTime: number = 0;

let cachedWeekData: NormalizedEarthquake[] | null = null;
let lastFetchedWeekTime: number = 0;

const CACHE_DURATION_DAY = 10 * 60 * 1000;  // 10 minutes
const CACHE_DURATION_WEEK = 15 * 60 * 1000; // 15 minutes

const USGS_DAY_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
const USGS_WEEK_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "day";
    const isWeek = period === "week";

    const currentTime = Date.now();
    const cacheAge = currentTime - (isWeek ? lastFetchedWeekTime : lastFetchedDayTime);
    const cacheDuration = isWeek ? CACHE_DURATION_WEEK : CACHE_DURATION_DAY;
    const activeCache = isWeek ? cachedWeekData : cachedDayData;

    // 1. Check if cache exists and is still valid
    if (activeCache && cacheAge < cacheDuration) {
      return NextResponse.json(activeCache, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "HIT",
          "X-Cache-Age-Seconds": Math.round(cacheAge / 1000).toString(),
          "X-Cache-Period": period,
        },
      });
    }

    // 2. Fetch fresh data from USGS
    const fetchUrl = isWeek ? USGS_WEEK_URL : USGS_DAY_URL;
    const response = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from USGS: status ${response.status}`);
    }

    const rawData = await response.json();
    
    // 3. Data Sanitization & Normalization
    const features = rawData.features || [];
    const normalizedData: NormalizedEarthquake[] = (features as USGSFeature[]).map((feat: USGSFeature): NormalizedEarthquake => {
      const coordinates = feat.geometry?.coordinates || [0, 0, 0];
      const properties = feat.properties || {};
      const timeVal = properties.time ? new Date(properties.time).toISOString() : new Date().toISOString();

      return {
        id: feat.id || Math.random().toString(36).substring(2, 9),
        lat: coordinates[1], // Latitude
        lng: coordinates[0], // Longitude
        mag: properties.mag || 0,
        location: properties.place || "Unknown Location",
        time: timeVal,
        tsunami: properties.tsunami === 1,
        depth: coordinates[2] || 0
      };
    });

    // 4. Update the global cache variables
    if (isWeek) {
      cachedWeekData = normalizedData;
      lastFetchedWeekTime = currentTime;
    } else {
      cachedDayData = normalizedData;
      lastFetchedDayTime = currentTime;
    }

    return NextResponse.json(normalizedData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MISS",
        "X-Cache-Period": period,
      },
    });

  } catch (error) {
    console.error("USGS API fetch failed, trying BMKG failover...", error);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "day";
    const isWeek = period === "week";
    const activeCache = isWeek ? cachedWeekData : cachedDayData;
    const currentTime = Date.now();

    try {
      const bmkgRes = await fetch("https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json");
      if (bmkgRes.ok) {
        const rawData = await bmkgRes.json();
        const gempas: BMKGGempaItem[] = rawData?.Infogempa?.gempa || [];
        const normalizedData: NormalizedEarthquake[] = gempas.map((item: BMKGGempaItem): NormalizedEarthquake => {
          const coords = (item.Coordinates || "0,0").split(",");
          const lat = parseFloat(coords[0]) || 0;
          const lng = parseFloat(coords[1]) || 0;
          const mag = parseFloat(item.Magnitude || "0") || 0;
          const depth = parseInt((item.Kedalaman || "0").replace(/\D/g, "")) || 0;
          const potensi = (item.Potensi || "").toLowerCase();
          const tsunami = potensi.includes("tsunami") && !potensi.includes("tidak");
          const id = item.DateTime ? `bmkg-${item.DateTime.replace(/\D/g, "")}` : Math.random().toString(36).substring(2, 9);

          return {
            id,
            lat,
            lng,
            mag,
            location: item.Wilayah || "Unknown Location",
            time: item.DateTime || new Date().toISOString(),
            tsunami,
            depth
          };
        });

        if (isWeek) {
          cachedWeekData = normalizedData;
          lastFetchedWeekTime = currentTime;
        } else {
          cachedDayData = normalizedData;
          lastFetchedDayTime = currentTime;
        }

        return NextResponse.json(normalizedData, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Cache": "FAILOVER",
            "X-Cache-Source": "BMKG",
            "X-Cache-Period": period,
          },
        });
      }
    } catch (bmkgError) {
      console.error("BMKG failover fetch also failed:", bmkgError);
    }

    // 5. Resilient Fallback mechanism
    if (activeCache) {
      return NextResponse.json(activeCache, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "FALLBACK",
          "X-Cache-Period": period,
          "X-Cache-Fallback-Reason": error instanceof Error ? error.message : "Fetch Failed",
        },
      });
    }

    // 6. Complete failure case
    return NextResponse.json(
      { 
        error: "Seismic API Unavailable", 
        message: error instanceof Error ? error.message : "Unknown error encountered" 
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "BYPASS_ERROR"
        }
      }
    );
  }
}
