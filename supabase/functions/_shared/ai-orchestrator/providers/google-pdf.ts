type JsonSpec = Record<string, unknown>;

export async function callGoogleFromRawPDF(pdfBuffer: ArrayBuffer): Promise<JsonSpec> {
  const k = Deno.env.get("GOOGLE_API_KEY")!;
  const model = Deno.env.get("GOOGLE_MODEL") || "gemini-1.5-pro";

  console.log(`🔎 Google PDF API request: model=${model}, PDF size=${Math.round(pdfBuffer.byteLength / 1024)}KB`);

  // 1) Upload du PDF via multipart (uploadType=multipart)
  const meta = { display_name: "spec.pdf", mime_type: "application/pdf" };
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

  const file = await up.json(); // { name: "files/xxx", uri?: "...", ... }
  console.log('✅ PDF uploaded to Google Files API:', file.name);

  // 2) Appel génération en référencant le fichier
  const system = "You are an expert oenologist. Read the attached PDF and extract a normalized product spec. Return ONLY valid JSON. Use null when unknown. Include page citations (field -> array of page numbers).";
  const gen = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${k}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: system },
          { fileData: { fileUri: file?.uri ?? undefined, mimeType: "application/pdf" } }
        ]
      }],
      generationConfig: { responseMimeType: "application/json" }
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