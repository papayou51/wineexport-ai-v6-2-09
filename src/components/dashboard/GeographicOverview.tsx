import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface GeographicOverviewProps {
  topCountries: Array<{
    code: string;
    name: string;
    projectCount: number;
    analysisCount: number;
  }>;
}

export const GeographicOverview = ({ topCountries }: GeographicOverviewProps) => {
  const maxActivity = Math.max(...topCountries.map(c => c.projectCount + c.analysisCount));

  const getFlagEmoji = (countryCode: string) => {
    const flags: Record<string, string> = {
      'FR': '🇫🇷',
      'DE': '🇩🇪', 
      'GB': '🇬🇧',
      'ES': '🇪🇸',
      'IT': '🇮🇹',
      'US': '🇺🇸',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'JP': '🇯🇵',
      'CN': '🇨🇳'
    };
    return flags[countryCode] || '🌍';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Aperçu Géographique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topCountries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucun marché ciblé pour le moment</p>
          </div>
        ) : (
          <>
            {/* Top marchés */}
            <div className="space-y-3">
              {topCountries.map((country, index) => {
                const totalActivity = country.projectCount + country.analysisCount;
                const activityPercentage = maxActivity > 0 ? (totalActivity / maxActivity) * 100 : 0;
                
                return (
                  <div key={country.code} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getFlagEmoji(country.code)}</span>
                        <div>
                          <span className="font-medium">{country.name}</span>
                          {index === 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Top marché
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">{totalActivity} activités</div>
                        <div className="text-muted-foreground">
                          {country.projectCount}p • {country.analysisCount}a
                        </div>
                      </div>
                    </div>
                    <Progress value={activityPercentage} className="h-2" />
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t text-center">
              <div className="text-sm text-muted-foreground">
                p = projets • a = analyses
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};