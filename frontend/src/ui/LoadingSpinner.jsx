import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingSpinner = ({ className = "w-5 h-5 text-blue-600" }) => {
  return <RefreshCw className={`${className} animate-spin`} data-testid="loading-spinner" />;
};

export default LoadingSpinner;
