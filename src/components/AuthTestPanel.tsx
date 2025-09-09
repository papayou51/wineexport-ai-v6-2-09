import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Shield, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const AuthTestPanel = () => {
  const { user, session, signOut } = useAuth();
  const [testResults, setTestResults] = useState<any>({});

  const runSecurityTest = async () => {
    const results = {
      userSession: !!session,
      tokenPresent: !!session?.access_token,
      userData: !!user,
      profileLinked: !!user?.user_metadata,
      orgData: !!user?.user_metadata?.organization_name
    };
    
    setTestResults(results);
    
    const allPassed = Object.values(results).every(Boolean);
    if (allPassed) {
      toast.success('✅ Tous les tests de sécurité sont passés !');
    } else {
      toast.warning('⚠️ Certains tests ont échoué');
    }
  };

  const TestResult = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      {passed ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <CardTitle>Panneau de Test d'Authentification</CardTitle>
          </div>
          <CardDescription>
            Vérification du système d'authentification et de sécurité
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* État de l'utilisateur */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <User className="h-4 w-4" />
                <h3 className="font-semibold">Utilisateur Connecté</h3>
              </div>
              {user ? (
                <div className="space-y-2">
                  <p className="text-sm"><strong>Email:</strong> {user.email}</p>
                  <p className="text-sm"><strong>ID:</strong> {user.id.slice(0, 8)}...</p>
                  <p className="text-sm"><strong>Confirmé:</strong> 
                    <Badge variant={user.email_confirmed_at ? "default" : "destructive"} className="ml-2">
                      {user.email_confirmed_at ? "Oui" : "Non"}
                    </Badge>
                  </p>
                  <p className="text-sm"><strong>Dernière connexion:</strong> {new Date(user.last_sign_in_at || '').toLocaleString('fr-FR')}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun utilisateur connecté</p>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Building2 className="h-4 w-4" />
                <h3 className="font-semibold">Organisation</h3>
              </div>
              {user?.user_metadata?.organization_name ? (
                <div className="space-y-2">
                  <p className="text-sm"><strong>Nom:</strong> {user.user_metadata.organization_name}</p>
                  <Badge variant="default">Propriétaire</Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune organisation</p>
              )}
            </Card>
          </div>

          {/* Tests de sécurité */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Tests de Sécurité
              </h3>
              <Button onClick={runSecurityTest} size="sm">
                Lancer les Tests
              </Button>
            </div>
            
            {Object.keys(testResults).length > 0 && (
              <div className="space-y-1">
                <TestResult passed={testResults.userSession} label="Session utilisateur active" />
                <TestResult passed={testResults.tokenPresent} label="Token d'accès présent" />
                <TestResult passed={testResults.userData} label="Données utilisateur chargées" />
                <TestResult passed={testResults.profileLinked} label="Profil lié au compte" />
                <TestResult passed={testResults.orgData} label="Organisation associée" />
              </div>
            )}
          </Card>

          {/* Session Info */}
          {session && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Informations de Session</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Expire:</strong> {new Date(session.expires_at! * 1000).toLocaleString('fr-FR')}</p>
                <p><strong>Type de token:</strong> {session.token_type}</p>
                <p><strong>Provider:</strong> {session.user.app_metadata.provider}</p>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <Button 
              variant="destructive" 
              onClick={signOut}
              disabled={!user}
            >
              Déconnexion
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/auth/login'}
              disabled={!!user}
            >
              Page de Connexion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthTestPanel;