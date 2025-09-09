import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityCheck {
  security_check: string;
  status: string;
  recommendation: string;
}

export const SecurityStatus = () => {
  const [checks, setChecks] = useState<SecurityCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSecurityStatus();
  }, []);

  const checkSecurityStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('check_security_configuration');
      
      if (error) {
        toast.error('Erreur lors de la vérification de la sécurité');
        return;
      }

      setChecks(data || []);
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OK':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Configuré
          </Badge>
        );
      case 'MANUAL_CHECK_REQUIRED':
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Action requise
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            À vérifier
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            État de la sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          État de la sécurité
        </CardTitle>
        <CardDescription>
          Vérifications de sécurité pour votre application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {checks.map((check, index) => (
          <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{check.security_check}</h4>
                {getStatusBadge(check.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {check.recommendation}
              </p>
              {check.status === 'MANUAL_CHECK_REQUIRED' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open('https://supabase.com/dashboard/project/gbuyfwlhxfwecitjtxii/auth/providers', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Configurer dans Supabase
                </Button>
              )}
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Astuce :</strong> Pour accélérer les tests, désactivez la confirmation d'email dans 
            Auth → Settings → User Signups → Enable email confirmations
          </p>
        </div>
      </CardContent>
    </Card>
  );
};