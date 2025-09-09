// fuse.ts
// Fusionne les sorties JSON de plusieurs LLM en un seul objet "fiche produit".
// Stratégie : majorité par champ (valeurs normalisées) + règles simples pour numériques/arrays.
// Retourne aussi confidence[field] (0..1) et citations fusionnées.

type AnySpec = Record<string, any>;

const FIELDS_ORDER: string[] = [
  "productName","producer","brand","appellation","region","country",
  "color","style","vintage","grapes","abv_percent","residualSugar_gL",
  "acidity_gL","closure","volume_ml","sulfites","organicCert","awards",
  "tastingNotes","foodPairing","servingTemp_C","ageingPotential_years",
  "exportNetPrice_EUR","availableVolume_cases","packaging","allergenInfo",
  "labelComplianceNotes"
];

// ---------- Normalisation légère pour comparer les valeurs ----------
function canon(v: any, key?: string): string {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "number") {
    // tolérance: arrondis légers pour éviter les faux désaccords
    const digits = key && /abv|percent|price|ml|gL|temp/i.test(key) ? 3 : 2;
    return String(Number(v.toFixed(digits)));
  }
  if (typeof v === "string") {
    return v.trim().toLowerCase().replace(/\s+/g, " ");
  }
  if (Array.isArray(v)) {
    // Trier pour stabilité (ex.: listes de cépages/awards)
    const norm = v.map(x => typeof x === "string" ? x.trim().toLowerCase() : x);
    return JSON.stringify(norm.sort());
  }
  // objets (ex.: grapes items)
  return JSON.stringify(v);
}

function isTruthyFilled(v: any): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// ---------- Règles spécifiques à certains champs ----------
function mergeNumeric(values: number[], tol: number = 0.5): number | null {
  if (!values.length) return null;
  // Regrouper par proximité
  values.sort((a,b)=>a-b);
  let bestVal = values[0], bestCount = 1, curVal = values[0], curCount = 1;
  for (let i=1;i<values.length;i++){
    if (Math.abs(values[i]-curVal) <= tol){
      curCount++;
      if (curCount > bestCount){ bestCount = curCount; bestVal = curVal; }
    } else {
      curVal = values[i]; curCount = 1;
    }
  }
  return bestVal;
}

function mergeString(values: string[]): string | null {
  if (!values.length) return null;
  // majorité stricte (valeur canonique la plus fréquente)
  const map = new Map<string,{raw:string,count:number}>();
  for (const s of values) {
    const k = canon(s);
    const prev = map.get(k);
    if (prev) prev.count += 1; else map.set(k, { raw: s, count: 1 });
  }
  const best = [...map.values()].sort((a,b)=>b.count - a.count)[0];
  return best?.raw ?? null;
}

function mergeStringArray(values: string[][]): string[] | null {
  if (!values.length) return null;
  const set = new Set<string>();
  for (const arr of values) for (const it of (arr || [])) set.add((it || "").trim());
  const out = [...set].filter(Boolean);
  return out.length ? out : null;
}

// Cépages: [{variety, percent?}]
function mergeGrapes(all: Array<Array<{ variety?: string; percent?: number }>>): any[] | null {
  const bag = new Map<string, number[]>(); // variety -> [percents...]
  let hasAny = false;

  for (const arr of all) {
    for (const g of (arr || [])) {
      const name = (g?.variety || "").trim().toLowerCase();
      if (!name) continue;
      hasAny = true;
      if (!bag.has(name)) bag.set(name, []);
      if (typeof g.percent === "number") bag.get(name)!.push(g.percent);
    }
  }
  if (!hasAny) return null;

  const merged = [...bag.entries()].map(([name, percents]) => ({
    variety: name.replace(/\b\w/g, c => c.toUpperCase()), // capitalise simple
    percent: percents.length ? Math.round( (percents.reduce((a,b)=>a+b,0)/percents.length) * 10 ) / 10 : undefined
  }));

  // Si la somme ≈ 100 ±5, on garde ; sinon on renvoie sans contrainte
  const sum = merged.reduce((a,g)=>a+(g.percent || 0),0);
  if (sum > 0 && Math.abs(sum - 100) <= 5) return merged;
  return merged;
}

// ---------- Fusion générique par majorité ----------
export function fuseResults(providerResults: AnySpec[]): AnySpec {
  // providerResults = [jsonOpenAI, jsonClaude, jsonGemini]
  const N = providerResults.length;
  const out: AnySpec = {};
  const confidence: Record<string, number> = {};
  const citations: Record<string, number[]> = {};

  // Collecte des citations
  for (const pr of providerResults) {
    const c = pr?.citations || {};
    for (const [k, pages] of Object.entries(c)) {
      const set = new Set([...(citations[k] || []), ...((pages as number[]) || [])]);
      citations[k] = [...set].sort((a,b)=>a-b);
    }
  }

  for (const field of FIELDS_ORDER) {
    const vals = providerResults.map(r => r?.[field]).filter(v => v !== undefined);
    const nonNull = vals.filter(isTruthyFilled);

    if (nonNull.length === 0) {
      out[field] = null;
      confidence[field] = 0;
      continue;
    }

    // Numériques connus
    if (["abv_percent","residualSugar_gL","acidity_gL","servingTemp_C","ageingPotential_years","volume_ml","exportNetPrice_EUR","availableVolume_cases","vintage"].includes(field)) {
      const nums = nonNull.map(Number).filter(n => !Number.isNaN(n));
      const merged = mergeNumeric(nums, field === "abv_percent" ? 0.3 : 1);
      out[field] = (merged ?? nums[0]) ?? null;
      // confiance ~ proportion des valeurs proches
      const agree = nums.filter(n => Math.abs(n - (out[field] as number)) <= (field === "abv_percent" ? 0.3 : 1)).length;
      confidence[field] = Math.max(0, Math.min(1, agree / N));
      continue;
    }

    // Tableaux de chaînes
    if (["awards","foodPairing","allergenInfo"].includes(field)) {
      const arrs = nonNull.map(a => Array.isArray(a) ? a : [a]).map(a => a.filter(Boolean));
      const merged = mergeStringArray(arrs as string[][]);
      out[field] = merged;
      confidence[field] = merged ? Math.min(1, (arrs.filter(a => a.length).length / N)) : 0;
      continue;
    }

    // Cépages
    if (field === "grapes") {
      const arrs = nonNull.filter(Array.isArray) as Array<Array<{variety?:string;percent?:number}>>;
      const merged = mergeGrapes(arrs);
      out[field] = merged;
      confidence[field] = merged ? Math.min(1, arrs.length / N) : 0;
      continue;
    }

    // Chaînes (majorité)
    if (typeof nonNull[0] === "string") {
      const merged = mergeString(nonNull as string[]);
      out[field] = merged ?? null;
      // confiance: part de la valeur majoritaire
      const map = new Map<string, number>();
      for (const v of nonNull) {
        const k = canon(v, field);
        map.set(k, (map.get(k) || 0) + 1);
      }
      const bestCount = Math.max(...map.values());
      confidence[field] = Math.max(0, Math.min(1, bestCount / N));
      continue;
    }

    // Fallback pour objets, etc.
    // On prend la valeur la plus fréquente par JSON canonique
    const map = new Map<string, any>();
    for (const v of nonNull) {
      const k = canon(v, field);
      if (!map.has(k)) map.set(k, v);
    }
    const counts = new Map<string, number>();
    for (const v of nonNull) {
      const k = canon(v, field);
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    const bestKey = [...counts.entries()].sort((a,b)=>b[1]-a[1])[0][0];
    out[field] = map.get(bestKey) ?? null;
    confidence[field] = Math.max(0, Math.min(1, (counts.get(bestKey) || 0) / N));
  }

  // Ajoute les meta
  out.citations = citations;
  out.confidence = confidence;
  return out;
}