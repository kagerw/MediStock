const API_BASE_URL = 'http://localhost:3001/api';

// ローカルストレージからトークンを取得
const getToken = () => {
  return localStorage.getItem('token');
};

// 認証ヘッダーを作成
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// ===========================================================================
// 認証関連のAPI
// ===========================================================================

// ユーザー登録
export const register = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'ユーザー登録に失敗しました');
  }

  // トークンをローカルストレージに保存
  localStorage.setItem('token', result.data.token);
  localStorage.setItem('user', JSON.stringify(result.data.user));

  return result.data;
};

// ログイン
export const login = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials)
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'ログインに失敗しました');
  }

  // トークンをローカルストレージに保存
  localStorage.setItem('token', result.data.token);
  localStorage.setItem('user', JSON.stringify(result.data.user));

  return result.data;
};

// ログアウト
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ユーザー情報取得（認証確認用）
export const getCurrentUser = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders()
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'ユーザー情報の取得に失敗しました');
  }

  return result.data.user;
};

// ログイン状態をチェック
export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

// ローカルストレージからユーザー情報を取得
export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// ===========================================================================
// 薬管理API（認証必須）
// ===========================================================================

// 薬一覧を取得
export const fetchMedicines = async () => {
  const response = await fetch(`${API_BASE_URL}/medicines`, {
    headers: getAuthHeaders()
  });
  
  const result = await response.json();
  
  if (!result.success) {
    if (response.status === 401 || response.status === 403) {
      logout(); // トークンが無効な場合はログアウト
      throw new Error('認証が必要です。再度ログインしてください。');
    }
    throw new Error(result.error || 'データの取得に失敗しました');
  }
  
  return result.data;
};

// 履歴を取得
export const fetchHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/history`, {
    headers: getAuthHeaders()
  });
  
  const result = await response.json();
  
  if (!result.success) {
    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error('認証が必要です。再度ログインしてください。');
    }
    throw new Error(result.error || '履歴の取得に失敗しました');
  }
  
  return result.data;
};

// 薬を追加
export const addMedicine = async (medicineData) => {
  const response = await fetch(`${API_BASE_URL}/medicines`, {
    method: 'POST',
    headers: getAuthHeaders(),
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
    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error('認証が必要です。再度ログインしてください。');
    }
    throw new Error(result.error || '薬の追加に失敗しました');
  }

  return result.data;
};

// 既存の薬に在庫を追加
export const addStock = async (id, quantity, notes) => {
  const response = await fetch(`${API_BASE_URL}/medicines/${id}/add-stock`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ quantity: parseInt(quantity), notes })
  });

  const result = await response.json();

  if (!result.success) {
    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error('認証が必要です。再度ログインしてください。');
    }
    throw new Error(result.error || '在庫の追加に失敗しました');
  }

  return result.data;
};

// 薬を服用
export const takeMedicine = async (id) => {
  const response = await fetch(`${API_BASE_URL}/medicines/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ action: 'take' })
  });

  const result = await response.json();

  if (!result.success) {
    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error('認証が必要です。再度ログインしてください。');
    }
    throw new Error(result.error || '服用の記録に失敗しました');
  }

  return result.data;
};

// 薬を削除
export const deleteMedicine = async (id) => {
  const response = await fetch(`${API_BASE_URL}/medicines/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const result = await response.json();

  if (!result.success) {
    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error('認証が必要です。再度ログインしてください。');
    }
    throw new Error(result.error || '薬の削除に失敗しました');
  }

  return result.data;
};
