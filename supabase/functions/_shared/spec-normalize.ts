// _shared/spec-normalize.ts
export type ProductSpec = Record<string, any>;

const ALLOWED = new Set([
  // Canonical V2 fields (snake_case preferred)
  "name","category","vintage","alcohol_percentage","volume_ml","description","tasting_notes","appellation",
  "awards","certifications","technical_specs","terroir","vine_age","yield_hl_ha","vinification","aging_details",
  "bottling_info","ean_code","packaging_info","availability","producer_contact",

  // Legacy/alternate fields kept for compatibility (will be aliased to canonical)
  "productName","producer","brand","region","country","color","grapes",
  "abv_percent","residualSugar_gL","acidity_gL","closure","sulfites","organicCert","foodPairing",
  "servingTemp_C","ageingPotential_years","exportNetPrice_EUR","availableVolume_cases","packaging",
  "allergenInfo","labelComplianceNotes","citations","confidence",
  // Extra technical metrics occasionally returned
  "ph","so2_total","total_acidity","producer_website","producer_email","producer_phone",
  "vineyardAltitude_m","exposure","soilType","oakAging","ageingMonths"
]);

const COLORS = new Set(["red","white","rosé","sparkling","orange"]);

const ALIASES: Record<string, string> = {
  // Legacy -> Canonical (snake_case)
  productName: "name",
  tastingNotes: "tasting_notes",
  tasting_notes: "tasting_notes",
  abvPercent: "alcohol_percentage",
  abv_percent: "alcohol_percentage",
  alcohol: "alcohol_percentage",
  volumeMl: "volume_ml",
  volume_ml: "volume_ml",
  food_pairing: "foodPairing", // kept for compatibility
  organicCertification: "organicCert",
  organic_cert: "organicCert",

  // V2 camelCase -> canonical snake_case
  vineAgeYears: "vine_age",
  vineAge_years: "vine_age",
  yieldHLHa: "yield_hl_ha",
  yield_hl_ha: "yield_hl_ha",
  vinificationDetails: "vinification",
  agingDetails: "aging_details",
  bottlingDate: "bottling_info",
  ean: "ean_code",
  ean_code: "ean_code",
  packagingDetails: "packaging_info",
  producerContact: "producer_contact",
  producer_contact: "producer_contact",
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

function sanitizeString(v: any): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return v;
  
  // Convert null-like strings to actual null
  const cleaned = v.trim();
  if (!cleaned || 
      /^(null|n\/a|n\.a\.|—|–|-|non renseigné|non spécifié|non disponible|inconnu|nd|na)$/i.test(cleaned)) {
    return null;
  }
  
  return cleaned;
}

export function normalizeSpec(raw: ProductSpec): ProductSpec {
  // 1) Sanitize and preserve fields from ChatGPT - remove null-like strings
  const pruned: ProductSpec = {};
  for (const [k, v] of Object.entries(raw || {})) {
    // Accept all known fields + common variations 
    const key = ALLOWED.has(k) ? k : (ALIASES[k] ?? k); // Keep unknown fields as-is
    const sanitized = sanitizeString(v);
    if (sanitized !== null) pruned[key] = sanitized; // Only keep non-null values
  }

  // 2) coercitions usuelles
  if (pruned.vintage != null) pruned.vintage = toInt(pruned.vintage);
  if (pruned.alcohol_percentage != null) pruned.alcohol_percentage = toNum(pruned.alcohol_percentage);
  if (pruned.abv_percent != null && pruned.alcohol_percentage == null) pruned.alcohol_percentage = toNum(pruned.abv_percent);
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
  if (pruned.vine_age != null) pruned.vine_age = toInt(pruned.vine_age);
  if (pruned.vineAge_years != null && pruned.vine_age == null) pruned.vine_age = toInt(pruned.vineAge_years);
  if (pruned.yield_hl_ha != null) pruned.yield_hl_ha = toNum(pruned.yield_hl_ha);
  if (pruned.yieldHlHa != null && pruned.yield_hl_ha == null) pruned.yield_hl_ha = toNum(pruned.yieldHlHa);
  if (pruned.ph != null) pruned.ph = toNum(pruned.ph);
  if (pruned.so2_total != null) pruned.so2_total = toNum(pruned.so2_total);
  if (pruned.total_acidity != null) pruned.total_acidity = toNum(pruned.total_acidity);
  if (pruned.vineyardAltitude_m != null) pruned.vineyardAltitude_m = toInt(pruned.vineyardAltitude_m);
  if (pruned.ageingMonths != null) pruned.ageingMonths = toInt(pruned.ageingMonths);

  // Build technical_specs object if missing and migrate known fields
  const tech: any = typeof pruned.technical_specs === "object" && pruned.technical_specs !== null
    ? { ...pruned.technical_specs }
    : {};
  if (tech.ph == null && pruned.ph != null) tech.ph = pruned.ph;
  if (tech.total_acidity == null && (pruned.total_acidity != null || pruned.acidity_gL != null)) {
    const ta = pruned.total_acidity ?? pruned.acidity_gL;
    tech.total_acidity = typeof ta === "number" ? `${ta}` : `${ta ?? ''}`.trim() || null;
  }
  if (tech.residual_sugar == null && pruned.residualSugar_gL != null) {
    const rs = pruned.residualSugar_gL;
    tech.residual_sugar = typeof rs === "number" ? `${rs}` : `${rs ?? ''}`.trim() || null;
  }
  if (tech.so2_total == null && pruned.so2_total != null) tech.so2_total = pruned.so2_total;
  if (Object.keys(tech).length) pruned.technical_specs = tech;

  // Preserve color from ChatGPT extraction - minimal normalization
  if (pruned.color && typeof pruned.color === "string") {
    const c = pruned.color.toLowerCase().trim();
    if (c === "rouge" || c === "red") pruned.color = "red";
    else if (c === "blanc" || c === "white") pruned.color = "white";
    else if (c === "rosé" || c === "rose" || c === "pink") pruned.color = "rosé";
    else if (c === "effervescent" || c === "sparkling" || c === "champagne") pruned.color = "sparkling";
    else if (c === "orange" || c === "amber") pruned.color = "orange";
    else if (COLORS.has(c)) pruned.color = c;
    // Keep unknown colors instead of nullifying - ChatGPT may extract valid variations
    else pruned.color = pruned.color; // Preserve original value
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

  // citations: preserve structured evidence { page, evidence } and accept legacy arrays
  if (pruned.citations && typeof pruned.citations === "object") {
    const fixed: any = {};
    for (const [field, arr] of Object.entries(pruned.citations)) {
      if (Array.isArray(arr)) {
        fixed[field] = arr.map((item: any) => {
          if (item && typeof item === "object") {
            const page = toInt((item as any).page);
            const evidence = (item as any).evidence != null ? String((item as any).evidence) : null;
            if (page) return { page, evidence };
            return null;
          } else if (typeof item === "number") {
            const page = toInt(item);
            return page ? { page, evidence: null } : null;
          } else if (typeof item === "string") {
            const m = item.match(/(\d{1,4})/);
            const page = m ? toInt(m[1]) : null;
            return page ? { page, evidence: item } : null;
          }
          return null;
        }).filter(Boolean);
      } else {
        fixed[field] = [];
      }
    }
    pruned.citations = fixed;
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

  // Normalize producer contact shape to producer_contact
  const rawPc: any = pruned.producer_contact ?? pruned.producerContact;
  if (rawPc != null) {
    if (typeof rawPc === "string") {
      pruned.producer_contact = { name: rawPc };
    } else if (typeof rawPc === "object") {
      pruned.producer_contact = {
        name: ((rawPc.name ?? rawPc.producer) ? String(rawPc.name ?? rawPc.producer).trim() : null),
        email: rawPc.email ?? null,
        phone: rawPc.phone ?? rawPc.tel ?? null,
        website: rawPc.website ?? rawPc.site ?? null,
      };
    }
    delete pruned.producerContact;
  }
  
  return pruned;
}