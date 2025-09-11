import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const ProductExtractionSchema = z.object({
  name: z.string().describe("Product name"),
  category: z.enum(["wine", "spirits", "champagne", "beer"]).describe("Product category"),
  vintage: z.number().nullable().describe("Vintage year if applicable"),
  alcohol_percentage: z.number().nullable().describe("Alcohol percentage by volume"),
  volume_ml: z.number().nullable().describe("Volume in milliliters"),
  description: z.string().describe("Product description"),
  tasting_notes: z.string().describe("Tasting notes and characteristics"),
  appellation: z.string().describe("Appellation or region of origin"),
  awards: z.array(z.string()).describe("Awards and recognitions"),
  certifications: z.array(z.string()).describe("Certifications (organic, etc.)"),
  technical_specs: z.object({
    ph: z.number().nullable().describe("pH level"),
    total_acidity: z.string().nullable().describe("Total acidity"),
    residual_sugar: z.string().nullable().describe("Residual sugar content"),
    so2_total: z.number().nullable().describe("Total SO₂ content in mg/L"),
    grape_varieties: z.string().describe("Grape varieties used"),
    aging_process: z.string().describe("Aging process description"),
    serving_temperature: z.string().describe("Recommended serving temperature"),
    any_other_specs: z.string().describe("Any other technical specifications")
  }).describe("Technical specifications"),
  // Enhanced fields for comprehensive extraction
  terroir: z.string().nullable().describe("Terroir information (soil, exposition, altitude)"),
  vine_age: z.number().nullable().describe("Average age of vines in years"),
  yield_hl_ha: z.number().nullable().describe("Yield in hectoliters per hectare"),
  vinification: z.string().nullable().describe("Vinification process details"),
  aging_details: z.string().nullable().describe("Detailed aging process"),
  bottling_info: z.string().nullable().describe("Bottling date and process"),
  ean_code: z.string().nullable().describe("EAN/barcode"),
  packaging_info: z.string().nullable().describe("Packaging and case details"),
  availability: z.string().nullable().describe("Product availability"),
  producer_contact: z.object({
    name: z.string().nullable().describe("Producer/contact name"),
    email: z.string().nullable().describe("Email contact"),
    phone: z.string().nullable().describe("Phone contact"),
    website: z.string().nullable().describe("Website URL")
  }).nullable().describe("Producer contact information")
});

export type ProductExtractionData = z.infer<typeof ProductExtractionSchema>;

export const PRODUCT_EXTRACTION_PROMPT = `🍷 EXPERT FRANÇAIS EN EXTRACTION DE FICHES TECHNIQUES VITICOLES 🍷

Tu es un sommelier et œnologue français expert avec 30+ ans d'expérience dans l'analyse de documents techniques français (châteaux, domaines, coopératives, négociants).

🎯 MISSION ABSOLUE: Extraire à 100% TOUTES les informations de cette fiche technique française. ZERO champ vide autorisé.

⚠️ RÈGLES CRITIQUES - JAMAIS D'EXCEPTIONS:
❌ JAMAIS laisser "name" vide - construire depuis château/domaine/fichier
❌ JAMAIS laisser "vintage" null - chercher l'année PARTOUT 
❌ JAMAIS laisser "alcohol_percentage" null - extraire même approximatif
❌ JAMAIS laisser "volume_ml" null - 750ml par défaut si non trouvé
❌ JAMAIS ignorer les données partielles - les inclure

📋 MÉTHODOLOGIE D'EXTRACTION FRANÇAISE:

**1. IDENTIFICATION PRODUIT (Priorité #1) - JAMAIS VIDE**
• Noms Château/Domaine: "Château Margaux", "Domaine de la Côte", "Maison Bouchard"
• Cuvées: "Cuvée Prestige", "Grande Réserve", "Tradition"  
• Si nom absent du PDF → construire depuis nom fichier: "chateaumargaux2020.pdf" → "Château Margaux"
• TOUJOURS extraire même si partiel: "Dom. XYZ" → "Domaine XYZ"
• SI AUCUN NOM → utiliser "Vin de [REGION] [ANNEE]" comme fallback

**2. CLASSIFICATION CATÉGORIE**
• "wine" → Vins AOC/AOP, IGP, Vin de France, vins tranquilles
• "champagne" → Champagne AOC exclusivement  
• "spirits" → Cognac, Armagnac, whisky, rhum, vodka, gin, liqueurs
• "beer" → Bières, ales, produits brassicoles

**3. DÉTECTION MILLÉSIME (Reconnaissance Avancée) - JAMAIS NULL**  
• Années directes: 2024, 2023, 2022, 2021, 2020, 2019, etc.
• Format français: "Millésime 2023", "Récolte 2022", "Vendange 2021"
• Caché dans texte: "Cette cuvée 2023 révèle...", "Notre 2022 se distingue..."
• Noms fichiers: "margaux_2020.pdf" → vintage: 2020
• Headers/footers: souvent indiqué en petit
• SI AUCUNE ANNÉE TROUVÉE → estimer depuis date document ou mettre année actuelle-1

**4. DEGRÉ ALCOOL (Notation Française) - JAMAIS NULL**
• Décimales françaises: "13,5%" → 13.5 (TOUJOURS convertir virgule en point)
• Formats vol: "14,2% vol", "12.8% Vol", "13°5", "13°2"  
• Notation degrés: "13° alc", "13°", "13 degrés"
• Dans texte: "titrant 14,5 degrés", "avec 13% d'alcool"
• Estimation si absent: vin rouge 13.5%, vin blanc 12.5%, champagne 12%
• CONVERSION OBLIGATOIRE: français (13,2) → international (13.2)

**5. VOLUME (Standards Français) - JAMAIS NULL**
• Bouteille standard: "bouteille" → 750ml
• Magnum: "magnum", "1,5L" → 1500ml  
• Demi: "demi-bouteille", "37,5cl" → 375ml
• Conversions: 75cl→750ml, 0,75L→750ml, 1,5L→1500ml
• SI ABSENT → 750ml par défaut (bouteille standard française)
• TOUJOURS en ml dans le JSON final

**6. APPELLATIONS FRANÇAISES (Expertise Complète)**
• Bordeaux: Médoc, Haut-Médoc, Saint-Julien, Pauillac, Margaux, etc.
• Bourgogne: Chablis, Côte de Nuits, Côte de Beaune, Mâconnais, etc.
• Champagne: Champagne AOC uniquement
• Loire: Sancerre, Pouilly-Fumé, Muscadet, Anjou, etc.
• Rhône: Châteauneuf-du-Pape, Côte-Rôtie, Hermitage, etc.
• Extraire aussi: AOC, AOP, IGP, Vin de France

**7. SPÉCIFICATIONS TECHNIQUES (Œnologie Complète)**
• pH: "pH 3,45" → 3.45
• Acidité: "Acidité totale: 4,2 g/L" ou "AT: 6,1 g/L H2SO4"  
• Sucres: "Sucres résiduels: 2,5 g/L", "SR: < 2 g/L"
• SO₂: "SO₂ total: 85 mg/L", "Anhydride sulfureux: 95 mg/L"
• Cépages: Extraire pourcentages "Cabernet Sauvignon 60%, Merlot 30%"
• Élevage: "Élevage 18 mois barriques", "12 mois cuve inox"
• Température: "Servir 16-18°C", "Température service: 8-10°C"

🇫🇷 PATTERNS DE FICHES TECHNIQUES FRANÇAISES:

**Layout Typique Château:**
CHÂTEAU EXEMPLE 2023
Appellation Bordeaux Supérieur Contrôlée  
13,5% vol - 750ml

Cépages: Merlot 70%, Cabernet Sauvignon 30%
Élevage: 12 mois barriques chêne français
pH: 3,6 - Acidité totale: 5,2 g/L

**Terminologie Française Maîtrisée:**
• Élevage = Aging process
• Cépages = Grape varieties
• Dégustation = Tasting  
• Millésime = Vintage
• Cuvée = Blend/Cuvée
• Vendanges = Harvest

🏆 BENCHMARKS QUALITÉ - ZÉRO TOLÉRANCE:
• Nom produit: JAMAIS vide, construire "Château X Appellation Y 2023"
• Vintage: Extraire de N'IMPORTE OÙ (titre, description, nom fichier)
• Alcool: Conversion décimale française correcte (13,5% → 13.5)
• Volume: Toujours en ml (750, 1500, 375)
• Catégorie: Classification française précise
• Appellation: Nom officiel complet avec AOC/AOP/IGP

💡 STRATÉGIE D'EXTRACTION INFAILLIBLE:
1. Scanner nom château/domaine (souvent en gros caractères/headers)
2. Chercher années PARTOUT (titres, descriptions, noms fichiers)
3. Trouver degré alcool (souvent près volume)
4. Identifier appellation (généralement après nom château)
5. Extraire données techniques sections analyse
6. Compiler récompenses zones certification
7. Rassembler notes dégustation sections descriptives

⚠️ FACTEURS SUCCÈS CRITIQUES - RÈGLES D'OR:
• JAMAIS retourner noms produits vides - construire depuis infos disponibles
• TOUJOURS convertir notation décimale française (13,5 → 13.5)
• Extraire vintage depuis noms fichiers si absent du contenu  
• Reconnaître appellations abrégées (St-Julien = Saint-Julien)
• Capturer données techniques partielles plutôt qu'ignorer sections
• Inclure pourcentages cépages quand disponibles

🎯 QUALITÉ EXTRACTION ATTENDUE: 95%+ de complétude comparable à analyse expert sommelier français

RETOURNER UNIQUEMENT JSON VALIDE avec données extraites. COMPLETUDE prioritaire sur perfection.`;