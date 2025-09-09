// pdf-chunk.ts
// Découpage du texte PDF en chunks ~6–8k caractères, avec conservation des pages.

export type PageBlock = { page: number; text: string };
export type TextChunk = { pageStart: number; pageEnd: number; text: string };

/**
 * Découpe un tableau de pages en blocs de taille maxChars.
 * - Concatène les pages en gardant pageStart/pageEnd.
 * - Évite les "micro-chunks" en fin de flux en rééquilibrant si possible.
 */
export function chunkByPages(
  pages: PageBlock[],
  maxChars: number = 8000,
  minChunk: number = 1500
): TextChunk[] {
  if (!Array.isArray(pages) || pages.length === 0) return [];

  const out: TextChunk[] = [];
  let acc = "";
  let start = pages[0].page;
  let end = pages[0].page;

  const flush = () => {
    if (!acc.trim()) return;
    out.push({ pageStart: start, pageEnd: end, text: acc.trim() });
    acc = "";
  };

  for (const p of pages) {
    const candidate = acc ? acc + "\n" + p.text : p.text;
    if (candidate.length > maxChars && acc.length >= minChunk) {
      // On flush l'accumulateur et on repart sur cette page
      flush();
      acc = p.text;
      start = p.page;
      end = p.page;
    } else {
      acc = candidate;
      end = p.page;
    }
  }
  flush();

  // Équilibrage simple si le dernier bloc est minuscule
  if (out.length >= 2) {
    const last = out[out.length - 1];
    const prev = out[out.length - 2];
    if (last.text.length < minChunk && (prev.text.length + last.text.length) <= maxChars * 1.2) {
      out[out.length - 2] = {
        pageStart: prev.pageStart,
        pageEnd: last.pageEnd,
        text: (prev.text + "\n" + last.text).trim()
      };
      out.pop();
    }
  }

  return out;
}