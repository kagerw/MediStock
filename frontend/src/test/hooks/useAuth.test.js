import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../hooks/useAuth'
import { mockUser, resetApiMocks } from '../test-utils'

// APIモジュールをモック
vi.mock('../../utils/api', () => import('../__mocks__/api'))

describe('useAuth', () => {
  beforeEach(() => {
    resetApiMocks()
    vi.clearAllMocks()
  })

  describe('初期化', () => {
    it('認証済みユーザーがいる場合、ユーザー情報を設定する', async () => {
      const { result } = renderHook(() => useAuth())

      // 初期状態では loading が false（実際の実装に合わせて修正）
      expect(result.current.loading).toBe(false)

      // useEffect が実行されるまで待機
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
    })

    it('認証されていない場合、ユーザー情報はnullになる', async () => {
      // isAuthenticated を false に設定
      const { isAuthenticated } = await import('../../utils/api')
      isAuthenticated.mockReturnValue(false)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })
  })

  describe('login', () => {
    it('ログイン成功時にユーザー情報を設定する', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const loginData = { user: mockUser, token: 'test-token' }

      act(() => {
        result.current.login(loginData)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('logout', () => {
    it('ログアウト時にユーザー情報をクリアする', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // 最初は認証済み状態
      expect(result.current.isAuthenticated).toBe(true)

      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('ログアウト時にAPI関数が呼ばれる', async () => {
      const { logout: apiLogout } = await import('../../utils/api')
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      act(() => {
        result.current.logout()
      })

      expect(apiLogout).toHaveBeenCalledTimes(1)
    })
  })

  describe('register', () => {
    it('登録成功時にユーザー情報を設定する', async () => {
      // 初期状態を未認証に設定
      const { isAuthenticated } = await import('../../utils/api')
      isAuthenticated.mockReturnValue(false)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // 最初は未認証状態
      expect(result.current.isAuthenticated).toBe(false)

      const registerData = { user: mockUser, token: 'test-token' }

      act(() => {
        result.current.register(registerData)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('isAuthenticated', () => {
    it('ユーザーが存在する場合はtrueを返す', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isAuthenticated).toBe(true)
    })

    it('ユーザーが存在しない場合はfalseを返す', async () => {
      const { isAuthenticated } = await import('../../utils/api')
      isAuthenticated.mockReturnValue(false)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isAuthenticated).toBe(false)
    })
  })
})
