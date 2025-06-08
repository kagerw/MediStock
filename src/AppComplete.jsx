<button
                    onClick={() => takeMedicine(medicine.id, medicine.name, medicine.quantity)}
                    disabled={medicine.quantity === 0 || loading}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      medicine.quantity === 0 || loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                    服用する
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 履歴 */}
        {showHistory && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">服用・処方履歴</h2>
              <div className="text-sm text-gray-500">
                最新 {history.length} 件
              </div>
            </div>
            
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">履歴がありません</p>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        entry.action === '服用' ? 'bg-green-500' : 
                        entry.action === '追加処方' ? 'bg-orange-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{entry.medicine_name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            entry.action === '服用' 
                              ? 'bg-green-100 text-green-800' 
                              : entry.action === '追加処方'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {entry.action}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-gray-600 mt-1">({entry.notes})</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700">
                        {entry.action === '服用' ? '-' : '+'}{entry.quantity}個
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {entry.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* フッター */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💊 薬の在庫管理アプリ - 認証版</p>
          <p className="mt-1">定期処方薬の管理に対応</p>
        </div>
      </div>
    </div>
  );
}

export default App;
