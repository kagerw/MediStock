import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key-change-this-in-production'; // 本番環境では環境変数を使用

// ミドルウェア
app.use(cors());
app.use(express.json());

// SQLiteデータベース接続
const dbPath = join(__dirname, 'medicine_auth.db');
const db = new sqlite3.Database(dbPath);

// データベース初期化
db.serialize(() => {
  // ユーザーテーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 薬テーブル（user_id追加）
  db.run(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      dosage VARCHAR(100),
      frequency VARCHAR(100),
      notes TEXT,
      added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // 履歴テーブル（user_id追加）
  db.run(`
    CREATE TABLE IF NOT EXISTS medicine_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action VARCHAR(50) NOT NULL,
      medicine_name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL,
      notes TEXT,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
});

// JWT認証ミドルウェア
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'アクセストークンが必要です'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'トークンが無効です'
      });
    }
    req.user = user;
    next();
  });
};

// ===========================================================================
// 認証関連のAPI
// ===========================================================================

// ユーザー登録
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'ユーザー名、メールアドレス、パスワードは必須です'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'パスワードは6文字以上である必要があります'
    });
  }

  try {
    // パスワードをハッシュ化
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ユーザーを作成
    const insertUser = `
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `;

    db.run(insertUser, [username, email, passwordHash], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({
            success: false,
            error: 'ユーザー名またはメールアドレスが既に使用されています'
          });
        }
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'ユーザー登録に失敗しました'
        });
      }

      // JWTトークンを生成
      const token = jwt.sign(
        { userId: this.lastID, username, email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: this.lastID,
            username,
            email
          },
          token
        }
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'ユーザー登録に失敗しました'
    });
  }
});

// ログイン
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'メールアドレスとパスワードは必須です'
    });
  }

  // ユーザーを検索
  const selectUser = 'SELECT * FROM users WHERE email = ?';
  
  db.get(selectUser, [email], async (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'ログインに失敗しました'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'メールアドレスまたはパスワードが間違っています'
      });
    }

    try {
      // パスワードを検証
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'メールアドレスまたはパスワードが間違っています'
        });
      }

      // JWTトークンを生成
      const token = jwt.sign(
        { userId: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
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
      res.status(500).json({
        success: false,
        error: 'ログインに失敗しました'
      });
    }
  });
});

// ユーザー情報取得（認証確認用）
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.userId,
        username: req.user.username,
        email: req.user.email
      }
    }
  });
});

// ===========================================================================
// 薬管理API（認証必須）
// ===========================================================================

// 薬一覧取得（ユーザー別）
app.get('/api/medicines', authenticateToken, (req, res) => {
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

  db.all(query, [req.user.userId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'データベースエラーが発生しました'
      });
    }

    res.json({
      success: true,
      data: rows
    });
  });
});

// 薬追加（ユーザー別）
app.post('/api/medicines', authenticateToken, (req, res) => {
  const { name, quantity, dosage, frequency, notes } = req.body;

  if (!name || !quantity) {
    return res.status(400).json({
      success: false,
      error: '薬の名前と数量は必須です'
    });
  }

  const insertMedicine = `
    INSERT INTO medicines (user_id, name, quantity, dosage, frequency, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(insertMedicine, [req.user.userId, name, quantity, dosage || '', frequency || '', notes || ''], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'データベースエラーが発生しました'
      });
    }

    // 履歴に追加
    const historyNotes = [dosage, frequency].filter(Boolean).join(', ');
    const insertHistory = `
      INSERT INTO medicine_history (user_id, action, medicine_name, quantity, notes)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.run(insertHistory, [req.user.userId, '処方追加', name, quantity, historyNotes], (historyErr) => {
      if (historyErr) {
        console.error('History insert error:', historyErr);
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: this.lastID,
        name,
        quantity,
        dosage,
        frequency,
        notes
      }
    });
  });
});

// 既存の薬に在庫を追加（ユーザー別）
app.put('/api/medicines/:id/add-stock', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { quantity, notes } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      error: '追加する数量は必須です'
    });
  }

  // 現在の薬情報を取得（ユーザー確認含む）
  const selectQuery = 'SELECT * FROM medicines WHERE id = ? AND user_id = ?';
  
  db.get(selectQuery, [id, req.user.userId], (err, medicine) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'データベースエラーが発生しました'
      });
    }

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: '薬が見つかりません'
      });
    }

    // 在庫を追加
    const updateQuery = `
      UPDATE medicines 
      SET quantity = quantity + ?, updated_date = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;

    db.run(updateQuery, [quantity, id, req.user.userId], function(updateErr) {
      if (updateErr) {
        console.error('Database error:', updateErr);
        return res.status(500).json({
          success: false,
          error: 'データベースエラーが発生しました'
        });
      }

      // 履歴に追加
      const historyNotes = notes ? `追加処方 - ${notes}` : '追加処方';
      const insertHistory = `
        INSERT INTO medicine_history (user_id, action, medicine_name, quantity, notes)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.run(insertHistory, [req.user.userId, '追加処方', medicine.name, quantity, historyNotes], (historyErr) => {
        if (historyErr) {
          console.error('History insert error:', historyErr);
        }
      });

      res.json({
        success: true,
        data: {
          ...medicine,
          quantity: medicine.quantity + quantity
        }
      });
    });
  });
});

// 薬服用（ユーザー別）
app.put('/api/medicines/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (action === 'take') {
    // 現在の薬情報を取得（ユーザー確認含む）
    const selectQuery = 'SELECT * FROM medicines WHERE id = ? AND user_id = ?';
    
    db.get(selectQuery, [id, req.user.userId], (err, medicine) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'データベースエラーが発生しました'
        });
      }

      if (!medicine) {
        return res.status(404).json({
          success: false,
          error: '薬が見つかりません'
        });
      }

      if (medicine.quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: '在庫がありません'
        });
      }

      // 在庫を1減らす
      const updateQuery = `
        UPDATE medicines 
        SET quantity = quantity - 1, updated_date = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;

      db.run(updateQuery, [id, req.user.userId], function(updateErr) {
        if (updateErr) {
          console.error('Database error:', updateErr);
          return res.status(500).json({
            success: false,
            error: 'データベースエラーが発生しました'
          });
        }

        // 履歴に追加
        const insertHistory = `
          INSERT INTO medicine_history (user_id, action, medicine_name, quantity)
          VALUES (?, ?, ?, ?)
        `;

        db.run(insertHistory, [req.user.userId, '服用', medicine.name, 1], (historyErr) => {
          if (historyErr) {
            console.error('History insert error:', historyErr);
          }
        });

        res.json({
          success: true,
          data: {
            ...medicine,
            quantity: medicine.quantity - 1
          }
        });
      });
    });
  } else {
    res.status(400).json({
      success: false,
      error: '無効なアクションです'
    });
  }
});

// 薬削除（ユーザー別）
app.delete('/api/medicines/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // まず薬の名前を取得（ユーザー確認含む）
  const selectQuery = 'SELECT name FROM medicines WHERE id = ? AND user_id = ?';
  
  db.get(selectQuery, [id, req.user.userId], (err, medicine) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'データベースエラーが発生しました'
      });
    }

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: '薬が見つかりません'
      });
    }

    // 薬を削除
    const deleteQuery = 'DELETE FROM medicines WHERE id = ? AND user_id = ?';
    
    db.run(deleteQuery, [id, req.user.userId], function(deleteErr) {
      if (deleteErr) {
        console.error('Database error:', deleteErr);
        return res.status(500).json({
          success: false,
          error: 'データベースエラーが発生しました'
        });
      }

      res.json({
        success: true,
        message: `${medicine.name}を削除しました`
      });
    });
  });
});

// 履歴取得（ユーザー別）
app.get('/api/history', authenticateToken, (req, res) => {
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

  db.all(query, [req.user.userId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'データベースエラーが発生しました'
      });
    }

    res.json({
      success: true,
      data: rows
    });
  });
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running with authentication',
    timestamp: new Date().toISOString()
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔐 Authentication enabled`);
  console.log(`📊 API endpoints:`);
  console.log(`   POST   /api/auth/register - ユーザー登録`);
  console.log(`   POST   /api/auth/login - ログイン`);
  console.log(`   GET    /api/auth/me - ユーザー情報取得`);
  console.log(`   GET    /api/medicines - 薬一覧取得 (認証必須)`);
  console.log(`   POST   /api/medicines - 薬新規追加 (認証必須)`);
  console.log(`   PUT    /api/medicines/:id/add-stock - 既存薬に在庫追加 (認証必須)`);
  console.log(`   PUT    /api/medicines/:id - 薬服用 (認証必須)`);
  console.log(`   DELETE /api/medicines/:id - 薬削除 (認証必須)`);
  console.log(`   GET    /api/history - 履歴取得 (認証必須)`);
  console.log(`   GET    /api/health - ヘルスチェック`);
});
