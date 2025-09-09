import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Grape, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword, user, loading: authLoading } = useAuth();
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
      const { error } = await resetPassword(email);
      
      if (error) {
        if (error.message === 'Unable to validate email address: invalid format') {
          toast.error('Format d\'email invalide');
        } else if (error.message === 'User not found') {
          toast.error('Aucun compte associé à cet email');
        } else {
          toast.error(error.message);
        }
      } else {
        setSent(true);
        toast.success('Email de récupération envoyé !');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-wine-deep to-wine-medium rounded-lg flex items-center justify-center">
              <Grape className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Email envoyé</CardTitle>
              <CardDescription>
                Vérifiez votre boîte mail pour réinitialiser votre mot de passe
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Un email de récupération a été envoyé à <strong>{email}</strong>
            </p>
            <Link to="/auth/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-wine-deep to-wine-medium rounded-lg flex items-center justify-center">
            <Grape className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
            <CardDescription>
              Saisissez votre email pour recevoir un lien de récupération
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Envoi...' : 'Envoyer le lien de récupération'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center"
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              Retour à la connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;