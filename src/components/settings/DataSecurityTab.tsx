import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ActiveSessions } from './ActiveSessions';
import { TwoFactorAuth } from './TwoFactorAuth';
import { useDataExport } from '@/hooks/useDataExport';
import { useAccountDeletion } from '@/hooks/useAccountDeletion';
import { useSecurityNotifications } from '@/hooks/useSecurityNotifications';
import { Download, Trash2, Shield, History, Database, ChevronDown, FileText, File, Mail } from 'lucide-react';
import { toast } from 'sonner';

export const DataSecurityTab = () => {
  const { isExporting, exportData } = useDataExport();
  const { isRequesting, requestDeletion, confirmDeletion } = useAccountDeletion();
  const { triggerAccountDeletionNotification } = useSecurityNotifications();

  // Check for deletion confirmation token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const confirmToken = urlParams.get('confirm_deletion');
    
    if (confirmToken) {
      // Remove token from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('confirm_deletion');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Confirm deletion
      confirmDeletion(confirmToken);
    }
  }, [confirmDeletion]);

  return (
    <div className="space-y-6">
      {/* Two Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentification à deux facteurs
          </CardTitle>
          <CardDescription>
            Renforcez la sécurité de votre compte avec l'authentification à deux facteurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorAuth />
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Sessions actives
          </CardTitle>
          <CardDescription>
            Gérez vos sessions de connexion et déconnectez-vous à distance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActiveSessions />
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gestion des données
          </CardTitle>
          <CardDescription>
            Exportez ou supprimez vos données personnelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <h4 className="font-medium mb-2">Exporter mes données</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Téléchargez une copie de toutes vos données personnelles. Inclut votre profil, préférences, projets, analyses, leads et rapports.
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={isExporting}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? 'Export en cours...' : 'Exporter mes données'}
                    {!isExporting && <ChevronDown className="ml-2 h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => exportData('json')}>
                    <File className="mr-2 h-4 w-4" />
                    Format JSON (complet)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportData('csv')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Format CSV (résumé)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Separator />

            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <h4 className="font-medium text-destructive mb-2">Zone de danger</h4>
            <p className="text-sm text-muted-foreground mb-4">
              La suppression de votre compte est irréversible. Toutes vos données seront définitivement supprimées.
            </p>
            
            <div className="bg-background/50 rounded-md p-3 mb-4 text-sm">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Processus sécurisé</p>
                  <p className="text-muted-foreground">
                    Un email de confirmation sera envoyé à votre adresse. 
                    Vous aurez 24h pour confirmer la suppression.
                  </p>
                </div>
              </div>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isRequesting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isRequesting ? 'Envoi en cours...' : 'Supprimer mon compte'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Un email de confirmation sera envoyé à votre adresse. Cette action supprimera définitivement votre
                    compte et toutes vos données de nos serveurs après confirmation.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await requestDeletion();
                      // La notification sera automatiquement envoyée par le hook useAccountDeletion
                    }}
                    disabled={isRequesting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isRequesting ? 'Envoi...' : 'Envoyer l\'email de confirmation'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};