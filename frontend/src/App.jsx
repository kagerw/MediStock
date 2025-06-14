import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useMedicine } from './hooks/useMedicine';
import Header from './layout/Header';
import ErrorAlert from './ui/ErrorAlert';
import StockAlert from './ui/StockAlert';
import AddMedicineForm from './medicine/AddMedicineForm';
import MedicineList from './medicine/MedicineList';
import MedicineHistory from './medicine/MedicineHistory';
import LoginForm from './auth/LoginForm';
import RegisterForm from './auth/RegisterForm';
import LoadingSpinner from './ui/LoadingSpinner';

function App() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  const { user, loading: authLoading, isAuthenticated, login, logout, register } = useAuth();

  // 認証状態の読み込み中
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  // 未認証の場合はログイン/登録画面を表示
  if (!isAuthenticated) {
    const handleLoginSuccess = (userData) => {
      login(userData);
    };

    const handleRegisterSuccess = (userData) => {
      register(userData);
    };

    const handleSwitchToRegister = () => {
      setAuthMode('register');
    };

    const handleSwitchToLogin = () => {
      setAuthMode('login');
    };

    if (authMode === 'register') {
      return (
        <RegisterForm
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      );
    }

    return (
      <LoginForm
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={handleSwitchToRegister}
      />
    );
  }

  // 認証済みの場合はメインアプリを表示
  return <AuthenticatedApp user={user} onLogout={logout} />;
}

// 認証済みユーザー用のコンポーネント
function AuthenticatedApp({ user, onLogout }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState(null);

  const {
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
  } = useMedicine();

  const handleToggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const handleToggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  const handleAddMedicineSuccess = async (medicineData) => {
    let success;
    
    // 追加処方の場合は既存薬に在庫を追加
    if (prescriptionData) {
      success = await handleAddStock(prescriptionData.id, medicineData.quantity, medicineData.notes);
    } else {
      // 新規薬の場合は新しい薬を追加
      success = await handleAddMedicine(medicineData);
    }
    
    if (success) {
      setShowAddForm(false);
      setPrescriptionData(null);
    }
    return success;
  };

  const handleCancelAddForm = () => {
    setShowAddForm(false);
    setPrescriptionData(null);
  };

  const handleAddPrescription = (medicine) => {
    setPrescriptionData(medicine);
    setShowAddForm(true);
  };

  const handleClearError = () => {
    setError('');
  };

  const handleLogout = () => {
    onLogout();
    setShowAddForm(false);
    setShowHistory(false);
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
          user={user}
          onLogout={handleLogout}
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
            initialData={prescriptionData}
          />
        )}

        {/* 薬一覧 */}
        <MedicineList
          medicines={medicines}
          onTake={handleTakeMedicine}
          onDelete={handleDeleteMedicine}
          onAddPrescription={handleAddPrescription}
          loading={loading}
        />

        {/* 履歴 */}
        {showHistory && <MedicineHistory history={history} />}
      </div>
    </div>
  );
}

export default App;
