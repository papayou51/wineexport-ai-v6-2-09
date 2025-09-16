import { encode as base64Encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

type JsonSpec = Record<string, unknown>;

export async function callGoogleFromRawPDF(pdfBuffer: ArrayBuffer): Promise<JsonSpec> {
  const k = Deno.env.get("GOOGLE_API_KEY")!;
  const model = Deno.env.get("GOOGLE_MODEL") || "gemini-1.5-pro";

  console.log(`🔎 Google PDF API request: model=${model}, PDF size=${Math.round(pdfBuffer.byteLength / 1024)}KB`);

  // 1) Upload du PDF via multipart (uploadType=multipart)
  const meta = { 
    file: { 
      displayName: "spec.pdf", 
      mimeType: "application/pdf" 
    } 
  };
  const boundary = "BOUNDARY_" + crypto.randomUUID();

  const parts = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n`,
    `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`,
  ];

  // Construire le corps multipart à la main (Deno)
  const enc = new TextEncoder();
  const tail = enc.encode(`\r\n--${boundary}--\r\n`);
  const head0 = enc.encode(parts[0]);
  const head1 = enc.encode(parts[1]);
  const pdfBytes = new Uint8Array(pdfBuffer);
  const multipart = new Uint8Array(head0.length + head1.length + pdfBytes.length + tail.length);
  multipart.set(head0, 0);
  multipart.set(head1, head0.length);
  multipart.set(pdfBytes, head0.length + head1.length);
  multipart.set(tail, head0.length + head1.length + pdfBytes.length);

  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${k}&uploadType=multipart`;
  const up = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body: multipart
  });

  if (!up.ok) { 
    const t = await up.text(); 
    console.error(`❌ Google File Upload Error ${up.status}:`, t);
    const e: any = new Error(`Google File Upload Error: ${t}`); 
    e.status = up.status; 
    throw e; 
  }

  const uploaded = await up.json(); // { name: "files/xxx", file?: { name: "...", uri: "..." }, ... }
  console.log('✅ PDF uploaded to Google Files API - Raw response:', JSON.stringify(uploaded, null, 2));
  
  // Extract fileUri correctly from the upload response
  const fileUri = uploaded?.file?.name ?? uploaded?.name ?? null;
  const fileMimeType = uploaded?.file?.mimeType ?? "application/pdf";
  
  console.log('📎 Extracted fileUri:', fileUri);
  console.log('📄 File mimeType:', fileMimeType);

  // 2) Appel génération en référencant le fichier
  const system = "You are an expert oenologist. Read the attached PDF and extract a normalized product spec. Return ONLY valid JSON. Use null when unknown. MANDATORY: Include 'citations' object with evidence and 'confidence' scores for each field.";
  
  // Strict schema aligned with ProductExtractionSchema - Google AI format
  const responseSchema = {
    type: "object",
    properties: {
      name: { type: "string", nullable: true },
      producer: { type: "string", nullable: true },
      appellation: { type: "string", nullable: true },
      region: { type: "string", nullable: true },
      country: { type: "string", nullable: true },
      color: { type: "string", nullable: true },
      vintage: { type: "number", nullable: true },
      grapes: { 
        type: "array",
        nullable: true,
        items: { type: "string" }
      },
      alcohol: { type: "number", nullable: true },
      sugar: { type: "number", nullable: true },
      acidity: { type: "number", nullable: true },
      ph: { type: "number", nullable: true },
      serving_temperature: { type: "number", nullable: true },
      aging: { type: "string", nullable: true },
      awards: { type: "string", nullable: true },
      tasting_notes: { type: "string", nullable: true },
      food_pairing: { type: "string", nullable: true },
      storage_conditions: { type: "string", nullable: true },
      citations: {
        type: "object",
        properties: {},
        description: "Object with field names as keys and arrays of citation objects as values"
      },
      confidence: {
        type: "object", 
        properties: {},
        description: "Object with field names as keys and confidence scores (0-100) as values"
      }
    },
    required: ["citations", "confidence"]
  };

  const gen = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${k}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: system },
          fileUri 
            ? { fileData: { fileUri, mimeType: fileMimeType } }
            : { inlineData: { mimeType: "application/pdf", data: base64Encode(new Uint8Array(pdfBuffer)) } }
        ]
      }],
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    })
  });

  if (!gen.ok) { 
    const t = await gen.text(); 
    console.error(`❌ Google PDF Generation Error ${gen.status}:`, t);
    const e: any = new Error(`Google PDF API Error: ${t}`); 
    e.status = gen.status; 
    throw e; 
  }

  const j = await gen.json();
  const text = j.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  
  console.log('✅ Google PDF response received');
  return JSON.parse(text);
}