import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Grape } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp(email, password, organizationName);
      
      if (error) {
        if (error.message === 'User already registered') {
          toast.error('Un compte existe déjà avec cet email');
        } else if (error.message === 'Signup requires a valid password') {
          toast.error('Le mot de passe doit contenir au moins 6 caractères');
        } else if (error.message === 'Unable to validate email address: invalid format') {
          toast.error('Format d\'email invalide');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Compte créé avec succès ! Vérifiez votre email pour confirmer votre inscription.');
        navigate('/auth/login');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-wine-deep to-wine-medium rounded-lg flex items-center justify-center">
            <Grape className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
            <CardDescription>
              Rejoignez WineExport AI et développez vos exports
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Nom de l'organisation</Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="Votre domaine viticole"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 caractères
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Vous avez déjà un compte ?{' '}
              <Link
                to="/auth/login"
                className="text-primary hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;