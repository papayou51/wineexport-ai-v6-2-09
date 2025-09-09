// Simple in-memory cache for AI responses
// In production, consider using Redis or similar

interface CacheEntry {
  result: any;
  timestamp: number;
  ttl: number;
  hits: number;
}

class AICache {
  private cache = new Map<string, CacheEntry>();
  
  private generateKey(prompt: string, schema: any, model: string, lang?: string): string {
    const content = JSON.stringify({ prompt, schema, model, lang });
    return this.hash(content);
  }

  private hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  get(prompt: string, schema: any, model: string, lang?: string): any | null {
    const key = this.generateKey(prompt, schema, model, lang);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.result;
  }

  set(prompt: string, schema: any, model: string, result: any, ttlMs: number = 24 * 60 * 60 * 1000, lang?: string): void {
    const key = this.generateKey(prompt, schema, model, lang);
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl: ttlMs,
      hits: 0
    });

    // Simple cleanup: remove old entries periodically
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    // If still too many entries, remove least recently used
    if (this.cache.size > 1000) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].hits - b[1].hits)
        .slice(0, 200);

      for (const [key] of sortedEntries) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; totalHits: number } {
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
    }
    return {
      size: this.cache.size,
      totalHits
    };
  }
}

export const aiCache = new AICache();