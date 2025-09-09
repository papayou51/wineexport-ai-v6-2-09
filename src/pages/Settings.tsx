import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfileForm } from "@/components/settings/UserProfileForm";
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";
import { PreferencesForm } from "@/components/settings/PreferencesForm";
import { DataSecurityTab } from "@/components/settings/DataSecurityTab";
import { SecurityNotificationsTab } from "@/components/settings/SecurityNotificationsTab";
import { GeographicSecurityTab } from "@/components/settings/GeographicSecurityTab";
import { TrustedDevicesTab } from "@/components/settings/TrustedDevicesTab";
import { SecurityIncidentsTab } from "@/components/settings/SecurityIncidentsTab";
import { SecuritySystemTest } from "@/components/settings/SecuritySystemTest";
import { SecurityStatus } from "@/components/SecurityStatus";
import { User, Lock, Settings as SettingsIcon, Database, Bell, Shield } from "lucide-react";

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles, préférences et sécurité
        </p>
      </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Préférences
            </TabsTrigger>
            <TabsTrigger value="advanced-security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sécurité+
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Données
            </TabsTrigger>
          </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Modifiez vos informations de profil et votre organisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserProfileForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <SecurityStatus />
          
          <Card>
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
              <CardDescription>
                Mettez à jour votre mot de passe pour sécuriser votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordChangeForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <SecurityNotificationsTab />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Préférences</CardTitle>
              <CardDescription>
                Personnalisez votre expérience utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PreferencesForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced-security" className="mt-6 space-y-6">
          <SecuritySystemTest />
          <GeographicSecurityTab />
          <TrustedDevicesTab />
          <SecurityIncidentsTab />
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <DataSecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;