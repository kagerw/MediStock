import { mockUser, mockMedicines, mockHistory } from '../test-utils'

// API関数のモック実装
export const login = vi.fn().mockResolvedValue({
  user: mockUser,
  token: 'mock-token'
})

export const register = vi.fn().mockResolvedValue({
  user: mockUser,
  token: 'mock-token'
})

export const logout = vi.fn()

export const isAuthenticated = vi.fn().mockReturnValue(true)

export const getStoredUser = vi.fn().mockReturnValue(mockUser)

export const fetchMedicines = vi.fn().mockResolvedValue(mockMedicines)

export const fetchHistory = vi.fn().mockResolvedValue(mockHistory)

export const addMedicine = vi.fn().mockResolvedValue({
  id: 4,
  name: '新しい薬',
  quantity: 30,
  dosage: '1錠',
  frequency: '1日3回',
  notes: '',
  created_at: '2024-01-04T00:00:00Z'
})

export const takeMedicine = vi.fn().mockResolvedValue({
  success: true,
  message: '服用を記録しました'
})

export const deleteMedicine = vi.fn().mockResolvedValue({
  success: true,
  message: '薬を削除しました'
})

export const addStock = vi.fn().mockResolvedValue({
  success: true,
  message: '在庫を追加しました'
})

// モック関数をリセットするヘルパー
export const resetApiMocks = () => {
  vi.clearAllMocks()
  
  // デフォルトの戻り値を再設定
  login.mockResolvedValue({ user: mockUser, token: 'mock-token' })
  register.mockResolvedValue({ user: mockUser, token: 'mock-token' })
  isAuthenticated.mockReturnValue(true)
  getStoredUser.mockReturnValue(mockUser)
  fetchMedicines.mockResolvedValue(mockMedicines)
  fetchHistory.mockResolvedValue(mockHistory)
  addMedicine.mockResolvedValue({
    id: 4,
    name: '新しい薬',
    quantity: 30,
    dosage: '1錠',
    frequency: '1日3回',
    notes: '',
    created_at: '2024-01-04T00:00:00Z'
  })
  takeMedicine.mockResolvedValue({ success: true, message: '服用を記録しました' })
  deleteMedicine.mockResolvedValue({ success: true, message: '薬を削除しました' })
  addStock.mockResolvedValue({ success: true, message: '在庫を追加しました' })
}
