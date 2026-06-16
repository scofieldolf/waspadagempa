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

interface BMKGGempaItem {
  DateTime?: string;
  Coordinates?: string;
  Magnitude?: string;
  Kedalaman?: string;
  Wilayah?: string;
  Potensi?: string;
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

// In-Memory cache state variables for BMKG feed
let cachedBmkgData: NormalizedEarthquake[] | null = null;
let lastFetchedBmkgTime: number = 0;
const CACHE_DURATION_BMKG = 5 * 60 * 1000; // 5 minutes in milliseconds

const BMKG_API_URL = "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json";

export async function GET() {
  const currentTime = Date.now();
  const cacheAge = currentTime - lastFetchedBmkgTime;

  // 1. Check if cache exists and is still valid (less than 5 minutes old)
  if (cachedBmkgData && cacheAge < CACHE_DURATION_BMKG) {
    return NextResponse.json(cachedBmkgData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "HIT",
        "X-Cache-Age-Seconds": Math.round(cacheAge / 1000).toString(),
        "X-Cache-Source": "BMKG",
      },
    });
  }

  try {
    // 2. Fetch fresh data from BMKG
    const response = await fetch(BMKG_API_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from BMKG: status ${response.status}`);
    }

    const rawData = await response.json();
    
    // 3. Data Sanitization & Normalization
    const gempas: BMKGGempaItem[] = rawData?.Infogempa?.gempa || [];
    const normalizedData = gempas.map((item: BMKGGempaItem): NormalizedEarthquake => {
      // Split coordinate strings e.g. "-6.45,101.25"
      const coords = (item.Coordinates || "0,0").split(",");
      const lat = parseFloat(coords[0]) || 0;
      const lng = parseFloat(coords[1]) || 0;

      const mag = parseFloat(item.Magnitude || "0") || 0;

      // Extract depth integer from string like "12 km"
      const depth = parseInt((item.Kedalaman || "0").replace(/\D/g, "")) || 0;

      // Determine tsunami alert: if "potensi" contains "tsunami" and NOT "tidak"
      const potensi = (item.Potensi || "").toLowerCase();
      const tsunami = potensi.includes("tsunami") && !potensi.includes("tidak");

      // Generate unique ID based on date-time and coordinates
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

    // 4. Update the global cache variables
    cachedBmkgData = normalizedData;
    lastFetchedBmkgTime = currentTime;

    return NextResponse.json(normalizedData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MISS",
        "X-Cache-Source": "BMKG",
      },
    });

  } catch (error) {
    console.error("BMKG API fetch failed, trying USGS failover...", error);

    try {
      const usgsRes = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson");
      if (usgsRes.ok) {
        const usgsData = await usgsRes.json();
        const features = usgsData.features || [];
        const normalizedData: NormalizedEarthquake[] = (features as USGSFeature[])
          .map((feat: USGSFeature): NormalizedEarthquake => {
            const coords = feat.geometry?.coordinates || [0, 0, 0];
            const properties = feat.properties || {};
            const timeVal = properties.time ? new Date(properties.time).toISOString() : new Date().toISOString();
            return {
              id: feat.id || Math.random().toString(36).substring(2, 9),
              lat: coords[1],
              lng: coords[0],
              mag: properties.mag || 0,
              location: properties.place || "Unknown Location",
              time: timeVal,
              tsunami: properties.tsunami === 1,
              depth: coords[2] || 0
            };
          })
          .filter((eq: NormalizedEarthquake) =>
            eq.lat >= -11 && eq.lat <= 6 && eq.lng >= 95 && eq.lng <= 141
          );

        cachedBmkgData = normalizedData;
        lastFetchedBmkgTime = currentTime;

        return NextResponse.json(normalizedData, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Cache": "FAILOVER",
            "X-Cache-Source": "USGS",
          },
        });
      }
    } catch (usgsError) {
      console.error("USGS failover fetch also failed:", usgsError);
    }

    // 5. Resilient Fallback to cached data if exists
    if (cachedBmkgData) {
      return NextResponse.json(cachedBmkgData, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "FALLBACK",
          "X-Cache-Source": "BMKG",
          "X-Cache-Fallback-Reason": error instanceof Error ? error.message : "Fetch Failed",
        },
      });
    }

    // 6. Complete failure case (no cache exists at all)
    return NextResponse.json(
      { 
        error: "Seismic API BMKG Unavailable", 
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
