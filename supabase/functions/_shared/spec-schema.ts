import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

export const GrapeItem = z.object({
  variety: z.string(),
  percent: z.number().min(0).max(100).nullable().optional(),
});

export const WineProductSpecSchema = z.object({
  productName: z.string().nullable(),
  producer: z.string().nullable(),
  brand: z.string().nullable(),
  appellation: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),
  color: z.enum(["red","white","rosé","sparkling","orange"]).nullable(),
  style: z.string().nullable(),
  vintage: z.number().int().min(1900).max(2100).nullable(),
  grapes: z.array(GrapeItem).nullable(),
  abv_percent: z.number().min(0).max(100).nullable(),
  residualSugar_gL: z.number().min(0).max(400).nullable(),
  acidity_gL: z.number().min(0).max(20).nullable(),
  ph: z.number().min(0).max(14).nullable(),
  so2_total: z.number().min(0).max(400).nullable(),
  closure: z.string().nullable(),
  volume_ml: z.number().nullable(),
  sulfites: z.boolean().nullable(),
  organicCert: z.string().nullable(),
  awards: z.array(z.string()).nullable(),
  tastingNotes: z.string().nullable(),
  foodPairing: z.array(z.string()).nullable(),
  servingTemp_C: z.number().min(0).max(30).nullable(),
  ageingPotential_years: z.number().min(0).max(50).nullable(),
  exportNetPrice_EUR: z.number().min(0).nullable(),
  availableVolume_cases: z.number().min(0).nullable(),
  packaging: z.string().nullable(),
  allergenInfo: z.array(z.string()).nullable(),
  labelComplianceNotes: z.string().nullable(),
  // Enhanced technical fields
  terroir: z.string().nullable(),
  vineAge_years: z.number().min(0).max(200).nullable(),
  yieldHlHa: z.number().min(0).max(200).nullable(),
  vinificationDetails: z.string().nullable(),
  agingDetails: z.string().nullable(),
  bottlingDate: z.string().nullable(),
  eanCode: z.string().nullable(),
  packagingDetails: z.string().nullable(),
  availability: z.string().nullable(),
  // Producer contact information
  producerContact: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    website: z.string().nullable(),
  }).nullable(),
  citations: z.record(z.string(), z.array(z.number())).default({}),
  confidence: z.record(z.string(), z.number()).default({}),
});

export type WineProductSpec = z.infer<typeof WineProductSpecSchema>;