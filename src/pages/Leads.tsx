import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectLeads, Lead } from '@/hooks/useLeads';
import { useProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { QuickTooltip } from '@/components/ui/tooltip-enhanced';
import { useComponentPerformance } from '@/hooks/usePerformanceMonitoring';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ArrowLeft, Mail, Phone, Globe, Star, Users, Search, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Leads = () => {
  useComponentPerformance('Leads');
  const { handleError } = useErrorHandler();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project } = useProject(id!);
  const { data: leads, isLoading } = useProjectLeads(id!);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.contact_status === statusFilter;
    const matchesCountry = selectedCountry === 'all' || lead.country_code === selectedCountry;
    
    return matchesSearch && matchesStatus && matchesCountry;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'variant-secondary';
      case 'contacted': return 'variant-outline';
      case 'interested': return 'variant-secondary';
      case 'qualified': return 'variant-default';
      case 'converted': return 'variant-secondary';
      case 'lost': return 'variant-destructive';
      default: return 'variant-secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nouveau';
      case 'contacted': return 'Contacté';
      case 'interested': return 'Intéressé';
      case 'qualified': return 'Qualifié';
      case 'converted': return 'Converti';
      case 'lost': return 'Perdu';
      default: return status;
    }
  };

  const uniqueCountries = [...new Set(leads?.map(lead => lead.country_code) || [])];

  const getLeadStats = () => {
    if (!leads) return { total: 0, qualified: 0, converted: 0, avgScore: 0 };
    
    const total = leads.length;
    const qualified = leads.filter(l => l.contact_status === 'qualified').length;
    const converted = leads.filter(l => l.contact_status === 'converted').length;
    const avgScore = leads.reduce((sum, l) => sum + (l.qualification_score || 0), 0) / total;
    
    return { total, qualified, converted, avgScore: Math.round(avgScore * 10) / 10 };
  };

  const stats = getLeadStats();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSkeleton variant="list" count={8} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/projects/${id}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au projet
        </Button>
      </div>

      {/* Project Info */}
      {project && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leads pour {project.name}
            </CardTitle>
            <CardDescription>
              Prospects et partenaires potentiels identifiés pour votre projet
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total des leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.qualified}</div>
            <p className="text-xs text-muted-foreground">Leads qualifiés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
            <p className="text-xs text-muted-foreground">Convertis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.avgScore}</div>
            <p className="text-xs text-muted-foreground">Score moyen</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, contact ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="new">Nouveau</SelectItem>
                  <SelectItem value="contacted">Contacté</SelectItem>
                  <SelectItem value="interested">Intéressé</SelectItem>
                  <SelectItem value="qualified">Qualifié</SelectItem>
                  <SelectItem value="converted">Converti</SelectItem>
                  <SelectItem value="lost">Perdu</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {uniqueCountries.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="space-y-4">
        {filteredLeads && filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{lead.company_name}</h3>
                        {lead.contact_person && (
                          <p className="text-muted-foreground">{lead.contact_person}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline">
                            {getStatusLabel(lead.contact_status)}
                          </Badge>
                          <Badge variant="outline">{lead.country_code}</Badge>
                          {lead.qualification_score && (
                            <Badge variant="outline" className="gap-1">
                              <Star className="h-3 w-3" />
                              {lead.qualification_score}/100
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {lead.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" 
                             className="text-primary hover:underline">
                            {lead.website}
                          </a>
                        </div>
                      )}
                    </div>

                    {lead.business_focus && lead.business_focus.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Secteurs d'activité :</p>
                        <div className="flex flex-wrap gap-1">
                          {lead.business_focus.map((focus, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {focus}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {lead.annual_volume && (
                      <p className="text-sm">
                        <span className="font-medium">Volume annuel :</span> {lead.annual_volume.toLocaleString()} unités
                      </p>
                    )}

                    {lead.price_range && (
                      <p className="text-sm">
                        <span className="font-medium">Gamme de prix :</span> {lead.price_range}
                      </p>
                    )}

                    {lead.notes && (
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="text-sm">{lead.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <QuickTooltip text="Envoyer un email" shortcut="Ctrl+E">
                      <Button size="sm" variant="outline">
                        Contacter
                      </Button>
                    </QuickTooltip>
                    <QuickTooltip text="Voir les détails complets">
                      <Button size="sm" variant="ghost">
                        Détails
                      </Button>
                    </QuickTooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun lead trouvé</h3>
              <p className="text-muted-foreground">
                {leads?.length === 0 
                  ? "Aucun lead n'a encore été généré pour ce projet" 
                  : "Aucun lead ne correspond aux filtres sélectionnés"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Leads;