import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 既存のSQLiteデータベースのパス
const sourceDbPath = join(__dirname, '../backend/medicine_auth.db');
const outputDir = join(__dirname, '../database');
const outputFile = join(outputDir, 'migration-data.sql');

// 出力ディレクトリが存在しない場合は作成
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🔄 データ移行を開始します...');
console.log(`📂 ソースDB: ${sourceDbPath}`);
console.log(`📄 出力ファイル: ${outputFile}`);

// SQLiteデータベースに接続
const db = new sqlite3.Database(sourceDbPath, (err) => {
  if (err) {
    console.error('❌ データベース接続エラー:', err.message);
    process.exit(1);
  }
  console.log('✅ SQLiteデータベースに接続しました');
});

let sqlStatements = [];

// ユーザーデータを取得
const exportUsers = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`👥 ${rows.length}件のユーザーデータを取得しました`);
      
      rows.forEach(row => {
        const sql = `INSERT INTO users (id, username, email, password_hash, created_date) VALUES (${row.id}, '${row.username.replace(/'/g, "''")}', '${row.email.replace(/'/g, "''")}', '${row.password_hash.replace(/'/g, "''")}', '${row.created_date}');`;
        sqlStatements.push(sql);
      });
      
      resolve();
    });
  });
};

// 薬データを取得
const exportMedicines = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM medicines', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`💊 ${rows.length}件の薬データを取得しました`);
      
      rows.forEach(row => {
        const dosage = row.dosage ? row.dosage.replace(/'/g, "''") : '';
        const frequency = row.frequency ? row.frequency.replace(/'/g, "''") : '';
        const notes = row.notes ? row.notes.replace(/'/g, "''") : '';
        
        const sql = `INSERT INTO medicines (id, user_id, name, quantity, dosage, frequency, notes, added_date, updated_date) VALUES (${row.id}, ${row.user_id}, '${row.name.replace(/'/g, "''")}', ${row.quantity}, '${dosage}', '${frequency}', '${notes}', '${row.added_date}', '${row.updated_date}');`;
        sqlStatements.push(sql);
      });
      
      resolve();
    });
  });
};

// 履歴データを取得
const exportHistory = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM medicine_history', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`📋 ${rows.length}件の履歴データを取得しました`);
      
      rows.forEach(row => {
        const notes = row.notes ? row.notes.replace(/'/g, "''") : '';
        
        const sql = `INSERT INTO medicine_history (id, user_id, action, medicine_name, quantity, notes, created_date) VALUES (${row.id}, ${row.user_id}, '${row.action.replace(/'/g, "''")}', '${row.medicine_name.replace(/'/g, "''")}', ${row.quantity}, '${notes}', '${row.created_date}');`;
        sqlStatements.push(sql);
      });
      
      resolve();
    });
  });
};

// メイン処理
const main = async () => {
  try {
    // 既存のSQLiteファイルが存在するかチェック
    if (!fs.existsSync(sourceDbPath)) {
      console.log('⚠️  既存のSQLiteデータベースが見つかりません。空の移行ファイルを作成します。');
      fs.writeFileSync(outputFile, '-- No existing data to migrate\n');
      console.log('✅ 空の移行ファイルを作成しました');
      return;
    }

    await exportUsers();
    await exportMedicines();
    await exportHistory();
    
    // SQLファイルに書き出し
    const sqlContent = [
      '-- Data migration from SQLite to D1',
      '-- Generated on: ' + new Date().toISOString(),
      '',
      ...sqlStatements
    ].join('\n');
    
    fs.writeFileSync(outputFile, sqlContent);
    
    console.log('✅ データ移行ファイルを作成しました');
    console.log(`📄 ファイル: ${outputFile}`);
    console.log(`📊 総SQL文数: ${sqlStatements.length}`);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ データベース切断エラー:', err.message);
      } else {
        console.log('✅ SQLiteデータベースを切断しました');
      }
    });
  }
};

main();
