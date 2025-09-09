export async function callAnthropicJSON(chunks: {text: string, pageStart?: number, pageEnd?: number}[]) {
  const k = Deno.env.get("ANTHROPIC_API_KEY")!;
  const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-3-5-sonnet-20240620";

  const system = "You are an expert oenologist. Output ONLY the tool result.";
  const user = chunks.map(c => 
    `Pages ${c.pageStart ?? ""}-${c.pageEnd ?? ""}\n"""${c.text}"""`
  ).join("\n\n");

  console.log(`🤖 Anthropic API request: model=${model}, chunks=${chunks.length}`);

  // JSON Schema minimal du spec (tu peux l'étendre, c'est l'essentiel pour stabiliser)
  const input_schema = {
    type: "object",
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
        required: ["variety"]
      }},
      abv_percent: { type: ["number","null"] },
      residualSugar_gL: { type: ["number","null"] },
      acidity_gL: { type: ["number","null"] },
      closure: { type: ["string","null"] },
      volume_ml: { type: ["number","null"] },
      sulfites: { type: ["boolean","null"] },
      organicCert: { type: ["string","null"] },
      awards: { type: ["array","null"], items: {type:"string"} },
      tastingNotes: { type: ["string","null"] },
      foodPairing: { type: ["array","null"], items: {type:"string"} },
      servingTemp_C: { type: ["number","null"] },
      ageingPotential_years: { type: ["number","null"] },
      exportNetPrice_EUR: { type: ["number","null"] },
      availableVolume_cases: { type: ["number","null"] },
      packaging: { type: ["string","null"] },
      allergenInfo: { type: ["array","null"], items: {type:"string"} },
      labelComplianceNotes: { type: ["string","null"] },
      citations: { type: "object", additionalProperties: { type:"array", items:{type:"integer"} } },
      confidence: { type: "object", additionalProperties: { type:"number" } }
    },
    additionalProperties: true
  };

  const body: any = {
    model,
    max_tokens: 4000,
    system,
    messages: [{ role: "user", content: user }],
    tools: [{ name: "emit_spec", input_schema }],
    tool_choice: { type: "tool", name: "emit_spec" } // ⇐ force le JSON conforme
  };

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { 
      "x-api-key": k, 
      "anthropic-version": "2023-06-01", 
      "content-type": "application/json" 
    },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const errorText = await r.text();
    console.error(`❌ Anthropic API Error ${r.status}:`, errorText);
    
    const e: any = new Error(`Anthropic API Error: ${errorText}`);
    e.status = r.status;
    throw e;
  }

  const json = await r.json();
  
  console.log('✅ Anthropic response received:', {
    inputTokens: json.usage?.input_tokens || 0,
    outputTokens: json.usage?.output_tokens || 0
  });

  // la tool call est dans content[].tool_use.input
  const toolUse = json.content?.find((p: any) => p?.type === "tool_use");
  return toolUse?.input ?? {}; // déjà JSON
}

export async function callAnthropicJSONByChunk(chunks: {text: string, pageStart?: number, pageEnd?: number}[]) {
  const k = Deno.env.get("ANTHROPIC_API_KEY")!;
  const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-3-5-sonnet-20240620";

  const system = "You are an expert wine data extraction AI. Extract precise product specifications from the provided text.\n\nSTRICT OUTPUT RULES:\n- Return structured JSON data via the function tool\n- Use exact data types: integers for years/volumes, numbers for percentages, booleans for yes/no\n- NO string formatting: use 14.5 not \"14.5%\", use 750 not \"75cl\", use 2020 not \"2020\"\n- color must be exactly: \"red\", \"white\", \"rosé\", \"sparkling\", or \"orange\" (lowercase)\n- Use null for unknown/unclear information\n- Cite page numbers in citations object\n- Be precise and complete\n\nExtract all available wine specifications from the text.";
  
  // JSON Schema for individual chunk processing
  const input_schema = {
    type: "object",
    properties: {
      productName: { type: ["string","null"] },
      producer: { type: ["string","null"] },
      brand: { type: ["string","null"] },
      appellation: { type: ["string","null"] },
      region: { type: ["string","null"] },
      country: { type: ["string","null"] },
      color: { type: ["string","null"], enum: ["red","white","rosé","sparkling","orange",null] },
      vintage: { type: ["integer","null"] },
      grapes: { type: ["array","null"], items: {
        type: "object",
        properties: { variety: {type:"string"}, percent: {type:["number","null"]} },
        required: ["variety"]
      }},
      abv_percent: { type: ["number","null"] },
      tastingNotes: { type: ["string","null"] },
      citations: { type: "object", additionalProperties: { type:"array", items:{type:"integer"} } }
    },
    additionalProperties: true
  };

  const results: any[] = [];

  for (const c of chunks) {
    const user = `Pages ${c.pageStart ?? ""}-${c.pageEnd ?? ""}\n"""${c.text}"""`;

    const body = {
      model,
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: user }],
      tools: [{ name: "emit_spec", input_schema }],
      tool_choice: { type: "tool", name: "emit_spec" }
    };

    // One request per chunk (sequential to avoid rate limits)
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { 
        "x-api-key": k, 
        "anthropic-version": "2023-06-01", 
        "content-type": "application/json" 
      },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const errorText = await r.text();
      const e: any = new Error(`Anthropic API Error: ${errorText}`);
      e.status = r.status;
      throw e;
    }

    const json = await r.json();
    const toolUse = json.content?.find((p: any) => p?.type === "tool_use");
    results.push(toolUse?.input ?? {});
  }

  // Import fuseResults to combine results from all chunks
  const { fuseResults } = await import("../fuse.ts");
  return fuseResults(results);
}