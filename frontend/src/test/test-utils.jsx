import React from 'react'
import { render, act } from '@testing-library/react'

// カスタムレンダー関数（必要に応じてプロバイダーを追加可能）
const customRender = (ui, options) => {
  return render(ui, {
    // ここに必要なプロバイダーを追加
    wrapper: ({ children }) => children,
    ...options,
  })
}

// よく使用されるテストユーティリティを再エクスポート
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// カスタムレンダーをデフォルトのrenderとして上書き
export { customRender as render }

// テスト用のモックデータ
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'テストユーザー'
}

export const mockMedicine = {
  id: 1,
  name: 'テスト薬',
  quantity: 10,
  dosage: '1錠',
  frequency: '1日3回',
  notes: 'テスト用のメモ',
  created_at: '2024-01-01T00:00:00Z'
}

export const mockMedicines = [
  mockMedicine,
  {
    id: 2,
    name: '在庫少薬',
    quantity: 2,
    dosage: '1錠',
    frequency: '1日2回',
    notes: '',
    created_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 3,
    name: '在庫切れ薬',
    quantity: 0,
    dosage: '1錠',
    frequency: '1日1回',
    notes: '',
    created_at: '2024-01-03T00:00:00Z'
  }
]

export const mockHistory = [
  {
    id: 1,
    medicine_id: 1,
    medicine_name: 'テスト薬',
    action: 'take',
    quantity_before: 11,
    quantity_after: 10,
    created_at: '2024-01-01T12:00:00Z'
  },
  {
    id: 2,
    medicine_id: 1,
    medicine_name: 'テスト薬',
    action: 'add',
    quantity_before: 0,
    quantity_after: 11,
    created_at: '2024-01-01T10:00:00Z'
  }
]

// API モックのリセット関数をエクスポート
export { resetApiMocks } from './__mocks__/api'
