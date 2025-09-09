import { fuseResults } from "../fuse.ts";

type Chunk = { text: string; pageStart?: number; pageEnd?: number };

export async function callOpenAIJSONByChunk(chunks: Chunk[], maxCharsPerChunk?: number) {
  const k = Deno.env.get("OPENAI_API_KEY")!;
  const model = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
  const MAX = maxCharsPerChunk || Number(Deno.env.get("CHUNK_SIZE") || 6000);

  console.log(`🤖 OpenAI API request: model=${model}, chunks=${chunks.length}, maxChars=${MAX}`);

  const parameters = {
    type: "object",
    additionalProperties: false,
    properties: {
      productName: { type: ["string","null"] },
      producer: { type: ["string","null"] },
      brand: { type: ["string","null"] },
      appellation: { type: ["string","null"] },
      region: { type: ["string","null"] },
      country: { type: ["string","null"] },
      color: { type: ["string","null"], enum: ["red","white","rosé","sparkling","orange",null] },
      style: { type: ["string","null"] },
      vintage: { type: ["integer","null"] },
      grapes: { type: ["array","null"], items: {
        type: "object",
        properties: { variety: {type:"string"}, percent: {type:["number","null"]} },
        required: ["variety"],
        additionalProperties: false
      }},
      abv_percent: { type: ["number","null"] },
      residualSugar_gL: { type: ["number","null"] },
      acidity_gL: { type: ["number","null"] },
      closure: { type: ["string","null"] },
      volume_ml: { type: ["integer","null"] },
      sulfites: { type: ["boolean","null"] },
      organicCert: { type: ["string","null"] },
      awards: { type: ["array","null"], items: {type:"string"} },
      tastingNotes: { type: ["string","null"] },
      foodPairing: { type: ["array","null"], items: {type:"string"} },
      servingTemp_C: { type: ["integer","null"] },
      ageingPotential_years: { type: ["integer","null"] },
      exportNetPrice_EUR: { type: ["number","null"] },
      availableVolume_cases: { type: ["integer","null"] },
      packaging: { type: ["string","null"] },
      allergenInfo: { type: ["array","null"], items: {type:"string"} },
      labelComplianceNotes: { type: ["string","null"] },
      citations: { type: "object", additionalProperties: { type:"array", items:{type:"integer"} } },
      confidence: { type: "object", additionalProperties: { type:"number" } }
    }
  };

  const results: any[] = [];

  for (const c of chunks) {
    let text = c.text.length > MAX ? c.text.slice(0, MAX) : c.text;

    const system = `Tu es un expert en extraction de données de fiches techniques de vin et spiritueux français.

Analyse le contenu fourni et extrait UNIQUEMENT les informations présentes dans le texte.
Retourne un JSON strict selon le schéma fourni.

Règles importantes :
- Toujours proposer un "productName" plausible s'il n'est pas explicitement indiqué, en combinant producteur, cuvée, appellation et millésime (ex: "Château Labrie Rouge 2020")
- Si une information n'est pas mentionnée, utilise null
- Pour les volumes, convertis en ml (ex: "75cl" → 750)  
- Pour l'alcool, extrait le pourcentage numérique (ex: "13,5°" → 13.5)
- Les citations doivent référencer les pages où l'info est trouvée
- Retourner un JSON strict, avec champs connus du schéma
- Ajouter "citations": { "<champ>": [ "p3", "p4" ] } quand possible
- Sois précis et factuel, n'invente rien mais propose des noms cohérents

FORMAT CRITIQUE:
- Numbers must be plain numbers, not strings (no "%", "cl", "ml", "°" etc.)
- volume_ml: integer in milliliters (750, 1500, not "75cl" or "0.75l")
- vintage: integer year (2020, not "2020")
- abv_percent: decimal number (14.5, not "14.5%")
- color: must be exactly one of: "red", "white", "rosé", "sparkling", "orange" (lowercase)
- grapes: array of objects with {variety: string, percent: number|null}
- Use null when information is unknown or unclear
- Always cite page numbers in citations object

Return ONLY via the function tool.`;

    const user = `Extract wine specifications from pages ${c.pageStart ?? ""}-${c.pageEnd ?? ""}:

"""${text}"""`;

    const body = {
      model, 
      temperature: 0.1,
      messages: [
        { role:"system", content: system }, 
        { role:"user", content: user }
      ],
      tools: [{ 
        type:"function", 
        function:{ 
          name:"emit_spec", 
          description:"Return wine product spec", 
          parameters 
        } 
      }],
      tool_choice: { type:"function", function:{ name:"emit_spec" } }
    };

    console.log(`🔄 Processing chunk ${chunks.indexOf(c) + 1}/${chunks.length}, text length: ${text.length}`);

    // Une requête par chunk (séquentiel => pas de 429)
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization:`Bearer ${k}`, "Content-Type":"application/json" },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      let msg = await r.text();
      const isContext = /context|length|too\s*long/i.test(msg) || r.status === 400;
      
      // Plan B : rétrécir davantage si besoin
      if (isContext && text.length > 4000) {
        console.log(`⚠️ Context length exceeded, retrying with smaller chunk (${text.length} -> 4000)`);
        text = text.slice(0, 4000);
        const body2 = { 
          ...body, 
          messages:[
            {role:"system",content:system},
            {role:"user",content:`Pages ${c.pageStart ?? ""}-${c.pageEnd ?? ""}\n"""${text}"""`}
          ] 
        };
        
        const r2 = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST", 
          headers: { Authorization:`Bearer ${k}`, "Content-Type":"application/json" }, 
          body: JSON.stringify(body2)
        });
        
        if (!r2.ok) { 
          const t2 = await r2.text(); 
          console.error(`❌ OpenAI API Error (retry) ${r2.status}:`, t2);
          const e:any = new Error(`OpenAI API Error: ${t2}`); 
          e.status = r2.status; 
          throw e; 
        }
        
        const j2 = await r2.json();
        const call2 = j2.choices?.[0]?.message?.tool_calls?.[0];
        results.push(JSON.parse(call2?.function?.arguments || "{}"));
        continue;
      }
      
      console.error(`❌ OpenAI API Error ${r.status}:`, msg);
      const e:any = new Error(`OpenAI API Error: ${msg}`); 
      e.status = r.status; 
      throw e;
    }

    const j = await r.json();
    const call = j.choices?.[0]?.message?.tool_calls?.[0];
    results.push(JSON.parse(call?.function?.arguments || "{}"));
    
    console.log(`✅ Chunk ${chunks.indexOf(c) + 1} processed successfully`);
  }

  console.log(`🔀 Fusing ${results.length} chunk results`);
  // On renvoie la fusion des résultats par chunk
  return fuseResults(results);
}

// Keep the original function for backward compatibility but deprecated
export async function callOpenAIJSON(chunks: Chunk[]) {
  console.warn("⚠️ callOpenAIJSON is deprecated, use callOpenAIJSONByChunk instead");
  return callOpenAIJSONByChunk(chunks);
}