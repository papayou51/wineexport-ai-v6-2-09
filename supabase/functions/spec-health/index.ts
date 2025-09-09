// supabase/functions/spec-health/index.ts
// KPIs d'extraction par organisation : qualité moyenne, couverture des champs, winner providers, citations.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const FIELDS = [
  "productName","producer","brand","appellation","region","country",
  "color","style","vintage","grapes","abv_percent","residualSugar_gL",
  "acidity_gL","closure","volume_ml","sulfites","organicCert","awards",
  "tastingNotes","foodPairing","servingTemp_C","ageingPotential_years",
  "exportNetPrice_EUR","availableVolume_cases","packaging","allergenInfo",
  "labelComplianceNotes"
];

type Run = { provider: "openai"|"anthropic"|"google"; ok?: boolean; status?: number|null; code?: string|null };
type Row = {
  organization_id: string|null;
  quality_score: number|null;
  spec_json: Record<string, any> | null;
  providers: { runs?: Run[] } | null;
  created_at: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const org = url.searchParams.get("organizationId") || undefined;
    const days = Number(url.searchParams.get("days") || "90"); // fenêtre d'analyse
    const limit = Number(url.searchParams.get("limit") || "1000");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const since = new Date(Date.now() - days*24*3600*1000).toISOString();

    let q = sb.from("product_specs")
      .select("organization_id,quality_score,spec_json,providers,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (org) q = q.eq("organization_id", org);

    const { data, error } = await q;
    if (error) throw error;

    const rows = (data || []) as Row[];
    const total = rows.length;

    // Qualité moyenne
    const qualities = rows.map(r => r.quality_score).filter((n): n is number => typeof n === "number");
    const avgQuality = qualities.length ? Math.round(qualities.reduce((a,b)=>a+b,0)/qualities.length) : null;

    // Couverture des champs
    const coverageCount: Record<string, number> = Object.fromEntries(FIELDS.map(f => [f, 0]));
    for (const r of rows) {
      const spec = r.spec_json || {};
      for (const f of FIELDS) {
        const v = spec[f];
        const filled = v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "") && !(Array.isArray(v) && v.length === 0);
        if (filled) coverageCount[f] += 1;
      }
    }
    const coverageRate = Object.fromEntries(
      FIELDS.map(f => [f, total ? Math.round(1000*coverageCount[f]/total)/10 : 0])
    );

    // Winner provider par analyse = premier run ok:true
    let openaiWins=0, anthropicWins=0, googleWins=0, failed=0;
    let citationsOK=0;
    for (const r of rows) {
      const runs = r.providers?.runs || [];
      const winner = runs.find(x => x.ok === true);
      if (winner?.provider === "openai") openaiWins++;
      else if (winner?.provider === "anthropic") anthropicWins++;
      else if (winner?.provider === "google") googleWins++;
      else failed++;

      const spec = r.spec_json || {};
      const cites = spec?.citations && Object.keys(spec.citations).length > 0;
      if (cites) citationsOK++;
    }

    const share = (n: number) => total ? Math.round(1000*n/total)/10 : 0;
    const usage = {
      openai: share(openaiWins),
      anthropic: share(anthropicWins),
      google: share(googleWins),
      failed: share(failed),
    };

    const citationsRate = share(citationsOK);

    const recentLimit = Number(url.searchParams.get("recentLimit") || "20");

    // Construisons la liste "recent" (les N dernières analyses détaillées)
    const recent = rows.slice(0, recentLimit).map(r => ({
      created_at: r.created_at,
      quality_score: r.quality_score,
      providers: r.providers,     // { runs: [...] }
      citations: (r.spec_json as any)?.citations,
    }));

    return new Response(JSON.stringify({
      success: true,
      windowDays: days,
      totalAnalyses: total,
      avgQuality,
      usage,                  // somme ≤ 100%
      coverageRate,           // % de remplissage par champ
      citationsRate,          // % d'analyses avec citations
      recent                  // nouveau: historique exploitable côté UI
    }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || "unknown" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});