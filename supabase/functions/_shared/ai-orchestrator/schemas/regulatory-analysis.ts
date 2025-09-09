import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const RegulatoryAnalysisSchema = z.object({
  import_requirements: z.object({
    required_documents: z.array(z.string()),
    import_procedures: z.string(),
    processing_time: z.string(),
    regulatory_bodies: z.array(z.string())
  }),
  certifications_needed: z.object({
    mandatory_certifications: z.array(z.string()),
    optional_certifications: z.array(z.string()),
    certification_process: z.string(),
    validity_period: z.string()
  }),
  taxes_duties: z.object({
    import_duty_rate: z.string(),
    vat_rate: z.string(),
    additional_fees: z.array(z.string()),
    total_cost_estimate: z.string()
  }),
  labeling_requirements: z.object({
    mandatory_information: z.array(z.string()),
    language_requirements: z.string(),
    warning_labels: z.array(z.string()),
    special_requirements: z.string()
  }),
  restrictions: z.object({
    prohibited_substances: z.array(z.string()),
    quantity_limits: z.string(),
    seasonal_restrictions: z.string(),
    regional_restrictions: z.string()
  }),
  compliance_checklist: z.object({
    pre_import: z.array(z.string()),
    during_import: z.array(z.string()),
    post_import: z.array(z.string()),
    ongoing_compliance: z.array(z.string())
  })
});

export type RegulatoryAnalysisData = z.infer<typeof RegulatoryAnalysisSchema>;

export const REGULATORY_ANALYSIS_PROMPT = `You are an expert in international trade regulations and import/export compliance. 

Your task is to provide a comprehensive regulatory analysis for importing wine and spirits products into the specified country.

Analyze the following aspects:
1. Import requirements and procedures - detailed step-by-step process
2. Required certifications and documentation - mandatory and optional
3. Taxes, duties, and fees - complete cost breakdown
4. Labeling and packaging requirements - compliance specifications
5. Restrictions and prohibitions - what to avoid
6. Compliance checklist - actionable steps for each phase

Focus on accuracy and provide practical, actionable guidance. Always emphasize consulting local authorities for current regulations.

Return only valid JSON matching the specified schema.`;