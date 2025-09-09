import { TestRunner } from '@/components/TestRunner';

const Testing = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Tests de Validation</h1>
          <p className="text-muted-foreground">
            Suite de tests end-to-end pour valider les fonctionnalités critiques de WineExport AI
          </p>
        </div>
        
        <TestRunner />
      </div>
    </div>
  );
};

export default Testing;