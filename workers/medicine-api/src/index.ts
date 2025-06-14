import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { secureHeaders } from 'hono/secure-headers';
import { validator } from 'hono/validator';
import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';

type Bindings = {
  DB: D1Database;
  JWT_SECRET?: string;
};

type Variables = {
  user: {
    userId: number;
    username: string;
    email: string;
  };
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// セキュリティヘッダーの設定
app.use('*', secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
  crossOriginEmbedderPolicy: false, // Cloudflare Workers互換性のため
}));

// レート制限機能（簡易実装）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (key: string, limit: number, windowMs: number): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
};

// JWT秘密鍵の取得（環境変数優先、フォールバック付き）
const getJWTSecret = (env: Bindings): string => {
  return env.JWT_SECRET || 'your-secret-key-change-this-in-production';
};

// CORS設定（デバッグ強化版）
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:8787'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// 全リクエストのログ
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.url} - Headers:`, c.req.header());
  await next();
});

// JWT認証ミドルウェア
const authenticateToken = async (c: any, next: any) => {
  const authHeader = c.req.header('authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return c.json({
      success: false,
      error: 'アクセストークンが必要です'
    }, 401);
  }

  try {
    const jwtSecret = getJWTSecret(c.env);
    const payload = await verify(token, jwtSecret);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({
      success: false,
      error: 'トークンが無効です'
    }, 403);
  }
};

// ===========================================================================
// 認証関連のAPI
// ===========================================================================

// 入力バリデーション関数
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6; // 既存ユーザーとの互換性のため緩和
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>'"&]/g, '');
};

// ユーザー登録（レート制限付き）
app.post('/api/auth/register', async (c) => {
  console.log('=== REGISTER ATTEMPT START ===');
  
  // レート制限チェック
  const clientIP = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  console.log('Register Client IP:', clientIP);
  
  if (!checkRateLimit(`register:${clientIP}`, 3, 15 * 60 * 1000)) {
    console.log('Rate limit exceeded for registration IP:', clientIP);
    return c.json({
      success: false,
      error: '登録試行回数が上限に達しました。15分後に再試行してください。'
    }, 429);
  }

  let requestBody;
  try {
    requestBody = await c.req.json();
    console.log('Register request body received:', { 
      username: requestBody.username, 
      email: requestBody.email, 
      hasPassword: !!requestBody.password
    });
  } catch (error) {
    console.error('Failed to parse register request body:', error);
    return c.json({
      success: false,
      error: 'リクエストの形式が正しくありません'
    }, 400);
  }

  const { username, email, password } = requestBody;

  // 入力検証
  if (!username || !email || !password) {
    return c.json({
      success: false,
      error: 'ユーザー名、メールアドレス、パスワードは必須です'
    }, 400);
  }

  // 詳細バリデーション
  if (!validateUsername(username)) {
    return c.json({
      success: false,
      error: 'ユーザー名は3-30文字の英数字とアンダースコアのみ使用可能です'
    }, 400);
  }

  if (!validateEmail(email)) {
    return c.json({
      success: false,
      error: '有効なメールアドレスを入力してください'
    }, 400);
  }

  if (!validatePassword(password)) {
    return c.json({
      success: false,
      error: 'パスワードは6文字以上である必要があります'
    }, 400);
  }

  // 入力サニタイゼーション
  const sanitizedUsername = sanitizeInput(username);
  const sanitizedEmail = sanitizeInput(email);

  try {
    // パスワードをハッシュ化
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ユーザーを作成
    const insertUser = `
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `;

    let result;
    try {
      result = await c.env.DB.prepare(insertUser)
        .bind(username, email, passwordHash)
        .run();
    } catch (dbError) {
      console.log('Database operation threw exception:', dbError);
      
      // UNIQUE制約エラーの検出（例外から）
      const errorString = String(dbError);
      if (errorString.includes('UNIQUE constraint failed')) {
        console.log('UNIQUE constraint error detected in exception:', errorString);
        
        if (errorString.includes('users.email')) {
          return c.json({
            success: false,
            error: 'このメールアドレスは既に登録されています。別のメールアドレスをお試しください。'
          }, 400);
        } else if (errorString.includes('users.username')) {
          return c.json({
            success: false,
            error: 'このユーザー名は既に使用されています。別のユーザー名をお試しください。'
          }, 400);
        } else {
          return c.json({
            success: false,
            error: 'ユーザー名またはメールアドレスが既に使用されています'
          }, 400);
        }
      }
      
      // その他のデータベースエラー
      console.error('Unexpected database exception:', dbError);
      throw dbError;
    }

    if (!result.success) {
      console.log('Database insert failed:', result.error);
      
      // UNIQUE制約エラーの検出を簡素化
      const errorString = String(result.error || '');
      if (errorString.includes('UNIQUE constraint failed')) {
        console.log('UNIQUE constraint error detected:', errorString);
        
        if (errorString.includes('users.email')) {
          return c.json({
            success: false,
            error: 'このメールアドレスは既に登録されています。別のメールアドレスをお試しください。'
          }, 400);
        } else if (errorString.includes('users.username')) {
          return c.json({
            success: false,
            error: 'このユーザー名は既に使用されています。別のユーザー名をお試しください。'
          }, 400);
        } else {
          return c.json({
            success: false,
            error: 'ユーザー名またはメールアドレスが既に使用されています'
          }, 400);
        }
      }
      
      console.error('Unexpected database error:', result.error);
      throw new Error('Database error');
    }

    // JWTトークンを生成
    const jwtSecret = getJWTSecret(c.env);
    const token = await sign(
      { userId: result.meta.last_row_id, username, email },
      jwtSecret
    );

    return c.json({
      success: true,
      data: {
        user: {
          id: result.meta.last_row_id,
          username,
          email
        },
        token
      }
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({
      success: false,
      error: 'ユーザー登録に失敗しました'
    }, 500);
  }
});

// ログイン（デバッグ強化版）
app.post('/api/auth/login', async (c) => {
  console.log('=== LOGIN ATTEMPT START ===');
  
  // レート制限チェック
  const clientIP = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  console.log('Client IP:', clientIP);
  
  if (!checkRateLimit(`login:${clientIP}`, 5, 15 * 60 * 1000)) {
    console.log('Rate limit exceeded for IP:', clientIP);
    return c.json({
      success: false,
      error: 'ログイン試行回数が上限に達しました。15分後に再試行してください。'
    }, 429);
  }

  let requestBody;
  try {
    requestBody = await c.req.json();
    console.log('Request body received:', { 
      email: requestBody.email, 
      hasPassword: !!requestBody.password
    });
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return c.json({
      success: false,
      error: 'リクエストの形式が正しくありません'
    }, 400);
  }

  const { email, password } = requestBody;

  // 入力検証
  if (!email || !password) {
    console.log('Missing email or password');
    return c.json({
      success: false,
      error: 'メールアドレスとパスワードは必須です'
    }, 400);
  }

  if (!validateEmail(email)) {
    console.log('Invalid email format:', email);
    return c.json({
      success: false,
      error: '有効なメールアドレスを入力してください'
    }, 400);
  }

  const sanitizedEmail = sanitizeInput(email);
  console.log('Sanitized email:', sanitizedEmail);

  try {
    // ユーザーを検索
    const selectUser = 'SELECT * FROM users WHERE email = ?';
    console.log('Executing query:', selectUser, 'with email:', sanitizedEmail);
    
    const user = await c.env.DB.prepare(selectUser).bind(sanitizedEmail).first();
    console.log('Database query result:', user ? 'User found' : 'User not found');

    if (!user) {
      console.log('No user found for email:', sanitizedEmail);
      return c.json({
        success: false,
        error: 'メールアドレスまたはパスワードが間違っています'
      }, 401);
    }

    // パスワードを検証
    console.log('User found:', { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: typeof user.password_hash === 'string' ? user.password_hash.length : 0
    });
    
    console.log('Comparing password with hash...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash as string);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password validation failed for user:', user.email);
      return c.json({
        success: false,
        error: 'メールアドレスまたはパスワードが間違っています'
      }, 401);
    }

    console.log('Login successful for user:', user.email);

    // JWTトークンを生成（有効期限24時間）
    const jwtSecret = getJWTSecret(c.env);
    const token = await sign(
      { 
        userId: user.id, 
        username: user.username, 
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24時間
      },
      jwtSecret
    );

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({
      success: false,
      error: 'ログインに失敗しました'
    }, 500);
  }
});

// ユーザー情報取得（認証確認用）
app.get('/api/auth/me', authenticateToken, async (c) => {
  const user = c.get('user');
  return c.json({
    success: true,
    data: {
      user: {
        id: user.userId,
        username: user.username,
        email: user.email
      }
    }
  });
});

// ===========================================================================
// 薬管理API（認証必須）
// ===========================================================================

// 薬一覧取得（ユーザー別）
app.get('/api/medicines', authenticateToken, async (c) => {
  const user = c.get('user');
  
  try {
    const query = `
      SELECT 
        id,
        name,
        quantity,
        dosage,
        frequency,
        notes,
        DATE(added_date) as added_date
      FROM medicines 
      WHERE user_id = ?
      ORDER BY added_date DESC
    `;

    const result = await c.env.DB.prepare(query).bind(user.userId).all();

    return c.json({
      success: true,
      data: result.results
    });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({
      success: false,
      error: 'データベースエラーが発生しました'
    }, 500);
  }
});

// 薬追加（ユーザー別）
app.post('/api/medicines', authenticateToken, async (c) => {
  const user = c.get('user');
  const { name, quantity, dosage, frequency, notes } = await c.req.json();

  if (!name || !quantity) {
    return c.json({
      success: false,
      error: '薬の名前と数量は必須です'
    }, 400);
  }

  try {
    const insertMedicine = `
      INSERT INTO medicines (user_id, name, quantity, dosage, frequency, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await c.env.DB.prepare(insertMedicine)
      .bind(user.userId, name, quantity, dosage || '', frequency || '', notes || '')
      .run();

    if (!result.success) {
      throw new Error('Database error');
    }

    // 履歴に追加
    const historyNotes = [dosage, frequency].filter(Boolean).join(', ');
    const insertHistory = `
      INSERT INTO medicine_history (user_id, action, medicine_name, quantity, notes)
      VALUES (?, ?, ?, ?, ?)
    `;

    await c.env.DB.prepare(insertHistory)
      .bind(user.userId, '処方追加', name, quantity, historyNotes)
      .run();

    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        name,
        quantity,
        dosage,
        frequency,
        notes
      }
    }, 201);
  } catch (error) {
    console.error('Database error:', error);
    return c.json({
      success: false,
      error: 'データベースエラーが発生しました'
    }, 500);
  }
});

// 既存の薬に在庫を追加（ユーザー別）
app.put('/api/medicines/:id/add-stock', authenticateToken, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const { quantity, notes } = await c.req.json();

  if (!quantity || quantity <= 0) {
    return c.json({
      success: false,
      error: '追加する数量は必須です'
    }, 400);
  }

  try {
    // 現在の薬情報を取得（ユーザー確認含む）
    const selectQuery = 'SELECT * FROM medicines WHERE id = ? AND user_id = ?';
    const medicine = await c.env.DB.prepare(selectQuery).bind(id, user.userId).first();

    if (!medicine) {
      return c.json({
        success: false,
        error: '薬が見つかりません'
      }, 404);
    }

    // 在庫を追加
    const updateQuery = `
      UPDATE medicines 
      SET quantity = quantity + ?, updated_date = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;

    const updateResult = await c.env.DB.prepare(updateQuery)
      .bind(quantity, id, user.userId)
      .run();

    if (!updateResult.success) {
      throw new Error('Database error');
    }

    // 履歴に追加
    const historyNotes = notes ? `追加処方 - ${notes}` : '追加処方';
    const insertHistory = `
      INSERT INTO medicine_history (user_id, action, medicine_name, quantity, notes)
      VALUES (?, ?, ?, ?, ?)
    `;

    await c.env.DB.prepare(insertHistory)
      .bind(user.userId, '追加処方', medicine.name, quantity, historyNotes)
      .run();

    return c.json({
      success: true,
      data: {
        ...medicine,
        quantity: (medicine.quantity as number) + quantity
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({
      success: false,
      error: 'データベースエラーが発生しました'
    }, 500);
  }
});

// 薬服用（ユーザー別）
app.put('/api/medicines/:id', authenticateToken, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const { action } = await c.req.json();

  if (action === 'take') {
    try {
      // 現在の薬情報を取得（ユーザー確認含む）
      const selectQuery = 'SELECT * FROM medicines WHERE id = ? AND user_id = ?';
      const medicine = await c.env.DB.prepare(selectQuery).bind(id, user.userId).first();

      if (!medicine) {
        return c.json({
          success: false,
          error: '薬が見つかりません'
        }, 404);
      }

      if ((medicine.quantity as number) <= 0) {
        return c.json({
          success: false,
          error: '在庫がありません'
        }, 400);
      }

      // 在庫を1減らす
      const updateQuery = `
        UPDATE medicines 
        SET quantity = quantity - 1, updated_date = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;

      const updateResult = await c.env.DB.prepare(updateQuery)
        .bind(id, user.userId)
        .run();

      if (!updateResult.success) {
        throw new Error('Database error');
      }

      // 履歴に追加
      const insertHistory = `
        INSERT INTO medicine_history (user_id, action, medicine_name, quantity)
        VALUES (?, ?, ?, ?)
      `;

      await c.env.DB.prepare(insertHistory)
        .bind(user.userId, '服用', medicine.name, 1)
        .run();

      return c.json({
        success: true,
        data: {
          ...medicine,
          quantity: (medicine.quantity as number) - 1
        }
      });
    } catch (error) {
      console.error('Database error:', error);
      return c.json({
        success: false,
        error: 'データベースエラーが発生しました'
      }, 500);
    }
  } else {
    return c.json({
      success: false,
      error: '無効なアクションです'
    }, 400);
  }
});

// 薬削除（ユーザー別）
app.delete('/api/medicines/:id', authenticateToken, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  try {
    // まず薬の名前を取得（ユーザー確認含む）
    const selectQuery = 'SELECT name FROM medicines WHERE id = ? AND user_id = ?';
    const medicine = await c.env.DB.prepare(selectQuery).bind(id, user.userId).first();

    if (!medicine) {
      return c.json({
        success: false,
        error: '薬が見つかりません'
      }, 404);
    }

    // 薬を削除
    const deleteQuery = 'DELETE FROM medicines WHERE id = ? AND user_id = ?';
    const deleteResult = await c.env.DB.prepare(deleteQuery).bind(id, user.userId).run();

    if (!deleteResult.success) {
      throw new Error('Database error');
    }

    return c.json({
      success: true,
      message: `${medicine.name}を削除しました`
    });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({
      success: false,
      error: 'データベースエラーが発生しました'
    }, 500);
  }
});

// 履歴取得（ユーザー別）
app.get('/api/history', authenticateToken, async (c) => {
  const user = c.get('user');

  try {
    const query = `
      SELECT 
        id,
        action,
        medicine_name,
        quantity,
        notes,
        DATETIME(created_date, 'localtime') as date
      FROM medicine_history 
      WHERE user_id = ?
      ORDER BY created_date DESC
      LIMIT 50
    `;

    const result = await c.env.DB.prepare(query).bind(user.userId).all();

    return c.json({
      success: true,
      data: result.results
    });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({
      success: false,
      error: 'データベースエラーが発生しました'
    }, 500);
  }
});

// ヘルスチェック
app.get('/api/health', async (c) => {
  return c.json({
    success: true,
    message: 'Server is running with authentication',
    timestamp: new Date().toISOString()
  });
});

export default app;
