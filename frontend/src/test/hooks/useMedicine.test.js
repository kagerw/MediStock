import { renderHook, act } from '@testing-library/react'
import { useMedicine } from '../../hooks/useMedicine'
import { mockMedicines, mockHistory, resetApiMocks } from '../test-utils'

// APIモジュールをモック
vi.mock('../../utils/api', () => import('../__mocks__/api'))

describe('useMedicine', () => {
  beforeEach(() => {
    resetApiMocks()
    vi.clearAllMocks()
  })

  describe('初期化', () => {
    it('初期状態で薬一覧と履歴を読み込む', async () => {
      const { result } = renderHook(() => useMedicine())

      // 初期状態
      expect(result.current.medicines).toEqual([])
      expect(result.current.history).toEqual([])
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe('')

      // useEffect が実行されるまで待機
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.medicines).toEqual(mockMedicines)
      expect(result.current.history).toEqual(mockHistory)
    })

    it('在庫アラート用のデータが正しく計算される', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // 在庫少（quantity <= 3 && quantity > 0）
      expect(result.current.lowStockMedicines).toHaveLength(1)
      expect(result.current.lowStockMedicines[0].name).toBe('在庫少薬')

      // 在庫切れ（quantity === 0）
      expect(result.current.outOfStockMedicines).toHaveLength(1)
      expect(result.current.outOfStockMedicines[0].name).toBe('在庫切れ薬')
    })
  })

  describe('handleAddMedicine', () => {
    it('薬の追加が成功する', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const newMedicine = {
        name: '新しい薬',
        quantity: '30',
        dosage: '1錠',
        frequency: '1日3回',
        notes: 'テスト用'
      }

      let addResult
      await act(async () => {
        addResult = await result.current.handleAddMedicine(newMedicine)
      })

      expect(addResult).toBe(true)
      expect(result.current.error).toBe('')

      // API関数が呼ばれることを確認
      const { addMedicine } = await import('../../utils/api')
      expect(addMedicine).toHaveBeenCalledWith(newMedicine)
    })

    it('必須項目が不足している場合はエラーになる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const incompleteMedicine = {
        name: '',
        quantity: '',
        dosage: '1錠',
        frequency: '1日3回',
        notes: ''
      }

      let addResult
      await act(async () => {
        addResult = await result.current.handleAddMedicine(incompleteMedicine)
      })

      expect(addResult).toBe(false)
      expect(result.current.error).toBe('薬の名前と数量は必須です')
    })

    it('API呼び出しが失敗した場合はエラーになる', async () => {
      const { addMedicine } = await import('../../utils/api')
      addMedicine.mockRejectedValue(new Error('サーバーエラー'))

      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const newMedicine = {
        name: '新しい薬',
        quantity: '30',
        dosage: '1錠',
        frequency: '1日3回',
        notes: ''
      }

      let addResult
      await act(async () => {
        addResult = await result.current.handleAddMedicine(newMedicine)
      })

      expect(addResult).toBe(false)
      expect(result.current.error).toBe('サーバーエラー')
    })
  })

  describe('handleTakeMedicine', () => {
    it('薬の服用が成功する', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let takeResult
      await act(async () => {
        takeResult = await result.current.handleTakeMedicine(1, 'テスト薬', 10)
      })

      expect(takeResult).toBe(true)
      expect(result.current.error).toBe('')

      // API関数が呼ばれることを確認
      const { takeMedicine } = await import('../../utils/api')
      expect(takeMedicine).toHaveBeenCalledWith(1)
    })

    it('在庫がない場合はエラーになる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let takeResult
      await act(async () => {
        takeResult = await result.current.handleTakeMedicine(1, 'テスト薬', 0)
      })

      expect(takeResult).toBe(false)
      expect(result.current.error).toBe('在庫がありません')
    })

    it('API呼び出しが失敗した場合はエラーになる', async () => {
      const { takeMedicine } = await import('../../utils/api')
      takeMedicine.mockRejectedValue(new Error('サーバーエラー'))

      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let takeResult
      await act(async () => {
        takeResult = await result.current.handleTakeMedicine(1, 'テスト薬', 10)
      })

      expect(takeResult).toBe(false)
      expect(result.current.error).toBe('サーバーエラー')
    })
  })

  describe('handleDeleteMedicine', () => {
    it('薬の削除が成功する', async () => {
      // confirm関数をモック
      global.confirm = vi.fn(() => true)

      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.handleDeleteMedicine(1)
      })

      expect(deleteResult).toBe(true)
      expect(result.current.error).toBe('')

      // API関数が呼ばれることを確認
      const { deleteMedicine } = await import('../../utils/api')
      expect(deleteMedicine).toHaveBeenCalledWith(1)
    })

    it('API呼び出しが失敗した場合はエラーになる', async () => {
      // confirm関数をモック
      global.confirm = vi.fn(() => true)

      const { deleteMedicine } = await import('../../utils/api')
      deleteMedicine.mockRejectedValue(new Error('削除に失敗しました'))

      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.handleDeleteMedicine(1)
      })

      expect(deleteResult).toBe(false)
      expect(result.current.error).toBe('削除に失敗しました')
    })

    it('確認ダイアログでキャンセルした場合は削除されない', async () => {
      // confirm関数をモック（falseを返す）
      global.confirm = vi.fn(() => false)

      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.handleDeleteMedicine(1)
      })

      expect(deleteResult).toBe(false)

      // API関数が呼ばれないことを確認
      const { deleteMedicine } = await import('../../utils/api')
      expect(deleteMedicine).not.toHaveBeenCalled()
    })
  })

  describe('refreshData', () => {
    it('データの再読み込みが実行される', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const { fetchMedicines, fetchHistory } = await import('../../utils/api')
      
      // モックをクリアして呼び出し回数をリセット
      fetchMedicines.mockClear()
      fetchHistory.mockClear()

      await act(async () => {
        await result.current.refreshData()
      })

      expect(fetchMedicines).toHaveBeenCalledTimes(1)
      expect(fetchHistory).toHaveBeenCalledTimes(1)
    })
  })

  describe('setError', () => {
    it('エラーメッセージを設定できる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      act(() => {
        result.current.setError('テストエラー')
      })

      expect(result.current.error).toBe('テストエラー')
    })
  })
})
