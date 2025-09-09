import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { AIOrchestrator } from '../_shared/ai-orchestrator/orchestrator.ts';
import { LeadGenerationSchema, LEAD_GENERATION_PROMPT, type LeadGenerationData } from '../_shared/ai-orchestrator/schemas/lead-generation.ts';

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
    
    console.log('Starting lead generation for project:', projectId, 'country:', countryCode);

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
    const contextualPrompt = `${LEAD_GENERATION_PROMPT}

Product Portfolio:
${project.products.map(p => `
- ${p.name} (${p.category})
- Price range: ${p.alcohol_percentage ? 'Premium' : 'Standard'}
- Volume: ${p.volume_ml || 'Various'}ml
- Certifications: ${p.certifications || 'Standard'}
`).join('\n')}

Target Market: ${country.name} (${countryCode})
Budget Range: ${project.budget_range}
Project Description: ${project.description}

Generate leads for: ${country.name}`;

    // Execute self-consistency analysis for better lead quality
    const startTime = Date.now();
    const taskResult = await orchestrator.execute<LeadGenerationData>({
      prompt: contextualPrompt,
      schema: LeadGenerationSchema,
      context: { projectId, countryCode },
      policy: {
        type: 'self-consistency',
        runs: 3,
        primaryProvider: 'openai'
      }
    });

    const structuredResults = taskResult.result;
    const leads = structuredResults.leads;
    const processingTime = taskResult.metadata.totalLatencyMs;

    // Store analysis in database
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        project_id: projectId,
        analysis_type: 'lead_generation',
        country_code: countryCode,
        input_data: inputData,
        results: structuredResults,
        llm_model_used: `Multi-AI (${taskResult.metadata.runs.map(r => r.provider).join(', ')})`,
        processing_time_ms: processingTime,
        confidence_score: 0.85,
        llm_runs: taskResult.metadata.runs,
        total_cost: taskResult.metadata.totalCost
      })
      .select()
      .single();

    if (analysisError) throw analysisError;

    // Store individual leads
    const leadsToInsert = leads.map(lead => ({
      project_id: projectId,
      country_code: countryCode,
      company_name: lead.company_name,
      contact_person: lead.contact_person,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      business_focus: lead.business_focus,
      annual_volume: lead.annual_volume,
      current_suppliers: lead.current_suppliers,
      price_range: lead.price_range,
      qualification_score: lead.qualification_score,
      notes: lead.notes,
      contact_status: 'new'
    }));

    const { error: leadsError } = await supabase
      .from('leads')
      .insert(leadsToInsert);

    if (leadsError) throw leadsError;

    console.log('Lead generation completed for project:', projectId, 'Generated leads:', leads.length);

    return new Response(JSON.stringify({
      success: true,
      analysis_id: analysis.id,
      processing_time_ms: processingTime,
      leads_generated: leads.length,
      results: structuredResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in lead generation:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});