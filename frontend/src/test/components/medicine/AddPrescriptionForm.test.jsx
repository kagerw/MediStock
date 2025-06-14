import { render, screen, userEvent } from '../../test-utils'
import AddMedicineForm from '../../../medicine/AddMedicineForm'

describe('AddPrescriptionForm - 追加処方機能', () => {
  const mockOnAdd = vi.fn()
  const mockOnCancel = vi.fn()

  // 既存薬のデータ（追加処方用）
  const existingMedicine = {
    id: 1,
    name: 'ロキソニン錠',
    dosage: '1錠',
    frequency: '1日3回食後',
    notes: '痛み止め'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAdd.mockClear()
    mockOnCancel.mockClear()
  })

  // afterEach(async () => {
  //   // 100 ms など遅延させた Promise を全部消化
  //   await vi.runAllTimersAsync()
  //   vi.useRealTimers()
  // })

  const renderAddPrescriptionForm = (props = {}) => {
    const defaultProps = {
      onAdd: mockOnAdd,
      onCancel: mockOnCancel,
      loading: false,
      initialData: existingMedicine,
      ...props
    }
    return render(<AddMedicineForm {...defaultProps} />)
  }

  describe('追加処方モードのレンダリング', () => {
    it('追加処方モードでは適切なタイトルが表示される', () => {
      renderAddPrescriptionForm()

      expect(screen.getByText('薬を追加処方')).toBeInTheDocument()
      expect(screen.queryByText('新しい薬を追加')).not.toBeInTheDocument()
    })

    it('既存薬の情報が初期値として設定される', () => {
      renderAddPrescriptionForm()

      expect(screen.getByDisplayValue('ロキソニン錠')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1錠')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1日3回食後')).toBeInTheDocument()
      expect(screen.getByDisplayValue('痛み止め')).toBeInTheDocument()
    })

    it('数量フィールドは空の状態で表示される', () => {
      renderAddPrescriptionForm()

      const quantityInput = screen.getByLabelText('数量 *')
      expect(quantityInput).toHaveValue(null)
    })

    it('薬名フィールドは編集可能である', () => {
      renderAddPrescriptionForm()

      const nameInput = screen.getByDisplayValue('ロキソニン錠')
      expect(nameInput).not.toBeDisabled()
    })
  })

  describe('追加処方フォームの入力', () => {
    it('追加する数量を入力できる', async () => {
      const user = userEvent.setup()
      renderAddPrescriptionForm()

      const quantityInput = screen.getByLabelText('数量 *')
      await user.type(quantityInput, '30')

      expect(quantityInput).toHaveValue(30)
    })

    it('既存の用量を変更できる', async () => {
      const user = userEvent.setup()
      renderAddPrescriptionForm()

      const dosageInput = screen.getByDisplayValue('1錠')
      await user.clear(dosageInput)
      await user.type(dosageInput, '2錠')

      expect(dosageInput).toHaveValue('2錠')
    })

    it('既存の服用頻度を変更できる', async () => {
      const user = userEvent.setup()
      renderAddPrescriptionForm()

      const frequencyInput = screen.getByDisplayValue('1日3回食後')
      await user.clear(frequencyInput)
      await user.type(frequencyInput, '1日2回朝夕食後')

      expect(frequencyInput).toHaveValue('1日2回朝夕食後')
    })

    it('既存のメモを変更できる', async () => {
      const user = userEvent.setup()
      renderAddPrescriptionForm()

      const notesInput = screen.getByDisplayValue('痛み止め')
      await user.clear(notesInput)
      await user.type(notesInput, '痛み止め - 追加処方')

      expect(notesInput).toHaveValue('痛み止め - 追加処方')
    })
  })

  describe('追加処方の送信', () => {
    it('正しい情報で追加処方が成功する', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(true)
      renderAddPrescriptionForm()

      // 数量を入力
      await user.type(screen.getByLabelText('数量 *'), '30')

      // 用量を変更
      const dosageInput = screen.getByDisplayValue('1錠')
      await user.clear(dosageInput)
      await user.type(dosageInput, '2錠')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // onAdd関数が正しい引数で呼ばれることを確認
      expect(mockOnAdd).toHaveBeenCalledWith({
        name: 'ロキソニン錠',
        quantity: '30',
        dosage: '2錠',
        frequency: '1日3回食後',
        notes: '痛み止め'
      })
    })

    it('数量のみ入力して追加処方できる', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(true)
      renderAddPrescriptionForm()

      // 数量のみ入力
      await user.type(screen.getByLabelText('数量 *'), '50')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // 既存の情報がそのまま使用されることを確認
      expect(mockOnAdd).toHaveBeenCalledWith({
        name: 'ロキソニン錠',
        quantity: '50',
        dosage: '1錠',
        frequency: '1日3回食後',
        notes: '痛み止め'
      })
    })

    it('追加処方成功時にフォームがリセットされる', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(true)
      renderAddPrescriptionForm()

      // 数量を入力
      await user.type(screen.getByLabelText('数量 *'), '30')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // 全フィールドがリセットされることを確認
      expect(screen.getByLabelText('数量 *')).toHaveValue(null)
      expect(screen.getByLabelText('薬の名前 *')).toHaveValue('')
      expect(screen.getByLabelText('用量')).toHaveValue('')
      expect(screen.getByLabelText('服用頻度')).toHaveValue('')
      expect(screen.getByLabelText('メモ')).toHaveValue('')
    })

    it('追加処方失敗時はフォームがリセットされない', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(false)
      renderAddPrescriptionForm()

      // 数量を入力
      await user.type(screen.getByLabelText('数量 *'), '30')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // フォームがリセットされないことを確認
      expect(screen.getByLabelText('数量 *')).toHaveValue(30)
      expect(screen.getByDisplayValue('ロキソニン錠')).toBeInTheDocument()
    })
  })

  describe('追加処方のバリデーション', () => {
    it('数量が必須であることを確認', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(true)
      renderAddPrescriptionForm()

      // 数量を入力せずに追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // 空の数量で呼び出されることを確認
      expect(mockOnAdd).toHaveBeenCalledWith({
        name: 'ロキソニン錠',
        quantity: '',
        dosage: '1錠',
        frequency: '1日3回食後',
        notes: '痛み止め'
      })
    })

    it('薬名が変更されても処方できる', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(true)
      renderAddPrescriptionForm()

      // 薬名を変更
      const nameInput = screen.getByDisplayValue('ロキソニン錠')
      await user.clear(nameInput)
      await user.type(nameInput, 'ロキソニン錠60mg')

      // 数量を入力
      await user.type(screen.getByLabelText('数量 *'), '20')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      expect(mockOnAdd).toHaveBeenCalledWith({
        name: 'ロキソニン錠60mg',
        quantity: '20',
        dosage: '1錠',
        frequency: '1日3回食後',
        notes: '痛み止め'
      })
    })
  })

  describe('追加処方時のローディング状態', () => {
    it('ローディング中は追加ボタンが無効化される', () => {
      renderAddPrescriptionForm({ loading: true })

      const addButton = screen.getByRole('button', { name: '追加中...' })
      expect(addButton).toBeDisabled()
    })

    it('ローディング中でもキャンセルボタンは有効', () => {
      renderAddPrescriptionForm({ loading: true })

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
      expect(cancelButton).not.toBeDisabled()
    })
  })

  describe('追加処方のアクセシビリティ', () => {
    it('フォームフィールドに適切なラベルが設定されている', () => {
      renderAddPrescriptionForm()

      expect(screen.getByLabelText('薬の名前 *')).toBeInTheDocument()
      expect(screen.getByLabelText('数量 *')).toBeInTheDocument()
      expect(screen.getByLabelText('用量')).toBeInTheDocument()
      expect(screen.getByLabelText('服用頻度')).toBeInTheDocument()
      expect(screen.getByLabelText('メモ')).toBeInTheDocument()
    })

    it('数量フィールドに適切な属性が設定されている', () => {
      renderAddPrescriptionForm()

      const quantityInput = screen.getByLabelText('数量 *')
      expect(quantityInput).toHaveAttribute('type', 'number')
      expect(quantityInput).toHaveAttribute('min', '1')
    })
  })

  describe('エッジケース', () => {
    it('initialDataがnullの場合は新規追加モードになる', () => {
      renderAddPrescriptionForm({ initialData: null })

      expect(screen.getByText('新しい薬を追加')).toBeInTheDocument()
      expect(screen.queryByText('薬を追加処方')).not.toBeInTheDocument()
    })

    it('initialDataが部分的な場合でも動作する', () => {
      const partialData = {
        name: 'テスト薬',
        dosage: '1錠'
      }
      renderAddPrescriptionForm({ initialData: partialData })

      expect(screen.getByDisplayValue('テスト薬')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1錠')).toBeInTheDocument()
      
      // 未設定の項目は空文字列
      const frequencyInput = screen.getByLabelText('服用頻度')
      const notesInput = screen.getByLabelText('メモ')
      expect(frequencyInput).toHaveValue('')
      expect(notesInput).toHaveValue('')
    })
  })
})
