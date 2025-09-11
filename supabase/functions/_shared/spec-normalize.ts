// _shared/spec-normalize.ts
export type ProductSpec = Record<string, any>;

const ALLOWED = new Set([
  // Core fields
  "productName","producer","brand","appellation","region","country",
  "color","style","vintage","grapes","abv_percent","residualSugar_gL",
  "acidity_gL","closure","volume_ml","sulfites","organicCert","awards","tastingNotes",
  "foodPairing","servingTemp_C","ageingPotential_years",
  "exportNetPrice_EUR","availableVolume_cases","packaging",
  "allergenInfo","labelComplianceNotes","citations","confidence",
  // Enhanced V2 fields
  "terroir","vineAge_years","yieldHlHa","vinificationDetails","agingDetails",
  "bottlingDate","eanCode","packagingDetails","availability","producerContact",
  "technical_specs","certifications","ph","so2_total","total_acidity",
  "producer_website","producer_email","producer_phone","vineyardAltitude_m","exposure",
  "soilType","oakAging","ageingMonths"
]);

const COLORS = new Set(["red","white","rosé","sparkling","orange"]);

const ALIASES: Record<string, string> = {
  // Common camelCase -> normalized keys
  abvPercent: "abv_percent",
  residualSugar: "residualSugar_gL",
  residualSugar_gL: "residualSugar_gL",
  acidityGL: "acidity_gL",
  servingTempC: "servingTemp_C",
  ageingPotentialYears: "ageingPotential_years",
  exportNetPriceEUR: "exportNetPrice_EUR",
  availableVolumeCases: "availableVolume_cases",
  volumeMl: "volume_ml",
  tasting_notes: "tastingNotes",
  tastingNotes: "tastingNotes",
  food_pairing: "foodPairing",
  organicCertification: "organicCert",
  organic_cert: "organicCert",
  vineAgeYears: "vineAge_years",
  yieldHLHa: "yieldHlHa",
  yield_hl_ha: "yieldHlHa",
  vinification: "vinificationDetails",
  agingDetails: "agingDetails",
  bottling_date: "bottlingDate",
  ean: "eanCode",
  ean_code: "eanCode",
  packagingDetails: "packagingDetails",
  producerContact: "producerContact",
  producer_contact: "producerContact",
  vineyardAltitudeM: "vineyardAltitude_m",
  soil: "soilType",
  appellationName: "appellation",
};

function toNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const s = v.replace(/[, ]/g, "").replace(/%|°|g\/?l|g\/?L|cl|ml/i, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toInt(v: any): number | null {
  const n = toNum(v);
  return n === null ? null : Math.round(n);
}

function toBool(v: any): boolean | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    if (/^(yes|true|oui|contains|présent)$/i.test(v)) return true;
    if (/^(no|false|non|sans|absent)$/i.test(v)) return false;
  }
  return null;
}

export function normalizeSpec(raw: ProductSpec): ProductSpec {
  // 1) on enlève les champs inconnus
  const pruned: ProductSpec = {};
  for (const [k, v] of Object.entries(raw || {})) {
    const key = ALLOWED.has(k) ? k : (ALIASES[k] ?? null);
    if (key) pruned[key] = v;
  }

  // 2) coercitions usuelles
  if (pruned.vintage != null) pruned.vintage = toInt(pruned.vintage);
  if (pruned.abv_percent != null) pruned.abv_percent = toNum(pruned.abv_percent);
  if (pruned.residualSugar_gL != null) pruned.residualSugar_gL = toNum(pruned.residualSugar_gL);
  if (pruned.acidity_gL != null) pruned.acidity_gL = toNum(pruned.acidity_gL);
  if (pruned.volume_ml != null) {
    // Handle common volume formats: 750ml, 75cl, 0.75l
    let vol = pruned.volume_ml;
    if (typeof vol === "string") {
      if (/cl$/i.test(vol)) {
        vol = toNum(vol) * 10; // 75cl = 750ml
      } else if (/l$/i.test(vol) && !/(ml|cl)$/i.test(vol)) {
        vol = toNum(vol) * 1000; // 0.75l = 750ml
      } else {
        vol = toNum(vol);
      }
    }
    pruned.volume_ml = toInt(vol);
  }
  if (pruned.servingTemp_C != null) pruned.servingTemp_C = toInt(pruned.servingTemp_C);
  if (pruned.ageingPotential_years != null) pruned.ageingPotential_years = toInt(pruned.ageingPotential_years);
  if (pruned.exportNetPrice_EUR != null) pruned.exportNetPrice_EUR = toNum(pruned.exportNetPrice_EUR);
  if (pruned.availableVolume_cases != null) pruned.availableVolume_cases = toInt(pruned.availableVolume_cases);
  if (pruned.sulfites != null) pruned.sulfites = toBool(pruned.sulfites);

  // V2 enhanced fields coercions
  if (pruned.vineAge_years != null) pruned.vineAge_years = toInt(pruned.vineAge_years);
  if (pruned.yieldHlHa != null) pruned.yieldHlHa = toNum(pruned.yieldHlHa);
  if (pruned.ph != null) pruned.ph = toNum(pruned.ph);
  if (pruned.so2_total != null) pruned.so2_total = toNum(pruned.so2_total);
  if (pruned.total_acidity != null) pruned.total_acidity = toNum(pruned.total_acidity);
  if (pruned.vineyardAltitude_m != null) pruned.vineyardAltitude_m = toInt(pruned.vineyardAltitude_m);
  if (pruned.ageingMonths != null) pruned.ageingMonths = toInt(pruned.ageingMonths);
  
  // Normalize color
  if (pruned.color && typeof pruned.color === "string") {
    const c = pruned.color.toLowerCase().trim();
    if (c === "rouge" || c === "red") pruned.color = "red";
    else if (c === "blanc" || c === "white") pruned.color = "white";
    else if (c === "rosé" || c === "rose" || c === "pink") pruned.color = "rosé";
    else if (c === "effervescent" || c === "sparkling" || c === "champagne") pruned.color = "sparkling";
    else if (c === "orange" || c === "amber") pruned.color = "orange";
    else if (COLORS.has(c)) pruned.color = c;
    else pruned.color = null;
  }

  // Normalize appellation into a readable string
  if (pruned.appellation != null) {
    const a: any = pruned.appellation;
    if (typeof a === "object") {
      const parts = [
        a.name ?? a.label ?? a.appellation ?? null,
        a.region ?? null,
        a.country ?? null
      ].filter(Boolean);
      pruned.appellation = parts.length ? parts.join(", ") : null;
    } else if (Array.isArray(a)) {
      pruned.appellation = a.filter(Boolean).join(", ");
    }
  }

  // grapes: accepter ["Merlot 60%","Cabernet 40%"] ou [{variety,percent}]
  if (Array.isArray(pruned.grapes)) {
    pruned.grapes = pruned.grapes.map((g: any) => {
      if (typeof g === "string") {
        const m = g.match(/^(.+?)\s*(\d{1,3})?%?$/);
        return { 
          variety: (m?.[1] || g).trim(), 
          percent: m?.[2] ? Number(m[2]) : null 
        };
      }
      return {
        variety: (g?.variety ?? g?.name ?? "").toString().trim() || null,
        percent: g?.percent != null ? toNum(g.percent) : null
      };
    }).filter((x: any) => x?.variety);
  }

  // Handle arrays that might be strings
  if (pruned.awards && typeof pruned.awards === "string") {
    pruned.awards = [pruned.awards];
  }
  if (pruned.foodPairing && typeof pruned.foodPairing === "string") {
    // Split common separators
    pruned.foodPairing = pruned.foodPairing.split(/[,;]/).map((item: string) => item.trim()).filter(Boolean);
  }
  if (pruned.allergenInfo && typeof pruned.allergenInfo === "string") {
    pruned.allergenInfo = [pruned.allergenInfo];
  }
  if (pruned.certifications && typeof pruned.certifications === "string") {
    pruned.certifications = [pruned.certifications];
  }

  // citations: garantir { field: number[] }
  if (pruned.citations && typeof pruned.citations === "object") {
    for (const k of Object.keys(pruned.citations)) {
      const arr = pruned.citations[k];
      pruned.citations[k] = Array.isArray(arr)
        ? arr.map((n: any) => toInt(n)).filter((n: any) => Number.isInteger(n))
        : [];
    }
  } else {
    pruned.citations = {};
  }

  // confidence: garantir { field: number }
  if (pruned.confidence && typeof pruned.confidence === "object") {
    for (const k of Object.keys(pruned.confidence)) {
      pruned.confidence[k] = toNum(pruned.confidence[k]) || 0;
    }
  } else {
    pruned.confidence = {};
  }

  // Normalize producerContact shape
  if (pruned.producerContact != null) {
    const pc: any = pruned.producerContact;
    if (typeof pc === "string") {
      pruned.producerContact = { name: pc };
    } else if (typeof pc === "object") {
      pruned.producerContact = {
        name: ((pc.name ?? pc.producer) ? String(pc.name ?? pc.producer).trim() : null),
        email: pc.email ?? null,
        phone: pc.phone ?? pc.tel ?? null,
        website: pc.website ?? pc.site ?? null,
      };
    }
  }
  
  return pruned;
}