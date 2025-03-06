import React, { useState } from 'react';
import { Check, X, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import type { Clause } from '../types';

export const ClauseAnalysis = ({ 
  clauses,
  onClauseUpdate
}: { 
  clauses: Clause[],
  onClauseUpdate: (id: string, status: 'accepted' | 'rejected', counter?: string) => void 
}) => {
  const [expandedClause, setExpandedClause] = useState<string | null>(null);
  const [counterText, setCounterText] = useState<{ [key: string]: string }>({});

  const handleCounter = (id: string, text: string) => {
    onClauseUpdate(id, 'rejected', text);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      {clauses.map((clause) => (
        <div key={clause.id} className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
          <div
            className="p-4 cursor-pointer flex items-center justify-between"
            onClick={() => setExpandedClause(expandedClause === clause.id ? null : clause.id)}
          >
            <h3 className="text-lg font-medium text-gray-900">{clause.title}</h3>
            {expandedClause === clause.id ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
          
          {expandedClause === clause.id && (
            <div className="p-4 border-t border-gray-200">
              <div className="prose max-w-none">
                <p className="text-gray-700">{clause.content}</p>
                
                <h4 className="text-sm font-medium text-gray-900 mt-4">What this means:</h4>
                <p className="text-gray-600">{clause.meaning}</p>
                
                <h4 className="text-sm font-medium text-gray-900 mt-4">Potential Counters:</h4>
                <ul className="list-disc pl-5 text-gray-600">
                  {clause.potentialCounters.map((counter, index) => (
                    <li key={index}>{counter}</li>
                  ))}
                </ul>
                
                <div className="mt-6 flex items-center space-x-4">
                  <button
                    onClick={() => onClauseUpdate(clause.id, 'accepted')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </button>
                  <button
                    onClick={() => onClauseUpdate(clause.id, 'rejected')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                  <button
                    onClick={() => setCounterText({ ...counterText, [clause.id]: '' })}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Counter
                  </button>
                </div>
                
                {counterText[clause.id] !== undefined && (
                  <div className="mt-4">
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      rows={4}
                      placeholder="Type your counter proposal..."
                      value={counterText[clause.id]}
                      onChange={(e) => setCounterText({ ...counterText, [clause.id]: e.target.value })}
                    />
                    <button
                      onClick={() => handleCounter(clause.id, counterText[clause.id])}
                      className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Submit Counter
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};