import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorAlert = ({ message, error, onClose }) => {
  const errorMessage = message || error;
  if (!errorMessage) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg" role="alert">
      <div className="flex items-center">
        <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
        <p className="text-red-800">{errorMessage}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
