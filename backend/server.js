import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// SQLiteデータベース接続
const dbPath = join(__dirname, 'medicine.db');
const db = new sqlite3.Database(dbPath);

// データベース初期化
db.serialize(() => {
  // 薬テーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      dosage VARCHAR(100),
      frequency VARCHAR(100),
      notes TEXT,
      added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 履歴テーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS medicine_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action VARCHAR(50) NOT NULL,
      medicine_name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL,
      notes TEXT,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// API Routes

// 薬一覧取得
app.get('/api/medicines', (req, res) => {
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
    ORDER BY added_date DESC
  `;

  db.all(query, [], (err, rows) => {
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

// 薬追加
app.post('/api/medicines', (req, res) => {
  const { name, quantity, dosage, frequency, notes } = req.body;

  if (!name || !quantity) {
    return res.status(400).json({
      success: false,
      error: '薬の名前と数量は必須です'
    });
  }

  const insertMedicine = `
    INSERT INTO medicines (name, quantity, dosage, frequency, notes)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(insertMedicine, [name, quantity, dosage || '', frequency || '', notes || ''], function(err) {
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
      INSERT INTO medicine_history (action, medicine_name, quantity, notes)
      VALUES (?, ?, ?, ?)
    `;

    db.run(insertHistory, ['処方追加', name, quantity, historyNotes], (historyErr) => {
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

// 薬服用（在庫を1減らす）
app.put('/api/medicines/:id', (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (action === 'take') {
    // 現在の薬情報を取得
    const selectQuery = 'SELECT * FROM medicines WHERE id = ?';
    
    db.get(selectQuery, [id], (err, medicine) => {
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
        WHERE id = ?
      `;

      db.run(updateQuery, [id], function(updateErr) {
        if (updateErr) {
          console.error('Database error:', updateErr);
          return res.status(500).json({
            success: false,
            error: 'データベースエラーが発生しました'
          });
        }

        // 履歴に追加
        const insertHistory = `
          INSERT INTO medicine_history (action, medicine_name, quantity)
          VALUES (?, ?, ?)
        `;

        db.run(insertHistory, ['服用', medicine.name, 1], (historyErr) => {
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

// 薬削除
app.delete('/api/medicines/:id', (req, res) => {
  const { id } = req.params;

  // まず薬の名前を取得
  const selectQuery = 'SELECT name FROM medicines WHERE id = ?';
  
  db.get(selectQuery, [id], (err, medicine) => {
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
    const deleteQuery = 'DELETE FROM medicines WHERE id = ?';
    
    db.run(deleteQuery, [id], function(deleteErr) {
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

// 履歴取得
app.get('/api/history', (req, res) => {
  const query = `
    SELECT 
      id,
      action,
      medicine_name,
      quantity,
      notes,
      DATETIME(created_date, 'localtime') as date
    FROM medicine_history 
    ORDER BY created_date DESC
    LIMIT 50
  `;

  db.all(query, [], (err, rows) => {
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
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET    /api/medicines - 薬一覧取得`);
  console.log(`   POST   /api/medicines - 薬追加`);
  console.log(`   PUT    /api/medicines/:id - 薬服用`);
  console.log(`   DELETE /api/medicines/:id - 薬削除`);
  console.log(`   GET    /api/history - 履歴取得`);
  console.log(`   GET    /api/health - ヘルスチェック`);
});
