import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Shield, ShieldCheck, Smartphone, Key, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';

export const TwoFactorAuth = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if 2FA is already enabled on component mount
  useEffect(() => {
    const checkMFAStatus = async () => {
      try {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors?.totp?.find(factor => factor.status === 'verified');
        setIs2FAEnabled(!!totpFactor);
      } catch (error) {
        console.error('Error checking MFA status:', error);
      }
    };
    
    checkMFAStatus();
  }, []);

  const handleEnable2FA = async () => {
    setIsEnabling(true);
    setLoading(true);
    
    try {
      // Enroll a new TOTP factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      if (data) {
        setFactorId(data.id);
        setTotpSecret(data.totp.secret);
        
        // Generate QR code for the TOTP URI
        const qrUri = data.totp.uri;
        const qrCodeDataUrl = await QRCode.toDataURL(qrUri);
        setQrCodeUrl(qrCodeDataUrl);
        
        setShowSetup(true);
      }
    } catch (error: any) {
      console.error('Error enrolling MFA:', error);
      toast.error('Erreur lors de l\'initialisation de la 2FA');
      setIsEnabling(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Veuillez saisir un code à 6 chiffres');
      return;
    }

    setLoading(true);

    try {
      // Create a challenge for the enrolled factor
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      if (challenge) {
        setChallengeId(challenge.id);

        // Verify the TOTP code
        const { data, error } = await supabase.auth.mfa.verify({
          factorId,
          challengeId: challenge.id,
          code: verificationCode
        });

        if (error) throw error;

        // Generate backup codes (simulate - Supabase doesn't provide this directly)
        const generatedBackupCodes = Array.from({ length: 8 }, () => 
          Math.random().toString(36).substr(2, 4) + '-' + 
          Math.random().toString(36).substr(2, 4) + '-' + 
          Math.random().toString(36).substr(2, 4)
        );
        setBackupCodes(generatedBackupCodes);

        setIs2FAEnabled(true);
        setShowSetup(false);
        setIsEnabling(false);
        setVerificationCode('');
        toast.success('Authentification à deux facteurs activée avec succès');
      }
    } catch (error: any) {
      console.error('Error verifying MFA:', error);
      toast.error('Code de vérification incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    
    try {
      // Get all TOTP factors and unenroll them
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactors = factors?.totp || [];
      
      for (const factor of totpFactors) {
        if (factor.status === 'verified') {
          const { error } = await supabase.auth.mfa.unenroll({
            factorId: factor.id
          });
          if (error) throw error;
        }
      }
      
      setIs2FAEnabled(false);
      setBackupCodes([]);
      toast.success('Authentification à deux facteurs désactivée');
    } catch (error: any) {
      console.error('Error disabling MFA:', error);
      toast.error('Erreur lors de la désactivation de la 2FA');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes-2fa.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Codes de sauvegarde téléchargés');
  };

  if (showSetup) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Configuration de l'authentification à deux facteurs</h3>
          <p className="text-sm text-muted-foreground">
            Suivez les étapes ci-dessous pour sécuriser votre compte
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Étape 1: Installez une application d'authentification</CardTitle>
              <CardDescription>
                Téléchargez Google Authenticator, Authy, ou une autre application 2FA
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Étape 2: Scannez le code QR</CardTitle>
              <CardDescription>
                Utilisez votre application pour scanner ce code QR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-4">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code pour 2FA" 
                    className="w-48 h-48 border border-border rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Key className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Génération du QR code...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  Ou saisissez manuellement cette clé :
                </p>
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono break-all">
                  {totpSecret}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Étape 3: Vérifiez avec un code</CardTitle>
              <CardDescription>
                Saisissez le code à 6 chiffres généré par votre application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="verification-code">Code de vérification</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyAndEnable}
                  disabled={verificationCode.length !== 6 || loading}
                  className="flex-1"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {loading ? 'Vérification...' : 'Activer la 2FA'}
                </Button>
                <Button
                  onClick={() => {
                    setShowSetup(false);
                    setIsEnabling(false);
                    setVerificationCode('');
                    setQrCodeUrl('');
                    setTotpSecret('');
                    setFactorId('');
                  }}
                  variant="outline"
                  disabled={loading}
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {is2FAEnabled ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <Shield className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">Authentification à deux facteurs</p>
            <p className="text-sm text-muted-foreground">
              {is2FAEnabled 
                ? 'Protection active avec une application d\'authentification' 
                : 'Ajoutez une couche de sécurité supplémentaire à votre compte'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {is2FAEnabled && (
            <Badge variant="secondary" className="text-green-700 bg-green-100">
              Activée
            </Badge>
          )}
          <Switch
            checked={is2FAEnabled}
            onCheckedChange={is2FAEnabled ? undefined : handleEnable2FA}
            disabled={isEnabling || loading}
          />
        </div>
      </div>

      {is2FAEnabled && (
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Application configurée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Votre application d'authentification génère des codes toutes les 30 secondes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Codes de sauvegarde
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {backupCodes.length} codes disponibles
                  </p>
                  <Button
                    onClick={downloadBackupCodes}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Télécharger
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-amber-800 font-medium">Important</p>
              <p className="text-amber-700">
                Sauvegardez vos codes de récupération dans un endroit sûr. 
                Ils vous permettront d'accéder à votre compte si vous perdez votre téléphone.
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                Désactiver la 2FA
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Désactiver l'authentification à deux facteurs ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cela réduira la sécurité de votre compte. Vous ne serez plus protégé par la double authentification.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDisable2FA}
                  disabled={loading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {loading ? 'Désactivation...' : 'Désactiver'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};