import { renderHook, act } from '@testing-library/react'
import { useMedicine } from '../../hooks/useMedicine'
import { mockMedicines, mockHistory, resetApiMocks } from '../test-utils'

// APIモジュールをモック
vi.mock('../../utils/api', () => import('../__mocks__/api'))

describe('useMedicine - handleAddStock（追加処方機能）', () => {
  beforeEach(() => {
    resetApiMocks()
    vi.clearAllMocks()
  })

  // afterEach(async () => {
  //   // 100 ms など遅延させた Promise を全部消化
  //   await vi.runAllTimersAsync()
  //   vi.useRealTimers()
  // })

  describe('handleAddStock - 在庫追加処方', () => {
    it('正常な在庫追加が成功する', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const medicineId = 1
      const addQuantity = 30
      const notes = '追加処方 - 定期受診'

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(medicineId, addQuantity, notes)
      })

      expect(addStockResult).toBe(true)
      expect(result.current.error).toBe('')

      // API関数が正しい引数で呼ばれることを確認
      const { addStock } = await import('../../utils/api')
      expect(addStock).toHaveBeenCalledWith(medicineId, addQuantity, notes)
    })

    it('在庫追加後にデータが再読み込みされる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const { fetchMedicines, fetchHistory } = await import('../../utils/api')
      
      // モックをクリアして呼び出し回数をリセット
      fetchMedicines.mockClear()
      fetchHistory.mockClear()

      await act(async () => {
        await result.current.handleAddStock(1, 20, 'テスト追加')
      })

      // データ再読み込みが実行されることを確認
      expect(fetchMedicines).toHaveBeenCalledTimes(1)
      expect(fetchHistory).toHaveBeenCalledTimes(1)
    })

    it('メモなしでも在庫追加できる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(1, 15)
      })

      expect(addStockResult).toBe(true)

      const { addStock } = await import('../../utils/api')
      expect(addStock).toHaveBeenCalledWith(1, 15, undefined)
    })

    it('空文字のメモでも在庫追加できる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(1, 25, '')
      })

      expect(addStockResult).toBe(true)

      const { addStock } = await import('../../utils/api')
      expect(addStock).toHaveBeenCalledWith(1, 25, '')
    })
  })

  describe('handleAddStock - バリデーション', () => {
    it('数量が未入力の場合はエラーになる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(1, null, 'テスト')
      })

      expect(addStockResult).toBe(false)
      expect(result.current.error).toBe('追加する数量は必須です')

      // API関数が呼ばれないことを確認
      const { addStock } = await import('../../utils/api')
      expect(addStock).not.toHaveBeenCalled()
    })

    it('数量が0の場合はエラーになる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(1, 0, 'テスト')
      })

      expect(addStockResult).toBe(false)
      expect(result.current.error).toBe('追加する数量は必須です')

      const { addStock } = await import('../../utils/api')
      expect(addStock).not.toHaveBeenCalled()
    })

    it('数量が負の値の場合はエラーになる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(1, -5, 'テスト')
      })

      expect(addStockResult).toBe(false)
      expect(result.current.error).toBe('追加する数量は必須です')

      const { addStock } = await import('../../utils/api')
      expect(addStock).not.toHaveBeenCalled()
    })

    it('数量が文字列の場合でも数値として扱われる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(1, '30', 'テスト')
      })

      expect(addStockResult).toBe(true)

      const { addStock } = await import('../../utils/api')
      expect(addStock).toHaveBeenCalledWith(1, '30', 'テスト')
    })

    it('数量が空文字の場合はエラーになる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(1, '', 'テスト')
      })

      expect(addStockResult).toBe(false)
      expect(result.current.error).toBe('追加する数量は必須です')
    })
  })

  describe('handleAddStock - エラーハンドリング', () => {
    it('API呼び出しが失敗した場合はエラーになる', async () => {
      const { addStock } = await import('../../utils/api')
      addStock.mockRejectedValue(new Error('在庫追加に失敗しました'))

      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(1, 20, 'テスト')
      })

      expect(addStockResult).toBe(false)
      expect(result.current.error).toBe('在庫追加に失敗しました')
    })

    it('ネットワークエラーの場合はデフォルトエラーメッセージが表示される', async () => {
      const { addStock } = await import('../../utils/api')
      addStock.mockRejectedValue(new Error())

      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(1, 20, 'テスト')
      })

      expect(addStockResult).toBe(false)
      expect(result.current.error).toBe('在庫の追加に失敗しました')
    })

    it('サーバーエラーの場合は適切なエラーメッセージが表示される', async () => {
      const { addStock } = await import('../../utils/api')
      addStock.mockRejectedValue(new Error('サーバーが応答しません'))

      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(1, 20, 'テスト')
      })

      expect(addStockResult).toBe(false)
      expect(result.current.error).toBe('サーバーが応答しません')
    })
  })

  describe('handleAddStock - ローディング状態', () => {
    it('在庫追加中はローディング状態になる', async () => {
      const { addStock } = await import('../../utils/api')
      
      // API呼び出しを遅延させる
      let resolveAddStock
      addStock.mockImplementation(() => new Promise(resolve => {
        resolveAddStock = resolve
      }))

      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // 在庫追加を開始
      act(() => {
        result.current.handleAddStock(1, 20, 'テスト')
      })

      // ローディング状態を確認
      expect(result.current.loading).toBe(true)

      // API呼び出しを完了
      await act(async () => {
        resolveAddStock()
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // ローディング状態が解除されることを確認
      expect(result.current.loading).toBe(false)
    })

    it('在庫追加エラー時もローディング状態が解除される', async () => {
      const { addStock } = await import('../../utils/api')
      addStock.mockRejectedValue(new Error('エラー'))

      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      await act(async () => {
        await result.current.handleAddStock(1, 20, 'テスト')
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('handleAddStock - 実際の使用シナリオ', () => {
    it('定期受診での追加処方シナリオ', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // 定期受診での追加処方
      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(
          1, 
          30, 
          '定期受診 - 2024/06/14 - 30日分追加処方'
        )
      })

      expect(addStockResult).toBe(true)
      expect(result.current.error).toBe('')

      const { addStock } = await import('../../utils/api')
      expect(addStock).toHaveBeenCalledWith(
        1, 
        30, 
        '定期受診 - 2024/06/14 - 30日分追加処方'
      )
    })

    it('緊急時の追加処方シナリオ', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // 緊急時の追加処方
      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(
          2, 
          7, 
          '緊急処方 - 症状悪化のため1週間分追加'
        )
      })

      expect(addStockResult).toBe(true)

      const { addStock } = await import('../../utils/api')
      expect(addStock).toHaveBeenCalledWith(
        2, 
        7, 
        '緊急処方 - 症状悪化のため1週間分追加'
      )
    })

    it('薬局での受け取り後の在庫追加シナリオ', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // 薬局での受け取り
      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(
          3, 
          60, 
          '薬局受取 - ○○薬局 - 2ヶ月分'
        )
      })

      expect(addStockResult).toBe(true)

      const { addStock } = await import('../../utils/api')
      expect(addStock).toHaveBeenCalledWith(
        3, 
        60, 
        '薬局受取 - ○○薬局 - 2ヶ月分'
      )
    })
  })

  describe('handleAddStock - 境界値テスト', () => {
    it('最小値（1）で在庫追加できる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(1, 1, 'テスト')
      })

      expect(addStockResult).toBe(true)

      const { addStock } = await import('../../utils/api')
      expect(addStock).toHaveBeenCalledWith(1, 1, 'テスト')
    })

    it('大きな数値でも在庫追加できる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(1, 9999, 'テスト')
      })

      expect(addStockResult).toBe(true)

      const { addStock } = await import('../../utils/api')
      expect(addStock).toHaveBeenCalledWith(1, 9999, 'テスト')
    })

    it('長いメモでも在庫追加できる', async () => {
      const { result } = renderHook(() => useMedicine())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const longNote = 'これは非常に長いメモです。'.repeat(10)

      let addStockResult
      await act(async () => {
        addStockResult = await result.current.handleAddStock(1, 30, longNote)
      })

      expect(addStockResult).toBe(true)

      const { addStock } = await import('../../utils/api')
      expect(addStock).toHaveBeenCalledWith(1, 30, longNote)
    })
  })
})
