export function computeQuality(spec: any, meta?: {citations?: Record<string, number[]>, providers?: any[]}) {
  // Define ESSENTIAL fields that should typically be present in wine specs
  const essentialKeys = [
    "productName", "producer", "color", "abv_percent", "volume_ml"
  ];
  
  // Define IMPORTANT fields that are commonly present but not always
  const importantKeys = [
    "appellation", "region", "vintage", "grapes", "tastingNotes"
  ];
  
  // Define OPTIONAL fields that may or may not be present (shouldn't penalize much if missing)
  const optionalKeys = [
    "brand", "country", "style", "residualSugar_gL", "closure", "sulfites", 
    "organicCert", "awards", "foodPairing", "servingTemp_C", "ageingPotential_years",
    "exportNetPrice_EUR", "availableVolume_cases", "packaging", "allergenInfo", "labelComplianceNotes"
  ];

  const getValue = (v: any) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);

  // Calculate weighted coverage
  const essentialFilled = essentialKeys.filter(k => getValue(spec?.[k])).length;
  const importantFilled = importantKeys.filter(k => getValue(spec?.[k])).length;
  const optionalFilled = optionalKeys.filter(k => getValue(spec?.[k])).length;
  
  // Weighted coverage: Essential fields count more, but be more forgiving
  const essentialScore = essentialFilled / essentialKeys.length;
  const importantScore = importantFilled / importantKeys.length; 
  const optionalScore = optionalFilled / optionalKeys.length;
  
  // More balanced weighting - less penalty for missing optional fields
  const coverage = (essentialScore * 0.5) + (importantScore * 0.4) + (optionalScore * 0.1);

  // Calculate consistency (basic validation checks)
  const consistency = [
    // ABV should be reasonable (5-75%) - or null/undefined (partial extraction)
    (spec?.abv_percent == null || (spec?.abv_percent >= 5 && spec?.abv_percent <= 75)) ? 1 : 0,
    // Vintage should be reasonable (1990-current year + 1) - or null/undefined
    (spec?.vintage == null || (spec?.vintage >= 1990 && spec?.vintage <= (new Date().getFullYear() + 1))) ? 1 : 0,
    // Grapes array should exist and have content - or be null/undefined for partial extraction
    (spec?.grapes == null || (Array.isArray(spec?.grapes) && spec?.grapes.length)) ? 1 : 0
  ];
  
  const consistencyScore = consistency.reduce((a, b) => a + b, 0) / consistency.length;

  // Check for citations (indicates AI actually read the document)
  const hasCitations = meta?.citations && Object.keys(meta.citations).length > 0 ? 1 : 0;

  // Adaptive weighting based on provider availability and quota constraints
  const activeProviders = meta?.providers?.filter(p => p.ok).length ?? 1;
  const quotaConstrained = activeProviders < 2; // Less than 2 providers suggests quota issues
  
  // Enhanced bonus system for real wine data quality
  let bonusScore = 0;
  
  // Core identification bonus
  if (spec?.productName && spec?.producer) bonusScore += 0.15; // Proper wine identification
  
  // French wine specifics
  if (spec?.appellation && spec?.appellation.length > 0) bonusScore += 0.1; // French AOC/AOP crucial
  if (spec?.region && spec?.region.length > 0) bonusScore += 0.05; // Regional info
  
  // Technical wine data
  if (spec?.grapes && Array.isArray(spec.grapes) && spec.grapes.length > 0) bonusScore += 0.1; // Grape composition
  if (spec?.vintage && spec?.vintage >= 1990) bonusScore += 0.05; // Valid vintage
  
  // Tasting & commercial info
  if (spec?.tastingNotes && spec.tastingNotes.length > 30) bonusScore += 0.08; // Meaningful tasting notes
  if (spec?.foodPairing && Array.isArray(spec.foodPairing) && spec.foodPairing.length > 0) bonusScore += 0.05; // Food pairing
  
  // Quality indicators
  if (spec?.organicCert || spec?.awards) bonusScore += 0.02; // Certifications/awards
  
  // Weighted combination - more generous scoring for real extractions
  const wCoverage = 0.60;      // Data completeness
  const wConsistency = 0.20;   // Data validity  
  const wBonus = 0.20;         // Wine-specific quality bonus (increased)

  const finalScore = Math.min(1.0, wCoverage * coverage + wConsistency * consistencyScore + wBonus * bonusScore);
  
  return Math.round(100 * finalScore);
}