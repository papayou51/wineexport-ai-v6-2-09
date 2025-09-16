import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_API = "https://api.openai.com/v1";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper function to upload PDF with purpose fallback
async function uploadFileForResponses(file: File, apiKey: string, base: string) {
  // certains déploiements refusent PDF avec "input"
  const purposes = ["assistants", "user_data", "input"];
  let lastErr = "";

  for (const purpose of purposes) {
    const fd = new FormData();
    fd.append("file", file, file.name || "document.pdf");
    fd.append("purpose", purpose);

    const up = await fetch(`${base}/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
    });

    if (up.ok) {
      const j = await up.json();
      console.log(`[files] Uploaded with purpose="${purpose}" → ${j?.id}`);
      return j?.id as string;
    }

    const t = await up.text();
    lastErr = t;
    console.warn(`[files] purpose="${purpose}" refused (${up.status}).`, t);

    // si on voit "Invalid file format application/pdf" on essaie le suivant
    if (/Invalid file format .*application\/pdf/i.test(t)) continue;

    // autre erreur bloquante → on remonte
    throw new Error(`OpenAI /files (${purpose}) error: ${t}`);
  }

  throw new Error(
    `OpenAI /files refused PDF for all purposes (assistants,user_data,input). Last: ${lastErr}`
  );
}

// Helper function for /responses call with model fallback
async function callResponses(model: string, fileId: string) {
  const payload = {
    model,
    instructions:
      "Lis UNIQUEMENT le PDF fourni. Réponds en TEXTE BRUT (aucun markdown/HTML). " +
      "Conserve exactement les espaces et les sauts de ligne. Ne normalise rien.",
    text: { format: "plain" },
    tool_choice: "none",
    input: [
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
  };

  return fetch(`${OPENAI_API}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

// Enhanced error messages for better UX
const getErrorMessage = (status: number, details?: string) => {
  switch (status) {
    case 413:
      return "Fichier trop volumineux. Utilisez un PDF de moins de 25 Mo.";
    case 415:
      return "Seuls les fichiers PDF sont acceptés.";
    case 401:
    case 403:
      return "Accès bloqué (CORS/JWT). Réessayez après connexion ou contactez le support.";
    case 502:
      return "Le moteur IA a renvoyé une erreur. Réessayez avec un PDF plus simple.";
    default:
      return details || "Erreur inconnue lors de l'analyse du PDF.";
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!OPENAI_API_KEY) {
    console.error("❌ OpenAI API key not configured");
    return new Response(getErrorMessage(500, "Configuration serveur manquante"), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=UTF-8" },
    });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    
    if (!(file instanceof File)) {
      return new Response(getErrorMessage(400, "Missing 'file' (PDF)"), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=UTF-8" },
      });
    }
    
    if (!file.type?.includes("pdf")) {
      return new Response(getErrorMessage(415), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=UTF-8" },
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      console.error(`❌ File too large: ${Math.round(file.size / 1024 / 1024)} MB`);
      return new Response(getErrorMessage(413), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=UTF-8" },
      });
    }

    console.log(`📄 Analyzing PDF (no local parsing): ${file.name} (${Math.round(file.size / 1024)} KB)`);

    // Étape A — upload du PDF TEL QUEL à OpenAI avec purpose fallback
    const fileId = await uploadFileForResponses(file, OPENAI_API_KEY!, OPENAI_API);

    // Étape B — appel /responses avec fallback modèle
    let res = await callResponses("gpt-4o-mini", fileId);
    if (!res.ok) {
      const t = await res.text();
      console.warn("[responses] gpt-4o-mini refused:", t);
      if (/input_file|unsupported|not supported/i.test(t)) {
        res = await callResponses("gpt-4.1", fileId);
      } else {
        return new Response(`OpenAI /responses error: ${t}`, {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "text/plain; charset=UTF-8" },
        });
      }
    }

    if (!res.ok) {
      const t = await res.text();
      return new Response(`OpenAI /responses error: ${t}`, {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=UTF-8" },
      });
    }

    const data = await res.json();
    const raw =
      data?.output?.[0]?.content?.[0]?.text ??
      data?.choices?.[0]?.message?.content ?? "";

    if (!raw) {
      return new Response("Empty AI output", {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=UTF-8" },
      });
    }

    console.log(`✅ PDF analysis completed: ${raw.length} characters`);

    // ⚠️ Retour BRUT, sans trim/normalisation
    return new Response(raw, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=UTF-8" },
    });
  } catch (err: any) {
    console.error("❌ Error in analyze-pdf-raw function:", err);
    return new Response(
      getErrorMessage(500, err?.message ?? String(err)),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/plain; charset=UTF-8" } },
    );
  }
});