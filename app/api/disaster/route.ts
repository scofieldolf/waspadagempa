import { NextResponse } from "next/server";

// In-Memory cache state variables (stored outside the GET handler in the global module scope)
let cachedData: any = null;
let lastFetchedTime: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Endpoint of official USGS Real-time GeoJSON feed (All Earthquakes in the past 24 hours)
const USGS_API_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

export async function GET() {
  const currentTime = Date.now();
  const cacheAge = currentTime - lastFetchedTime;

  // 1. Check if cache exists and is still valid (less than 10 minutes old)
  if (cachedData && cacheAge < CACHE_DURATION) {
    return NextResponse.json(cachedData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "HIT",
        "X-Cache-Age-Seconds": Math.round(cacheAge / 1000).toString(),
      },
    });
  }

  try {
    // 2. Cache is expired or empty, fetch fresh data from USGS
    const response = await fetch(USGS_API_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      // Ensure Next.js doesn't override our in-memory cache with standard static page cache
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from USGS: status ${response.status}`);
    }

    const rawData = await response.json();
    
    // 3. Data Sanitization & Normalization
    // Filter and map the heavy USGS GeoJSON down to optimize payload size by up to 70%
    const features = rawData.features || [];
    const normalizedData = features.map((feat: any) => {
      const coordinates = feat.geometry?.coordinates || [0, 0, 0];
      const properties = feat.properties || {};
      
      return {
        id: feat.id || Math.random().toString(36).substring(2, 9),
        lat: coordinates[1], // Latitude from geometry
        lng: coordinates[0], // Longitude from geometry
        mag: properties.mag || 0,
        location: properties.place || "Unknown Location",
        // Convert timestamp (ms since epoch) to standard human-parseable ISO-8601 string
        time: new Date(properties.time).toISOString(),
        tsunami: properties.tsunami === 1,
        depth: coordinates[2] || 0 // Include depth which is geometry coordinate[2]
      };
    });

    // 4. Update the global cache variables
    cachedData = normalizedData;
    lastFetchedTime = currentTime;

    return NextResponse.json(normalizedData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MISS",
      },
    });

  } catch (error) {
    console.error("USGS API fetch failed:", error);

    // 5. Resilient Fallback mechanism
    // If the USGS API fails but we have expired cached data, fall back to it
    if (cachedData) {
      return NextResponse.json(cachedData, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "FALLBACK",
          "X-Cache-Fallback-Reason": error instanceof Error ? error.message : "Fetch Failed",
        },
      });
    }

    // 6. Complete failure case (no cache exists at all)
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
