import React from 'react';
import MedicineCard from './MedicineCard';

const MedicineList = ({ medicines, onTake, onDelete, onAddPrescription, loading }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">現在の薬一覧</h2>
      {medicines.length === 0 && !loading ? (
        <p className="text-gray-500 text-center py-8">薬が登録されていません</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onTake={onTake}
              onDelete={onDelete}
              onAddPrescription={onAddPrescription}
              loading={loading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineList;
