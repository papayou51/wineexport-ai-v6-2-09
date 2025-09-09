/**
 * PDF Text Extraction Utilities
 * Provides robust text extraction from PDF files using multiple strategies
 */

export interface PDFExtractionResult {
  text: string;
  length: number;
  hasWineContent: boolean;
  extractionStrategies: string[];
}

export class PDFExtractor {
  private static wineKeywords = [
    'vin', 'wine', 'château', 'appellation', 'cuvée', 'vintage', 
    'millésime', 'alcool', 'alcohol', '%vol', 'domaine', 'winery'
  ];

  /**
   * Extract text from PDF buffer using multiple strategies
   */
  static extractText(pdfBuffer: ArrayBuffer, fileName: string): PDFExtractionResult {
    const pdfBytes = new Uint8Array(pdfBuffer);
    const pdfString = new TextDecoder('latin1').decode(pdfBytes);
    let allText = '';
    const strategies: string[] = [];

    console.log('Starting PDF text extraction with multiple strategies...');

    // Strategy 1: Extract text from PDF content streams
    try {
      const streamPattern = /BT\s+(.*?)ET/gs;
      const streamMatches = [...pdfString.matchAll(streamPattern)];
      
      for (const match of streamMatches) {
        const streamContent = match[1];
        const textOps = streamContent.match(/\((.*?)\)\s*Tj/g) || [];
        for (const op of textOps) {
          const text = op.match(/\((.*?)\)/)?.[1];
          if (text && text.length > 1) {
            allText += text + ' ';
          }
        }
      }
      
      if (streamMatches.length > 0) {
        strategies.push('content-streams');
      }
    } catch (e) {
      console.warn('Content streams extraction failed:', e);
    }

    // Strategy 2: Extract text from parentheses (standard PDF text encoding)
    try {
      const textPattern = /\(([^)]{2,})\)/g;
      const textMatches = [...pdfString.matchAll(textPattern)];
      
      for (const match of textMatches) {
        const text = match[1];
        if (text && /[a-zA-ZÀ-ÿ]/.test(text) && text.length > 1) {
          allText += text + ' ';
        }
      }
      
      if (textMatches.length > 0) {
        strategies.push('parentheses-text');
      }
    } catch (e) {
      console.warn('Parentheses text extraction failed:', e);
    }

    // Strategy 3: Extract text from hex strings
    try {
      const hexPattern = /<([0-9A-Fa-f]{4,})>/g;
      const hexMatches = [...pdfString.matchAll(hexPattern)];
      
      for (const match of hexMatches) {
        try {
          const hexString = match[1];
          let text = '';
          for (let i = 0; i < hexString.length; i += 2) {
            const hex = hexString.substr(i, 2);
            const char = String.fromCharCode(parseInt(hex, 16));
            if (char.match(/[a-zA-ZÀ-ÿ0-9\s.,;:!?\-]/)) {
              text += char;
            }
          }
          if (text.trim().length > 1) {
            allText += text + ' ';
          }
        } catch (e) {
          // Skip invalid hex
        }
      }
      
      if (hexMatches.length > 0) {
        strategies.push('hex-strings');
      }
    } catch (e) {
      console.warn('Hex strings extraction failed:', e);
    }

    // Clean and normalize the extracted text
    const cleanedText = allText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u024F]/g, ' ') // Keep printable characters and accented letters
      .replace(/\s*\n\s*/g, '\n') // Clean line breaks
      .trim();

    // Check for wine-related content
    const hasWineContent = this.wineKeywords.some(keyword => 
      cleanedText.toLowerCase().includes(keyword.toLowerCase())
    );

    console.log(`PDF extraction completed using strategies: ${strategies.join(', ')}`);
    console.log(`Extracted text length: ${cleanedText.length}`);

    return {
      text: cleanedText,
      length: cleanedText.length,
      hasWineContent,
      extractionStrategies: strategies,
    };
  }

  /**
   * Generate fallback content when PDF extraction fails
   */
  static generateFallbackContent(fileName: string): string {
    return `
      WINE PRODUCT INFORMATION
      
      File: ${fileName}
      
      This appears to be a wine product document. Please provide the following information manually:
      - Product name
      - Producer/Winery
      - Region/Appellation  
      - Vintage year
      - Alcohol percentage
      - Volume
      - Grape varieties
      - Tasting notes
      - Technical specifications (pH, acidity, etc.)
      - Awards and certifications
      
      Note: Automatic text extraction failed. Manual data entry may be required.
    `;
  }
}