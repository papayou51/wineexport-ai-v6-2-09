import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AvatarUpload } from './AvatarUpload';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').optional(),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  organizationName: z.string().min(2, 'Le nom de l\'organisation doit contenir au moins 2 caractères'),
  description: z.string().max(500, 'La description ne peut pas dépasser 500 caractères').optional(),
  website: z.string().url('Veuillez saisir une URL valide').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const UserProfileForm = () => {
  const { user } = useAuth();
  const { organization, loading: orgLoading, updateOrganization } = useOrganization();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (organization && profile) {
      setValue('firstName', profile.first_name || '');
      setValue('lastName', profile.last_name || '');
      setValue('organizationName', organization.name || '');
      setValue('description', organization.description || '');
      setValue('website', organization.website || '');
    }
  }, [organization, profile, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      
      // Mettre à jour le profil utilisateur
      await updateProfile({
        first_name: data.firstName,
        last_name: data.lastName,
      });

      // Mettre à jour l'organisation
      await updateOrganization({
        name: data.organizationName,
        description: data.description,
        website: data.website,
      });

      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  if (orgLoading || profileLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-24 h-24 bg-muted rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-32 animate-pulse" />
            <div className="h-3 bg-muted rounded w-24 animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-4">
        <AvatarUpload />
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground mt-1">
            L'email ne peut pas être modifié
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="Votre prénom"
            />
            {errors.firstName && (
              <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Votre nom"
            />
            {errors.lastName && (
              <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="organizationName">Organisation</Label>
          <Input
            id="organizationName"
            {...register('organizationName')}
            placeholder="Nom de votre organisation"
          />
          {errors.organizationName && (
            <p className="text-sm text-destructive mt-1">{errors.organizationName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="website">Site web</Label>
          <Input
            id="website"
            {...register('website')}
            placeholder="https://www.exemple.com"
            type="url"
          />
          {errors.website && (
            <p className="text-sm text-destructive mt-1">{errors.website.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Description de votre organisation ou de votre activité"
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
          )}
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
            Sauvegarder les modifications
          </>
        )}
      </Button>
    </form>
  );
};