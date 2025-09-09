// _shared/spec-normalize.ts
export type ProductSpec = Record<string, any>;

const ALLOWED = new Set([
  "productName","producer","brand","appellation","region","country",
  "color","style","vintage","grapes","abv_percent","residualSugar_gL",
  "acidity_gL","closure","volume_ml","sulfites","organicCert","awards","tastingNotes",
  "foodPairing","servingTemp_C","ageingPotential_years",
  "exportNetPrice_EUR","availableVolume_cases","packaging",
  "allergenInfo","labelComplianceNotes","citations","confidence"
]);

const COLORS = new Set(["red","white","rosé","sparkling","orange"]);

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
    if (ALLOWED.has(k)) pruned[k] = v;
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

  return pruned;
}