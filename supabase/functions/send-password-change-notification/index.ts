import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userEmail: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { userEmail }: NotificationRequest = await req.json();

    if (!userEmail) {
      throw new Error("Email utilisateur requis");
    }

    const { error } = await resend.emails.send({
      from: "Sécurité <security@yourdomain.com>",
      to: [userEmail],
      subject: "🔐 Votre mot de passe a été modifié",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">Modification de mot de passe</h1>
            <div style="width: 50px; height: 3px; background-color: #4CAF50; margin: 0 auto;"></div>
          </div>
          
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">🔐 Votre mot de passe a été modifié</h2>
            <p style="color: #666; line-height: 1.6;">
              Nous vous confirmons que votre mot de passe a été modifié avec succès le <strong>${new Date().toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</strong>.
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
      `,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Notification email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});