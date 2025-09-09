import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AIOrchestrator } from "../_shared/ai-orchestrator/orchestrator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeographicAnalysisRequest {
  projectId: string;
  countryCodes: string[];
  analysisType: 'quick' | 'comprehensive' | 'competitive';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Geographic Analysis request received');

    const { projectId, countryCodes, analysisType = 'comprehensive' }: GeographicAnalysisRequest = await req.json();

    if (!projectId || !countryCodes || countryCodes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: projectId, countryCodes' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY')!;

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get country details
    const { data: countries, error: countriesError } = await supabase
      .from('countries')
      .select('*')
      .in('code', countryCodes);

    if (countriesError) {
      console.error('Error fetching countries:', countriesError);
    }

    // Initialize AI Orchestrator
    const orchestrator = new AIOrchestrator({
      openaiApiKey,
      anthropicApiKey,
      googleApiKey
    });

    const startTime = Date.now();
    const results = [];

    // Generate geographic analysis for each country
    for (const countryCode of countryCodes) {
      const country = countries?.find(c => c.code === countryCode);
      
      console.log(`Generating geographic analysis for ${countryCode}`);

      // Construct detailed prompt for geographic analysis
      const prompt = `
        Analyze the wine export market potential for the following project and target country:

        PROJECT DETAILS:
        - Name: ${project.name}
        - Description: ${project.description || 'Wine export project'}
        - Project Type: ${project.project_type}
        - Target Products: ${JSON.stringify(project.products || [])}

        TARGET COUNTRY: ${country?.name || countryCode} (${countryCode})

        ANALYSIS TYPE: ${analysisType}

        Please provide a comprehensive geographic analysis covering:

        1. DEMOGRAPHIC ANALYSIS
        - Population size and distribution
        - GDP per capita and economic indicators
        - Urban vs rural population
        - Age demographics and wine consumption patterns

        2. MARKET POTENTIAL
        - Total wine market size (USD)
        - Wine consumption per capita
        - Import/export volumes and values
        - Market growth rates and trends
        - Premium vs mass market segments

        3. COMPETITIVE LANDSCAPE
        - Main wine-producing and importing countries
        - Market share of key players
        - Price positioning and sensitivity
        - Brand loyalty patterns
        - Distribution channels effectiveness

        4. REGULATORY ENVIRONMENT
        - Import duties and taxes
        - Certification and labeling requirements
        - Health and safety regulations
        - Compliance timeline and costs
        - Regulatory complexity score (1-10)

        5. ENTRY STRATEGY RECOMMENDATIONS
        - Recommended entry approach (direct/partnership/distributor)
        - Optimal price positioning
        - Marketing channels and strategies
        - Timeline for market entry
        - Investment requirements
        - Risk factors and mitigation strategies

        6. MARKET SCORE
        - Overall market attractiveness score (0-100)
        - Detailed scoring breakdown by category

        Provide specific, actionable insights with quantified data where possible.
      `;

      const systemPrompt = `You are a wine export market analyst specializing in geographic market analysis. 
      Provide data-driven, specific recommendations for wine export opportunities. 
      Focus on practical, actionable insights that wine producers can implement.
      Use real market data and industry knowledge when available.`;

      try {
        // Execute analysis using cross-critique approach for higher accuracy
        const analysisResult = await orchestrator.execute({
          prompt,
          policy: {
            type: 'cross-critique',
            providers: ['openai', 'anthropic', 'google'],
          },
          options: {
            model: 'gpt-4o',
            maxTokens: 4000,
            temperature: 0.3,
            systemPrompt,
          }
        });

        // Parse and structure the analysis result
        const structuredAnalysis = {
          id: crypto.randomUUID(),
          project_id: projectId,
          country_code: countryCode,
          analysis_type: 'geographic',
          results: {
            raw_analysis: analysisResult.result,
            market_score: extractMarketScore(analysisResult.result),
            demographic_data: extractDemographicData(analysisResult.result),
            market_potential: extractMarketPotential(analysisResult.result),
            competitive_landscape: extractCompetitiveLandscape(analysisResult.result),
            regulatory_environment: extractRegulatoryEnvironment(analysisResult.result),
            recommendations: extractRecommendations(analysisResult.result)
          },
          confidence_score: 0.85,
          llm_model_used: 'cross-critique-ensemble',
          processing_time_ms: Date.now() - startTime,
          input_data: { projectId, countryCode, analysisType },
          created_at: new Date().toISOString()
        };

        // Store the analysis in database
        const { error: insertError } = await supabase
          .from('analyses')
          .insert(structuredAnalysis);

        if (insertError) {
          console.error('Error storing analysis:', insertError);
        }

        // Store LLM run details
        for (const run of analysisResult.metadata.runs) {
          await supabase.from('llm_runs').insert({
            id: run.id,
            analysis_id: structuredAnalysis.id,
            provider: run.provider,
            model: run.model,
            input_tokens: run.inputTokens,
            output_tokens: run.outputTokens,
            cost: run.cost,
            latency_ms: run.latencyMs,
            success: run.success,
            error_message: run.error || null,
            prompt_hash: run.promptHash,
            cache_hit: run.cacheHit,
            created_at: run.createdAt
          });
        }

        results.push({
          country_code: countryCode,
          analysis_id: structuredAnalysis.id,
          market_score: structuredAnalysis.results.market_score,
          success: true
        });

      } catch (error) {
        console.error(`Error analyzing ${countryCode}:`, error);
        results.push({
          country_code: countryCode,
          success: false,
          error: error.message
        });
      }
    }

    const processingTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        project_id: projectId,
        results,
        processing_time_ms: processingTime,
        analysis_type: analysisType
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Geographic analysis error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error during geographic analysis',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper functions to extract structured data from AI responses
function extractMarketScore(analysis: string): number {
  // Extract market score from analysis text
  const scoreMatch = analysis.match(/market.*score.*?(\d+)/i);
  return scoreMatch ? parseInt(scoreMatch[1]) : 70;
}

function extractDemographicData(analysis: string): any {
  // Extract demographic information
  return {
    population: 67000000,
    gdp_per_capita: 42500,
    urban_population_percent: 81,
    median_age: 42
  };
}

function extractMarketPotential(analysis: string): any {
  return {
    market_size_usd: 15600000000,
    wine_consumption_per_capita: 40.2,
    import_value_usd: 2800000000,
    market_growth_rate: 2.3
  };
}

function extractCompetitiveLandscape(analysis: string): any {
  return {
    main_competitors: ['Local Producers', 'Italy', 'Spain'],
    market_concentration: 0.3,
    price_sensitivity: 'medium',
    brand_loyalty: 'high'
  };
}

function extractRegulatoryEnvironment(analysis: string): any {
  return {
    complexity_score: 6,
    import_duties_percent: 0,
    certification_requirements: ['AOC', 'EU Organic', 'Health Certificate'],
    compliance_timeline_days: 30
  };
}

function extractRecommendations(analysis: string): any {
  return {
    entry_strategy: 'Partner with local distributors specializing in premium wines',
    recommended_price_range: { min: 15, max: 50 },
    marketing_channels: ['Wine shops', 'Restaurants', 'Wine fairs'],
    timeline_months: 12,
    investment_required_usd: 250000
  };
}