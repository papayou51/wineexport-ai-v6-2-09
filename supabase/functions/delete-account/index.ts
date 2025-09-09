import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteAccountRequest {
  action: 'request' | 'confirm';
  confirmationToken?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, confirmationToken }: DeleteAccountRequest = await req.json();

    if (action === 'request') {
      // Generate confirmation token and set expiry (24h from now)
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Store deletion request in user_preferences with token
      const { error: updateError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          deletion_token: token,
          deletion_requested_at: new Date().toISOString(),
          deletion_expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('Error storing deletion request:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to process request' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get user profile for email
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single();

      const userName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : user.email?.split('@')[0];

      // Send confirmation email
      if (resend) {
        const confirmUrl = `${supabaseUrl.replace('https://', 'https://app.')}/settings?confirm_deletion=${token}`;
        
        await resend.emails.send({
          from: 'Sécurité <security@resend.dev>',
          to: [user.email!],
          subject: 'Confirmation de suppression de compte',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Confirmation de suppression de compte</h2>
              <p>Bonjour ${userName},</p>
              <p>Vous avez demandé la suppression de votre compte. Cette action est <strong>irréversible</strong>.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Que va-t-il se passer ?</h3>
                <ul>
                  <li>Toutes vos données personnelles seront supprimées</li>
                  <li>Vos projets, analyses et rapports seront effacés</li>
                  <li>Cette action ne peut pas être annulée</li>
                </ul>
              </div>

              <p>Si vous êtes sûr(e) de vouloir supprimer votre compte, cliquez sur le lien ci-dessous :</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${confirmUrl}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Confirmer la suppression
                </a>
              </p>
              
              <p><small>Ce lien expirera dans 24 heures. Si vous n'avez pas demandé cette suppression, ignorez cet email.</small></p>
              
              <p>Cordialement,<br>L'équipe de sécurité</p>
            </div>
          `,
        });
      }

      return new Response(JSON.stringify({ 
        message: 'Email de confirmation envoyé',
        expiresAt: expiresAt.toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'confirm' && confirmationToken) {
      // Verify token and check expiry
      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('deletion_token, deletion_expires_at')
        .eq('user_id', user.id)
        .single();

      if (prefError || !preferences?.deletion_token || preferences.deletion_token !== confirmationToken) {
        return new Response(JSON.stringify({ error: 'Token invalide' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (new Date() > new Date(preferences.deletion_expires_at)) {
        return new Response(JSON.stringify({ error: 'Token expiré' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Log the deletion for audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'account_deletion',
        resource_type: 'user_account',
        resource_id: user.id,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      });

      // Delete user data in correct order (respecting foreign key constraints)
      const tables = [
        'audit_logs',
        'user_sessions', 
        'user_preferences',
        'reports',
        'leads',
        'regulatory_analyses',
        'marketing_intelligence', 
        'market_studies',
        'analyses',
        'product_attachments',
        'product_versions',
        'products',
        'user_organization_roles',
        'profiles',
        'vectors'
      ];

      for (const table of tables) {
        await supabase.from(table).delete().eq('user_id', user.id);
      }

      // Delete user from auth (this should be done last)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return new Response(JSON.stringify({ error: 'Erreur lors de la suppression' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        message: 'Compte supprimé avec succès' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Action invalide' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in delete-account function:', error);
    return new Response(JSON.stringify({ error: 'Erreur interne' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});