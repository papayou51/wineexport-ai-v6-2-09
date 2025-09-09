import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, countryCode, analyses, projectName, format } = await req.json()
    
    console.log('Generating PDF report for:', { projectId, countryCode, format })
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )
    
    // Generate the professional HTML content
    const htmlContent = await generateProfessionalPDF({
      projectName,
      countryCode,
      analyses,
      format: format || 'professional'
    })
    
    // In production, you would use Puppeteer here to convert HTML to PDF
    // For now, we'll return a styled HTML that can be saved as PDF by the browser
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `WineExport-Analysis-${countryCode}-${timestamp}.html`
    
    // Store the generated report (could be extended to use Supabase Storage)
    const reportData = {
      project_id: projectId,
      country_code: countryCode,
      generated_at: new Date().toISOString(),
      format: format || 'professional',
      file_name: fileName
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        htmlContent,
        fileName,
        downloadUrl: `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
        metadata: reportData
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function generateProfessionalPDF({ projectName, countryCode, analyses, format }: {
  projectName: string
  countryCode: string
  analyses: any[]
  format: string
}) {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const completedAnalyses = analyses.length
  const totalAnalyses = 4
  const completionRate = Math.round((completedAnalyses / totalAnalyses) * 100)
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WineExport AI - Rapport d'Analyse ${countryCode}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    :root {
      --wine-deep: #3d1a1a;
      --wine-medium: #5d2a2a;
      --gold: #d4af37;
      --gold-light: #f4e5a1;
      --background: #faf8f4;
      --card-bg: #ffffff;
      --text-primary: #2c1810;
      --text-secondary: #6b5b4f;
      --border: #e8e3db;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: var(--text-primary);
      background: var(--background);
      font-size: 14px;
    }
    
    .document {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      min-height: 297mm;
    }
    
    /* Cover Page */
    .cover {
      height: 297mm;
      background: linear-gradient(135deg, var(--wine-deep) 0%, var(--wine-medium) 50%, var(--gold) 100%);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40mm;
      position: relative;
      page-break-after: always;
    }
    
    .cover::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="wine" patternUnits="userSpaceOnUse" width="20" height="20"><circle cx="10" cy="10" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23wine)"/></svg>');
    }
    
    .cover-content {
      position: relative;
      z-index: 2;
    }
    
    .logo {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 2rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .cover-title {
      font-size: 2.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      line-height: 1.2;
    }
    
    .cover-subtitle {
      font-size: 1.5rem;
      font-weight: 400;
      margin-bottom: 3rem;
      opacity: 0.9;
    }
    
    .cover-meta {
      background: rgba(255,255,255,0.15);
      padding: 2rem;
      border-radius: 15px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    }
    
    .cover-meta p {
      font-size: 1.1rem;
      margin: 0.5rem 0;
    }
    
    /* Content Pages */
    .page {
      padding: 20mm;
      min-height: 257mm;
      page-break-after: always;
    }
    
    .page-header {
      border-bottom: 3px solid var(--gold);
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    
    .page-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--wine-deep);
      margin-bottom: 0.5rem;
    }
    
    .page-subtitle {
      color: var(--text-secondary);
      font-size: 1.1rem;
    }
    
    /* Executive Summary */
    .executive-summary {
      background: linear-gradient(135deg, var(--gold-light), #ffffff);
      padding: 2rem;
      border-radius: 15px;
      border: 1px solid var(--border);
      margin-bottom: 2rem;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin: 2rem 0;
    }
    
    .stat-card {
      background: var(--card-bg);
      padding: 1.5rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--wine-deep);
      line-height: 1;
    }
    
    .stat-label {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }
    
    /* Analysis Sections */
    .analysis-section {
      background: var(--card-bg);
      border-radius: 15px;
      padding: 2rem;
      margin-bottom: 2rem;
      border: 1px solid var(--border);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--gold);
    }
    
    .section-icon {
      width: 50px;
      height: 50px;
      background: var(--wine-deep);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;
      color: white;
      font-size: 1.5rem;
    }
    
    .section-title {
      font-size: 1.8rem;
      font-weight: 600;
      color: var(--wine-deep);
    }
    
    .analysis-content {
      line-height: 1.8;
      color: var(--text-primary);
    }
    
    .analysis-content h3 {
      color: var(--wine-medium);
      font-size: 1.3rem;
      margin: 1.5rem 0 1rem 0;
      font-weight: 600;
    }
    
    .analysis-content ul {
      margin: 1rem 0;
      padding-left: 2rem;
    }
    
    .analysis-content li {
      margin: 0.8rem 0;
      position: relative;
    }
    
    .analysis-content li::marker {
      color: var(--gold);
    }
    
    .highlight-box {
      background: linear-gradient(135deg, var(--gold-light), #ffffff);
      padding: 1.5rem;
      border-radius: 10px;
      margin: 1.5rem 0;
      border-left: 5px solid var(--gold);
    }
    
    .recommendation {
      background: linear-gradient(135deg, #e8f4f8, #ffffff);
      padding: 1.5rem;
      border-radius: 10px;
      margin: 1.5rem 0;
      border-left: 5px solid #4a90e2;
    }
    
    .warning {
      background: linear-gradient(135deg, #fff4e6, #ffffff);
      padding: 1.5rem;
      border-radius: 10px;
      margin: 1.5rem 0;
      border-left: 5px solid #ff8c00;
    }
    
    /* Footer */
    .document-footer {
      text-align: center;
      padding: 2rem;
      margin-top: 3rem;
      border-top: 2px solid var(--border);
      color: var(--text-secondary);
    }
    
    .footer-logo {
      font-weight: 700;
      color: var(--wine-deep);
      margin-bottom: 0.5rem;
    }
    
    /* Print Styles */
    @media print {
      body { font-size: 12px; }
      .document { max-width: none; margin: 0; }
      .page { page-break-after: always; min-height: auto; }
      .cover { page-break-after: always; }
      .analysis-section { page-break-inside: avoid; }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .cover { padding: 20mm; }
      .page { padding: 15mm; }
      .cover-title { font-size: 2rem; }
      .stats-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="document">
    <!-- Cover Page -->
    <div class="cover">
      <div class="cover-content">
        <div class="logo">🍷 WineExport AI</div>
        <h1 class="cover-title">Analyse Stratégique d'Export</h1>
        <h2 class="cover-subtitle">${projectName}</h2>
        <div class="cover-meta">
          <p><strong>Marché cible:</strong> ${countryCode}</p>
          <p><strong>Date de génération:</strong> ${currentDate}</p>
          <p><strong>Analyses complétées:</strong> ${completedAnalyses}/${totalAnalyses} (${completionRate}%)</p>
          <p><strong>Type de rapport:</strong> Analyse complète Cas 1</p>
        </div>
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Résumé Exécutif</h1>
        <p class="page-subtitle">Vue d'ensemble stratégique pour l'export vers ${countryCode}</p>
      </div>
      
      <div class="executive-summary">
        <h2 style="color: var(--wine-deep); margin-bottom: 1rem;">Synthèse de l'analyse</h2>
        <p style="font-size: 1.1rem; line-height: 1.7;">
          Ce rapport présente une analyse complète des opportunités d'export pour <strong>${projectName}</strong> 
          sur le marché <strong>${countryCode}</strong>. Notre analyse couvre quatre dimensions stratégiques 
          essentielles : l'étude de marché approfondie, l'analyse réglementaire détaillée, la génération 
          de leads qualifiés et les recommandations d'intelligence marketing.
        </p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${completedAnalyses}</div>
          <div class="stat-label">Analyses Réalisées</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${completionRate}%</div>
          <div class="stat-label">Taux de Completion</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${analyses.reduce((sum, a) => sum + (a.leads?.length || 0), 0)}</div>
          <div class="stat-label">Leads Générés</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${Math.round(analyses.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / Math.max(analyses.length, 1) * 100)}%</div>
          <div class="stat-label">Confiance Moyenne</div>
        </div>
      </div>
      
      ${analyses.length > 0 ? `
        <div class="highlight-box">
          <h3 style="margin-top: 0;">Recommandations Clés</h3>
          <ul>
            <li><strong>Potentiel de marché:</strong> ${countryCode} présente des opportunités significatives pour l'export de produits vinicoles</li>
            <li><strong>Conformité réglementaire:</strong> Plusieurs exigences spécifiques ont été identifiées pour l'importation</li>
            <li><strong>Réseau de distribution:</strong> ${analyses.find(a => a.analysis_type === 'lead_generation')?.leads?.length || 0} distributeurs potentiels qualifiés</li>
            <li><strong>Stratégie marketing:</strong> Approche personnalisée recommandée selon les spécificités locales</li>
          </ul>
        </div>
      ` : ''}
    </div>

    <!-- Analysis Sections -->
    ${analyses.map(analysis => `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">${getAnalysisTypeLabel(analysis.analysis_type)}</h1>
          <p class="page-subtitle">Analyse détaillée - ${countryCode}</p>
        </div>
        
        <div class="analysis-section">
          <div class="section-header">
            <div class="section-icon">${getAnalysisIcon(analysis.analysis_type)}</div>
            <h2 class="section-title">${getAnalysisTypeLabel(analysis.analysis_type)}</h2>
          </div>
          <div class="analysis-content">
            ${formatProfessionalAnalysisResults(analysis)}
          </div>
        </div>
      </div>
    `).join('')}

    <!-- Conclusion -->
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Conclusion & Prochaines Étapes</h1>
        <p class="page-subtitle">Plan d'action recommandé</p>
      </div>
      
      <div class="analysis-section">
        <h3>Synthèse Finale</h3>
        <p>L'analyse complète du marché ${countryCode} révèle un potentiel d'export prometteur pour ${projectName}. 
           Les données collectées permettent d'établir une stratégie d'approche structurée et adaptée aux 
           spécificités locales.</p>
        
        <div class="recommendation">
          <h3>Plan d'Action Recommandé</h3>
          <ol>
            <li><strong>Phase 1 - Préparation:</strong> Mise en conformité réglementaire et adaptation des produits</li>
            <li><strong>Phase 2 - Prospection:</strong> Prise de contact avec les distributeurs qualifiés identifiés</li>
            <li><strong>Phase 3 - Négociation:</strong> Établissement des partenariats commerciaux</li>
            <li><strong>Phase 4 - Lancement:</strong> Déploiement de la stratégie marketing adaptée</li>
          </ol>
        </div>
        
        <div class="highlight-box">
          <h3>Indicateurs de Succès</h3>
          <ul>
            <li>Première commande obtenue dans les 6 mois</li>
            <li>3 distributeurs partenaires actifs dans l'année</li>
            <li>Chiffre d'affaires export représentant 15% du CA total</li>
          </ul>
        </div>
      </div>
      
      <div class="document-footer">
        <div class="footer-logo">WineExport AI</div>
        <p>Rapport généré le ${currentDate} - Votre partenaire intelligent pour l'export vinicole</p>
        <p style="font-size: 0.8rem; margin-top: 0.5rem;">
          Ce rapport a été généré automatiquement par notre système d'intelligence artificielle. 
          Pour toute question, contactez notre équipe d'experts.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

function getAnalysisTypeLabel(type: string): string {
  switch (type) {
    case 'market_study':
      return 'Étude de Marché'
    case 'regulatory_analysis':
      return 'Analyse Réglementaire'
    case 'lead_generation':
      return 'Génération de Leads'
    case 'marketing_intelligence':
      return 'Intelligence Marketing'
    default:
      return type
  }
}

function getAnalysisIcon(type: string): string {
  switch (type) {
    case 'market_study':
      return '📈'
    case 'regulatory_analysis':
      return '🛡️'
    case 'lead_generation':
      return '👥'
    case 'marketing_intelligence':
      return '📊'
    default:
      return '📋'
  }
}

function formatProfessionalAnalysisResults(analysis: any): string {
  const results = analysis.results || {}
  
  switch (analysis.analysis_type) {
    case 'market_study':
      return `
        <h3>Aperçu du Marché</h3>
        <p><strong>Taille du marché:</strong> ${results.market_size || 'Données en cours d\'analyse'}</p>
        <p><strong>Croissance annuelle:</strong> ${results.growth_rate || 'À déterminer'}</p>
        
        <div class="highlight-box">
          <h3>Opportunités Identifiées</h3>
          <ul>
            ${results.opportunities ? results.opportunities.map((opp: string) => `<li>${opp}</li>`).join('') : '<li>Analyse en cours de finalisation</li>'}
          </ul>
        </div>
        
        <h3>Analyse Concurrentielle</h3>
        <p>${results.competitive_analysis || 'Une analyse détaillée de la concurrence locale est disponible dans les données complètes.'}</p>
        
        <div class="recommendation">
          <h3>Recommandations Stratégiques</h3>
          <ul>
            ${results.recommendations ? results.recommendations.map((rec: string) => `<li>${rec}</li>`).join('') : '<li>Recommandations détaillées disponibles dans l\'analyse complète</li>'}
          </ul>
        </div>
      `
    
    case 'regulatory_analysis':
      return `
        <h3>Exigences Réglementaires</h3>
        <p><strong>Conformité requise:</strong> ${results.compliance_requirements || 'Analyse en cours'}</p>
        
        <div class="warning">
          <h3>Points d'Attention Critiques</h3>
          <ul>
            ${results.critical_requirements ? results.critical_requirements.map((req: string) => `<li>${req}</li>`).join('') : '<li>Exigences spécifiques en cours d\'identification</li>'}
          </ul>
        </div>
        
        <h3>Processus d'Importation</h3>
        <p>${results.import_process || 'Le processus détaillé d\'importation est documenté dans l\'analyse complète.'}</p>
        
        <div class="highlight-box">
          <h3>Certifications Nécessaires</h3>
          <ul>
            ${results.required_certifications ? results.required_certifications.map((cert: string) => `<li>${cert}</li>`).join('') : '<li>Liste des certifications en cours de validation</li>'}
          </ul>
        </div>
      `
    
    case 'lead_generation':
      const leadsCount = analysis.leads?.length || 0
      return `
        <h3>Prospects Qualifiés Identifiés</h3>
        <p><strong>Nombre total de leads:</strong> ${leadsCount}</p>
        <p><strong>Score de qualification moyen:</strong> ${results.average_score || 'En cours de calcul'}/100</p>
        
        <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr); margin: 1.5rem 0;">
          <div class="stat-card">
            <div class="stat-number">${analysis.leads?.filter((l: any) => l.qualification_score >= 80).length || 0}</div>
            <div class="stat-label">Leads Premium</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${analysis.leads?.filter((l: any) => l.contact_status === 'qualified').length || 0}</div>
            <div class="stat-label">Leads Qualifiés</div>
          </div>
        </div>
        
        <h3>Distributeurs Prioritaires</h3>
        ${analysis.leads && analysis.leads.length > 0 ? `
          <ul>
            ${analysis.leads.slice(0, 5).map((lead: any) => `
              <li><strong>${lead.company_name}</strong> - Score: ${lead.qualification_score}/100 
                  ${lead.annual_volume ? `- Volume: ${lead.annual_volume.toLocaleString()} L` : ''}</li>
            `).join('')}
          </ul>
        ` : '<p>Les contacts des distributeurs prioritaires sont disponibles dans l\'export CSV.</p>'}
        
        <div class="recommendation">
          <h3>Stratégie de Prospection</h3>
          <p>Une approche personnalisée par segment de distributeur est recommandée, en priorisant les contacts avec les scores de qualification les plus élevés.</p>
        </div>
      `
    
    case 'marketing_intelligence':
      return `
        <h3>Stratégie Marketing Recommandée</h3>
        <p><strong>Positionnement optimal:</strong> ${results.positioning || 'Analyse en cours'}</p>
        
        <div class="highlight-box">
          <h3>Canaux de Distribution Prioritaires</h3>
          <ul>
            ${results.distribution_channels ? results.distribution_channels.map((channel: string) => `<li>${channel}</li>`).join('') : '<li>Analyse des canaux en cours de finalisation</li>'}
          </ul>
        </div>
        
        <h3>Stratégie de Prix</h3>
        <p>${results.pricing_strategy || 'Une stratégie de prix adaptée au marché local a été développée dans l\'analyse complète.'}</p>
        
        <div class="recommendation">
          <h3>Plan Marketing Opérationnel</h3>
          <ul>
            ${results.marketing_actions ? results.marketing_actions.map((action: string) => `<li>${action}</li>`).join('') : '<li>Plan d\'actions marketing détaillé disponible</li>'}
          </ul>
        </div>
        
        <div class="warning">
          <h3>Spécificités Culturelles</h3>
          <p>${results.cultural_considerations || 'Des considérations culturelles spécifiques ont été identifiées pour optimiser l\'approche marketing locale.'}</p>
        </div>
      `
    
    default:
      return `<p>Analyse ${analysis.analysis_type} complétée avec succès. Résultats détaillés disponibles.</p>`
  }
}