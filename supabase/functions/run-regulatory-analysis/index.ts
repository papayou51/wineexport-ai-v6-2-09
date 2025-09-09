import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { AIOrchestrator } from '../_shared/ai-orchestrator/orchestrator.ts';
import { RegulatoryAnalysisSchema, REGULATORY_ANALYSIS_PROMPT, type RegulatoryAnalysisData } from '../_shared/ai-orchestrator/schemas/regulatory-analysis.ts';

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
    
    console.log('Starting regulatory analysis for project:', projectId, 'country:', countryCode);

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
    const contextualPrompt = `${REGULATORY_ANALYSIS_PROMPT}

Product Details:
${project.products.map(p => `
- Name: ${p.name}
- Category: ${p.category}
- Alcohol %: ${p.alcohol_percentage || 'N/A'}%
- Volume: ${p.volume_ml || 'N/A'}ml
- Certifications: ${p.certifications || 'None'}
- Technical Specs: ${JSON.stringify(p.technical_specs || {})}
`).join('\n')}

Country Information:
- Name: ${country.name}
- Region: ${country.region}
- Sub-region: ${country.sub_region}
- Regulatory Info: ${JSON.stringify(country.regulatory_info || {})}

Target Country: ${country.name} (${countryCode})`;

    // Execute cross-critique analysis with multiple AI providers
    const startTime = Date.now();
    const taskResult = await orchestrator.execute<RegulatoryAnalysisData>({
      prompt: contextualPrompt,
      schema: RegulatoryAnalysisSchema,
      context: { projectId, countryCode },
      policy: {
        type: 'cross-critique',
        providers: ['openai', 'anthropic', 'google'],
        primaryProvider: 'openai'
      }
    });

    const structuredResults = taskResult.result;
    const processingTime = taskResult.metadata.totalLatencyMs;

    // Store analysis in database
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        project_id: projectId,
        analysis_type: 'regulatory_analysis',
        country_code: countryCode,
        input_data: inputData,
        results: structuredResults,
        llm_model_used: `Multi-AI (${taskResult.metadata.runs.map(r => r.provider).join(', ')})`,
        processing_time_ms: processingTime,
        confidence_score: 0.90,
        llm_runs: taskResult.metadata.runs,
        total_cost: taskResult.metadata.totalCost
      })
      .select()
      .single();

    if (analysisError) throw analysisError;

    // Store detailed regulatory analysis
    const { error: regulatoryError } = await supabase
      .from('regulatory_analyses')
      .insert({
        analysis_id: analysis.id,
        import_requirements: structuredResults.import_requirements,
        certifications_needed: structuredResults.certifications_needed,
        taxes_duties: structuredResults.taxes_duties,
        labeling_requirements: structuredResults.labeling_requirements,
        restrictions: structuredResults.restrictions,
        compliance_checklist: structuredResults.compliance_checklist
      });

    if (regulatoryError) throw regulatoryError;

    console.log('Regulatory analysis completed for project:', projectId);

    return new Response(JSON.stringify({
      success: true,
      analysis_id: analysis.id,
      processing_time_ms: processingTime,
      results: structuredResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in regulatory analysis:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});