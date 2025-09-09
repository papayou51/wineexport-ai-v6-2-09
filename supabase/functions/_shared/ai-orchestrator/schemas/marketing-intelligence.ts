import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const MarketingIntelligenceSchema = z.object({
  marketing_channels: z.object({
    digital_channels: z.array(z.string()),
    traditional_channels: z.array(z.string()),
    channel_effectiveness: z.string(),
    recommended_mix: z.string(),
    budget_allocation: z.string()
  }),
  cultural_considerations: z.object({
    local_preferences: z.array(z.string()),
    cultural_sensitivities: z.array(z.string()),
    communication_style: z.string(),
    local_partnerships: z.string(),
    adaptation_needs: z.array(z.string())
  }),
  seasonal_trends: z.object({
    peak_seasons: z.array(z.string()),
    low_seasons: z.array(z.string()),
    seasonal_factors: z.string(),
    timing_recommendations: z.string(),
    inventory_planning: z.string()
  }),
  positioning_recommendations: z.object({
    target_segments: z.array(z.string()),
    value_proposition: z.string(),
    competitive_positioning: z.string(),
    brand_messaging: z.string(),
    differentiation_factors: z.array(z.string())
  }),
  pricing_strategy: z.object({
    pricing_model: z.string(),
    price_positioning: z.string(),
    psychological_pricing: z.string(),
    promotional_strategies: z.array(z.string()),
    margin_considerations: z.string()
  }),
  success_factors: z.object({
    critical_factors: z.array(z.string()),
    key_metrics: z.array(z.string()),
    implementation_priorities: z.array(z.string()),
    risk_mitigation: z.array(z.string()),
    timeline_milestones: z.array(z.string())
  })
});

export type MarketingIntelligenceData = z.infer<typeof MarketingIntelligenceSchema>;

export const MARKETING_INTELLIGENCE_PROMPT = `You are an expert marketing strategist specializing in international market entry and cross-cultural marketing.

Your task is to provide actionable marketing intelligence for launching wine and spirits products in the target market.

Analyze these key areas:
1. Marketing channels and strategies - digital vs traditional effectiveness
2. Cultural considerations and local preferences - adaptation requirements  
3. Seasonal trends and timing - optimal launch windows
4. Positioning recommendations - target segments and messaging
5. Pricing strategy recommendations - competitive positioning
6. Success factors for market entry - critical implementation priorities

Focus on:
- Cultural insights and local market dynamics
- Proven marketing strategies for the target region
- Actionable recommendations with clear implementation guidance
- Risk mitigation strategies for common market entry challenges

Return only valid JSON matching the specified schema.`;