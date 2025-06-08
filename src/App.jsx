import React, { useState } from 'react';
import { useMedicine } from './hooks/useMedicine';
import Header from './components/layout/Header';
import ErrorAlert from './components/ui/ErrorAlert';
import StockAlert from './components/ui/StockAlert';
import AddMedicineForm from './components/medicine/AddMedicineForm';
import MedicineList from './components/medicine/MedicineList';
import MedicineHistory from './components/medicine/MedicineHistory';

function App() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const {
    medicines,
    history,
    loading,
    error,
    lowStockMedicines,
    outOfStockMedicines,
    setError,
    handleAddMedicine,
    handleTakeMedicine,
    handleDeleteMedicine,
    refreshData
  } = useMedicine();

  const handleToggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const handleToggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  const handleAddMedicineSuccess = async (medicineData) => {
    const success = await handleAddMedicine(medicineData);
    if (success) {
      setShowAddForm(false);
    }
    return success;
  };

  const handleCancelAddForm = () => {
    setShowAddForm(false);
  };

  const handleClearError = () => {
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <Header
          loading={loading}
          showHistory={showHistory}
          onToggleHistory={handleToggleHistory}
          onToggleAddForm={handleToggleAddForm}
          onRefresh={refreshData}
        />

        {/* エラー表示 */}
        <ErrorAlert error={error} onClose={handleClearError} />

        {/* 在庫アラート */}
        <StockAlert
          lowStockMedicines={lowStockMedicines}
          outOfStockMedicines={outOfStockMedicines}
        />

        {/* 薬追加フォーム */}
        {showAddForm && (
          <AddMedicineForm
            onAdd={handleAddMedicineSuccess}
            onCancel={handleCancelAddForm}
            loading={loading}
          />
        )}

        {/* 薬一覧 */}
        <MedicineList
          medicines={medicines}
          onTake={handleTakeMedicine}
          onDelete={handleDeleteMedicine}
          loading={loading}
        />

        {/* 履歴 */}
        {showHistory && <MedicineHistory history={history} />}
      </div>
    </div>
  );
}

export default App;
