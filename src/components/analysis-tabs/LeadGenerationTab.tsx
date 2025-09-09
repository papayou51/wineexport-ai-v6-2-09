import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Download, Search, Filter, ExternalLink, Phone, Mail, Globe, MapPin } from 'lucide-react';
import { Analysis } from '@/hooks/useAnalyses';
import { useProjectLeads } from '@/hooks/useLeads';

interface LeadGenerationTabProps {
  analysis?: Analysis;
  projectId: string;
  countryCode: string;
}

export const LeadGenerationTab: React.FC<LeadGenerationTabProps> = ({
  analysis,
  projectId,
  countryCode,
}) => {
  const { data: leads, isLoading: leadsLoading } = useProjectLeads(projectId);
  
  // Filter leads by country
  const countryLeads = leads?.filter(lead => lead.country_code === countryCode) || [];

  if (!analysis) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Génération de leads non disponible</h3>
            <p className="text-muted-foreground">
              L'analyse de génération de leads pour {countryCode} n'a pas encore été réalisée.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const results = analysis.results || {};
  const statistics = results.statistics || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualified':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'interested':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'contacted':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'new':
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'qualified':
        return 'Qualifié';
      case 'interested':
        return 'Intéressé';
      case 'contacted':
        return 'Contacté';
      case 'new':
        return 'Nouveau';
      default:
        return status;
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Entreprise', 'Contact', 'Email', 'Téléphone', 'Site web', 'Secteur', 'Score', 'Statut'];
    const csvContent = [
      headers.join(','),
      ...countryLeads.map(lead => [
        lead.company_name,
        lead.contact_person || '',
        lead.email || '',
        lead.phone || '',
        lead.website || '',
        lead.business_focus?.join('; ') || '',
        lead.qualification_score || '',
        lead.contact_status
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${countryCode}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total leads</p>
                <p className="text-2xl font-bold">{countryLeads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leads qualifiés</p>
                <p className="text-2xl font-bold">
                  {countryLeads.filter(lead => lead.contact_status === 'qualified').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Users className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score moyen</p>
                <p className="text-2xl font-bold">
                  {countryLeads.length > 0 
                    ? Math.round(countryLeads.reduce((sum, lead) => sum + (lead.qualification_score || 0), 0) / countryLeads.length)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Download className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prêt à exporter</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportCSV}
                  disabled={countryLeads.length === 0}
                  className="mt-1"
                >
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prospects identifiés - {countryCode}</CardTitle>
              <CardDescription>
                Liste des distributeurs et partenaires potentiels
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtrer
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom d'entreprise, secteur..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Leads Table */}
          {leadsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : countryLeads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Secteur d'activité</TableHead>
                  <TableHead>Volume annuel</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countryLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.company_name}</p>
                        {lead.website && (
                          <a 
                            href={lead.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            <Globe className="h-3 w-3" />
                            Site web
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.contact_person && (
                          <p className="text-sm font-medium">{lead.contact_person}</p>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.business_focus && lead.business_focus.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {lead.business_focus.slice(0, 2).map((focus, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {focus}
                              </Badge>
                            ))}
                            {lead.business_focus.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{lead.business_focus.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.annual_volume ? (
                        <span className="font-medium">
                          {lead.annual_volume.toLocaleString()} L
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${getScoreColor(lead.qualification_score)}`}>
                        {lead.qualification_score || '-'}/100
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.contact_status)}>
                        {getStatusLabel(lead.contact_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {lead.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`mailto:${lead.email}`)}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        )}
                        {lead.website && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(lead.website, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun lead trouvé</h3>
              <p className="text-muted-foreground">
                Aucun prospect n'a été identifié pour {countryCode}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Quality Distribution */}
      {countryLeads.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par qualité</CardTitle>
              <CardDescription>Distribution des scores de qualification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { range: '80-100', label: 'Excellent', count: countryLeads.filter(l => (l.qualification_score || 0) >= 80).length, color: 'bg-green-500' },
                  { range: '60-79', label: 'Bon', count: countryLeads.filter(l => (l.qualification_score || 0) >= 60 && (l.qualification_score || 0) < 80).length, color: 'bg-yellow-500' },
                  { range: '40-59', label: 'Moyen', count: countryLeads.filter(l => (l.qualification_score || 0) >= 40 && (l.qualification_score || 0) < 60).length, color: 'bg-orange-500' },
                  { range: '0-39', label: 'Faible', count: countryLeads.filter(l => (l.qualification_score || 0) < 40).length, color: 'bg-red-500' }
                ].map((segment) => (
                  <div key={segment.range} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-3 h-3 rounded-full ${segment.color}`}></div>
                      <span className="font-medium">{segment.label}</span>
                      <span className="text-sm text-muted-foreground">({segment.range})</span>
                    </div>
                    <span className="font-bold">{segment.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statuts de contact</CardTitle>
              <CardDescription>État d'avancement des prises de contact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { status: 'new', label: 'Nouveaux', color: 'bg-gray-500' },
                  { status: 'contacted', label: 'Contactés', color: 'bg-blue-500' },
                  { status: 'interested', label: 'Intéressés', color: 'bg-yellow-500' },
                  { status: 'qualified', label: 'Qualifiés', color: 'bg-green-500' }
                ].map((statusInfo) => {
                  const count = countryLeads.filter(l => l.contact_status === statusInfo.status).length;
                  const percentage = countryLeads.length > 0 ? Math.round((count / countryLeads.length) * 100) : 0;
                  
                  return (
                    <div key={statusInfo.status} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                          <span className="font-medium">{statusInfo.label}</span>
                        </div>
                        <span className="font-bold">{count}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${statusInfo.color}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};