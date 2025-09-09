type ProviderRun = { 
  provider: "openai" | "anthropic" | "google"; 
  ok?: boolean; 
  status?: number | null; 
  code?: string | null; 
  message?: string; 
  ms?: number 
};

export function formatLLMError(payload: any) {
  // Edge function sends: {success:false, error, details, providers:{runs: ProviderRun[]}}
  const runs: ProviderRun[] = payload?.providers?.runs || [];
  if (!runs.length) return payload?.details || "Échec inconnu de l'orchestrateur.";

  const icon = (p: ProviderRun["provider"]) =>
    p === "openai" ? "🚀" : p === "anthropic" ? "🤖" : "🧠";

  // Stable order
  const order = ["openai", "anthropic", "google"] as const;
  const sorted = runs.slice().sort((a, b) => order.indexOf(a.provider as any) - order.indexOf(b.provider as any));

  const lines = sorted.map(r => {
    const state = r.ok ? "OK" :
      r.code === "rate_limited" || r.status === 429 ? "QUOTA" :
      r.code === "unauthorized" || r.status === 401 ? "AUTH" :
      r.code === "invalid_model" ? "MODEL" : "KO";
    const msg = (r.message || "").slice(0, 140).replace(/\s+/g, " ").trim();
    return `${icon(r.provider)} ${r.provider} — ${state}${r.status ? ` (${r.status})` : ""}${r.code ? ` [${r.code}]` : ""}${msg ? `: ${msg}` : ""}`;
  });

  return `Analyse IA indisponible.\n${lines.join("\n")}`;
}