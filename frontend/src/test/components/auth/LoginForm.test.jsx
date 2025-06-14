import { render, screen, userEvent } from '../../test-utils'
import LoginForm from '../../../auth/LoginForm'
import { resetApiMocks } from '../../test-utils'

// APIモジュールをモック
vi.mock('../../../utils/api', () => import('../../__mocks__/api'))

describe('LoginForm', () => {
  const mockOnLoginSuccess = vi.fn()
  const mockOnSwitchToRegister = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks() // すべてのモックをクリア
    resetApiMocks()
    mockOnLoginSuccess.mockClear()
    mockOnSwitchToRegister.mockClear()
  })

  const renderLoginForm = () => {
    return render(
      <LoginForm
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    )
  }

  describe('レンダリング', () => {
    it('必要な要素が表示される', () => {
      renderLoginForm()

      expect(screen.getByText('薬管理システム')).toBeInTheDocument()
      expect(screen.getByText('アカウントにログインしてください')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('メールアドレス')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('パスワード')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
      expect(screen.getByText('アカウントをお持ちでない方はこちら')).toBeInTheDocument()
    })

    it('初期状態では入力フィールドが空である', () => {
      renderLoginForm()

      expect(screen.getByPlaceholderText('メールアドレス')).toHaveValue('')
      expect(screen.getByPlaceholderText('パスワード')).toHaveValue('')
    })
  })

  describe('フォーム入力', () => {
    it('メールアドレスを入力できる', async () => {
      const user = userEvent.setup()
      renderLoginForm()

      const emailInput = screen.getByPlaceholderText('メールアドレス')
      await user.type(emailInput, 'test@example.com')

      expect(emailInput).toHaveValue('test@example.com')
    })

    it('パスワードを入力できる', async () => {
      const user = userEvent.setup()
      renderLoginForm()

      const passwordInput = screen.getByPlaceholderText('パスワード')
      await user.type(passwordInput, 'password123')

      expect(passwordInput).toHaveValue('password123')
    })
  })

  describe('フォーム送信', () => {
    mockOnLoginSuccess.mockClear()
    it('正しい情報でログインが成功する', async () => {
      const user = userEvent.setup()
      renderLoginForm()

      // フォームに入力
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード'), 'password123')

      // ログインボタンをクリック
      await user.click(screen.getByRole('button', { name: 'ログイン' }))

      // API関数が呼ばれることを確認
      const { login } = await import('../../../utils/api')
      expect(login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })

      // 成功コールバックが呼ばれることを確認
      expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1)
    })

    it('ログイン中はローディング状態になる', async () => {
      const user = userEvent.setup()
      
      // ログインAPIを遅延させる
      const { login } = await import('../../../utils/api')
      // login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      login.mockImplementation(() => new Promise(() => {}))

      renderLoginForm()

      // フォームに入力
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード'), 'password123')

      // ログインボタンをクリック
      const loginButton = screen.getByRole('button', { name: 'ログイン' })
      await user.click(loginButton)

      // ローディングスピナーが表示されることを確認
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

      // ボタンが無効化されることを確認
      expect(loginButton).toBeDisabled()
    })

    it('ログインエラー時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      
      // ログインAPIをエラーにする（レンダリング前に設定）
      const { login } = await import('../../../utils/api')
      login.mockClear()
      login.mockRejectedValue(new Error('認証に失敗しました'))

      renderLoginForm()

      // 初期状態ではエラーメッセージが表示されていないことを確認
      expect(screen.queryByText('認証に失敗しました')).not.toBeInTheDocument()

      // フォームに入力
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード'), 'wrongpassword')

      // ログインボタンをクリック
      await user.click(screen.getByRole('button', { name: 'ログイン' }))

      // エラーメッセージが表示されることを確認
      expect(await screen.findByText('認証に失敗しました')).toBeInTheDocument()

      // ErrorAlertコンポーネントが表示されることを確認
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // 成功コールバックが呼ばれないことを確認
      expect(mockOnLoginSuccess).not.toHaveBeenCalled()
    })

    it('再ログイン試行時にエラーメッセージがクリアされる', async () => {
      const user = userEvent.setup()
      
      // 最初はエラーにする
      const { login } = await import('../../../utils/api')
      login.mockRejectedValueOnce(new Error('認証に失敗しました'))

      renderLoginForm()

      // フォームに入力してエラーを発生させる
      await user.type(screen.getByPlaceholderText('メールアドレス'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('パスワード'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: 'ログイン' }))

      // エラーメッセージが表示されることを確認
      expect(await screen.findByText('認証に失敗しました')).toBeInTheDocument()

      // 2回目は成功するようにモックを設定
      login.mockResolvedValueOnce({ user: { id: 1, email: 'test@example.com' }, token: 'token123' })

      // 再度ログインボタンをクリック
      await user.click(screen.getByRole('button', { name: 'ログイン' }))

      // エラーメッセージが消えることを確認
      expect(screen.queryByText('認証に失敗しました')).not.toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('必須フィールドが空の場合は送信されない', async () => {
      const user = userEvent.setup()
      renderLoginForm()

      // パスワードのみ入力（メールアドレスは空）
      await user.type(screen.getByPlaceholderText('パスワード'), 'password123')

      // ログインボタンをクリック
      await user.click(screen.getByRole('button', { name: 'ログイン' }))

      // API関数が呼ばれないことを確認
      const { login } = await import('../../../utils/api')
      expect(login).not.toHaveBeenCalled()
    })
  })

  describe('登録画面への切り替え', () => {
    it('登録リンクをクリックすると切り替えコールバックが呼ばれる', async () => {
      const user = userEvent.setup()
      renderLoginForm()

      const registerLink = screen.getByText('アカウントをお持ちでない方はこちら')
      await user.click(registerLink)

      expect(mockOnSwitchToRegister).toHaveBeenCalledTimes(1)
    })
  })

  describe('アクセシビリティ', () => {
    it('フォームフィールドに適切なラベルが設定されている', () => {
      renderLoginForm()

      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
      expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    })

    it('メールフィールドに適切なtype属性が設定されている', () => {
      renderLoginForm()

      expect(screen.getByPlaceholderText('メールアドレス')).toHaveAttribute('type', 'email')
    })

    it('パスワードフィールドに適切なtype属性が設定されている', () => {
      renderLoginForm()

      expect(screen.getByPlaceholderText('パスワード')).toHaveAttribute('type', 'password')
    })
  })
})
