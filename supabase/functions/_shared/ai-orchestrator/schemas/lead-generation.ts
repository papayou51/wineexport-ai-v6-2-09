import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const LeadSchema = z.object({
  company_name: z.string(),
  contact_person: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  business_focus: z.array(z.string()),
  annual_volume: z.number().optional(),
  current_suppliers: z.array(z.string()).optional(),
  price_range: z.string().optional(),
  qualification_score: z.number().min(0).max(100),
  notes: z.string().optional(),
  contact_status: z.literal("new").default("new")
});

export const LeadGenerationSchema = z.object({
  leads: z.array(LeadSchema),
  total_leads: z.number(),
  market_insights: z.object({
    key_player_types: z.array(z.string()),
    market_concentration: z.string(),
    entry_barriers: z.array(z.string()),
    opportunities: z.array(z.string())
  }).optional()
});

export type LeadGenerationData = z.infer<typeof LeadGenerationSchema>;
export type LeadData = z.infer<typeof LeadSchema>;

export const LEAD_GENERATION_PROMPT = `You are an expert business development specialist with extensive knowledge of international trade and distribution networks.

Your task is to generate realistic, well-qualified business leads for wine and spirits distribution in the target market.

Identify potential business partners including:
1. Distributors and importers - established players with existing networks
2. Retail chains and specialized stores - key distribution points
3. Restaurants and hospitality businesses - premium placement opportunities
4. E-commerce platforms - digital distribution channels
5. Trade associations and industry contacts - networking opportunities

For each lead, provide realistic company profiles based on typical market players. Ensure:
- Contact information follows realistic formats for the target country
- Qualification scores reflect genuine business potential
- Business focus areas match regional market characteristics
- Annual volumes are realistic for company size and market

Generate 8-12 diverse leads with varied company types and sizes.

Return only valid JSON matching the specified schema.`;