import * as React from "react";
import { Download } from "lucide-react";

// Types de la réponse spec-health
type Provider = "openai" | "anthropic" | "google";
type Run = { provider: Provider; ok?: boolean; status?: number | null; code?: string | null; message?: string; ms?: number };
type HealthResponse = {
  success: boolean;
  windowDays: number;
  totalAnalyses: number;
  avgQuality: number | null;
  usage: { openai: number; anthropic: number; google: number; failed: number; fallback?: number };
  citationsRate: number;
  coverageRate: Record<string, number>;
  recent?: Array<{ created_at: string; quality_score: number | null; providers?: { runs?: Run[] } }>;
};

function cx(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(" "); }
function fmtPct(n?: number) { return typeof n === "number" ? `${n.toFixed(1)}%` : "—"; }
function fmtDate(s: string) { try { return new Date(s).toLocaleString(); } catch { return s; } }

function runStatus(r?: Run) {
  if (!r) return { label: "Inconnu", cls: "bg-muted text-muted-foreground" };
  if (r.ok) return { label: "OK", cls: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" };
  if (r.code === "rate_limited" || r.status === 429) return { label: "Quota", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" };
  if (r.code === "unauthorized" || r.status === 401) return { label: "Auth", cls: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" };
  if (r.code === "invalid_model") return { label: "Modèle", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400" };
  return { label: "KO", cls: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" };
}

function ProviderBadges({ runs = [] as Run[] }) {
  const providers: Provider[] = ["openai", "anthropic", "google"];
  return (
    <div className="flex flex-wrap gap-2">
      {providers.map(p => {
        const r = runs.find(x => x.provider === p);
        const s = runStatus(r);
        return (
          <span key={p} className={cx("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium", s.cls)}>
            {p[0].toUpperCase()+p.slice(1)} — {s.label}
          </span>
        );
      })}
    </div>
  );
}

export default function AIExtractionHistory({
  organizationId,
  days = 30,
  recentLimit = 20,
  endpoint = "/functions/v1/spec-health",
}: { organizationId?: string; days?: number; recentLimit?: number; endpoint?: string }) {

  const [data, setData] = React.useState<HealthResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams();
      if (organizationId) qs.set("organizationId", organizationId);
      qs.set("days", String(days));
      qs.set("recentLimit", String(recentLimit));
      const r = await fetch(`${endpoint}?${qs.toString()}`);
      const j: HealthResponse = await r.json();
      if (!j?.success) throw new Error("spec-health failed");
      setData(j);
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [organizationId, days, recentLimit, endpoint]);

  React.useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_,i)=><div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-4 rounded-xl bg-destructive/10 text-destructive">
        Erreur de chargement du monitoring : {error || "inconnu"} 
        <button onClick={load} className="ml-3 underline">Réessayer</button>
      </div>
    );
  }

  const { totalAnalyses, avgQuality, usage, citationsRate, recent = [] } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Historique des extractions IA</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{days} derniers jours</span>
          <button onClick={load} className="rounded-lg px-3 py-1.5 bg-muted hover:bg-muted/80 text-sm">Actualiser</button>
          <a
            href={`/functions/v1/spec-export?${new URLSearchParams({
              ...(organizationId && { organizationId }),
              days: String(days),
              delimiter: "semicolon",
              filename: "extraction-audit.csv"
            }).toString()}`}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </a>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-muted-foreground">Total analyses</div>
          <div className="text-2xl font-semibold">{totalAnalyses}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-muted-foreground">Qualité moyenne</div>
          <div className="text-2xl font-semibold">{avgQuality ?? "—"}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-muted-foreground">Citations présentes</div>
          <div className="text-2xl font-semibold">{fmtPct(citationsRate)}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-muted-foreground">Échecs</div>
          <div className="text-2xl font-semibold">{fmtPct(usage.failed)}</div>
        </div>
      </div>

      {/* Usage bars */}
      <div className="rounded-2xl border p-4">
        <div className="mb-3 font-medium">Répartition d'usage (winner par analyse)</div>
        {[
          { label: "OpenAI", value: usage.openai },
          { label: "Anthropic", value: usage.anthropic },
          { label: "Google", value: usage.google },
          { label: "Échecs", value: usage.failed },
        ].map((row) => (
          <div key={row.label} className="mb-2">
            <div className="flex justify-between text-sm">
              <span>{row.label}</span><span>{fmtPct(row.value)}</span>
            </div>
            <div className="h-2 rounded bg-muted">
              <div className="h-2 rounded bg-foreground" style={{ width: `${Math.min(100, row.value || 0)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent table */}
      <div className="rounded-2xl border">
        <div className="p-4 font-medium">Dernières analyses</div>
        <div className="border-t">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Qualité</th>
                <th className="text-left p-3">Providers</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={3} className="p-4 text-muted-foreground">Aucune analyse récente.</td></tr>
              )}
              {recent.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{fmtDate(r.created_at)}</td>
                  <td className="p-3">
                    {typeof r.quality_score === "number" ? (
                      <span className={cx(
                        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                        r.quality_score >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" :
                        r.quality_score >= 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" :
                        "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      )}>
                        {r.quality_score}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="p-3">
                    <ProviderBadges runs={r.providers?.runs ?? []} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}