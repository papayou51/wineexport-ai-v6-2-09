import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSecurityNotifications } from "@/hooks/useSecurityNotifications";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Bell, 
  Key, 
  Mail, 
  Smartphone, 
  Trash2, 
  AlertTriangle,
  TestTube
} from "lucide-react";

export const SecurityNotificationsTab = () => {
  const { 
    isLoading, 
    preferences, 
    updatePreferences,
    sendSecurityNotification
  } = useSecurityNotifications();
  const { toast } = useToast();
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  const handlePreferenceChange = async (key: keyof typeof preferences, value: boolean) => {
    await updatePreferences({ [key]: value });
  };

  const testNotification = async () => {
    setIsTestingNotification(true);
    try {
      await sendSecurityNotification('login_new_location', {
        location: 'Paris, France (Test)',
        ipAddress: '192.168.1.1 (Test)',
      });
      toast({
        title: "Email de test envoyé",
        description: "Vérifiez votre boîte mail pour voir l'email de test",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer l'email de test",
      });
    } finally {
      setIsTestingNotification(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Notifications de Sécurité</CardTitle>
          </div>
          <CardDescription>
            Configurez les alertes automatiques pour les activités importantes de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connexions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Nouvelles connexions</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir une alerte lors de connexions depuis de nouvelles localisations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Recommandé</Badge>
                <Switch
                  checked={preferences.loginNotifications}
                  onCheckedChange={(value) => handlePreferenceChange('loginNotifications', value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Separator />

            {/* Changement de mot de passe */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Changement de mot de passe</Label>
                  <p className="text-sm text-muted-foreground">
                    Confirmation par email lors du changement de mot de passe
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Recommandé</Badge>
                <Switch
                  checked={preferences.passwordChangeNotifications}
                  onCheckedChange={(value) => handlePreferenceChange('passwordChangeNotifications', value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Separator />

            {/* Changement d'email */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Changement d'email</Label>
                  <p className="text-sm text-muted-foreground">
                    Alerte lors de la modification de l'adresse email du compte
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Recommandé</Badge>
                <Switch
                  checked={preferences.emailChangeNotifications}
                  onCheckedChange={(value) => handlePreferenceChange('emailChangeNotifications', value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Separator />

            {/* Authentification à deux facteurs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Authentification à deux facteurs</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications lors de l'activation/désactivation de la 2FA
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.twoFactorNotifications}
                onCheckedChange={(value) => handlePreferenceChange('twoFactorNotifications', value)}
                disabled={isLoading}
              />
            </div>

            <Separator />

            {/* Suppression de compte */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Suppression de compte</Label>
                  <p className="text-sm text-muted-foreground">
                    Alerte lors des demandes de suppression de compte
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Critique</Badge>
                <Switch
                  checked={preferences.accountDeletionNotifications}
                  onCheckedChange={(value) => handlePreferenceChange('accountDeletionNotifications', value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Separator />

            {/* Activité suspecte */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Activité suspecte</Label>
                  <p className="text-sm text-muted-foreground">
                    Alerte lors de la détection d'activités inhabituelles
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Critique</Badge>
                <Switch
                  checked={preferences.suspiciousActivityNotifications}
                  onCheckedChange={(value) => handlePreferenceChange('suspiciousActivityNotifications', value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test des notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-primary" />
            <CardTitle>Test des notifications</CardTitle>
          </div>
          <CardDescription>
            Testez le système de notifications en envoyant un email de test
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testNotification}
            disabled={isTestingNotification}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <TestTube className="mr-2 h-4 w-4" />
            {isTestingNotification ? "Envoi en cours..." : "Envoyer un email de test"}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Un email de test sera envoyé à votre adresse pour vérifier la configuration
          </p>
        </CardContent>
      </Card>

      {/* Informations sur la sécurité */}
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-800 dark:text-amber-200">
              Conseils de sécurité
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
            <li>• Gardez toutes les notifications critiques activées pour votre sécurité</li>
            <li>• Vérifiez régulièrement vos emails de sécurité</li>
            <li>• Signalez immédiatement toute activité suspecte</li>
            <li>• Ne partagez jamais vos informations de connexion</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};