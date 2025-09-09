import { callOpenAIJSONByChunk } from "./providers/openai.ts";
import { callAnthropicJSONByChunk } from "./providers/anthropic.ts";
import { callGoogleJSONByChunk } from "./providers/google.ts";
import { chunkByPages } from "../pdf-chunk.ts";
import { fuseResults } from "./fuse.ts";
import { computeQuality } from "./quality.ts";

type PageBlock = { page: number; text: string };
type Probe = { 
  ok: boolean; 
  provider: "openai" | "anthropic" | "google"; 
  data?: any; 
  error?: string; 
  status?: number | null; 
  code?: string | null; 
  ms: number 
};

function validateModels() {
  const suspects = ["OPENAI_MODEL", "ANTHROPIC_MODEL", "GOOGLE_MODEL"]
    .map(k => [k, Deno.env.get(k) || ""] as const);
  
  for (const [k, v] of suspects) {
    if (/^sk-/.test(v) || /^AIza/.test(v)) {
      throw new Error(`${k} contient une clé API (commence par sk- ou AIza). Déplacez la valeur vers *_API_KEY et remettez un vrai nom de modèle.`);
    }
  }
}

function validateProviderConfig() {
  const providersEnabled = Deno.env.get("PROVIDERS_ENABLED") || "";
  
  // Check if PROVIDERS_ENABLED contains API keys instead of provider names
  if (/^sk-|^AIza|^ant-/.test(providersEnabled)) {
    console.error("❌ PROVIDERS_ENABLED contient une clé API au lieu d'une liste de providers!");
    console.error("   Format attendu: 'openai,anthropic,google'");
    console.error("   Format reçu:", providersEnabled.substring(0, 20) + "...");
    throw new Error("PROVIDERS_ENABLED mal configuré: contient une clé API au lieu de noms de providers");
  }
  
  // Validate provider names
  const validProviders = ["openai", "anthropic", "google"];
  const enabledProviders = providersEnabled.split(",").map(p => p.trim()).filter(p => p);
  
  for (const provider of enabledProviders) {
    if (!validProviders.includes(provider)) {
      console.warn(`⚠️ Provider inconnu dans PROVIDERS_ENABLED: ${provider}`);
    }
  }
  
  console.log("✅ Configuration des providers validée:", enabledProviders);
}

async function safeCall<T>(fn: () => Promise<T>, provider: Probe["provider"]): Promise<Probe> {
  const t0 = Date.now();
  try {
    const data = await fn();
    return { ok: true, provider, data, ms: Date.now() - t0 };
  } catch (e: any) {
    const status = e?.status ?? e?.response?.status ?? null;
    const msg = e?.message ?? "unknown";
    let code: string | null = e?.code ?? null;
    
    // Enhanced error detection with quota intelligence
    if (status === 401) code = "unauthorized";
    else if (status === 429 || /quota|rate.?limit|insufficient.*quota|exceeded.*quota/i.test(msg)) {
      code = "rate_limited";
      console.warn(`🚨 ${provider} quota exceeded - marking for fallback`);
    }
    else if (/model.*not.*found|invalid.*model/i.test(msg)) code = "invalid_model";
    else if (status === 400 && /context|length|too\s+long/i.test(msg)) code = "context_length_exceeded";
    else if (status === 400 && /response_format|tool_choice|tools/i.test(msg)) code = "invalid_request";
    else if (/billing|payment|subscription/i.test(msg)) {
      code = "billing_issue";
      console.warn(`💳 ${provider} billing issue - provider unavailable`);
    }
    
    console.error(`❌ ${provider} provider failed:`, {
      status: status ?? null,
      code: code ?? null,
      message: msg
    });
    
    return { 
      ok: false, 
      provider, 
      error: msg, 
      status, 
      code, 
      ms: Date.now() - t0 
    };
  }
}

export async function runOrchestrator({ 
  pages, 
  maxCharsPerChunk = 6000 
}: { 
  pages: PageBlock[]; 
  maxCharsPerChunk?: number 
}) {
  validateModels();
  validateProviderConfig();

  // Enhanced provider orchestration strategy
  const primary = (Deno.env.get("PRIMARY_PROVIDER") || "openai").toLowerCase();
  const strategy = (Deno.env.get("PROVIDER_STRATEGY") || "primary_first").toLowerCase();
  const runSecondariesOnSuccess = (Deno.env.get("RUN_SECONDARIES_ON_SUCCESS") || "1") === "1";

  console.log('🔄 Starting enhanced LLM orchestration with strategy:', strategy);
  console.log('🎯 Primary provider:', primary, '| Run secondaries on success:', runSecondariesOnSuccess);

  // Chunk the pages
  const chunks = chunkByPages(pages, maxCharsPerChunk);
  console.log('📊 Created', chunks.length, 'chunks for processing');

  // Available providers in priority order
  const available: Array<"openai"|"anthropic"|"google"> = [
    Deno.env.get("OPENAI_API_KEY") ? "openai" : null,
    Deno.env.get("ANTHROPIC_API_KEY") ? "anthropic" : null,
    Deno.env.get("GOOGLE_API_KEY") ? "google" : null,
  ].filter(Boolean) as any;

  const ordered = [primary, ...available.filter(p => p !== primary)] as Array<"openai"|"anthropic"|"google">;
  console.log('📋 Provider order:', ordered);

  // Map provider to implementation
  const impl = {
    openai: () => callOpenAIJSONByChunk(chunks, maxCharsPerChunk),
    anthropic: () => callAnthropicJSONByChunk(chunks),
    google: () => callGoogleJSONByChunk(chunks),
  };

  let firstOk: Probe | null = null;
  const results: Probe[] = [];

  // Primary-first strategy with optional short-circuit
  if (strategy === "primary_first" && ordered.length > 0) {
    const first = ordered[0];
    console.log(`🤖 Trying primary provider: ${first}`);
    
    const res = await safeCall(impl[first], first);
    results.push(res);
    
    if (res.ok) {
      firstOk = res;
      console.log(`✅ Primary success: ${first} (${res.ms}ms)`);
      
      // Short-circuit if configured to not run secondaries on success
      if (!runSecondariesOnSuccess) {
        console.log('🏃‍♂️ Short-circuiting - not running secondary providers');
        const fused = fuseResults([firstOk.data]);
        const quality = computeQuality(fused, { citations: fused?.citations });
        console.log(`📊 Final quality: ${quality}% from ${first} (primary only)`);
        
        return { 
          successes: [firstOk], 
          failures: [], 
          fused 
        };
      }
    } else {
      console.log(`❌ Primary failed: ${first} - trying secondaries`);
    }
  }

  // Run remaining providers (secondaries) in parallel
  const remainingProviders = ordered.slice(firstOk ? 1 : 0);
  if (remainingProviders.length > 0) {
    console.log('🔄 Running secondary providers:', remainingProviders);
    
    const tasks = remainingProviders.map(provider =>
      safeCall(impl[provider], provider)
    );
    
    const secondaryResults = await Promise.all(tasks);
    results.push(...secondaryResults);
  }

  // Analyze results
  const successes = results.filter(r => r.ok);
  const failures = results.filter(r => !r.ok);

  if (!successes.length) {
    console.log(`❌ All providers failed`);  
    const error: any = new Error("All providers failed");
    error.details = failures.map(f => ({
      provider: f.provider,
      status: f.status,
      code: f.code,
      error: f.error
    }));
    error.providers = { runs: failures };
    throw error;
  }

  // Fuse results from all successful providers
  const fused = fuseResults(successes.map(s => s.data));
  const quality = computeQuality(fused, { citations: fused?.citations });
  
  console.log('📊 Final results:', {
    successes: successes.length,
    failures: failures.length,
    quality: `${quality}%`,
    providers: successes.map(r => ({ provider: r.provider, ok: r.ok, ms: r.ms }))
  });

  return { successes, failures, fused };
}