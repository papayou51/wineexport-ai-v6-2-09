// supabase/functions/_shared/ocr.ts
type PageBlock = { page: number; text: string };

export async function ocrFallbackFromPdf(
  pdfBuffer: ArrayBuffer,
  {
    apiKey = Deno.env.get("OCRSPACE_API_KEY") ?? "",
    lang = Deno.env.get("OCR_LANG") ?? "fre", // fre = français
  } = {}
): Promise<PageBlock[]> {
  if (!apiKey) throw new Error("OCR_MISCONFIGURED: missing OCRSPACE_API_KEY");

  console.log(`[OCR] Starting OCR fallback with language: ${lang}`);

  const form = new FormData();
  form.append("apikey", apiKey);
  form.append("language", lang);
  form.append("isCreateSearchablePdf", "false");
  form.append("scale", "true");
  form.append("OCREngine", "2"); // meilleur moteur
  form.append(
    "file",
    new Blob([pdfBuffer], { type: "application/pdf" }),
    "file.pdf"
  );

  const r = await fetch("https://api.ocr.space/parse/image", { 
    method: "POST", 
    body: form,
    // Add timeout for OCR requests
    signal: AbortSignal.timeout(30000) // 30 seconds timeout
  });
  
  if (!r.ok) {
    console.error(`[OCR] HTTP error: ${r.status} ${r.statusText}`);
    throw new Error(`OCR_HTTP_${r.status}`);
  }
  
  const json = await r.json();
  console.log(`[OCR] Response received, processing...`);

  if (json.IsErroredOnProcessing) {
    const msg = json.ErrorMessage?.[0] || json.ErrorMessage || "OCR_UNKNOWN_ERROR";
    console.error(`[OCR] Processing error: ${msg}`);
    throw new Error(`OCR_FAILED: ${msg}`);
  }

  const results = (json.ParsedResults ?? []) as any[];
  const pages: PageBlock[] = results.map((pr, i) => ({
    page: pr.Page ?? i + 1,
    text: (pr.ParsedText ?? "").trim(),
  })).filter(p => p.text && p.text.length > 10); // Filter out very short text

  console.log(`[OCR] Extracted ${pages.length} pages with ${pages.reduce((sum, p) => sum + p.text.length, 0)} total characters`);

  // Basic cleanup
  return pages.map(p => ({
    ...p,
    text: p.text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove common OCR artifacts
      .replace(/[^\w\s\-.,;:()%€$£\u00C0-\u017F]/g, '')
      .trim()
  })).filter(p => p.text.length > 20); // Keep only meaningful text
}