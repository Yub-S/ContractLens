import React, { useState, useEffect } from 'react';
import { FileText, Upload } from 'lucide-react';
import type { Clause } from '../types';
import { processContract } from '../lib/api';
import * as pdfjs from 'pdfjs-dist';
import { getDocument } from 'pdfjs-dist/build/pdf';

// Set worker path
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export const Landing = ({ onAnalysisComplete }: { onAnalysisComplete: (clauses: Clause[]) => void }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = getDocument(new Uint8Array(arrayBuffer));
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      // Clean up the extracted text
      fullText = fullText
      .replace(/[ ]+/g, ' ')       // Replace multiple spaces with a single space
      .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines with two newlines
      .trim();                     // Remove leading/trailing whitespace
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setFileName(file.name);
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Extract text from PDF
      const contractText = await extractTextFromPDF(file);
      
      // For debugging - remove in production
      console.log('Extracted text:', contractText);
      
      // Send to backend for analysis
      const clauses = await processContract(contractText);
      onAnalysisComplete(clauses);
    } catch (error) {
      console.error('Error processing contract:', error);
      setError('Failed to process the contract. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
        
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload your legal contracts and get instant analysis, insights, and negotiation suggestions powered by AI.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        {!isAnalyzing ? (
          <>
            <FileText className="mx-auto h-16 w-16 text-indigo-600 mb-6" />
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                Start Your Contract Analysis
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Upload your contract in PDF format and let our AI analyze it for you.
              </p>
              {error && (
                <p className="text-red-600 mt-2">{error}</p>
              )}
              <label className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 mr-2" />
                Upload Contract
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </>
        ) : (
          <div className="py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-medium text-gray-900">Analyzing your contract...</h3>
            <p className="text-gray-600 mt-2">{fileName}</p>
          </div>
        )}
      </div>
    </div>
  );
};