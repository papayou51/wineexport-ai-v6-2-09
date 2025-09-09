import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  format?: 'json' | 'csv';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { format = 'json' }: ExportRequest = await req.json().catch(() => ({}));

    console.log(`Starting data export for user ${user.id} in format ${format}`);

    // Collect all user data
    const exportData: any = {
      export_info: {
        user_id: user.id,
        exported_at: new Date().toISOString(),
        format: format,
      },
      account: {
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
    };

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      exportData.profile = profile;
    }

    // Get user preferences
    const { data: preferences } = await supabaseClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (preferences) {
      exportData.preferences = preferences;
    }

    // Get user organizations and roles
    const { data: organizationRoles } = await supabaseClient
      .from('user_organization_roles')
      .select(`
        *,
        organizations (*)
      `)
      .eq('user_id', user.id);

    if (organizationRoles && organizationRoles.length > 0) {
      exportData.organizations = organizationRoles;

      // Get organization data
      const organizationIds = organizationRoles.map((role: any) => role.organization_id);

      // Get products
      const { data: products } = await supabaseClient
        .from('products')
        .select('*')
        .in('organization_id', organizationIds);

      if (products && products.length > 0) {
        exportData.products = products;
      }

      // Get projects
      const { data: projects } = await supabaseClient
        .from('projects')
        .select('*')
        .in('organization_id', organizationIds);

      if (projects && projects.length > 0) {
        exportData.projects = projects;

        const projectIds = projects.map((project: any) => project.id);

        // Get analyses
        const { data: analyses } = await supabaseClient
          .from('analyses')
          .select('*')
          .in('project_id', projectIds);

        if (analyses && analyses.length > 0) {
          exportData.analyses = analyses;
        }

        // Get leads
        const { data: leads } = await supabaseClient
          .from('leads')
          .select('*')
          .in('project_id', projectIds);

        if (leads && leads.length > 0) {
          exportData.leads = leads;
        }

        // Get reports
        const { data: reports } = await supabaseClient
          .from('reports')
          .select('*')
          .in('project_id', projectIds);

        if (reports && reports.length > 0) {
          exportData.reports = reports;
        }
      }
    }

    // Get user sessions
    const { data: sessions } = await supabaseClient
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id);

    if (sessions && sessions.length > 0) {
      exportData.sessions = sessions;
    }

    // Log the export action in audit logs
    const { error: auditError } = await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'data_export',
        resource_type: 'user_data',
        resource_id: user.id,
        new_values: { format, exported_at: new Date().toISOString() },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

    if (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    console.log(`Data export completed for user ${user.id}`);

    // Return the data based on format
    if (format === 'csv') {
      // For CSV, we'll flatten the main profile data
      const csvData = [
        'Field,Value',
        `Email,${exportData.account.email}`,
        `Created At,${exportData.account.created_at}`,
        `First Name,${exportData.profile?.first_name || ''}`,
        `Last Name,${exportData.profile?.last_name || ''}`,
        `Phone,${exportData.profile?.phone || ''}`,
        `Language,${exportData.preferences?.language || ''}`,
        `Theme,${exportData.preferences?.theme || ''}`,
        `Organizations Count,${exportData.organizations?.length || 0}`,
        `Projects Count,${exportData.projects?.length || 0}`,
        `Products Count,${exportData.products?.length || 0}`,
        `Analyses Count,${exportData.analyses?.length || 0}`,
        `Leads Count,${exportData.leads?.length || 0}`,
      ].join('\n');

      return new Response(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="user-data-${user.id}.csv"`,
          ...corsHeaders,
        },
      });
    }

    // Default JSON format
    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${user.id}.json"`,
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in export-user-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to export user data',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);