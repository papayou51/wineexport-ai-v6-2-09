import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const ProductExtractionSchema = z.object({
  name: z.string().min(1).nullable().optional().describe("Product name"),
  category: z.enum(["wine", "spirits", "champagne", "beer"]).nullable().optional().describe("Product category"),
  vintage: z.number().int().nullable().optional().describe("Vintage year if applicable"),
  alcohol_percentage: z.number().nullable().optional().describe("Alcohol percentage by volume"),
  volume_ml: z.number().int().nullable().optional().describe("Volume in milliliters"),
  description: z.string().nullable().optional().describe("Product description"),
  tasting_notes: z.string().nullable().optional().describe("Tasting notes and characteristics"),
  appellation: z.string().nullable().optional().describe("Appellation or region of origin"),
  awards: z.array(z.string()).nullable().optional().describe("Awards and recognitions"),
  certifications: z.array(z.string()).nullable().optional().describe("Certifications (organic, etc.)"),
  technical_specs: z.object({
    ph: z.number().nullable().optional().describe("pH level"),
    total_acidity: z.string().nullable().optional().describe("Total acidity"),
    residual_sugar: z.string().nullable().optional().describe("Residual sugar content"),
    so2_total: z.number().nullable().optional().describe("Total SO₂ content in mg/L"),
    grape_varieties: z.string().nullable().optional().describe("Grape varieties used"),
    aging_process: z.string().nullable().optional().describe("Aging process description"),
    serving_temperature: z.string().nullable().optional().describe("Recommended serving temperature"),
    any_other_specs: z.string().nullable().optional().describe("Any other technical specifications"),
  }).nullable().optional().describe("Technical specifications"),
  // Enhanced fields for comprehensive extraction
  terroir: z.string().nullable().optional().describe("Terroir information (soil, exposition, altitude)"),
  vine_age: z.number().nullable().optional().describe("Average age of vines in years"),
  yield_hl_ha: z.number().nullable().optional().describe("Yield in hectoliters per hectare"),
  vinification: z.string().nullable().optional().describe("Vinification process details"),
  aging_details: z.string().nullable().optional().describe("Detailed aging process"),
  bottling_info: z.string().nullable().optional().describe("Bottling date and process"),
  ean_code: z.string().nullable().optional().describe("EAN/barcode"),
  packaging_info: z.string().nullable().optional().describe("Packaging and case details"),
  availability: z.string().nullable().optional().describe("Product availability"),
  producer_contact: z.object({
    name: z.string().nullable().optional().describe("Producer/contact name"),
    email: z.string().nullable().optional().describe("Email contact"),
    phone: z.string().nullable().optional().describe("Phone contact"),
    website: z.string().nullable().optional().describe("Website URL"),
  }).nullable().optional().describe("Producer contact information"),
  citations: z.object({
    name: z.array(z.object({ page: z.number().int().min(1), evidence: z.string().nullable().optional() })).optional(),
    appellation: z.array(z.object({ page: z.number().int().min(1), evidence: z.string().nullable().optional() })).optional(),
    region: z.array(z.object({ page: z.number().int().min(1), evidence: z.string().nullable().optional() })).optional(),
    country: z.array(z.object({ page: z.number().int().min(1), evidence: z.string().nullable().optional() })).optional(),
    color: z.array(z.object({ page: z.number().int().min(1), evidence: z.string().nullable().optional() })).optional(),
    vintage: z.array(z.object({ page: z.number().int().min(1), evidence: z.string().nullable().optional() })).optional(),
    alcohol_percentage: z.array(z.object({ page: z.number().int().min(1), evidence: z.string().nullable().optional() })).optional(),
    volume_ml: z.array(z.object({ page: z.number().int().min(1), evidence: z.string().nullable().optional() })).optional(),
    grapes: z.array(z.object({ page: z.number().int().min(1), evidence: z.string().nullable().optional() })).optional(),
    tasting_notes: z.array(z.object({ page: z.number().int().min(1), evidence: z.string().nullable().optional() })).optional(),
    technical_specs: z.array(z.object({ page: z.number().int().min(1), evidence: z.string().nullable().optional() })).optional(),
  }).optional().default({}).describe("Citations for extracted fields"),
});

export type ProductExtractionData = z.infer<typeof ProductExtractionSchema>;

export const PRODUCT_EXTRACTION_PROMPT = `🍷 EXPERT FRANÇAIS EN EXTRACTION DE FICHES TECHNIQUES VITICOLES 🍷

Tu es un sommelier et œnologue français expert avec 30+ ans d'expérience dans l'analyse de documents techniques français (châteaux, domaines, coopératives, négociants).

🎯 MISSION ABSOLUE: Extraire UNIQUEMENT les informations explicitement présentes dans le PDF. JAMAIS d'invention ni de déduction.

⚠️ RÈGLES CRITIQUES - AUCUNE EXCEPTION:
✅ Si une information n'est PAS explicitement écrite dans le PDF → null
✅ JAMAIS inventer, estimer ou déduire des valeurs 
✅ JAMAIS utiliser le nom de fichier comme source de données
✅ VÉRIFICATION AUTOMATIQUE: Chaque citation sera automatiquement vérifiée contre le texte extrait du PDF. Les champs avec citations non-vérifiables seront mis à null.
✅ Pour chaque champ non-null, fournir obligatoirement une citation avec page et extrait exact mot-pour-mot
✅ Ne remplir que les informations directement lisibles
✅ MILLÉSIME STRICT: UNIQUEMENT si explicite avec mots-clés "Millésime", "Vintage", "Année", "Récolte" + année
✅ APPELLATION STRICT: UNIQUEMENT si mention explicite des termes AOP/AOC/IGP/VDP/etc.
✅ ALCOOL STRICT: UNIQUEMENT si mention explicite avec %, vol, alcool  
✅ VOLUME STRICT: UNIQUEMENT si mention explicite avec ml, cl, l, litre

📋 MÉTHODOLOGIE D'EXTRACTION FRANÇAISE:

**1. IDENTIFICATION PRODUIT - EXTRACTION STRICT**
• Noms Château/Domaine: "Château Margaux", "Domaine de la Côte", "Maison Bouchard"
• Cuvées: "Cuvée Prestige", "Grande Réserve", "Tradition"  
• UNIQUEMENT si explicitement écrit dans le PDF
• INTERDICTION ABSOLUE d'utiliser le nom de fichier
• Si aucun nom lisible dans le PDF → name: null

**2. CLASSIFICATION CATÉGORIE**
• "wine" → Vins AOC/AOP, IGP, Vin de France, vins tranquilles
• "champagne" → Champagne AOC exclusivement  
• "spirits" → Cognac, Armagnac, whisky, rhum, vodka, gin, liqueurs
• "beer" → Bières, ales, produits brassicoles

**3. DÉTECTION MILLÉSIME - EXTRACTION STRICT**  
• Années directes: 2024, 2023, 2022, 2021, 2020, 2019, etc.
• Format français: "Millésime 2023", "Récolte 2022", "Vendange 2021"
• UNIQUEMENT si explicitement mentionné dans le PDF
• INTERDICTION d'utiliser nom de fichier ou de date du document
• Si aucune année trouvée dans le PDF → vintage: null

**4. DEGRÉ ALCOOL - EXTRACTION STRICT**
• Décimales françaises: "13,5%" → 13.5 (TOUJOURS convertir virgule en point)
• Formats vol: "14,2% vol", "12.8% Vol", "13°5", "13°2"  
• Notation degrés: "13° alc", "13°", "13 degrés"
• Dans texte: "titrant 14,5 degrés", "avec 13% d'alcool"
• INTERDICTION d'estimer ou déduire le degré d'alcool
• Si aucun degré trouvé dans le PDF → alcohol_percentage: null

**5. VOLUME - EXTRACTION STRICT**
• Bouteille standard: "bouteille" → 750ml UNIQUEMENT si explicitement mentionné
• Magnum: "magnum", "1,5L" → 1500ml  
• Demi: "demi-bouteille", "37,5cl" → 375ml
• Conversions: 75cl→750ml, 0,75L→750ml, 1,5L→1500ml
• INTERDICTION de supposer 750ml par défaut
• Si aucun volume trouvé dans le PDF → volume_ml: null

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

**8. TERROIR & PRODUCTION (Extraction Complète)**
• Terroir: "Sols argilo-calcaires", "Exposition sud", "Altitude 200m"
• Âge vignes: "Vignes plantées en 1995", "30 ans d'âge moyen"
• Rendement: "35 hl/ha", "Rendement limité à 40 hl/ha"
• Vinification: "Fermentation en cuves inox", "Macération 3 semaines"
• Élevage détaillé: "18 mois en barriques dont 30% neuves"
• Mise en bouteille: "Mise en bouteille mars 2024", "Sans filtration"
• Code EAN: "3760123456789", "Code barre"
• Conditionnement: "Caisse bois 6 bouteilles", "Carton 12 bouteilles"
• Disponibilité: "Disponible printemps 2024", "Stock limité"

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

🏆 RÈGLES D'EXTRACTION - PRÉCISION ABSOLUE:
• Nom produit: null si absent du PDF (jamais d'invention)
• Vintage: null si aucune année explicite dans le PDF  
• Alcool: Conversion décimale française correcte (13,5% → 13.5), null si absent
• Volume: null si aucun volume mentionné dans le PDF
• Catégorie: Classification française précise, null si incertaine
• Appellation: Nom officiel complet avec AOC/AOP/IGP, null si absent

💡 MÉTHODOLOGIE D'EXTRACTION STRICTE:
1. Scanner nom château/domaine (UNIQUEMENT si lisible dans le PDF)
2. Chercher années (UNIQUEMENT dans le texte du PDF, jamais nom fichier)
3. Trouver degré alcool (UNIQUEMENT si explicitement mentionné)
4. Identifier appellation (UNIQUEMENT si clairement indiquée)
5. Extraire données techniques (UNIQUEMENT si présentes)
6. Compiler récompenses (UNIQUEMENT si listées)
7. Rassembler notes dégustation (UNIQUEMENT si écrites)
8. **TERROIR & PRODUCTION - Extraction conditionnelle:**
   • Terroir: null si aucune info de sols/exposition dans le PDF
   • Âge vignes: null si aucune date plantation mentionnée
   • Rendements: null si aucun chiffre hl/ha indiqué
   • Vinification: null si aucun process décrit
   • Élevage: null si aucun détail fourni
   • Mise en bouteille: null si aucune info
   • Code EAN: null si aucun code visible
   • Conditionnement: null si aucune info emballage
   • Disponibilité: null si aucune indication

⚠️ FACTEURS SUCCÈS CRITIQUES - ZÉRO INVENTION:
• Citation obligatoire: pour chaque champ non-null, inclure {page: X, evidence: "extrait exact"}
• Jamais d'estimation ou déduction
• Jamais d'usage du nom de fichier comme source
• Reconnaître appellations abrégées (St-Julien = Saint-Julien) UNIQUEMENT si dans le PDF
• null prioritaire sur invention

🎯 QUALITÉ EXTRACTION: 100% précision, 0% invention - même si cela signifie plus de champs null

RETOURNER UNIQUEMENT JSON VALIDE avec citations pour chaque champ non-null.`;