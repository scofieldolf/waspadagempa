import { NextResponse } from "next/server";

// In-Memory cache state variables for BMKG feed
let cachedBmkgData: any = null;
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
    const gempas = rawData?.Infogempa?.gempa || [];
    const normalizedData = gempas.map((item: any) => {
      // Split coordinate strings e.g. "-6.45,101.25"
      const coords = (item.Coordinates || "0,0").split(",");
      const lat = parseFloat(coords[0]) || 0;
      const lng = parseFloat(coords[1]) || 0;
      
      const mag = parseFloat(item.Magnitude) || 0;
      
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
    console.error("BMKG API fetch failed:", error);

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
