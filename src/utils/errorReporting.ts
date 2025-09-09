// Enhanced error reporting and debugging utilities for PDF extraction issues

export interface PDFExtractionError {
  type: 'QUOTA_EXCEEDED' | 'AUTH_ERROR' | 'PDF_NOT_SUPPORTED' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  provider: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export class PDFExtractionReporter {
  private static errors: PDFExtractionError[] = [];
  
  static reportError(error: PDFExtractionError) {
    this.errors.push({
      ...error,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 errors to prevent memory leaks
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }
    
    // Log structured error for debugging
    console.group(`🚨 PDF Extraction Error - ${error.type}`);
    console.error(`Provider: ${error.provider}`);
    console.error(`Message: ${error.message}`);
    if (error.details) {
      console.error('Details:', error.details);
    }
    console.groupEnd();
  }
  
  static getErrorSummary(): string {
    if (this.errors.length === 0) return 'No errors recorded';
    
    const errorCounts = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return `Error summary: ${Object.entries(errorCounts)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ')}`;
  }
  
  static getLastErrors(count = 5): PDFExtractionError[] {
    return this.errors.slice(-count);
  }
  
  static clear() {
    this.errors = [];
  }
  
  static generateDiagnosticReport(): string {
    const lastErrors = this.getLastErrors(3);
    const summary = this.getErrorSummary();
    
    return `
PDF Extraction Diagnostic Report
Generated: ${new Date().toISOString()}

${summary}

Recent Errors:
${lastErrors.map((error, i) => `
${i + 1}. ${error.type} (${error.provider})
   Message: ${error.message}
   Time: ${error.timestamp}
   ${error.details ? `Details: ${JSON.stringify(error.details, null, 2)}` : ''}
`).join('')}

Troubleshooting Steps:
1. Check API key configuration in Supabase secrets
2. Verify provider quotas and limits
3. Test with smaller PDF files
4. Check network connectivity
5. Review provider-specific error messages
    `.trim();
  }
}

// Helper function to parse error messages and categorize them
export function categorizeError(errorMessage: string, provider: string): PDFExtractionError['type'] {
  const message = errorMessage.toLowerCase();
  
  if (message.includes('quota') || message.includes('rate limit') || message.includes('exceeded')) {
    return 'QUOTA_EXCEEDED';
  }
  
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
    return 'AUTH_ERROR';
  }
  
  if (message.includes('pdf_not_supported') || message.includes('not support')) {
    return 'PDF_NOT_SUPPORTED';
  }
  
  if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
    return 'NETWORK_ERROR';
  }
  
  return 'UNKNOWN_ERROR';
}

// Enhanced error message formatter
export function formatErrorMessage(error: any, context: string): string {
  const baseMessage = error?.message || String(error);
  
  // Extract useful information from error messages
  const insights: string[] = [];
  
  if (baseMessage.includes('max_tokens')) {
    insights.push('API parameter error - check token limits');
  }
  
  if (baseMessage.includes('429')) {
    insights.push('Rate limited - wait before retry or check quotas');
  }
  
  if (baseMessage.includes('401') || baseMessage.includes('403')) {
    insights.push('Authentication failed - verify API keys');
  }
  
  if (baseMessage.includes('PDF')) {
    insights.push('PDF processing issue - try text extraction fallback');
  }
  
  const insightText = insights.length > 0 ? ` (${insights.join(', ')})` : '';
  
  return `${context}: ${baseMessage}${insightText}`;
}
