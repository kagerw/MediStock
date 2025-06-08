import React from 'react';
import { Plus, History, RefreshCw, Pill } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

const Header = ({ 
  loading, 
  showHistory, 
  onToggleHistory, 
  onToggleAddForm, 
  onRefresh 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pill className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">薬の在庫管理</h1>
          {loading && <LoadingSpinner />}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleHistory}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showHistory 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <History className="w-4 h-4" />
            {showHistory ? '履歴を閉じる' : '履歴を表示'}
          </button>
          <button
            onClick={onToggleAddForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            薬を追加
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            更新
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
