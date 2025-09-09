import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityNotificationRequest {
  userEmail: string;
  notificationType: 'login_new_location' | 'password_change' | 'email_change' | '2fa_enabled' | '2fa_disabled' | 'account_deletion_requested' | 'suspicious_activity';
  metadata?: {
    ipAddress?: string;
    location?: string;
    device?: string;
    browser?: string;
    timestamp?: string;
  };
}

const getEmailTemplate = (type: string, metadata: any = {}) => {
  const templates = {
    login_new_location: {
      subject: "🔐 Nouvelle connexion détectée",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🔐 Nouvelle connexion détectée</h1>
            <div style="width: 50px; height: 3px; background-color: #f59e0b; margin: 0 auto;"></div>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #92400e; margin-top: 0;">Nouvelle connexion à votre compte</h2>
            <p style="color: #92400e; line-height: 1.6; margin: 0;">
              Une connexion à votre compte a été détectée depuis une nouvelle localisation le <strong>${metadata.timestamp}</strong>.
            </p>
          </div>

          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Détails de la connexion :</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li><strong>Localisation :</strong> ${metadata.location || 'Inconnue'}</li>
              <li><strong>Adresse IP :</strong> ${metadata.ipAddress || 'Non disponible'}</li>
              <li><strong>Appareil :</strong> ${metadata.device || 'Inconnu'}</li>
              <li><strong>Navigateur :</strong> ${metadata.browser || 'Inconnu'}</li>
            </ul>
          </div>

          <div style="background-color: #fee2e2; border: 1px solid #f87171; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #dc2626; margin: 0; font-weight: bold;">
              ⚠️ Si ce n'était pas vous, sécurisez immédiatement votre compte en changeant votre mot de passe.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Cet email a été envoyé automatiquement. Ne répondez pas à ce message.
            </p>
          </div>
        </div>
      `
    },
    password_change: {
      subject: "🔐 Mot de passe modifié avec succès",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">Mot de passe modifié</h1>
            <div style="width: 50px; height: 3px; background-color: #4CAF50; margin: 0 auto;"></div>
          </div>
          
          <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #0369a1; margin-top: 0;">🔐 Votre mot de passe a été modifié</h2>
            <p style="color: #0369a1; line-height: 1.6;">
              Votre mot de passe a été modifié avec succès le <strong>${metadata.timestamp}</strong>.
            </p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #856404; margin: 0; font-weight: bold;">
              ⚠️ Si vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement.
            </p>
          </div>

          <div style="margin: 30px 0;">
            <h3 style="color: #333;">Conseils de sécurité :</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>Ne partagez jamais votre mot de passe</li>
              <li>Utilisez un gestionnaire de mots de passe</li>
              <li>Activez l'authentification à deux facteurs</li>
              <li>Choisissez des mots de passe uniques pour chaque service</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Cet email a été envoyé automatiquement. Ne répondez pas à ce message.
            </p>
          </div>
        </div>
      `
    },
    email_change: {
      subject: "📧 Adresse email modifiée",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">📧 Email modifié</h1>
            <div style="width: 50px; height: 3px; background-color: #8b5cf6; margin: 0 auto;"></div>
          </div>
          
          <div style="background-color: #faf5ff; border: 1px solid #8b5cf6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #7c3aed; margin-top: 0;">Adresse email modifiée</h2>
            <p style="color: #7c3aed; line-height: 1.6;">
              L'adresse email de votre compte a été modifiée le <strong>${metadata.timestamp}</strong>.
            </p>
          </div>

          <div style="background-color: #fee2e2; border: 1px solid #f87171; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #dc2626; margin: 0; font-weight: bold;">
              ⚠️ Si vous n'avez pas effectué cette modification, votre compte pourrait être compromis. Contactez-nous immédiatement.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Cet email a été envoyé automatiquement. Ne répondez pas à ce message.
            </p>
          </div>
        </div>
      `
    },
    '2fa_enabled': {
      subject: "🛡️ Authentification à deux facteurs activée",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🛡️ 2FA Activée</h1>
            <div style="width: 50px; height: 3px; background-color: #10b981; margin: 0 auto;"></div>
          </div>
          
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #047857; margin-top: 0;">Sécurité renforcée !</h2>
            <p style="color: #047857; line-height: 1.6;">
              L'authentification à deux facteurs a été activée sur votre compte le <strong>${metadata.timestamp}</strong>. 
              Votre compte est maintenant plus sécurisé.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Cet email a été envoyé automatiquement. Ne répondez pas à ce message.
            </p>
          </div>
        </div>
      `
    },
    '2fa_disabled': {
      subject: "⚠️ Authentification à deux facteurs désactivée",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">⚠️ 2FA Désactivée</h1>
            <div style="width: 50px; height: 3px; background-color: #f59e0b; margin: 0 auto;"></div>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #92400e; margin-top: 0;">Sécurité réduite</h2>
            <p style="color: #92400e; line-height: 1.6;">
              L'authentification à deux facteurs a été désactivée sur votre compte le <strong>${metadata.timestamp}</strong>.
            </p>
          </div>

          <div style="background-color: #fee2e2; border: 1px solid #f87171; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #dc2626; margin: 0; font-weight: bold;">
              ⚠️ Nous recommandons fortement de réactiver la 2FA pour protéger votre compte.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Cet email a été envoyé automatiquement. Ne répondez pas à ce message.
            </p>
          </div>
        </div>
      `
    },
    account_deletion_requested: {
      subject: "🗑️ Demande de suppression de compte",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🗑️ Suppression de compte</h1>
            <div style="width: 50px; height: 3px; background-color: #dc2626; margin: 0 auto;"></div>
          </div>
          
          <div style="background-color: #fee2e2; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #dc2626; margin-top: 0;">Demande de suppression de compte</h2>
            <p style="color: #dc2626; line-height: 1.6;">
              Une demande de suppression de compte a été effectuée le <strong>${metadata.timestamp}</strong>. 
              La suppression aura lieu dans 24 heures si elle n'est pas annulée.
            </p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #92400e; margin: 0; font-weight: bold;">
              ⚠️ Si vous n'avez pas demandé cette suppression, connectez-vous immédiatement pour annuler cette action.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Cet email a été envoyé automatiquement. Ne répondez pas à ce message.
            </p>
          </div>
        </div>
      `
    },
    suspicious_activity: {
      subject: "🚨 Activité suspecte détectée",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🚨 Activité suspecte</h1>
            <div style="width: 50px; height: 3px; background-color: #dc2626; margin: 0 auto;"></div>
          </div>
          
          <div style="background-color: #fee2e2; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #dc2626; margin-top: 0;">🚨 Activité suspecte détectée</h2>
            <p style="color: #dc2626; line-height: 1.6;">
              Une activité inhabituelle a été détectée sur votre compte le <strong>${metadata.timestamp}</strong>.
            </p>
          </div>

          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Détails de l'activité :</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li><strong>Type :</strong> ${metadata.activityType || 'Activité inhabituelle'}</li>
              <li><strong>Localisation :</strong> ${metadata.location || 'Inconnue'}</li>
              <li><strong>Adresse IP :</strong> ${metadata.ipAddress || 'Non disponible'}</li>
            </ul>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #92400e; margin: 0; font-weight: bold;">
              ⚠️ Par sécurité, nous recommandons de changer votre mot de passe et de vérifier votre compte.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Cet email a été envoyé automatiquement. Ne répondez pas à ce message.
            </p>
          </div>
        </div>
      `
    }
  };

  return templates[type as keyof typeof templates] || templates.suspicious_activity;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { userEmail, notificationType, metadata = {} }: SecurityNotificationRequest = await req.json();

    if (!userEmail || !notificationType) {
      throw new Error("Email utilisateur et type de notification requis");
    }

    // Ajouter timestamp si pas fourni
    if (!metadata.timestamp) {
      metadata.timestamp = new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    const template = getEmailTemplate(notificationType, metadata);

    const { error } = await resend.emails.send({
      from: "Sécurité <security@yourdomain.com>",
      to: [userEmail],
      subject: template.subject,
      html: template.html,
    });

    if (error) {
      throw error;
    }

    console.log(`Security notification sent: ${notificationType} to ${userEmail}`);

    return new Response(
      JSON.stringify({ success: true, notificationType }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Security notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});