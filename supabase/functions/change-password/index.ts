import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    supabaseClient.auth.setSession({
      access_token: authHeader.replace("Bearer ", ""),
      refresh_token: ""
    });

    const { currentPassword, newPassword }: PasswordChangeRequest = await req.json();

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Utilisateur non authentifié");
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error("Mot de passe actuel incorrect");
    }

    // Check if new password is compromised (simplified check)
    if (await isPasswordCompromised(newPassword)) {
      throw new Error("Ce mot de passe a été compromis dans des violations de données. Choisissez un autre mot de passe.");
    }

    // Update password
    const { error: updateError } = await supabaseClient.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      throw updateError;
    }

    // Send notification email
    await supabaseClient.functions.invoke('send-password-change-notification', {
      body: { userEmail: user.email }
    });

    return new Response(
      JSON.stringify({ success: true, message: "Mot de passe modifié avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Password change error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

async function isPasswordCompromised(password: string): Promise<boolean> {
  try {
    // Use SHA-1 hash for HaveIBeenPwned API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();
    
    return text.includes(suffix);
  } catch (error) {
    console.error("Error checking password:", error);
    return false; // Don't block password change if API is down
  }
}