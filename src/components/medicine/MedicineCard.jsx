import React from 'react';
import { Minus } from 'lucide-react';

const MedicineCard = ({ medicine, onTake, onDelete, loading }) => {
  const getCardStyle = () => {
    if (medicine.quantity === 0) {
      return 'border-red-300 bg-red-50';
    } else if (medicine.quantity <= 3) {
      return 'border-yellow-300 bg-yellow-50';
    }
    return 'border-gray-200 bg-white';
  };

  return (
    <div className={`border rounded-lg p-4 ${getCardStyle()}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-800">{medicine.name}</h3>
        <button
          onClick={() => onDelete(medicine.id)}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          削除
        </button>
      </div>
      <div className="text-2xl font-bold text-blue-600 mb-2">
        {medicine.quantity}個
      </div>
      {medicine.dosage && (
        <p className="text-sm text-gray-600 mb-1">用量: {medicine.dosage}</p>
      )}
      {medicine.frequency && (
        <p className="text-sm text-gray-600 mb-1">頻度: {medicine.frequency}</p>
      )}
      {medicine.notes && (
        <p className="text-sm text-gray-600 mb-2">メモ: {medicine.notes}</p>
      )}
      <p className="text-xs text-gray-500 mb-3">追加日: {medicine.added_date}</p>
      <button
        onClick={() => onTake(medicine.id, medicine.name, medicine.quantity)}
        disabled={medicine.quantity === 0 || loading}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          medicine.quantity === 0 || loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        <Minus className="w-4 h-4" />
        服用する
      </button>
    </div>
  );
};

export default MedicineCard;
