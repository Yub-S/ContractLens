import React from 'react';
import { Copy } from 'lucide-react';
import type { Clause } from '../types';

export const Summary = ({ clauses }: { clauses: Clause[] }) => {
  const generateEmailContent = () => {
    const accepted = clauses.filter(c => c.status === 'accepted');
    const rejected = clauses.filter(c => c.status === 'rejected');
    const countered = clauses.filter(c => c.counter);

    return `
Dear [Contract Party],

I have reviewed the contract and would like to provide my response:

Accepted Clauses:
${accepted.map(c => `- ${c.title}`).join('\n')}

Rejected Clauses:
${rejected.map(c => `- ${c.title}`).join('\n')}

Proposed Counter-offers:
${countered.map(c => `- ${c.title}: ${c.counter}`).join('\n')}

I look forward to discussing these points further.

Best regards,
[Your Name]
    `.trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateEmailContent());
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 mb-16 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Contract Review Summary</h2>
      
      <div className="prose max-w-none">
        <pre className="bg-gray-50 p-4 rounded-lg text-sm">
          {generateEmailContent()}
        </pre>
      </div>
      
      <button
        onClick={handleCopy}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
      >
        <Copy className="h-4 w-4 mr-2" />
        Copy to Clipboard
      </button>
    </div>
  );
};