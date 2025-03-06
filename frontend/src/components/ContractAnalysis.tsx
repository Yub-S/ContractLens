import React, { useState } from 'react';
import { Check, X, MessageSquare, ChevronDown, ChevronUp, Send, Edit2, ArrowLeft, Mail } from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import type { Clause } from '../types';
import { generateNegotiationEmail } from '../lib/api';

export const ContractAnalysis = ({ clauses }: { clauses: Clause[] }) => {
  const [expandedClause, setExpandedClause] = useState<string | null>(null);
  const [counterText, setCounterText] = useState<{ [key: string]: string }>({});
  const [showChat, setShowChat] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [clauseStatuses, setClauseStatuses] = useState<{[key: string]: { status: 'pending' | 'accepted' | 'rejected' | 'countered', counter?: string }}>({});
  const [editingCounter, setEditingCounter] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState<string | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  const handleClauseAction = (id: string, status: 'accepted' | 'rejected' | 'countered', counter?: string) => {
    setClauseStatuses(prev => ({
      ...prev,
      [id]: { status, counter }
    }));

    if (status !== 'countered') {
      setCounterText(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      setEditingCounter(null);
    }
  };

  const handleCounter = (id: string) => {
    if (counterText[id]?.trim()) {
      handleClauseAction(id, 'countered', counterText[id]);
      setEditingCounter(null);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'countered':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const generateEmailContent = async () => {
    const accepted = clauses.filter(c => clauseStatuses[c.id]?.status === 'accepted');
    const rejected = clauses.filter(c => clauseStatuses[c.id]?.status === 'rejected');
    const countered = clauses.filter(c => clauseStatuses[c.id]?.status === 'countered');

    const acceptedText = accepted.map(c => `${c.title}: ${c.content}`).join('\n');
    const rejectedText = rejected.map(c => `${c.title}: ${c.content}`).join('\n');
    const counteredText = countered
    .map(c => `${c.title}:\nOriginal: ${c.content}\nMeaning: ${c.meaning}\nCounter: ${clauseStatuses[c.id].counter}`)
    .join('\n\n');  

    setIsGeneratingEmail(true);
    try {
      const email = await generateNegotiationEmail(acceptedText, rejectedText, counteredText);
      setEmailContent(email);
    } catch (error) {
      console.error('Error generating email:', error);
      setEmailContent('Failed to generate email. Please try again.');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleFinalize = async () => {
    await generateEmailContent();
    setShowSummary(true);
  };

  const handleSendEmail = () => {
    if (!emailContent) return;
    const subject = 'Contract Review Response';
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailContent)}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Contract Analysis</h2>
        <div className="space-x-4">
          <button
            onClick={() => setShowChat(prev => !prev)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {showChat ? 'Close Chat' : 'Chat with AI'}
          </button>
          {!showSummary ? (
            <button
              onClick={handleFinalize}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              disabled={isGeneratingEmail}
            >
              <Send className="h-4 w-4 mr-2" />
              {isGeneratingEmail ? 'Generating...' : 'Finalize Contract'}
            </button>
          ) : (
            <button
              onClick={() => setShowSummary(false)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analysis
            </button>
          )}
        </div>
      </div>

      {!showSummary ? (
        <div className="space-y-6">
          {clauses.map((clause) => (
            <div key={clause.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedClause(expandedClause === clause.id ? null : clause.id)}
              >
                <div className="flex items-center space-x-3">
                  {clauseStatuses[clause.id]?.status && (
                    <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
                      clauseStatuses[clause.id].status === 'accepted' ? 'bg-green-500' :
                      clauseStatuses[clause.id].status === 'rejected' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`} />
                  )}
                  <h3 className="text-lg font-medium text-gray-900">{clause.title}</h3>
                </div>
                <div className="flex items-center space-x-4">
                  {clauseStatuses[clause.id]?.status && (
                    <span className={`text-sm font-medium ${getStatusColor(clauseStatuses[clause.id].status)}`}>
                      {clauseStatuses[clause.id].status === 'accepted' ? 'Accepted' :
                       clauseStatuses[clause.id].status === 'rejected' ? 'Rejected' :
                       'Countered'}
                    </span>
                  )}
                  {expandedClause === clause.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
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
                    
                    {clauseStatuses[clause.id]?.status === 'countered' && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-blue-900">Your Counter Proposal:</h4>
                          <button
                            onClick={() => setEditingCounter(clause.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-blue-800">{clauseStatuses[clause.id].counter}</p>
                      </div>
                    )}
                    
                    <div className="mt-6 flex items-center space-x-4">
                      <button
                        onClick={() => handleClauseAction(clause.id, 'accepted')}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          clauseStatuses[clause.id]?.status === 'accepted'
                            ? 'bg-green-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleClauseAction(clause.id, 'rejected')}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          clauseStatuses[clause.id]?.status === 'rejected'
                            ? 'bg-red-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          setCounterText(prev => ({ 
                            ...prev, 
                            [clause.id]: clauseStatuses[clause.id]?.counter || '' 
                          }));
                          setEditingCounter(clause.id);
                        }}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          clauseStatuses[clause.id]?.status === 'countered'
                            ? 'bg-blue-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Counter
                      </button>
                    </div>
                    
                    {editingCounter === clause.id && (
                      <div className="mt-4">
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          rows={4}
                          placeholder="Type your counter proposal..."
                          value={counterText[clause.id] || ''}
                          onChange={(e) => setCounterText({ ...counterText, [clause.id]: e.target.value })}
                        />
                        <button
                          onClick={() => handleCounter(clause.id)}
                          className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
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
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contract Review Summary</h2>
          
          <div className="prose max-w-none">
            {isGeneratingEmail ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3">Generating email content...</span>
              </div>
            ) : (
              <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto">
                {emailContent}
              </pre>
            )}
          </div>
          
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => navigator.clipboard.writeText(emailContent || '')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              disabled={!emailContent || isGeneratingEmail}
            >
              <Check className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </button>
            <button
              onClick={handleSendEmail}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              disabled={!emailContent || isGeneratingEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </button>
          </div>
        </div>
      )}

      {showChat && <ChatInterface />}
    </div>
  );
};