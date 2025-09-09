export function computeQuality(spec: any, meta?: {citations?: Record<string, number[]>}) {
  // Define key fields for wine/spirits product data
  const keys = [
    "productName", "producer", "brand", "appellation", "region", "country",
    "color", "style", "vintage", "grapes", "abv_percent", "residualSugar_gL",
    "closure", "volume_ml", "sulfites", "organicCert", "awards", "tastingNotes",
    "foodPairing", "servingTemp_C", "ageingPotential_years", "exportNetPrice_EUR",
    "availableVolume_cases", "packaging", "allergenInfo", "labelComplianceNotes"
  ];

  // Calculate coverage (how many fields are filled)
  const filled = keys.filter(k => {
    const v = spec?.[k];
    return v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
  }).length;
  
  const coverage = filled / keys.length;

  // Calculate consistency (basic validation checks)
  const consistency = [
    // ABV should be reasonable (5-75%)
    (spec?.abv_percent >= 5 && spec?.abv_percent <= 75) ? 1 : 0,
    // Vintage should be reasonable (1990-current year + 1)
    (spec?.vintage >= 1990 && spec?.vintage <= (new Date().getFullYear() + 1)) ? 1 : 0,
    // Grapes array should exist and have content
    (Array.isArray(spec?.grapes) && spec?.grapes.length) ? 1 : 0
  ];
  
  const consistencyScore = consistency.reduce((a, b) => a + b, 0) / consistency.length;

  // Check for citations (indicates AI actually read the document)
  const hasCitations = meta?.citations && Object.keys(meta.citations).length > 0 ? 1 : 0;

  // Weighted combination
  const wCoverage = 0.55;      // Most important: how complete is the data
  const wConsistency = 0.25;   // Are the values reasonable
  const wCitations = 0.20;     // Does it reference source pages

  const finalScore = wCoverage * coverage + wConsistency * consistencyScore + wCitations * hasCitations;
  
  return Math.round(100 * finalScore);
}