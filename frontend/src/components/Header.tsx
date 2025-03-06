import React from 'react';
import { Scale, ArrowLeft } from 'lucide-react';

export const Header = ({ onBack }: { onBack?: () => void }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <div className="flex items-center space-x-3">
              <Scale className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">ContractLens</h1>
            </div>
          </div>
          <nav>
            <button className="text-gray-600 hover:text-gray-900">Help</button>
          </nav>
        </div>
      </div>
    </header>
  );
};