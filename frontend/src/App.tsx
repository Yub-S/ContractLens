import React, { useState } from 'react';
import { Header } from './components/Header';
import { Landing } from './components/Landing';
import { ContractAnalysis } from './components/ContractAnalysis';

function App() {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [clauses, setClauses] = useState<Clause[]>([]);

  const handleAnalysisComplete = (analyzedClauses: Clause[]) => {
    setClauses(analyzedClauses);
    setShowAnalysis(true);
  };

  const handleBackToLanding = () => {
    setShowAnalysis(false);
    setClauses([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onBack={showAnalysis ? handleBackToLanding : undefined} />
      
      <main className="py-10">
        {!showAnalysis ? (
          <Landing onAnalysisComplete={handleAnalysisComplete} />
        ) : (
          <ContractAnalysis clauses={clauses} />
        )}
      </main>
    </div>
  );
}

export default App;