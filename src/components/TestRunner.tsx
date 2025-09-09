import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, RotateCcw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { allE2EScenarios, executeE2EScenario, E2ETestScenario } from '@/tests/e2e-scenarios';

interface TestResult {
  scenario: E2ETestScenario;
  success: boolean;
  duration: number;
  error?: string;
  timestamp: number;
}

export const TestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);

  // Exécuter tous les tests
  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const totalTests = allE2EScenarios.length;
    
    for (let i = 0; i < allE2EScenarios.length; i++) {
      const scenario = allE2EScenarios[i];
      setCurrentTest(scenario.name);
      
      try {
        const result = await executeE2EScenario(scenario);
        
        setResults(prev => [...prev, {
          scenario,
          success: result.success,
          duration: result.totalDuration,
          error: result.success ? undefined : 'Test failed',
          timestamp: Date.now()
        }]);
      } catch (error) {
        setResults(prev => [...prev, {
          scenario,
          success: false,
          duration: 0,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now()
        }]);
      }
      
      setProgress(((i + 1) / totalTests) * 100);
    }

    setIsRunning(false);
    setCurrentTest('');
  }, []);

  // Exécuter un test spécifique
  const runSingleTest = useCallback(async (scenario: E2ETestScenario) => {
    setIsRunning(true);
    setCurrentTest(scenario.name);

    try {
      const result = await executeE2EScenario(scenario);
      
      setResults(prev => [
        ...prev.filter(r => r.scenario.id !== scenario.id),
        {
          scenario,
          success: result.success,
          duration: result.totalDuration,
          error: result.success ? undefined : 'Test failed',
          timestamp: Date.now()
        }
      ]);
    } catch (error) {
      setResults(prev => [
        ...prev.filter(r => r.scenario.id !== scenario.id),
        {
          scenario,
          success: false,
          duration: 0,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now()
        }
      ]);
    }

    setIsRunning(false);
    setCurrentTest('');
  }, []);

  // Réinitialiser les résultats
  const resetResults = useCallback(() => {
    setResults([]);
    setProgress(0);
  }, []);

  // Calculer les statistiques
  const stats = {
    total: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    avgDuration: results.length > 0 
      ? results.reduce((sum, r) => sum + r.duration, 0) / results.length 
      : 0,
    successRate: results.length > 0 
      ? (results.filter(r => r.success).length / results.length) * 100 
      : 0
  };

  const getScenarioResult = (scenario: E2ETestScenario) => {
    return results.find(r => r.scenario.id === scenario.id);
  };

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tests End-to-End WineExport AI</CardTitle>
              <p className="text-muted-foreground">
                Validation complète des workflows critiques
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Lancer tous les tests
              </Button>
              <Button 
                onClick={resetResults} 
                variant="outline"
                size="sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardHeader>

        {isRunning && (
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Test en cours: {currentTest}</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Statistiques */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-muted-foreground">Tests exécutés</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
              <div className="text-muted-foreground">Succès</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-muted-foreground">Échecs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.successRate.toFixed(0)}%</div>
              <div className="text-muted-foreground">Taux de succès</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des scénarios */}
      <Card>
        <CardHeader>
          <CardTitle>Scénarios de test</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {allE2EScenarios.map((scenario) => {
                const result = getScenarioResult(scenario);
                
                return (
                  <div 
                    key={scenario.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{scenario.name}</span>
                        {scenario.criticalPath && (
                          <Badge variant="destructive" className="text-xs">
                            Critique
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {scenario.description}
                      </p>
                      {result && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {result.duration.toFixed(0)}ms
                          {result.error && (
                            <>
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                              {result.error}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {result && (
                        <div className="flex items-center">
                          {result.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runSingleTest(scenario)}
                        disabled={isRunning}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Test
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Résultats détaillés */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats détaillés</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {results.map((result) => (
                  <div 
                    key={`${result.scenario.id}-${result.timestamp}`}
                    className={`p-3 border rounded-lg ${
                      result.success 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.scenario.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? 'SUCCÈS' : 'ÉCHEC'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {result.duration.toFixed(0)}ms
                        </span>
                      </div>
                    </div>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-1">{result.error}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};