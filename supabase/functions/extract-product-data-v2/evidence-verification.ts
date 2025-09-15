/**
 * Evidence Verification Module
 * Verifies that extracted data has valid citations from the PDF content
 */

interface ValidationReport {
  keptFields: number;
  droppedFields: number;
  noCitationFields: string[];
  invalidEvidenceFields: string[];
}

interface EvidenceVerificationResult {
  extractedData: any;
  validationReport: ValidationReport;
}

/**
 * Normalize text for evidence matching
 */
function normalizeForEvidence(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if evidence text appears in the PDF content
 */
function evidenceFoundInNormalizedPDF(evidence: string, normalizedPDF: string): boolean {
  const normalizedEvidence = normalizeForEvidence(evidence);
  
  // Try exact match first
  if (normalizedPDF.includes(normalizedEvidence)) return true;

  // Try word-by-word match for longer evidence (minimum 3 words match)
  const evidenceWords = normalizedEvidence.split(' ').filter(w => w.length > 2);
  if (evidenceWords.length >= 3) {
    let matches = 0;
    for (const word of evidenceWords) {
      if (normalizedPDF.includes(word)) {
        matches++;
        if (matches >= 3) return true;
      }
    }
    return false;
  }

  // For shorter evidence, require at least 2 words to match
  if (evidenceWords.length >= 2) {
    let matches = 0;
    for (const word of evidenceWords) {
      if (normalizedPDF.includes(word)) {
        matches++;
        if (matches >= 2) return true;
      }
    }
    return false;
  }
  
  return false;
}

// Backwards-compat: normalize PDF here if only raw text provided
function evidenceFoundInPDF(evidence: string, pdfText: string): boolean {
  const normalizedPDF = normalizeForEvidence(pdfText);
  return evidenceFoundInNormalizedPDF(evidence, normalizedPDF);
}

/**
 * Verify evidence for extracted fields and remove fields without valid evidence
 */
export function verifyEvidence(rawSpec: any, pdfText: string, fileName: string): EvidenceVerificationResult {
  console.log('🔍 Starting evidence verification for', fileName);
  
  const verifiedSpec = { ...rawSpec };
  const report: ValidationReport = {
    keptFields: 0,
    droppedFields: 0,
    noCitationFields: [],
    invalidEvidenceFields: []
  };
  
  // Skip verification if no citations provided
  if (!rawSpec.citations || typeof rawSpec.citations !== 'object') {
    console.log('⚠️ No citations provided in extraction, keeping all fields');
    // Count non-null fields as kept
    Object.keys(rawSpec).forEach(key => {
      if (rawSpec[key] !== null && rawSpec[key] !== undefined && key !== 'citations' && key !== 'confidence') {
        report.keptFields++;
      }
    });
    return { extractedData: verifiedSpec, validationReport: report };
  }
  
  const citations = rawSpec.citations;
  // Normalize once for performance
  const normalizedPDFText = normalizeForEvidence(pdfText);
  const fieldNames = Object.keys(rawSpec).filter(key => key !== 'citations' && key !== 'confidence');
  
  for (const fieldName of fieldNames) {
    const fieldValue = rawSpec[fieldName];
    
    // Skip null/empty fields
    if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
      continue;
    }
    
    // Check if field has citations
    if (!citations[fieldName] || !Array.isArray(citations[fieldName]) || citations[fieldName].length === 0) {
      console.log(`❌ Field ${fieldName} has no citations, removing`);
      verifiedSpec[fieldName] = null;
      report.droppedFields++;
      report.noCitationFields.push(fieldName);
      continue;
    }
    
    // Verify at least one citation has valid evidence
    const fieldCitations = citations[fieldName];
    let hasValidEvidence = false;
    
    for (const citation of fieldCitations) {
      if (citation.evidence && typeof citation.evidence === 'string') {
        if (evidenceFoundInNormalizedPDF(citation.evidence, normalizedPDFText)) {
          hasValidEvidence = true;
          console.log(`✅ Field ${fieldName} evidence verified: "${citation.evidence.substring(0, 50)}..."`);
          break;
        }
      }
    }
    
    if (!hasValidEvidence) {
      console.log(`❌ Field ${fieldName} has invalid evidence, removing`);
      verifiedSpec[fieldName] = null;
      report.droppedFields++;
      report.invalidEvidenceFields.push(fieldName);
    } else {
      report.keptFields++;
    }
  }
  
  console.log(`🔍 Evidence verification completed: ${report.keptFields} kept, ${report.droppedFields} dropped`);
  
  return { extractedData: verifiedSpec, validationReport: report };
}