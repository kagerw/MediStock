import React, { useState } from 'react';

const AddMedicineForm = ({ onAdd, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    dosage: '',
    frequency: '',
    notes: ''
  });

  const handleSubmit = async () => {
    const success = await onAdd(formData);
    if (success) {
      setFormData({
        name: '',
        quantity: '',
        dosage: '',
        frequency: '',
        notes: ''
      });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">新しい薬を追加</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="medicine-name" className="block text-sm font-medium text-gray-700 mb-1">薬の名前 *</label>
          <input
            id="medicine-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="例：ロキソニン錠"
          />
        </div>
        <div>
          <label htmlFor="medicine-quantity" className="block text-sm font-medium text-gray-700 mb-1">数量 *</label>
          <input
            id="medicine-quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="例：30"
            min="1"
          />
        </div>
        <div>
          <label htmlFor="medicine-dosage" className="block text-sm font-medium text-gray-700 mb-1">用量</label>
          <input
            id="medicine-dosage"
            type="text"
            value={formData.dosage}
            onChange={(e) => handleChange('dosage', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="例：1錠"
          />
        </div>
        <div>
          <label htmlFor="medicine-frequency" className="block text-sm font-medium text-gray-700 mb-1">服用頻度</label>
          <input
            id="medicine-frequency"
            type="text"
            value={formData.frequency}
            onChange={(e) => handleChange('frequency', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="例：1日3回食後"
          />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="medicine-notes" className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
        <textarea
          id="medicine-notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows="2"
          placeholder="例：副作用の注意点など"
        />
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? '追加中...' : '追加'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
};

export default AddMedicineForm;
