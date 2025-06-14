import { render, screen, userEvent } from '../../test-utils'
import AddMedicineForm from '../../../medicine/AddMedicineForm'

describe('AddMedicineForm', () => {
  const mockOnAdd = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAdd.mockClear()
    mockOnCancel.mockClear()
  })

  const renderAddMedicineForm = (props = {}) => {
    const defaultProps = {
      onAdd: mockOnAdd,
      onCancel: mockOnCancel,
      loading: false,
      ...props
    }
    return render(<AddMedicineForm {...defaultProps} />)
  }

  describe('レンダリング', () => {
    it('必要な要素が表示される', () => {
      renderAddMedicineForm()

      expect(screen.getByText('新しい薬を追加')).toBeInTheDocument()
      expect(screen.getByLabelText('薬の名前 *')).toBeInTheDocument()
      expect(screen.getByLabelText('数量 *')).toBeInTheDocument()
      expect(screen.getByLabelText('用量')).toBeInTheDocument()
      expect(screen.getByLabelText('服用頻度')).toBeInTheDocument()
      expect(screen.getByLabelText('メモ')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument()
    })

    it('初期状態では全ての入力フィールドが空である', () => {
      renderAddMedicineForm()

      expect(screen.getByPlaceholderText('例：ロキソニン錠')).toHaveValue('')
      expect(screen.getByPlaceholderText('例：30')).toHaveValue(null)
      expect(screen.getByPlaceholderText('例：1錠')).toHaveValue('')
      expect(screen.getByPlaceholderText('例：1日3回食後')).toHaveValue('')
      expect(screen.getByPlaceholderText('例：副作用の注意点など')).toHaveValue('')
    })

    it('ローディング中は追加ボタンのテキストが変わる', () => {
      renderAddMedicineForm({ loading: true })

      expect(screen.getByRole('button', { name: '追加中...' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '追加中...' })).toBeDisabled()
    })
  })

  describe('フォーム入力', () => {
    it('薬の名前を入力できる', async () => {
      const user = userEvent.setup()
      renderAddMedicineForm()

      const nameInput = screen.getByPlaceholderText('例：ロキソニン錠')
      await user.type(nameInput, 'テスト薬')

      expect(nameInput).toHaveValue('テスト薬')
    })

    it('数量を入力できる', async () => {
      const user = userEvent.setup()
      renderAddMedicineForm()

      const quantityInput = screen.getByPlaceholderText('例：30')
      await user.type(quantityInput, '50')

      expect(quantityInput).toHaveValue(50)
    })

    it('用量を入力できる', async () => {
      const user = userEvent.setup()
      renderAddMedicineForm()

      const dosageInput = screen.getByPlaceholderText('例：1錠')
      await user.type(dosageInput, '2錠')

      expect(dosageInput).toHaveValue('2錠')
    })

    it('服用頻度を入力できる', async () => {
      const user = userEvent.setup()
      renderAddMedicineForm()

      const frequencyInput = screen.getByPlaceholderText('例：1日3回食後')
      await user.type(frequencyInput, '1日2回')

      expect(frequencyInput).toHaveValue('1日2回')
    })

    it('メモを入力できる', async () => {
      const user = userEvent.setup()
      renderAddMedicineForm()

      const notesInput = screen.getByPlaceholderText('例：副作用の注意点など')
      await user.type(notesInput, 'テスト用のメモ')

      expect(notesInput).toHaveValue('テスト用のメモ')
    })
  })

  describe('フォーム送信', () => {
    it('正しい情報で薬の追加が成功する', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(true)
      renderAddMedicineForm()

      // フォームに入力
      await user.type(screen.getByPlaceholderText('例：ロキソニン錠'), 'テスト薬')
      await user.type(screen.getByPlaceholderText('例：30'), '50')
      await user.type(screen.getByPlaceholderText('例：1錠'), '2錠')
      await user.type(screen.getByPlaceholderText('例：1日3回食後'), '1日2回')
      await user.type(screen.getByPlaceholderText('例：副作用の注意点など'), 'テスト用メモ')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // onAdd関数が正しい引数で呼ばれることを確認
      expect(mockOnAdd).toHaveBeenCalledWith({
        name: 'テスト薬',
        quantity: '50',
        dosage: '2錠',
        frequency: '1日2回',
        notes: 'テスト用メモ'
      })
    })

    it('追加成功時にフォームがリセットされる', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(true)
      renderAddMedicineForm()

      // フォームに入力
      await user.type(screen.getByPlaceholderText('例：ロキソニン錠'), 'テスト薬')
      await user.type(screen.getByPlaceholderText('例：30'), '50')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // フォームがリセットされることを確認
      expect(screen.getByPlaceholderText('例：ロキソニン錠')).toHaveValue('')
      expect(screen.getByPlaceholderText('例：30')).toHaveValue(null)
    })

    it('追加失敗時はフォームがリセットされない', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(false)
      renderAddMedicineForm()

      // フォームに入力
      await user.type(screen.getByPlaceholderText('例：ロキソニン錠'), 'テスト薬')
      await user.type(screen.getByPlaceholderText('例：30'), '50')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // フォームがリセットされないことを確認
      expect(screen.getByPlaceholderText('例：ロキソニン錠')).toHaveValue('テスト薬')
      expect(screen.getByPlaceholderText('例：30')).toHaveValue(50)
    })

    it('必須項目のみで追加できる', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(true)
      renderAddMedicineForm()

      // 必須項目のみ入力
      await user.type(screen.getByPlaceholderText('例：ロキソニン錠'), 'テスト薬')
      await user.type(screen.getByPlaceholderText('例：30'), '30')

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }))

      // onAdd関数が呼ばれることを確認
      expect(mockOnAdd).toHaveBeenCalledWith({
        name: 'テスト薬',
        quantity: '30',
        dosage: '',
        frequency: '',
        notes: ''
      })
    })
  })

  describe('キャンセル機能', () => {
    it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
      const user = userEvent.setup()
      renderAddMedicineForm()

      await user.click(screen.getByRole('button', { name: 'キャンセル' }))

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('フォームバリデーション', () => {
    it('数量フィールドにmin属性が設定されている', () => {
      renderAddMedicineForm()

      const quantityInput = screen.getByPlaceholderText('例：30')
      expect(quantityInput).toHaveAttribute('min', '1')
      expect(quantityInput).toHaveAttribute('type', 'number')
    })
  })

  describe('アクセシビリティ', () => {
    it('必須フィールドに適切なラベルが設定されている', () => {
      renderAddMedicineForm()

      expect(screen.getByLabelText('薬の名前 *')).toBeInTheDocument()
      expect(screen.getByLabelText('数量 *')).toBeInTheDocument()
    })

    it('オプションフィールドに適切なラベルが設定されている', () => {
      renderAddMedicineForm()

      expect(screen.getByLabelText('用量')).toBeInTheDocument()
      expect(screen.getByLabelText('服用頻度')).toBeInTheDocument()
      expect(screen.getByLabelText('メモ')).toBeInTheDocument()
    })
  })
})
