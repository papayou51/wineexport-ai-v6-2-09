export async function callGoogleJSON(chunks: {text: string, pageStart?: number, pageEnd?: number}[]) {
  const k = Deno.env.get("GOOGLE_API_KEY")!;
  const model = Deno.env.get("GOOGLE_MODEL") || "gemini-1.5-pro";
  
  const system = "You are an expert oenologist. Return ONLY valid JSON matching the fields. Use null when unknown. Include page citations as an object mapping field->int[].";
  const user = chunks.map(c => 
    `Pages ${c.pageStart ?? ""}-${c.pageEnd ?? ""}\n"""${c.text}"""`
  ).join("\n\n");

  console.log(`🤖 Google API request: model=${model}, chunks=${chunks.length}`);

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${k}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ 
        role: "user", 
        parts: [{ text: `${system}\n\n${user}` }]
      }],
      generationConfig: { 
        responseMimeType: "application/json"
      }
    })
  });

  if (!r.ok) {
    const errorText = await r.text();
    console.error(`❌ Google API Error ${r.status}:`, errorText);
    
    const e: any = new Error(`Google API Error: ${errorText}`);
    e.status = r.status;
    throw e;
  }

  const json = await r.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  
  console.log('✅ Google response received');

  return JSON.parse(text);
}

export async function callGoogleJSONByChunk(chunks: {text: string, pageStart?: number, pageEnd?: number}[]) {
  const k = Deno.env.get("GOOGLE_API_KEY")!;
  const model = Deno.env.get("GOOGLE_MODEL") || "gemini-1.5-pro";
  
  const system = "You are an expert wine data extraction AI. Return ONLY valid JSON.\n\nCRITICAL FORMAT REQUIREMENTS:\n- Return only raw data types: numbers as numbers (14.5), integers as integers (750), booleans as booleans (true/false)\n- NO string formatting: use 14.5 not \"14.5%\", use 750 not \"75cl\", use 2020 not \"2020\"\n- color field must be exactly: \"red\", \"white\", \"rosé\", \"sparkling\", or \"orange\" (lowercase)\n- Use null for unknown information\n- Always include page citations as field -> array of page numbers\n\nExtract all wine specifications from the text and return as structured JSON.";

  const results: any[] = [];

  for (const c of chunks) {
    const user = `Pages ${c.pageStart ?? ""}-${c.pageEnd ?? ""}\n"""${c.text}"""`;

    // One request per chunk (sequential to avoid rate limits)
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${k}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          role: "user", 
          parts: [{ text: `${system}\n\n${user}` }]
        }],
        generationConfig: { 
          responseMimeType: "application/json"
        }
      })
    });

    if (!r.ok) {
      const errorText = await r.text();
      const e: any = new Error(`Google API Error: ${errorText}`);
      e.status = r.status;
      throw e;
    }

    const json = await r.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    results.push(JSON.parse(text));
  }

  // Import fuseResults to combine results from all chunks
  const { fuseResults } = await import("../fuse.ts");
  return fuseResults(results);
}