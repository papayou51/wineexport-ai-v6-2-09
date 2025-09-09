import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';

const preferencesSchema = z.object({
  language: z.string(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  marketingEmails: z.boolean(),
  autoSave: z.boolean(),
  theme: z.string(),
  dataRetention: z.string(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

const defaultPreferences: PreferencesFormData = {
  language: 'fr',
  emailNotifications: true,
  pushNotifications: false,
  marketingEmails: false,
  autoSave: true,
  theme: 'system',
  dataRetention: '12months',
};

export const PreferencesForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { preferences, loading: preferencesLoading, updatePreferences } = usePreferences();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      language: 'fr',
      emailNotifications: true,
      pushNotifications: false,
      marketingEmails: false,
      autoSave: true,
      theme: 'system',
      dataRetention: '12months',
    },
  });

  // Initialiser le formulaire avec les préférences de Supabase
  useEffect(() => {
    if (preferences) {
      setValue('language', preferences.language);
      setValue('theme', preferences.theme);
      setValue('emailNotifications', preferences.email_notifications);
      setValue('pushNotifications', preferences.push_notifications);
      setValue('marketingEmails', preferences.marketing_emails);
      setValue('autoSave', preferences.auto_save);
      setValue('dataRetention', preferences.data_retention);
    }
  }, [preferences, setValue]);

  const onSubmit = async (data: PreferencesFormData) => {
    try {
      setIsLoading(true);
      
      // Mettre à jour les préférences dans Supabase
      await updatePreferences({
        language: data.language,
        theme: data.theme,
        email_notifications: data.emailNotifications,
        push_notifications: data.pushNotifications,
        marketing_emails: data.marketingEmails,
        auto_save: data.autoSave,
        data_retention: data.dataRetention,
      });

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des préférences');
    } finally {
      setIsLoading(false);
    }
  };

  const watchedValues = watch();

  if (preferencesLoading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6">
        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language">Langue</Label>
          <Select
            value={watchedValues.language}
            onValueChange={(value) => setValue('language', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une langue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Theme */}
        <div className="space-y-2">
          <Label htmlFor="theme">Thème</Label>
          <Select
            value={watchedValues.theme}
            onValueChange={(value) => setValue('theme', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un thème" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Clair</SelectItem>
              <SelectItem value="dark">Sombre</SelectItem>
              <SelectItem value="system">Système</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notifications</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Notifications par email</Label>
              <p className="text-sm text-muted-foreground">
                Recevez des notifications importantes par email
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={watchedValues.emailNotifications}
              onCheckedChange={(checked) => setValue('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifications">Notifications push</Label>
              <p className="text-sm text-muted-foreground">
                Recevez des notifications en temps réel dans votre navigateur
              </p>
            </div>
            <Switch
              id="pushNotifications"
              checked={watchedValues.pushNotifications}
              onCheckedChange={(checked) => setValue('pushNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketingEmails">Emails marketing</Label>
              <p className="text-sm text-muted-foreground">
                Recevez des conseils et actualités sur nos produits
              </p>
            </div>
            <Switch
              id="marketingEmails"
              checked={watchedValues.marketingEmails}
              onCheckedChange={(checked) => setValue('marketingEmails', checked)}
            />
          </div>
        </div>

        {/* Application Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Paramètres de l'application</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoSave">Sauvegarde automatique</Label>
              <p className="text-sm text-muted-foreground">
                Sauvegardez automatiquement vos modifications
              </p>
            </div>
            <Switch
              id="autoSave"
              checked={watchedValues.autoSave}
              onCheckedChange={(checked) => setValue('autoSave', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataRetention">Rétention des données</Label>
            <Select
              value={watchedValues.dataRetention}
              onValueChange={(value) => setValue('dataRetention', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 mois</SelectItem>
                <SelectItem value="6months">6 mois</SelectItem>
                <SelectItem value="1_year">1 an</SelectItem>
                <SelectItem value="2_years">2 ans</SelectItem>
                <SelectItem value="indefinite">Indéfini</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Durée de conservation de vos données d'analyse
            </p>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sauvegarde...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder les préférences
          </>
        )}
      </Button>
    </form>
  );
};