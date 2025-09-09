import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

// Import AI Orchestrator
import { AIOrchestrator } from '../_shared/ai-orchestrator/orchestrator.ts';
import { MarketAnalysisSchema } from '../_shared/ai-orchestrator/schemas/market-analysis.ts';

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
    
    console.log('Starting market analysis for project:', projectId, 'country:', countryCode);

    // Get API keys
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Initialize AI Orchestrator with available providers
    const orchestrator = new AIOrchestrator({
      openai: openAIApiKey,
      anthropic: anthropicApiKey,
      google: googleApiKey,
    });

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

    const startTime = Date.now();

    // Create AI prompt for market analysis
    const prompt = `Analyze the market potential for exporting wine/spirits products to ${country.name} (${countryCode}).

Project Details:
- Products: ${project.products.map(p => `${p.name} (${p.category})`).join(', ')}
- Description: ${project.description}
- Budget Range: ${project.budget_range}

Country Information:
- Name: ${country.name}
- Region: ${country.region}
- Sub-region: ${country.sub_region}

Please provide a comprehensive market analysis including:
1. Market size and growth potential with specific data
2. Competitive landscape analysis with key players
3. Price analysis and recommended positioning strategy
4. Most effective distribution channels for wine/spirits
5. Consumer preferences and cultural considerations
6. Clear opportunities and risks assessment
7. Prioritized recommendations with timeline and impact

Provide detailed, actionable insights that can guide export decisions.`;

    // Execute market analysis using AI Orchestrator with cross-critique policy
    const taskOutput = await orchestrator.execute({
      prompt,
      schema: MarketAnalysisSchema,
      policy: {
        type: 'cross-critique',
        providers: ['openai', 'anthropic', 'google']
      },
      options: {
        systemPrompt: 'You are an expert market research analyst specializing in international wine and spirits export markets. Provide detailed, data-driven insights with specific metrics and actionable recommendations.',
        maxTokens: 4000,
        temperature: 0.2,
        jsonSchema: MarketAnalysisSchema
      }
    }, {
      taskId: crypto.randomUUID(),
      projectId: projectId,
      organizationId: project.organization_id
    });

    const structuredResults = taskOutput.result;
    const processingTime = Date.now() - startTime;

    // Store analysis in database
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        project_id: projectId,
        analysis_type: 'market_study',
        country_code: countryCode,
        input_data: inputData,
        results: structuredResults,
        llm_model_used: taskOutput.metadata.runs.map(r => `${r.provider}:${r.model}`).join(', '),
        processing_time_ms: processingTime,
        confidence_score: taskOutput.metadata.runs.length > 1 ? 0.95 : 0.85
      })
      .select()
      .single();

    // Store LLM runs for tracking
    if (taskOutput.metadata.runs.length > 0) {
      const llmRuns = taskOutput.metadata.runs.map(run => ({
        project_id: projectId,
        analysis_id: analysis?.id,
        provider: run.provider,
        model: run.model,
        prompt_hash: run.promptHash,
        input_tokens: run.inputTokens,
        output_tokens: run.outputTokens,
        cost_estimate: run.cost,
        latency_ms: run.latencyMs,
        cache_hit: run.cacheHit,
        success: run.success,
        error: run.error,
        created_at: run.createdAt
      }));

      const { error: llmRunsError } = await supabase
        .from('llm_runs')
        .insert(llmRuns);

      if (llmRunsError) {
        console.error('Error storing LLM runs:', llmRunsError);
      }
    }

    if (analysisError) throw analysisError;

    // Store detailed market study
    const { error: marketStudyError } = await supabase
      .from('market_studies')
      .insert({
        analysis_id: analysis.id,
        market_size: structuredResults.market_size,
        competitor_analysis: structuredResults.competitive_landscape,
        price_analysis: structuredResults.price_analysis,
        distribution_channels: structuredResults.distribution_channels,
        consumer_preferences: structuredResults.consumer_preferences
      });

    if (marketStudyError) throw marketStudyError;

    console.log('Market analysis completed for project:', projectId);

    return new Response(JSON.stringify({
      success: true,
      analysis_id: analysis.id,
      processing_time_ms: processingTime,
      total_cost: taskOutput.metadata.totalCost,
      providers_used: taskOutput.metadata.runs.map(r => r.provider),
      cache_hit: taskOutput.metadata.cacheHit,
      results: structuredResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in market analysis:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});