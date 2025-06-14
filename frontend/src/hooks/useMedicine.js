import { useState, useEffect } from 'react';
import * as api from '../utils/api';

export const useMedicine = () => {
  const [medicines, setMedicines] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 薬一覧を取得
  const loadMedicines = async () => {
    try {
      setLoading(true);
      const data = await api.fetchMedicines();
      setMedicines(data);
      setError('');
    } catch (err) {
      setError(err.message || 'サーバーとの通信に失敗しました');
      console.error('Fetch medicines error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 履歴を取得
  const loadHistory = async () => {
    try {
      const data = await api.fetchHistory();
      setHistory(data);
      setError('');
    } catch (err) {
      setError(err.message || '履歴の取得に失敗しました');
      console.error('Fetch history error:', err);
    }
  };

  // 薬を追加
  const handleAddMedicine = async (medicineData) => {
    if (!medicineData.name || !medicineData.quantity) {
      setError('薬の名前と数量は必須です');
      return false;
    }

    try {
      setLoading(true);
      await api.addMedicine(medicineData);
      await loadMedicines();
      await loadHistory();
      setError('');
      return true;
    } catch (err) {
      setError(err.message || '薬の追加に失敗しました');
      console.error('Add medicine error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 既存の薬に在庫を追加
  const handleAddStock = async (id, quantity, notes) => {
    if (!quantity || quantity <= 0) {
      setError('追加する数量は必須です');
      return false;
    }

    try {
      setLoading(true);
      await api.addStock(id, quantity, notes);
      await loadMedicines();
      await loadHistory();
      setError('');
      return true;
    } catch (err) {
      setError(err.message || '在庫の追加に失敗しました');
      console.error('Add stock error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 薬を服用
  const handleTakeMedicine = async (id, medicineName, currentQuantity) => {
    if (currentQuantity <= 0) {
      setError('在庫がありません');
      return false;
    }

    try {
      setLoading(true);
      await api.takeMedicine(id);
      await loadMedicines();
      await loadHistory();
      setError('');
      return true;
    } catch (err) {
      setError(err.message || '服用の記録に失敗しました');
      console.error('Take medicine error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 薬を削除
  const handleDeleteMedicine = async (id) => {
    if (!confirm('この薬を削除してもよろしいですか？')) {
      return false;
    }

    try {
      setLoading(true);
      await api.deleteMedicine(id);
      await loadMedicines();
      setError('');
      return true;
    } catch (err) {
      setError(err.message || '薬の削除に失敗しました');
      console.error('Delete medicine error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // データを更新
  const refreshData = async () => {
    await loadMedicines();
    await loadHistory();
  };

  // 初回読み込み
  useEffect(() => {
    loadMedicines();
    loadHistory();
  }, []);

  // 在庫アラート用のデータ
  const lowStockMedicines = medicines.filter(med => med.quantity <= 3 && med.quantity > 0);
  const outOfStockMedicines = medicines.filter(med => med.quantity === 0);

  return {
    medicines,
    history,
    loading,
    error,
    lowStockMedicines,
    outOfStockMedicines,
    setError,
    handleAddMedicine,
    handleAddStock,
    handleTakeMedicine,
    handleDeleteMedicine,
    refreshData
  };
};
