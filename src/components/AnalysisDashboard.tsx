import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileDown, Share2, TrendingUp, Shield, Users, BarChart } from "lucide-react";
import { usePDFExport } from "@/hooks/usePDFExport";
import { Analysis } from '@/hooks/useAnalyses';
import { MarketAnalysisTab } from '@/components/analysis-tabs/MarketAnalysisTab';
import { RegulatoryAnalysisTab } from '@/components/analysis-tabs/RegulatoryAnalysisTab';
import { LeadGenerationTab } from '@/components/analysis-tabs/LeadGenerationTab';
import { MarketingIntelligenceTab } from '@/components/analysis-tabs/MarketingIntelligenceTab';

interface AnalysisDashboardProps {
  projectId: string;
  countryCode: string;
  analyses: Analysis[];
  projectName?: string;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  projectId,
  countryCode,
  analyses,
  projectName = "Analyse de projet"
}) => {
  const pdfExport = usePDFExport();
  const getAnalysisByType = (type: Analysis['analysis_type']) => {
    return analyses.find(a => a.analysis_type === type);
  };

  const getTabStatus = (type: Analysis['analysis_type']) => {
    const analysis = getAnalysisByType(type);
    return analysis ? 'completed' : 'missing';
  };

  const getTabIcon = (type: Analysis['analysis_type']) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'market_study':
        return <TrendingUp className={iconClass} />;
      case 'regulatory_analysis':
        return <Shield className={iconClass} />;
      case 'lead_generation':
        return <Users className={iconClass} />;
      case 'marketing_intelligence':
        return <BarChart className={iconClass} />;
      default:
        return null;
    }
  };

  const getTabLabel = (type: Analysis['analysis_type']) => {
    switch (type) {
      case 'market_study':
        return 'Marché';
      case 'regulatory_analysis':
        return 'Réglementation';
      case 'lead_generation':
        return 'Leads';
      case 'marketing_intelligence':
        return 'Marketing';
      default:
        return type;
    }
  };

  const TabTriggerWithStatus = ({ type }: { type: Analysis['analysis_type'] }) => {
    const status = getTabStatus(type);
    const analysis = getAnalysisByType(type);
    
    return (
      <TabsTrigger value={type} className="gap-2 relative">
        {getTabIcon(type)}
        {getTabLabel(type)}
        {status === 'completed' && (
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            ✓
          </Badge>
        )}
        {analysis?.confidence_score && (
          <span className="text-xs text-muted-foreground ml-1">
            ({Math.round(analysis.confidence_score * 100)}%)
          </span>
        )}
      </TabsTrigger>
    );
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Tableau de bord - {countryCode}
            </CardTitle>
            <CardDescription>
              Résultats détaillés de toutes les analyses réalisées
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => pdfExport.mutate({ projectId, countryCode, analyses, projectName })}
              disabled={pdfExport.isPending}
            >
              <FileDown className="h-4 w-4" />
              {pdfExport.isPending ? 'Export...' : 'Export PDF'}
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Partager
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="market_study" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabTriggerWithStatus type="market_study" />
            <TabTriggerWithStatus type="regulatory_analysis" />
            <TabTriggerWithStatus type="lead_generation" />
            <TabTriggerWithStatus type="marketing_intelligence" />
          </TabsList>

          <TabsContent value="market_study">
            <MarketAnalysisTab 
              analysis={getAnalysisByType('market_study')}
              countryCode={countryCode}
            />
          </TabsContent>

          <TabsContent value="regulatory_analysis">
            <RegulatoryAnalysisTab 
              analysis={getAnalysisByType('regulatory_analysis')}
              countryCode={countryCode}
            />
          </TabsContent>

          <TabsContent value="lead_generation">
            <LeadGenerationTab 
              analysis={getAnalysisByType('lead_generation')}
              projectId={projectId}
              countryCode={countryCode}
            />
          </TabsContent>

          <TabsContent value="marketing_intelligence">
            <MarketingIntelligenceTab 
              analysis={getAnalysisByType('marketing_intelligence')}
              countryCode={countryCode}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};