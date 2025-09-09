import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { AIOrchestrator } from '../_shared/ai-orchestrator/orchestrator.ts';
import { MarketingIntelligenceSchema, MARKETING_INTELLIGENCE_PROMPT, type MarketingIntelligenceData } from '../_shared/ai-orchestrator/schemas/marketing-intelligence.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, countryCode, inputData } = await req.json();
    
    console.log('Starting marketing intelligence for project:', projectId, 'country:', countryCode);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get project and product details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        products:products!inner(*)
      `)
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    // Get country data
    const { data: country, error: countryError } = await supabase
      .from('countries')
      .select('*')
      .eq('code', countryCode)
      .single();

    if (countryError) throw countryError;

    // Initialize AI Orchestrator
    const orchestrator = new AIOrchestrator({
      openaiApiKey: openAIApiKey,
      anthropicApiKey: Deno.env.get('ANTHROPIC_API_KEY'),
      googleApiKey: Deno.env.get('GOOGLE_API_KEY'),
    });

    // Build context-rich prompt
    const contextualPrompt = `${MARKETING_INTELLIGENCE_PROMPT}

Product Portfolio:
${project.products.map(p => `
- Product: ${p.name}
- Category: ${p.category}
- Description: ${p.description || 'Premium product'}
- Alcohol Content: ${p.alcohol_percentage || 'N/A'}%
- Volume: ${p.volume_ml || 'Various sizes'}ml
- Awards: ${p.awards || 'None listed'}
- Certifications: ${p.certifications || 'Standard'}
`).join('\n')}

Target Market:
- Country: ${country.name}
- Region: ${country.region}
- Sub-region: ${country.sub_region}

Project Context:
- Budget Range: ${project.budget_range}
- Timeline: ${project.timeline}
- Description: ${project.description}

Target Country: ${country.name} (${countryCode})`;

    // Execute cross-critique analysis for comprehensive insights
    const startTime = Date.now();
    const taskResult = await orchestrator.execute<MarketingIntelligenceData>({
      prompt: contextualPrompt,
      schema: MarketingIntelligenceSchema,
      context: { projectId, countryCode },
      policy: {
        type: 'cross-critique',
        providers: ['openai', 'anthropic', 'google'],
        primaryProvider: 'anthropic'
      }
    });

    const structuredResults = taskResult.result;
    const processingTime = taskResult.metadata.totalLatencyMs;

    // Store analysis in database
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        project_id: projectId,
        analysis_type: 'marketing_intelligence',
        country_code: countryCode,
        input_data: inputData,
        results: structuredResults,
        llm_model_used: `Multi-AI (${taskResult.metadata.runs.map(r => r.provider).join(', ')})`,
        processing_time_ms: processingTime,
        confidence_score: 0.95,
        llm_runs: taskResult.metadata.runs,
        total_cost: taskResult.metadata.totalCost
      })
      .select()
      .single();

    if (analysisError) throw analysisError;

    // Store detailed marketing intelligence
    const { error: marketingError } = await supabase
      .from('marketing_intelligence')
      .insert({
        analysis_id: analysis.id,
        marketing_channels: structuredResults.marketing_channels,
        cultural_considerations: structuredResults.cultural_considerations,
        seasonal_trends: structuredResults.seasonal_trends,
        positioning_recommendations: structuredResults.positioning_recommendations,
        pricing_strategy: structuredResults.pricing_strategy,
        success_factors: structuredResults.success_factors
      });

    if (marketingError) throw marketingError;

    console.log('Marketing intelligence completed for project:', projectId);

    return new Response(JSON.stringify({
      success: true,
      analysis_id: analysis.id,
      processing_time_ms: processingTime,
      results: structuredResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in marketing intelligence:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});