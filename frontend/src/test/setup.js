import '@testing-library/jest-dom'

// グローバルなモック設定
global.confirm = vi.fn(() => true)
global.alert = vi.fn()

// LocalStorage のモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// SessionStorage のモック
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.sessionStorage = sessionStorageMock

// fetch のモック
global.fetch = vi.fn()

// テスト前にモックをリセット
beforeEach(() => {
  vi.clearAllMocks()
})
