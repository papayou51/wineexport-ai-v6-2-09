type Run = { 
  provider: "openai" | "anthropic" | "google"; 
  ok?: boolean; 
  status?: number | null; 
  code?: string | null 
};

function statusOf(runs: Run[], p: Run["provider"]) {
  const r = runs.find(x => x.provider === p);
  if (!r) return { label: "Inconnu", color: "bg-muted text-muted-foreground" };
  if (r.ok) return { label: "OK", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" };
  if (r.code === "rate_limited" || r.status === 429) return { label: "Quota", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" };
  if (r.code === "unauthorized" || r.status === 401) return { label: "Auth", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" };
  if (r.code === "invalid_model") return { label: "Modèle", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400" };
  return { label: "KO", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" };
}

export function ProviderBadges({ runs = [] as Run[] }) {
  const ps: Run["provider"][] = ["openai", "anthropic", "google"];
  return (
    <div className="flex gap-2 flex-wrap">
      {ps.map(p => {
        const s = statusOf(runs, p);
        const icon = p === "openai" ? "🚀" : p === "anthropic" ? "🤖" : "🧠";
        return (
          <span key={p} className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${s.color}`}>
            {icon} {p.charAt(0).toUpperCase() + p.slice(1)} — {s.label}
          </span>
        );
      })}
    </div>
  );
}