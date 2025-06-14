import { render, screen, userEvent } from '../../test-utils'
import RegisterForm from '../../../auth/RegisterForm'
import { resetApiMocks } from '../../test-utils'

// APIモジュールをモック
vi.mock('../../../utils/api', () => import('../../__mocks__/api'))

describe('RegisterForm', () => {
  const mockOnRegisterSuccess = vi.fn()
  const mockOnSwitchToLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks() // すべてのモックをクリア
    resetApiMocks()
    mockOnRegisterSuccess.mockClear()
    mockOnSwitchToLogin.mockClear()
  })

  const renderRegisterForm = () => {
    return render(
      <RegisterForm
        onRegisterSuccess={mockOnRegisterSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    )
  }

  describe('レンダリング', () => {
    it('必要な要素が表示される', () => {
      renderRegisterForm()

      expect(screen.getByText('薬管理システム')).toBeInTheDocument()
      expect(screen.getByText('新しいアカウントを作成してください')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('ユーザー名')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('メールアドレス')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('パスワード（6文字以上）')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('パスワードを再入力')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'アカウント作成' })).toBeInTheDocument()
      expect(screen.getByText('既にアカウントをお持ちの方はこちら')).toBeInTheDocument()
    })

    it('初期状態では入力フィールドが空である', () => {
      renderRegisterForm()

      expect(screen.getByPlaceholderText('ユーザー名')).toHaveValue('')
      expect(screen.getByPlaceholderText('メールアドレス')).toHaveValue('')
      expect(screen.getByPlaceholderText('パスワード（6文字以上）')).toHaveValue('')
      expect(screen.getByPlaceholderText('パスワードを再入力')).toHaveValue('')
    })
  })

  describe('フォーム入力', () => {
    it('ユーザー名を入力できる', async () => {
      const user = userEvent.setup()
      renderRegisterForm()

      const usernameInput = screen.getByPlaceholderText('ユーザー名')
      await user.type(usernameInput, 'testuser')

      expect(usernameInput).toHaveValue('testuser')
    })

    it('メールアドレスを入力できる', async () => {
      const user = userEvent.setup()
      renderRegisterForm()

      const emailInput = screen.getByPlaceholderText('メールアドレス')
      await user.type(emailInput, 'test@example.com')

      expect(emailInput).toHaveValue('test@example.com')
    })

    it('パスワードを入力できる', async () => {
      const user = userEvent.setup()
      renderRegisterForm()

      const passwordInput = screen.getByPlaceholderText('パスワード（6文字以上）')
      await user.type(passwordInput, 'password123')

      expect(passwordInput).toHaveValue('password123')
    })

    it('パスワード確認を入力できる', async () => {
      const user = userEvent.setup()
      renderRegisterForm()

      const confirmPasswordInput = screen.getByPlaceholderText('パスワードを再入力')
      await user.type(confirmPasswordInput, 'password123')

      expect(confirmPasswordInput).toHaveValue('password123')
    })
  })

  describe('バリデーション', () => {
    it('パスワードが一致しない場合エラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      renderRegisterForm()

      // フォームに入力（パスワードが一致しない）
      await user.type(screen.getByPlaceholderText('ユーザー名'), 'testuser')
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード（6文字以上）'), 'password123')
      await user.type(screen.getByPlaceholderText('パスワードを再入力'), 'differentpassword')

      // 登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'アカウント作成' }))

      // エラーメッセージが表示されることを確認
      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // API関数が呼ばれないことを確認
      const { register } = await import('../../../utils/api')
      expect(register).not.toHaveBeenCalled()

      // 成功コールバックが呼ばれないことを確認
      expect(mockOnRegisterSuccess).not.toHaveBeenCalled()
    })

    it('パスワードが6文字未満の場合エラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      renderRegisterForm()

      // フォームに入力（パスワードが短い）
      await user.type(screen.getByPlaceholderText('ユーザー名'), 'testuser')
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード（6文字以上）'), '12345')
      await user.type(screen.getByPlaceholderText('パスワードを再入力'), '12345')

      // 登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'アカウント作成' }))

      // エラーメッセージが表示されることを確認
      expect(screen.getByText('パスワードは6文字以上である必要があります')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // API関数が呼ばれないことを確認
      const { register } = await import('../../../utils/api')
      expect(register).not.toHaveBeenCalled()

      // 成功コールバックが呼ばれないことを確認
      expect(mockOnRegisterSuccess).not.toHaveBeenCalled()
    })
  })

  describe('フォーム送信', () => {
    it('正しい情報でユーザー登録が成功する', async () => {
      const user = userEvent.setup()
      renderRegisterForm()

      // フォームに入力
      await user.type(screen.getByPlaceholderText('ユーザー名'), 'testuser')
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード（6文字以上）'), 'password123')
      await user.type(screen.getByPlaceholderText('パスワードを再入力'), 'password123')

      // 登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'アカウント作成' }))

      // API関数が正しい引数で呼ばれることを確認
      const { register } = await import('../../../utils/api')
      expect(register).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })

      // 成功コールバックが呼ばれることを確認
      expect(mockOnRegisterSuccess).toHaveBeenCalledTimes(1)
    })

    it('登録中はローディング状態になる', async () => {
      const user = userEvent.setup()
      
      // 登録APIを遅延させる
      const { register } = await import('../../../utils/api')
      register.mockImplementation(() => new Promise(() => {}))

      renderRegisterForm()

      // フォームに入力
      await user.type(screen.getByPlaceholderText('ユーザー名'), 'testuser')
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード（6文字以上）'), 'password123')
      await user.type(screen.getByPlaceholderText('パスワードを再入力'), 'password123')

      // 登録ボタンをクリック
      const registerButton = screen.getByRole('button', { name: 'アカウント作成' })
      await user.click(registerButton)

      // ローディングスピナーが表示されることを確認
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

      // ボタンが無効化されることを確認
      expect(registerButton).toBeDisabled()
    })

    it('登録エラー時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      
      // 登録APIをエラーにする
      const { register } = await import('../../../utils/api')
      register.mockClear()
      register.mockRejectedValue(new Error('ユーザー登録に失敗しました'))

      renderRegisterForm()

      // 初期状態ではエラーメッセージが表示されていないことを確認
      expect(screen.queryByText('ユーザー登録に失敗しました')).not.toBeInTheDocument()

      // フォームに入力
      await user.type(screen.getByPlaceholderText('ユーザー名'), 'testuser')
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード（6文字以上）'), 'password123')
      await user.type(screen.getByPlaceholderText('パスワードを再入力'), 'password123')

      // 登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'アカウント作成' }))

      // エラーメッセージが表示されることを確認
      expect(await screen.findByText('ユーザー登録に失敗しました')).toBeInTheDocument()

      // ErrorAlertコンポーネントが表示されることを確認
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // 成功コールバックが呼ばれないことを確認
      expect(mockOnRegisterSuccess).not.toHaveBeenCalled()
    })

    it('再登録試行時にエラーメッセージがクリアされる', async () => {
      const user = userEvent.setup()
      
      // 最初はエラーにする
      const { register } = await import('../../../utils/api')
      register.mockRejectedValueOnce(new Error('ユーザー登録に失敗しました'))

      renderRegisterForm()

      // フォームに入力してエラーを発生させる
      await user.type(screen.getByPlaceholderText('ユーザー名'), 'testuser')
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード（6文字以上）'), 'password123')
      await user.type(screen.getByPlaceholderText('パスワードを再入力'), 'password123')
      await user.click(screen.getByRole('button', { name: 'アカウント作成' }))

      // エラーメッセージが表示されることを確認
      expect(await screen.findByText('ユーザー登録に失敗しました')).toBeInTheDocument()

      // 2回目は成功するようにモックを設定
      register.mockResolvedValueOnce({ 
        user: { id: 1, username: 'testuser', email: 'test@example.com' }, 
        token: 'token123' 
      })

      // 再度登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'アカウント作成' }))

      // エラーメッセージが消えることを確認
      expect(screen.queryByText('ユーザー登録に失敗しました')).not.toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('必須フィールドが空の場合は送信されない', async () => {
      const user = userEvent.setup()
      renderRegisterForm()

      // ユーザー名のみ入力（他のフィールドは空）
      await user.type(screen.getByPlaceholderText('ユーザー名'), 'testuser')

      // 登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'アカウント作成' }))

      // API関数が呼ばれないことを確認
      const { register } = await import('../../../utils/api')
      expect(register).not.toHaveBeenCalled()
    })
  })

  describe('ログイン画面への切り替え', () => {
    it('ログインリンクをクリックすると切り替えコールバックが呼ばれる', async () => {
      const user = userEvent.setup()
      renderRegisterForm()

      const loginLink = screen.getByText('既にアカウントをお持ちの方はこちら')
      await user.click(loginLink)

      expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1)
    })
  })

  describe('アクセシビリティ', () => {
    it('フォームフィールドに適切なラベルが設定されている', () => {
      renderRegisterForm()

      expect(screen.getByLabelText('ユーザー名')).toBeInTheDocument()
      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
      expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
      expect(screen.getByLabelText('パスワード確認')).toBeInTheDocument()
    })

    it('メールフィールドに適切なtype属性が設定されている', () => {
      renderRegisterForm()

      expect(screen.getByPlaceholderText('メールアドレス')).toHaveAttribute('type', 'email')
    })

    it('パスワードフィールドに適切なtype属性が設定されている', () => {
      renderRegisterForm()

      expect(screen.getByPlaceholderText('パスワード（6文字以上）')).toHaveAttribute('type', 'password')
      expect(screen.getByPlaceholderText('パスワードを再入力')).toHaveAttribute('type', 'password')
    })

    it('フォームフィールドに適切なautoComplete属性が設定されている', () => {
      renderRegisterForm()

      expect(screen.getByPlaceholderText('ユーザー名')).toHaveAttribute('autoComplete', 'username')
      expect(screen.getByPlaceholderText('メールアドレス')).toHaveAttribute('autoComplete', 'email')
      expect(screen.getByPlaceholderText('パスワード（6文字以上）')).toHaveAttribute('autoComplete', 'new-password')
      expect(screen.getByPlaceholderText('パスワードを再入力')).toHaveAttribute('autoComplete', 'new-password')
    })

    it('必須フィールドにrequired属性が設定されている', () => {
      renderRegisterForm()

      expect(screen.getByPlaceholderText('ユーザー名')).toBeRequired()
      expect(screen.getByPlaceholderText('メールアドレス')).toBeRequired()
      expect(screen.getByPlaceholderText('パスワード（6文字以上）')).toBeRequired()
      expect(screen.getByPlaceholderText('パスワードを再入力')).toBeRequired()
    })
  })

  describe('エラーハンドリング', () => {
    it('重複メールアドレスでの登録時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      
      // 重複メールアドレスエラーを設定
      const { register } = await import('../../../utils/api')
      register.mockClear()
      register.mockRejectedValue(new Error('このメールアドレスは既に使用されています'))

      renderRegisterForm()

      // フォームに入力（既存のメールアドレス）
      await user.type(screen.getByPlaceholderText('ユーザー名'), 'testuser')
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'existing@example.com')
      await user.type(screen.getByPlaceholderText('パスワード（6文字以上）'), 'password123')
      await user.type(screen.getByPlaceholderText('パスワードを再入力'), 'password123')

      // 登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'アカウント作成' }))

      // 重複エラーメッセージが表示されることを確認
      expect(await screen.findByText('このメールアドレスは既に使用されています')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // 成功コールバックが呼ばれないことを確認
      expect(mockOnRegisterSuccess).not.toHaveBeenCalled()
    })

    it('重複ユーザー名での登録時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      
      // 重複ユーザー名エラーを設定
      const { register } = await import('../../../utils/api')
      register.mockClear()
      register.mockRejectedValue(new Error('このユーザー名は既に使用されています'))

      renderRegisterForm()

      // フォームに入力（既存のユーザー名）
      await user.type(screen.getByPlaceholderText('ユーザー名'), 'existinguser')
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード（6文字以上）'), 'password123')
      await user.type(screen.getByPlaceholderText('パスワードを再入力'), 'password123')

      // 登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'アカウント作成' }))

      // 重複エラーメッセージが表示されることを確認
      expect(await screen.findByText('このユーザー名は既に使用されています')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // 成功コールバックが呼ばれないことを確認
      expect(mockOnRegisterSuccess).not.toHaveBeenCalled()
    })

    it('サーバーエラー時に適切なエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      
      // サーバーエラーを設定
      const { register } = await import('../../../utils/api')
      register.mockClear()
      register.mockRejectedValue(new Error('サーバーエラーが発生しました'))

      renderRegisterForm()

      // フォームに入力
      await user.type(screen.getByPlaceholderText('ユーザー名'), 'testuser')
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード（6文字以上）'), 'password123')
      await user.type(screen.getByPlaceholderText('パスワードを再入力'), 'password123')

      // 登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'アカウント作成' }))

      // サーバーエラーメッセージが表示されることを確認
      expect(await screen.findByText('サーバーエラーが発生しました')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // 成功コールバックが呼ばれないことを確認
      expect(mockOnRegisterSuccess).not.toHaveBeenCalled()
    })

    it('APIエラーでmessageプロパティがない場合はデフォルトメッセージが表示される', async () => {
      const user = userEvent.setup()
      
      // messageプロパティがないエラーを設定
      const { register } = await import('../../../utils/api')
      register.mockClear()
      register.mockRejectedValue(new Error())

      renderRegisterForm()

      // フォームに入力
      await user.type(screen.getByPlaceholderText('ユーザー名'), 'testuser')
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード（6文字以上）'), 'password123')
      await user.type(screen.getByPlaceholderText('パスワードを再入力'), 'password123')

      // 登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'アカウント作成' }))

      // デフォルトエラーメッセージが表示されることを確認
      expect(await screen.findByText('ユーザー登録に失敗しました')).toBeInTheDocument()
    })

    it('ネットワークエラー時に適切なエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      
      // ネットワークエラーを設定
      const { register } = await import('../../../utils/api')
      register.mockClear()
      register.mockRejectedValue(new Error('ネットワークエラーが発生しました'))

      renderRegisterForm()

      // フォームに入力
      await user.type(screen.getByPlaceholderText('ユーザー名'), 'testuser')
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード（6文字以上）'), 'password123')
      await user.type(screen.getByPlaceholderText('パスワードを再入力'), 'password123')

      // 登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'アカウント作成' }))

      // ネットワークエラーメッセージが表示されることを確認
      expect(await screen.findByText('ネットワークエラーが発生しました')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // 成功コールバックが呼ばれないことを確認
      expect(mockOnRegisterSuccess).not.toHaveBeenCalled()
    })
  })
})
