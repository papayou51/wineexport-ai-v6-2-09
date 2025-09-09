// supabase/functions/spec-export/index.ts
// Exporte un CSV des extractions IA (une ligne = 1 analyse)
// Query params:
//   organizationId?=uuid
//   days?=90
//   limit?=5000
//   delimiter?=comma|semicolon          (def: comma)
//   filename?=export.csv
//   fields?=productName,appellation,... (champs *additionnels* à inclure depuis spec_json)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type Run = { provider: "openai"|"anthropic"|"google"; ok?: boolean; status?: number|null; code?: string|null; message?: string; ms?: number };
type Row = {
  organization_id: string|null;
  filename?: string|null;
  quality_score: number|null;
  spec_json: any;
  providers: { runs?: Run[] } | null;
  created_at: string;
};

const DEFAULT_FIELDS = [
  "productName","producer","brand","appellation","region","country",
  "color","style","vintage","abv_percent","tastingNotes",
  "exportNetPrice_EUR","availableVolume_cases"
];

function winnerProvider(runs: Run[] = []) {
  const w = runs.find(x => x.ok === true);
  return w ? w.provider : "none";
}
function hasCitations(spec: any) {
  const c = spec?.citations;
  return !!(c && typeof c === "object" && Object.keys(c).length);
}
function grapesCompact(spec: any) {
  const arr = Array.isArray(spec?.grapes) ? spec.grapes : [];
  if (!arr.length) return "";
  return arr.map((g: any) => {
    const v = (g?.variety || "").toString();
    const p = typeof g?.percent === "number" ? ` ${g.percent}%` : "";
    return (v + p).trim();
  }).join(" | ");
}

// CSV helpers
function sepFromParam(v: string|undefined) {
  return v === "semicolon" ? ";" : ","; // défaut: virgule
}
function csvEscape(s: any, sep: string) {
  if (s === null || s === undefined) return "";
  const str = String(s);
  const needsQuotes = str.includes('"') || str.includes("\n") || str.includes("\r") || str.includes(sep);
  const esc = str.replace(/"/g, '""');
  return needsQuotes ? `"${esc}"` : esc;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const url = new URL(req.url);
    const org = url.searchParams.get("organizationId") || undefined;
    const days = Number(url.searchParams.get("days") || "90");
    const limit = Math.min(Number(url.searchParams.get("limit") || "5000"), 20000);
    const sep = sepFromParam(url.searchParams.get("delimiter") || undefined);
    const filename = url.searchParams.get("filename") || "spec-export.csv";
    const extraFieldsParam = url.searchParams.get("fields") || "";
    const extraFields = extraFieldsParam
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .filter(f => !DEFAULT_FIELDS.includes(f)); // évite doublons

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const since = new Date(Date.now() - days*24*3600*1000).toISOString();

    let q = sb.from("product_specs")
      .select("organization_id, filename, quality_score, spec_json, providers, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (org) q = q.eq("organization_id", org);

    const { data, error } = await q;
    if (error) throw error;

    const rows = (data || []) as Row[];

    // Colonnes CSV
    const header = [
      "created_at",
      "organization_id",
      "filename",
      "quality_score",
      "winner_provider",
      "has_citations",
      "grapes_compact",
      ...DEFAULT_FIELDS,
      ...extraFields
    ];

    const lines: string[] = [];
    lines.push(header.join(sep));

    for (const r of rows) {
      const spec = r.spec_json || {};
      const runs = r.providers?.runs || [];

      const baseCols = [
        r.created_at,
        r.organization_id || "",
        r.filename || "",
        typeof r.quality_score === "number" ? r.quality_score : "",
        winnerProvider(runs),
        hasCitations(spec) ? "1" : "0",
        grapesCompact(spec),
      ];

      const specCols = [...DEFAULT_FIELDS, ...extraFields].map(k => {
        let v = spec?.[k];

        // simplification pour tableaux/objets
        if (Array.isArray(v)) v = v.join(" | ");
        else if (v && typeof v === "object") v = JSON.stringify(v);

        return v ?? "";
      });

      const rowCsv = [...baseCols, ...specCols]
        .map(c => csvEscape(c, sep))
        .join(sep);

      lines.push(rowCsv);
    }

    const csv = lines.join("\r\n");
    return new Response(csv, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });

  } catch (e: any) {
    const msg = e?.message || "unknown error";
    return new Response(`error,${csvEscape(msg, ",")}\r\n`, {
      status: 200,
      headers: { ...cors, "Content-Type": "text/csv; charset=utf-8" }
    });
  }
});