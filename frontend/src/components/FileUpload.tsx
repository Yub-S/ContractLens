import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';

export const FileUpload = ({ onAnalysisComplete }: { onAnalysisComplete: (clauses: any[]) => void }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setIsAnalyzing(true);
      
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dummy clauses data
      const dummyClauses = [
        {
          id: '1',
          title: 'Non-Disclosure Agreement',
          content: 'Both parties agree to maintain confidentiality of shared information...',
          meaning: 'This clause prevents both parties from sharing sensitive information with third parties.',
          potentialCounters: [
            'Limit the confidentiality period to 2 years',
            'Exclude publicly available information',
            'Add mutual disclosure rights'
          ],
          status: 'pending'
        },
        {
          id: '2',
          title: 'Termination Clause',
          content: 'Either party may terminate this agreement with 30 days notice...',
          meaning: 'Allows either party to end the contract with proper notice.',
          potentialCounters: [
            'Extend notice period to 60 days',
            'Add specific termination conditions',
            'Include severance terms'
          ],
          status: 'pending'
        }
      ];

      setIsAnalyzing(false);
      onAnalysisComplete(dummyClauses);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      {!isAnalyzing ? (
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                <Upload className="w-5 h-5 mr-2" />
                Upload Contract
              </span>
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                accept=".pdf"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          <p className="mt-2 text-sm text-gray-600">Upload your contract in PDF format</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-900">Analyzing your contract...</p>
          <p className="mt-2 text-sm text-gray-600">This will just take a moment</p>
        </div>
      )}
    </div>
  );
};