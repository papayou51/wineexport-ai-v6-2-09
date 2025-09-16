import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_API = "https://api.openai.com/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "Missing 'file' (PDF)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!file.type?.includes("pdf")) {
      return new Response(JSON.stringify({ error: "Only PDF is accepted" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`📄 Analyzing PDF (no local parsing): ${file.name} (${Math.round(file.size / 1024)} KB)`);

    // Étape A — upload du PDF TEL QUEL à OpenAI (aucune lecture/parse côté app)
    const fd = new FormData();
    fd.append("file", file, file.name);
    fd.append("purpose", "input");

    const upRes = await fetch(`${OPENAI_API}/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: fd,
    });

    if (!upRes.ok) {
      const t = await upRes.text();
      console.error("❌ OpenAI /files error:", t);
      return new Response(JSON.stringify({ error: "OpenAI /files error", details: t }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uploaded = await upRes.json();
    const fileId = uploaded?.id as string;
    if (!fileId) {
      return new Response(JSON.stringify({ error: "No file id returned by OpenAI" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Étape B — appel /responses avec le PDF en entrée (STRICTEMENT IA, pas de tools)
    const respRes = await fetch(`${OPENAI_API}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",              // modèle compatible fichiers/PDF
        response_format: { type: "text" }, // on exige un TEXTE BRUT
        tool_choice: "none",               // aucune tool/function
        input: [
          {
            role: "system",
            content:
              "Tu es un moteur d'analyse. Lis UNIQUEMENT le PDF fourni. Réponds en TEXTE BRUT, " +
              "sans markdown ni HTML. Conserve exactement les espaces et sauts de ligne. Ne résume pas le fichier, " +
              "donne ton analyse détaillée du contenu tel que lu.",
          },
          {
            role: "user",
            content: [
              { type: "input_text", text: "Analyse le PDF joint en texte brut :" },
              { type: "input_file", file_id: fileId },
            ],
          },
        ],
        temperature: 0.2,
        top_p: 1,
        max_output_tokens: 8192,
      }),
    });

    if (!respRes.ok) {
      const t = await respRes.text();
      console.error("❌ OpenAI /responses error:", t);
      return new Response(JSON.stringify({ error: "OpenAI /responses error", details: t }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await respRes.json();

    // Chemin standard de la Responses API
    const raw =
      data?.output?.[0]?.content?.[0]?.text ??
      data?.choices?.[0]?.message?.content ?? // fallback si variation SDK
      "";

    if (!raw) {
      return new Response(JSON.stringify({ error: "Empty AI output" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ⚠️ Retour BRUT, sans trim/normalisation
    return new Response(raw, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=UTF-8" },
    });
  } catch (err: any) {
    console.error("❌ Error in analyze-pdf-raw function:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err?.message ?? String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});