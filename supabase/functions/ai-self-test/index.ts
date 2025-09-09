// supabase/functions/ai-self-test/index.ts
// Pings OpenAI / Anthropic / Google et renvoie un diagnostic lisible.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { callGoogleFromRawPDF } from "../_shared/ai-orchestrator/providers/google-pdf.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type Provider = "openai" | "anthropic" | "google" | "google_pdf";
type Probe = { provider: Provider; ok: boolean; status?: number | null; code?: string | null; message?: string; ms?: number };

async function safe<T>(fn: () => Promise<T>, provider: Provider): Promise<Probe> {
  const t0 = Date.now();
  try {
    await fn();
    return { provider, ok: true, ms: Date.now() - t0 };
  } catch (e: any) {
    const status = e?.status ?? e?.response?.status ?? null;
    const msg = e?.message ?? "unknown";
    let code: string | null = null;
    if (status === 401) code = "unauthorized";
    else if (status === 429 || /quota|rate.?limit/i.test(msg)) code = "rate_limited";
    else if (/model.*not.*found|invalid.*model/i.test(msg)) code = "invalid_model";
    return { provider, ok: false, status, code, message: msg, ms: Date.now() - t0 };
  }
}

async function pingOpenAI() {
  const k = Deno.env.get("OPENAI_API_KEY");
  if (!k) throw Object.assign(new Error("OPENAI_API_KEY missing"), { status: 401 });
  const model = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: 'Return {"ok":true} only as JSON.' }],
      tools: [{
        type: "function",
        function: {
          name: "emit_test",
          description: "Return test result",
          parameters: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] }
        }
      }],
      tool_choice: { type: "function", function: { name: "emit_test" } }
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    const e: any = new Error(t);
    e.status = r.status;
    throw e;
  }
  await r.json();
}

async function pingGooglePDF() {
  const k = Deno.env.get("GOOGLE_API_KEY");
  if (!k) throw Object.assign(new Error("GOOGLE_API_KEY missing"), { status: 401 });
  if ((Deno.env.get("ENABLE_GEMINI_PDF") || "0") !== "1") {
    throw Object.assign(new Error("ENABLE_GEMINI_PDF not enabled"), { status: 404 });
  }
  
  // Mini PDF valide pour tester l'upload
  const minimalPdf = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n").buffer;
  await callGoogleFromRawPDF(minimalPdf);
}

async function pingAnthropic() {
  const k = Deno.env.get("ANTHROPIC_API_KEY");
  if (!k) throw Object.assign(new Error("ANTHROPIC_API_KEY missing"), { status: 401 });
  const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-3-5-sonnet-20240620";
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": k, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 64,
      system: "Return JSON only.",
      messages: [{ role: "user", content: 'Return {"ok":true}' }],
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    const e: any = new Error(t);
    e.status = r.status;
    throw e;
  }
  await r.json();
}

async function pingGoogle() {
  const k = Deno.env.get("GOOGLE_API_KEY");
  if (!k) throw Object.assign(new Error("GOOGLE_API_KEY missing"), { status: 401 });
  const model = Deno.env.get("GOOGLE_MODEL") || "gemini-1.5-pro";
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${k}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: 'Return {"ok":true} as JSON' }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  if (!r.ok) {
    const t = await r.text();
    const e: any = new Error(t);
    e.status = r.status;
    throw e;
  }
  await r.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const probes = await Promise.all([
    safe(pingOpenAI, "openai"),
    safe(pingAnthropic, "anthropic"),
    safe(pingGoogle, "google"),
    safe(pingGooglePDF, "google_pdf"),
  ]);

  const ok = probes.some((p) => p.ok);
  return new Response(JSON.stringify({ success: ok, probes }, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});