const API_BASE_URL = 'http://localhost:3001/api';

// 薬一覧を取得
export const fetchMedicines = async () => {
  const response = await fetch(`${API_BASE_URL}/medicines`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'データの取得に失敗しました');
  }
  
  return result.data;
};

// 履歴を取得
export const fetchHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/history`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '履歴の取得に失敗しました');
  }
  
  return result.data;
};

// 薬を追加
export const addMedicine = async (medicineData) => {
  const response = await fetch(`${API_BASE_URL}/medicines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: medicineData.name,
      quantity: parseInt(medicineData.quantity),
      dosage: medicineData.dosage,
      frequency: medicineData.frequency,
      notes: medicineData.notes
    })
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || '薬の追加に失敗しました');
  }

  return result.data;
};

// 薬を服用
export const takeMedicine = async (id) => {
  const response = await fetch(`${API_BASE_URL}/medicines/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'take' })
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || '服用の記録に失敗しました');
  }

  return result.data;
};

// 薬を削除
export const deleteMedicine = async (id) => {
  const response = await fetch(`${API_BASE_URL}/medicines/${id}`, {
    method: 'DELETE'
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || '薬の削除に失敗しました');
  }

  return result.data;
};
