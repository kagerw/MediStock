const API_BASE_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:8787/api' // 開発モード(npm run dev)のときはこちら
  : '/api';                     // 本番ビルド(npm run build)のときはこちら

// セキュリティ強化：入力サニタイゼーション
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>'"&]/g, '');
};

// セキュリティ強化：入力バリデーション
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 6; // 既存ユーザーとの互換性のため緩和
};

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

// セキュリティ強化：APIリクエストのラッパー
const secureApiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-Requested-With': 'XMLHttpRequest', // CSRF対策
    }
  });

  // レート制限エラーのハンドリング
  if (response.status === 429) {
    const result = await response.json();
    throw new Error(result.error || 'リクエストが多すぎます。しばらく待ってから再試行してください。');
  }

  // アカウントロックエラーのハンドリング
  if (response.status === 423) {
    const result = await response.json();
    throw new Error(result.error || 'アカウントがロックされています。');
  }

  return response;
};

// ===========================================================================
// 認証関連のAPI
// ===========================================================================

// ユーザー登録（セキュリティ強化版）
export const register = async (userData) => {
  // クライアント側バリデーション
  if (!userData.username || !userData.email || !userData.password) {
    throw new Error('すべての項目を入力してください');
  }

  if (!validateEmail(userData.email)) {
    throw new Error('有効なメールアドレスを入力してください');
  }

  if (!validatePassword(userData.password)) {
    throw new Error('パスワードは6文字以上である必要があります');
  }

  // 入力サニタイゼーション
  const sanitizedData = {
    username: sanitizeInput(userData.username),
    email: sanitizeInput(userData.email),
    password: userData.password // パスワードはサニタイズしない
  };

  const response = await secureApiRequest(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sanitizedData)
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

// ログイン（セキュリティ強化版）
export const login = async (credentials) => {
  // クライアント側バリデーション
  if (!credentials.email || !credentials.password) {
    throw new Error('メールアドレスとパスワードを入力してください');
  }

  if (!validateEmail(credentials.email)) {
    throw new Error('有効なメールアドレスを入力してください');
  }

  // 入力サニタイゼーション
  const sanitizedCredentials = {
    email: sanitizeInput(credentials.email),
    password: credentials.password // パスワードはサニタイズしない
  };

  const response = await secureApiRequest(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sanitizedCredentials)
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
