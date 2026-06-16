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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { earthquakes } = body;

    if (!earthquakes || !Array.isArray(earthquakes)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // 1. Calculate real-time stats for geological prompting
    const total = earthquakes.length;
    let maxMag = 0;
    let maxLoc = "N/A";
    let tsunamiCount = 0;
    let totalDepth = 0;

    let sumatra = 0;
    let java = 0;
    let sulawesi = 0;
    let banda = 0;
    let papua = 0;
    let others = 0;

    (earthquakes as NormalizedEarthquake[]).forEach((eq: NormalizedEarthquake) => {
      if (eq.mag > maxMag) {
        maxMag = eq.mag;
        maxLoc = eq.location;
      }
      if (eq.tsunami) tsunamiCount++;
      totalDepth += eq.depth;

      const loc = eq.location.toLowerCase();
      if (loc.includes("sumatra") || loc.includes("aceh") || loc.includes("mentawai") || loc.includes("nias")) {
        sumatra++;
      } else if (loc.includes("java") || loc.includes("jawa") || loc.includes("sunda") || loc.includes("banten") || loc.includes("jakarta")) {
        java++;
      } else if (loc.includes("sulawesi") || loc.includes("gorontalo") || loc.includes("minahasa") || loc.includes("palu")) {
        sulawesi++;
      } else if (loc.includes("banda") || loc.includes("maluku") || loc.includes("seram") || loc.includes("ambon")) {
        banda++;
      } else if (loc.includes("papua") || loc.includes("irian") || loc.includes("biak") || loc.includes("jayapura")) {
        papua++;
      } else {
        others++;
      }
    });

    const avgDepth = total > 0 ? (totalDepth / total).toFixed(1) : "0.0";
    const geminiKey = process.env.GEMINI_API_KEY;

    // 2. If GEMINI_API_KEY is available, make a call to Gemini API
    if (geminiKey) {
      const prompt = `
You are the advanced Seismotectonic AI Analyst for the Waspadagempa system, specializing in the geophysics of the Indonesian Ring of Fire.
Analyze this real-time seismic dataset:
- Total seismic events in active view: ${total}
- Maximum magnitude: M ${maxMag.toFixed(1)} located at "${maxLoc}"
- Tsunami warnings generated: ${tsunamiCount}
- Average epicenter depth: ${avgDepth} km
- Sector breakdown:
  * Sumatra Sector: ${sumatra} events
  * Java/Sunda Sector: ${java} events
  * Sulawesi Sector: ${sulawesi} events
  * Banda Sea/Maluku Sector: ${banda} events
  * Papua Sector: ${papua} events
  * Other regional waters: ${others} events

Generate an executive seismological briefing in a professional, authoritative tone. Keep it highly informative, concise, and structured.
You must provide the briefing in BOTH Indonesian (first) and English (second).

Structure:
# ✨ Analisis Seismotektonik Gemini AI / Gemini AI Seismotectonic Briefing

## 🌋 Ringkasan Aktivitas & Tektonik (Indonesian)
- Analyze the density and depth of the active sectors.
- Reference major tectonic boundaries showing potential stress (e.g. Sunda subduction zone, Palu-Koro fault, Flores thrust) based on active epicenters.
- Discuss tsunami potential and overall risk level.

## 🛡️ Panduan & Kesiapsiagaan Sipil (Indonesian)
- Actionable, context-appropriate safety recommendations based on depth and magnitude.

---

## 🌋 Seismic Overview & Tectonics (English)
- Geologic overview, active faults analysis, stress release.

## 🛡️ Civil Advisory & Readiness (English)
- Safety guidelines for communities near active sectors.
`;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
            next: { revalidate: 0 },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const briefing = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (briefing) {
            return NextResponse.json({ success: true, briefing, provider: "gemini" });
          }
        }
      } catch (err) {
        console.error("Gemini API call failed, falling back to local analyzer:", err);
      }
    }

    // 3. Robust Geological Fallback Engine (Runs locally if API fails or Key is absent)
    const localBriefing = generateLocalBriefing({
      total,
      maxMag,
      maxLoc,
      tsunamiCount,
      avgDepth,
      sumatra,
      java,
      sulawesi,
      banda,
      papua,
      others,
    });

    return NextResponse.json({
      success: true,
      briefing: localBriefing,
      provider: "local-analytical-engine",
    });

  } catch (error: unknown) {
    console.error("AI Briefing failed:", error);
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message || "Failed to generate briefing" }, { status: 500 });
  }
}

interface BriefingStats {
  total: number;
  maxMag: number;
  maxLoc: string;
  tsunamiCount: number;
  avgDepth: string;
  sumatra: number;
  java: number;
  sulawesi: number;
  banda: number;
  papua: number;
  others: number;
}

// Local Analytical Geological Engine
function generateLocalBriefing(stats: BriefingStats): string {
  const {
    total,
    maxMag,
    maxLoc,
    tsunamiCount,
    avgDepth,
    sumatra,
    java,
    sulawesi,
    banda,
    papua,
  } = stats;

  const riskLevelId = maxMag >= 6.0 ? "TINGGI" : maxMag >= 5.0 ? "SEDANG" : "RENDAH";
  const riskLevelEn = maxMag >= 6.0 ? "HIGH" : maxMag >= 5.0 ? "MODERATE" : "LOW";
  const riskColor = maxMag >= 6.0 ? "🔴" : maxMag >= 5.0 ? "🟡" : "🟢";

  // Determine active plates/faults based on active sectors
  const activeStructuresId: string[] = [];
  const activeStructuresEn: string[] = [];

  if (sumatra > 0) {
    activeStructuresId.push("Palung Sunda (Subduksi Sumatra)", "Sesar Besar Semangko Sumatra");
    activeStructuresEn.push("Sunda Trench (Sumatra Subduction)", "Great Sumatran Strike-Slip Fault");
  }
  if (java > 0) {
    activeStructuresId.push("Zona Megathrust Selat Sunda / Jawa Selatan");
    activeStructuresEn.push("Sunda Megathrust Zone (Sunda Strait / South Java)");
  }
  if (sulawesi > 0) {
    activeStructuresId.push("Sesar Palu-Koro (Sulawesi)", "Sesar Naik Gorontalo");
    activeStructuresEn.push("Palu-Koro Strike-Slip Fault (Sulawesi)", "Gorontalo Thrust Fault");
  }
  if (banda > 0) {
    activeStructuresId.push("Busur Banda (Kolisi Kerak Samudra)", "Sesar Naik Flores");
    activeStructuresEn.push("Banda Arc (Oceanic Collision Zone)", "Flores Back-arc Thrust");
  }
  if (papua > 0) {
    activeStructuresId.push("Sesar Sorong (Papua Barat)", "Zona Suture New Guinea");
    activeStructuresEn.push("Sorong Fault Zone (West Papua)", "New Guinea Trench/Suture");
  }

  if (activeStructuresId.length === 0) {
    activeStructuresId.push("Sistem Subduksi Lempeng Indo-Australia / Eurasia");
    activeStructuresEn.push("Indo-Australian / Eurasian Plate Subduction System");
  }

  return `# ✨ Analisis Seismotektonik Gemini AI / Gemini AI Seismotectonic Briefing

> [!NOTE]
> *Laporan ini dianalisis menggunakan Mesin Pemodelan Geologi Lokal Waspadagempa berdasarkan parameter seismik real-time.*

---

## 🌋 Ringkasan Aktivitas & Tektonik (Indonesian)

Analisis data seismik terkini menunjukkan aktivitas sebanyak **${total} kejadian gempa bumi** yang tercatat di wilayah Indonesia. Tingkat kerawanan seismik saat ini berada pada tingkat **${riskColor} ${riskLevelId}** dikarenakan guncangan terkuat mencapai **M ${maxMag.toFixed(1)}** di **"${maxLoc}"**.

### 🔍 Poin Analisis Tektonik Utama:
- **Distribusi Kedalaman:** Kedalaman rata-rata gempa adalah **${avgDepth} km**. Gempa didominasi oleh gempa dangkal (<70 km) yang berhubungan langsung dengan deformasi kerak bumi di sepanjang patahan aktif lokal.
- **Struktur Geologi Terpengaruh:** Sebaran episenter menunjukkan konsentrasi tegangan tektonik yang sedang dilepaskan pada struktur utama berikut:
  ${activeStructuresId.map((s) => `  * **${s}**`).join("\n")}
- **Bahaya Sekunder (Tsunami):** Tercatat **${tsunamiCount} peringatan potensi tsunami** yang dikeluarkan. Wilayah pantai dekat epicenter terkuat diimbau untuk segera menjauhi area pantai jika merasakan guncangan kuat berdurasi lama.

## 🛡️ Panduan & Kesiapsiagaan Sipil (Indonesian)

1. **Tetap Waspada Gempa Susulan:** Gempa bumi dengan Magnitudo M ${maxMag.toFixed(1)} biasanya diikuti oleh gempa susulan (*aftershocks*) berukuran lebih kecil. Warga di sekitar daerah epicenter diimbau tidak memasuki bangunan yang strukturnya sudah retak.
2. **Kewaspadaan Tsunami:** ${
    tsunamiCount > 0
      ? "**SEGERA EVAKUASI!** Peringatan tsunami aktif terdeteksi. Warga di pesisir pantai sekitar epicenter harus segera mengevakuasi diri ke dataran tinggi tanpa menunggu sirine resmi."
      : "Tidak ada ancaman tsunami aktif saat ini. Namun, warga di wilayah pesisir harus tetap mengenali tanda gempa kuat (guncangan >20 detik) sebagai peringatan alami evakuasi mandiri."
  }
3. **Kondisi Bangunan:** Periksa keretakan struktural pada tiang penyangga rumah Anda. Jika terdapat retakan signifikan, koordinasikan dengan BPBD setempat untuk verifikasi kelayakan huni.

---

## 🌋 Seismic Overview & Tectonics (English)

The active earthquake feed records **${total} seismic occurrences** across the Indonesian Ring of Fire. The tectonic risk index is currently flagged as **${riskColor} ${riskLevelEn}**, heavily influenced by a peak energy release of **M ${maxMag.toFixed(1)}** located at **"${maxLoc}"**.

### 🔍 Key Geological Observations:
- **Depth Dispersion:** The average depth is **${avgDepth} km**, indicating a predominance of shallow crustal stress release. Shallow events present a higher risk of localized ground acceleration and shaking intensity.
- **Active Structural Stress:** The spatial distribution of epicenters directly correlates with slip stress releases along these major seismogenic zones:
  ${activeStructuresEn.map((s) => `  * **${s}**`).join("\n")}
- **Tsunami Risk Status:** There are **${tsunamiCount} active tsunami alerts**. Convergent plate boundaries undergoing sudden vertical displacement remain under active geophysical observation.

## 🛡️ Civil Advisory & Readiness (English)

1. **Structural Integrity Integrity Checks:** Residents in proximity to the M ${maxMag.toFixed(1)} epicenter should assess their dwellings for load-bearing cracks. Do not occupy structures that exhibit compromised structural integrity.
2. **Tsunami Emergency Protocols:** ${
    tsunamiCount > 0
      ? "**IMMEDIATE EVACUATION REQUIRED!** Active tsunami signals are flagged. Coastal populations near the high-magnitude epicenter must proceed immediately inland and ascend to high ground."
      : "No active tsunami threats are registered. However, always treat any sustained ground vibration exceeding 20 seconds as a natural trigger for immediate, self-initiated vertical evacuation."
  }
3. **Prepare Emergency Kit:** Ensure your emergency preparedness bag (containing clean water, dry food, flashlights, and medical supplies) is easily accessible in case aftershocks disrupt local power grids.
`;
}
