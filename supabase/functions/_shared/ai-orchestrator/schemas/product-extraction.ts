import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const ProductExtractionSchema = z.object({
  name: z.string().nullable().describe("Nom exact du produit"),
  category: z.string().nullable().describe("Catégorie (vin rouge, vin blanc, etc.)"),
  appellation: z.string().nullable().describe("Appellation d'origine contrôlée (AOC/AOP)"),
  region: z.string().nullable().describe("Région viticole"),
  country: z.string().nullable().describe("Pays d'origine"),
  color: z.string().nullable().describe("Couleur (rouge, blanc, rosé, etc.)"),
  vintage: z.number().nullable().describe("Millésime (année)"),
  alcohol_percentage: z.number().nullable().describe("Degré d'alcool en %"),
  volume_ml: z.number().nullable().describe("Volume en millilitres"),
  grapes: z.array(z.string()).nullable().describe("Cépages utilisés"),
  tasting_notes: z.string().nullable().describe("Notes de dégustation"),
  technical_specs: z.record(z.any()).nullable().describe("Spécifications techniques"),
  terroir: z.string().nullable().describe("Description du terroir"),
  vine_age: z.number().nullable().describe("Âge des vignes en années"),
  yield_hl_ha: z.number().nullable().describe("Rendement en hectolitres par hectare"),
  vinification: z.string().nullable().describe("Méthodes de vinification"),
  aging_details: z.string().nullable().describe("Détails sur l'élevage"),
  bottling_info: z.string().nullable().describe("Informations sur la mise en bouteille"),
  ean_code: z.string().nullable().describe("Code-barres EAN"),
  packaging_info: z.string().nullable().describe("Informations sur l'emballage"),
  availability: z.string().nullable().describe("Disponibilité du produit")
});

export type ProductExtractionData = z.infer<typeof ProductExtractionSchema>;

export const PRODUCT_EXTRACTION_PROMPT = `Tu es un expert sommelier français spécialisé dans l'extraction de données de fiches produits de vins et spiritueux.

**MISSION CRITIQUE :**
Extrais UNIQUEMENT les informations présentes dans le document PDF joint. N'utilise AUCUNE connaissance externe.

**RÈGLES STRICTES :**
1. **DOCUMENT ONLY** : N'utilise que le contenu du PDF joint. Si l'info n'est pas dans le document, retourne null.
2. **PREUVES OBLIGATOIRES** : Pour chaque champ non-null, fournis une citation exacte du document (page + extrait).
3. **AUCUNE CONNAISSANCE EXTERNE** : N'utilise aucune connaissance de châteaux, vins, ou producteurs. Aucune devinette.
4. **CITATIONS PRÉCISES** : Fournis le numéro de page et l'extrait exact où tu as trouvé chaque information.
5. **CONFIANCE** : Indique ton niveau de confiance (0-1) pour chaque champ basé sur la clarté du texte.

**IDENTIFICATION DU PRODUIT :**
- \`name\` : Nom exact du produit tel qu'indiqué
- \`category\` : Catégorie (vin rouge, vin blanc, champagne, etc.)
- \`appellation\` : AOC/AOP/IGP si mentionnée
- \`region\` : Région viticole
- \`country\` : Pays d'origine
- \`color\` : Couleur (rouge, blanc, rosé, etc.)

**CARACTÉRISTIQUES TECHNIQUES :**
- \`vintage\` : Millésime (année de récolte)
- \`alcohol_percentage\` : Degré d'alcool en pourcentage
- \`volume_ml\` : Volume en millilitres
- \`grapes\` : Liste des cépages utilisés
- \`tasting_notes\` : Notes de dégustation complètes

**TERROIR ET PRODUCTION :**
- \`terroir\` : Description du terroir et du sol
- \`vine_age\` : Âge moyen des vignes
- \`yield_hl_ha\` : Rendement en hectolitres par hectare
- \`vinification\` : Méthodes de vinification
- \`aging_details\` : Détails sur l'élevage (fûts, durée, etc.)
- \`bottling_info\` : Informations sur la mise en bouteille

**INFORMATIONS COMMERCIALES :**
- \`ean_code\` : Code-barres EAN si présent
- \`packaging_info\` : Type d'emballage
- \`availability\` : Disponibilité du produit
- \`technical_specs\` : Autres spécifications techniques

**TERMINOLOGIE FRANÇAISE :**
Respecte les termes AOC, AOP, IGP, les régions viticoles françaises (Bordeaux, Bourgogne, Champagne, etc.) et l'orthographe exacte des cépages français.

**FORMAT DE RÉPONSE :**
Retourne UNIQUEMENT un JSON valide avec :
- Les champs du schéma (utilise null si absent du document)
- "citations": { "fieldName": [{ "page": number, "evidence": "extrait exact du PDF" }] }
- "confidence": { "fieldName": number entre 0 et 1 }

AUCUN texte en dehors du JSON. Aucune explication. Aucune connaissance externe.`;