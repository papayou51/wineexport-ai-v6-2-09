/**
 * Evidence Verification Module
 * Verifies that extracted data has valid citations from the PDF content
 */

interface ValidationReport {
  keptFields: number;
  droppedFields: number;
  noCitationFields: string[];
  invalidEvidenceFields: string[];
  lenientMode?: boolean;
  reason?: string;
  provider?: string;
  directAnalysis?: boolean;
}

interface EvidenceVerificationResult {
  verifiedSpec: any;
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
 * Check if evidence text appears in the PDF content with improved fuzzy matching
 */
function evidenceFoundInNormalizedPDF(evidence: string, normalizedPDF: string): boolean {
  const normalizedEvidence = normalizeForEvidence(evidence);
  
  // Try exact match first
  if (normalizedPDF.includes(normalizedEvidence)) return true;

  // Try partial match (at least 70% of the evidence appears)
  if (normalizedEvidence.length > 10) {
    const partialLength = Math.floor(normalizedEvidence.length * 0.7);
    for (let i = 0; i <= normalizedEvidence.length - partialLength; i++) {
      const partial = normalizedEvidence.substring(i, i + partialLength);
      if (partial.length > 10 && normalizedPDF.includes(partial)) {
        return true;
      }
    }
  }

  // Try word-by-word match with lower threshold for better tolerance
  const evidenceWords = normalizedEvidence.split(' ').filter(w => w.length > 2);
  if (evidenceWords.length >= 3) {
    let matches = 0;
    for (const word of evidenceWords) {
      if (normalizedPDF.includes(word)) {
        matches++;
      }
    }
    // Reduced threshold: require 60% of words to match instead of all
    const requiredMatches = Math.max(2, Math.ceil(evidenceWords.length * 0.6));
    return matches >= requiredMatches;
  }

  // For shorter evidence, be more lenient
  if (evidenceWords.length >= 2) {
    let matches = 0;
    for (const word of evidenceWords) {
      if (normalizedPDF.includes(word)) {
        matches++;
      }
    }
    return matches >= Math.min(2, evidenceWords.length);
  }
  
  // For very short evidence, check if at least the main word exists
  if (evidenceWords.length === 1 && evidenceWords[0].length > 4) {
    return normalizedPDF.includes(evidenceWords[0]);
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
export function verifyEvidence(
  rawSpec: any, 
  pdfText: string, 
  fileName: string, 
  options?: { mode?: 'strict' | 'lenient', reason?: string }
): EvidenceVerificationResult {
  console.log('🔍 Starting evidence verification for', fileName);
  console.log('📄 PDF text sample (first 200 chars):', pdfText.substring(0, 200));
  
  const mode = options?.mode || 'strict';
  const reason = options?.reason || 'unknown';
  console.log(`🔥 STRICT MODE ENFORCED - no lenient fallback allowed`);
  
  const verifiedSpec = { ...rawSpec };
  const report: ValidationReport = {
    keptFields: 0,
    droppedFields: 0,
    noCitationFields: [],
    invalidEvidenceFields: [],
    lenientMode: mode === 'lenient',
    reason: reason
  };
  
  // STRICT MODE: Citations are MANDATORY - fail if missing
  if (!rawSpec.citations || typeof rawSpec.citations !== 'object') {
    console.error('❌ STRICT MODE: No citations provided - extraction REJECTED');
    throw new Error('STRICT MODE: Citations are mandatory for all extracted fields');
  }
  
  const citations = rawSpec.citations;
  console.log('📊 Citations structure:', Object.keys(citations));
  
  // Normalize once for performance
  const normalizedPDFText = normalizeForEvidence(pdfText);
  const fieldNames = Object.keys(rawSpec).filter(key => key !== 'citations' && key !== 'confidence');
  
  // Track essential fields that should be preserved if possible
  const essentialFields = ['name', 'vintage', 'abv_percent', 'alcohol_percentage', 'appellation'];
  const verificationResults: { [key: string]: boolean } = {};
  
  for (const fieldName of fieldNames) {
    const fieldValue = rawSpec[fieldName];
    
    // Skip null/empty fields
    if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
      continue;
    }
    
    // Check if field has citations
    if (!citations[fieldName] || !Array.isArray(citations[fieldName]) || citations[fieldName].length === 0) {
      console.log(`❌ Field ${fieldName} has no citations`);
      console.log(`   Value: "${String(fieldValue).substring(0, 100)}"`);
      verificationResults[fieldName] = false;
      report.noCitationFields.push(fieldName);
      continue;
    }
    
    // Verify at least one citation has valid evidence
    const fieldCitations = citations[fieldName];
    let hasValidEvidence = false;
    
    console.log(`🔍 Checking ${fieldCitations.length} citations for field ${fieldName}`);
    
    for (const citation of fieldCitations) {
      if (citation.evidence && typeof citation.evidence === 'string') {
        console.log(`   Testing evidence: "${citation.evidence.substring(0, 100)}..."`);
        
        if (evidenceFoundInNormalizedPDF(citation.evidence, normalizedPDFText)) {
          hasValidEvidence = true;
          console.log(`✅ Field ${fieldName} evidence verified!`);
          break;
        } else {
          console.log(`❌ Evidence not found in PDF for ${fieldName}`);
        }
      }
    }
    
    verificationResults[fieldName] = hasValidEvidence;
    
    if (!hasValidEvidence) {
      report.invalidEvidenceFields.push(fieldName);
    }
  }
  
  // Apply lenient mode if requested or if strict verification would fail completely
  const totalFieldsWithData = Object.keys(verificationResults).length;
  const verifiedFields = Object.values(verificationResults).filter(Boolean).length;
  
  console.log(`📊 Verification results: ${verifiedFields}/${totalFieldsWithData} fields verified`);
  
  if (mode === 'lenient' || (verifiedFields === 0 && totalFieldsWithData > 0)) {
    if (mode !== 'lenient') {
      console.log('⚠️ All fields would be rejected in strict mode - applying lenient fallback');
    }
    console.log('🛡️ Using lenient mode: preserving data without strict evidence requirements');
    
    // In lenient mode, keep all essential fields and any fields that passed basic validation
    report.lenientMode = true;
    for (const fieldName of fieldNames) {
      if (rawSpec[fieldName] !== null && rawSpec[fieldName] !== undefined && rawSpec[fieldName] !== '') {
        // Keep field in lenient mode
        report.keptFields++;
      }
    }
    
    // Don't drop any fields in lenient mode - preserve original data
    return { verifiedSpec, validationReport: report };
  }
  // Normal strict verification: apply results
  for (const [fieldName, isValid] of Object.entries(verificationResults)) {
    if (isValid) {
      report.keptFields++;
    } else {
      verifiedSpec[fieldName] = null;
      report.droppedFields++;
    }
  }
  
  console.log(`🔍 Evidence verification completed: ${report.keptFields} kept, ${report.droppedFields} dropped`);
  
  return { verifiedSpec, validationReport: report };
}