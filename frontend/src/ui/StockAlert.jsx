import React from 'react';
import { AlertTriangle } from 'lucide-react';

const StockAlert = ({ lowStockMedicines = [], outOfStockMedicines = [] }) => {
  if (lowStockMedicines.length === 0 && outOfStockMedicines.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
      <div className="flex items-center">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
        <h3 className="text-yellow-800 font-medium">在庫アラート</h3>
      </div>
      <div className="mt-2 text-sm text-yellow-700">
        {outOfStockMedicines.length > 0 && (
          <p>在庫切れ: {outOfStockMedicines.map(med => med.name).join(', ')}</p>
        )}
        {lowStockMedicines.length > 0 && (
          <p>在庫僅少（3個以下）: {lowStockMedicines.map(med => `${med.name}(${med.quantity}個)`).join(', ')}</p>
        )}
      </div>
    </div>
  );
};

export default StockAlert;
