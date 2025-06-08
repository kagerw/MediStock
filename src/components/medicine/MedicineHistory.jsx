import React from 'react';

const MedicineHistory = ({ history }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">服用・処方履歴</h2>
      {history.length === 0 ? (
        <p className="text-gray-500 text-center py-8">履歴がありません</p>
      ) : (
        <div className="space-y-3">
          {history.slice(0, 20).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  entry.action === '服用' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <div>
                  <span className="font-medium">{entry.medicine_name}</span>
                  <span className={`ml-2 text-sm px-2 py-1 rounded ${
                    entry.action === '服用' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {entry.action}
                  </span>
                  {entry.notes && (
                    <span className="ml-2 text-sm text-gray-600">({entry.notes})</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {entry.action === '服用' ? '-' : '+'}{entry.quantity}個
                </div>
                <div className="text-xs text-gray-500">{entry.date}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineHistory;
