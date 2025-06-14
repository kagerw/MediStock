import { render, screen, userEvent, waitFor } from '../test-utils'
import { useMedicine } from '../../hooks/useMedicine'
import AddMedicineForm from '../../medicine/AddMedicineForm'
import { mockMedicines, resetApiMocks } from '../test-utils'

// APIモジュールをモック
vi.mock('../../utils/api', () => import('../__mocks__/api'))

// 追加処方機能の統合テスト
describe('追加処方機能 - 統合テスト', () => {
  beforeEach(() => {
    resetApiMocks()
    vi.clearAllMocks()
  })

  // afterEach(async () => {
  //   // 100 ms など遅延させた Promise を全部消化
  //   await vi.runAllTimersAsync()
  //   vi.useRealTimers()
  // })

  // テスト用のコンポーネント（useMedicineフックを使用）
  const TestAddPrescriptionComponent = ({ existingMedicine }) => {
    const {
      loading,
      error,
      handleAddMedicine,
      handleAddStock
    } = useMedicine()

    const handleAdd = async (formData) => {
      if (existingMedicine) {
        // 既存薬への在庫追加（追加処方）
        return await handleAddStock(existingMedicine.id, formData.quantity, formData.notes)
      } else {
        // 新規薬の追加
        return await handleAddMedicine(formData)
      }
    }

    return (
      <div>
        {error && <div data-testid="error-message">{error}</div>}
        <AddMedicineForm
          onAdd={handleAdd}
          onCancel={() => {}}
          loading={loading}
          initialData={existingMedicine}
        />
      </div>
    )
  }

  describe('新規薬の追加処方', () => {
    it('新規薬を追加処方として登録できる', async () => {
      const user = userEvent.setup()
      render(<TestAddPrescriptionComponent />)

      // フォームに入力
      await user.type(screen.getByLabelText('薬の名前 *'), 'アスピリン錠')
      await user.type(screen.getByLabelText('数量 *'), '30')
      await user.type(screen.getByLabelText('用量'), '1錠')
      await user.type(screen.getByLabelText('服用頻度'), '1日1回朝食後')
      await user.type(screen.getByLabelText('メモ'), '新規処方 - 血栓予防')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // API関数が呼ばれることを確認
      const { addMedicine } = await import('../../utils/api')
      await waitFor(() => {
        expect(addMedicine).toHaveBeenCalledWith({
          name: 'アスピリン錠',
          quantity: '30',
          dosage: '1錠',
          frequency: '1日1回朝食後',
          notes: '新規処方 - 血栓予防'
        })
      })
    })

    it('新規薬追加時のエラーハンドリング', async () => {
      const { addMedicine } = await import('../../utils/api')
      addMedicine.mockRejectedValue(new Error('薬の追加に失敗しました'))

      const user = userEvent.setup()
      render(<TestAddPrescriptionComponent />)

      // 必須項目のみ入力
      await user.type(screen.getByLabelText('薬の名前 *'), 'テスト薬')
      await user.type(screen.getByLabelText('数量 *'), '10')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('薬の追加に失敗しました')
      })
    })
  })

  describe('既存薬への追加処方', () => {
    const existingMedicine = {
      id: 1,
      name: 'ロキソニン錠',
      dosage: '1錠',
      frequency: '1日3回食後',
      notes: '痛み止め'
    }

    it('既存薬に在庫を追加処方できる', async () => {
      const user = userEvent.setup()
      render(<TestAddPrescriptionComponent existingMedicine={existingMedicine} />)

      // 追加処方モードであることを確認
      expect(screen.getByText('薬を追加処方')).toBeInTheDocument()

      // 既存の情報が表示されていることを確認
      expect(screen.getByDisplayValue('ロキソニン錠')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1錠')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1日3回食後')).toBeInTheDocument()
      expect(screen.getByDisplayValue('痛み止め')).toBeInTheDocument()

      // 数量とメモを入力
      await user.type(screen.getByLabelText('数量 *'), '30')
      await user.type(screen.getByDisplayValue('痛み止め'), ' - 追加処方')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // handleAddStock関数が呼ばれることを確認
      const { addStock } = await import('../../utils/api')
      await waitFor(() => {
        expect(addStock).toHaveBeenCalledWith(1, '30', '痛み止め - 追加処方')
      })
    })

    it('既存薬の情報を変更して追加処方できる', async () => {
      const user = userEvent.setup()
      render(<TestAddPrescriptionComponent existingMedicine={existingMedicine} />)

      // 用量を変更
      const dosageInput = screen.getByDisplayValue('1錠')
      await user.clear(dosageInput)
      await user.type(dosageInput, '2錠')

      // 服用頻度を変更
      const frequencyInput = screen.getByDisplayValue('1日3回食後')
      await user.clear(frequencyInput)
      await user.type(frequencyInput, '1日2回朝夕食後')

      // 数量を入力
      await user.type(screen.getByLabelText('数量 *'), '20')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // 既存薬への在庫追加として処理されることを確認（フォームの変更は無視される）
      const { addStock } = await import('../../utils/api')
      await waitFor(() => {
        expect(addStock).toHaveBeenCalledWith(1, '20', '痛み止め')
      })

      // addMedicineは呼ばれないことを確認
      const { addMedicine } = await import('../../utils/api')
      expect(addMedicine).not.toHaveBeenCalled()
    })

    it('既存薬への追加処方時のエラーハンドリング', async () => {
      const { addStock } = await import('../../utils/api')
      addStock.mockRejectedValue(new Error('在庫の追加に失敗しました'))

      const user = userEvent.setup()
      render(<TestAddPrescriptionComponent existingMedicine={existingMedicine} />)

      // 数量を入力
      await user.type(screen.getByLabelText('数量 *'), '15')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('在庫の追加に失敗しました')
      })
    })

    it('数量未入力での追加処方はバリデーションエラーになる', async () => {
      const user = userEvent.setup()
      render(<TestAddPrescriptionComponent existingMedicine={existingMedicine} />)

      // ★ loading が終わって「追加」ボタンが現れるまで待つ
      const addButton = await screen.findByRole('button', { name: '追加' })

      // 数量を入力せずに追加ボタンをクリック
      await user.click(addButton)

      // handleAddStockが空の数量（''）でバリデーションエラーを出すことを確認
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('追加する数量は必須です')
      }, { timeout: 3000 })

      // addStock APIが呼ばれないことを確認
      const { addStock } = await import('../../utils/api')
      expect(addStock).not.toHaveBeenCalled()
    })
  })

  describe('追加処方の実用的なシナリオ', () => {
    it('定期受診での追加処方シナリオ', async () => {
      const existingMedicine = {
        id: 2,
        name: '高血圧薬',
        dosage: '1錠',
        frequency: '1日1回朝食後',
        notes: '血圧管理'
      }

      const user = userEvent.setup()
      render(<TestAddPrescriptionComponent existingMedicine={existingMedicine} />)

      // 定期受診での追加処方
      await user.type(screen.getByLabelText('数量 *'), '90')
      
      const notesInput = screen.getByDisplayValue('血圧管理')
      await user.clear(notesInput)
      await user.type(notesInput, '血圧管理 - 定期受診 3ヶ月分処方')

      await user.click(screen.getByRole('button', { name: '追加' }))

      const { addStock } = await import('../../utils/api')
      await waitFor(() => {
        expect(addStock).toHaveBeenCalledWith(2, '90', '血圧管理 - 定期受診 3ヶ月分処方')
      })
    })

    it('緊急時の追加処方シナリオ', async () => {
      const existingMedicine = {
        id: 3,
        name: '抗生物質',
        dosage: '1カプセル',
        frequency: '1日3回食後',
        notes: '感染症治療'
      }

      const user = userEvent.setup()
      render(<TestAddPrescriptionComponent existingMedicine={existingMedicine} />)

      // 緊急時の追加処方
      await user.type(screen.getByLabelText('数量 *'), '21')
      
      const notesInput = screen.getByDisplayValue('感染症治療')
      await user.clear(notesInput)
      await user.type(notesInput, '感染症治療 - 緊急処方 7日分追加')

      await user.click(screen.getByRole('button', { name: '追加' }))

      const { addStock } = await import('../../utils/api')
      await waitFor(() => {
        expect(addStock).toHaveBeenCalledWith(3, '21', '感染症治療 - 緊急処方 7日分追加')
      })
    })

    it('薬局での受け取り後の在庫更新シナリオ', async () => {
      const existingMedicine = {
        id: 4,
        name: 'ビタミンD',
        dosage: '1錠',
        frequency: '1日1回',
        notes: 'サプリメント'
      }

      const user = userEvent.setup()
      render(<TestAddPrescriptionComponent existingMedicine={existingMedicine} />)

      // 薬局での受け取り
      await user.type(screen.getByLabelText('数量 *'), '60')
      
      const notesInput = screen.getByDisplayValue('サプリメント')
      await user.clear(notesInput)
      await user.type(notesInput, 'サプリメント - ○○薬局で受取 2ヶ月分')

      await user.click(screen.getByRole('button', { name: '追加' }))

      const { addStock } = await import('../../utils/api')
      await waitFor(() => {
        expect(addStock).toHaveBeenCalledWith(4, '60', 'サプリメント - ○○薬局で受取 2ヶ月分')
      })
    })
  })

  describe('追加処方のローディング状態', () => {
    it('追加処方中はローディング状態が表示される', async () => {
      const { addStock } = await import('../../utils/api')
      
      // API呼び出しを遅延させる
      let resolveAddStock
      addStock.mockImplementation(() => new Promise(resolve => {
        resolveAddStock = resolve
      }))

      const existingMedicine = {
        id: 1,
        name: 'テスト薬',
        dosage: '1錠',
        frequency: '1日1回',
        notes: 'テスト'
      }

      const user = userEvent.setup()
      render(<TestAddPrescriptionComponent existingMedicine={existingMedicine} />)

      // 数量を入力
      await user.type(screen.getByLabelText('数量 *'), '30')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // ローディング状態を確認
      const loadingBtn = screen.getByRole('button', { name: '追加中...' })
      expect(loadingBtn).toBeInTheDocument()
      expect(loadingBtn).toBeDisabled()

      // API呼び出しを完了
      resolveAddStock({ success: true })
      
      // ④ 画面が通常状態に戻るまで待つ
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument()
      })
    })
  })
})
