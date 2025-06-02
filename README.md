# 薬の在庫管理アプリ

ローカル開発環境での薬の在庫管理システム

## 構成
- **フロントエンド**: Vite + React + Tailwind CSS (ポート: 3000)
- **バックエンド**: Express.js + SQLite (ポート: 3001)

## 機能
- 薬の追加・削除
- 服用記録（在庫を1つ減らす）
- 在庫アラート（3個以下で警告、0個で在庫切れ表示）
- 服用・処方履歴の表示
- レスポンシブデザイン

## セットアップ手順

### 1. 依存関係のインストール

#### フロントエンド
```bash
# フロントエンドの依存関係をインストール
npm install
```

#### バックエンド
```bash
# バックエンドディレクトリに移動
cd backend

# バックエンドの依存関係をインストール
npm install
```

### 2. アプリケーションの起動

#### バックエンドサーバーを起動（ターミナル1）
```bash
cd backend
npm run dev
```

#### フロントエンドサーバーを起動（ターミナル2）
```bash
# プロジェクトルートディレクトリで実行
npm run dev
```

### 3. アクセス
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001/api

## API仕様

### 薬一覧取得
```
GET /api/medicines
```

### 薬追加
```
POST /api/medicines
Content-Type: application/json

{
  "name": "ロキソニン錠",
  "quantity": 30,
  "dosage": "1錠",
  "frequency": "1日3回食後",
  "notes": "胃に注意"
}
```

### 薬服用
```
PUT /api/medicines/:id
Content-Type: application/json

{
  "action": "take"
}
```

### 薬削除
```
DELETE /api/medicines/:id
```

### 履歴取得
```
GET /api/history
```

### ヘルスチェック
```
GET /api/health
```

## データベース
SQLiteファイル（backend/medicine.db）に以下のテーブルが作成されます：
- `medicines`: 薬の基本情報
- `medicine_history`: 処方・服用履歴

## 開発
```bash
# バックエンド（nodemonで自動リロード）
cd backend
npm run dev

# フロントエンド（Viteの開発サーバー）
npm run dev
```

## プロジェクト構造
```
medicine-inventory/
├── package.json              # フロントエンド依存関係
├── vite.config.js            # Vite設定
├── tailwind.config.js        # Tailwind CSS設定
├── postcss.config.js         # PostCSS設定
├── index.html                # HTMLテンプレート
├── src/
│   ├── main.jsx              # Reactエントリーポイント
│   ├── App.jsx               # メインアプリケーション
│   └── index.css             # グローバルスタイル
├── backend/
│   ├── package.json          # バックエンド依存関係
│   ├── server.js             # Express.jsサーバー
│   └── medicine.db           # SQLiteデータベース（自動生成）
└── README.md                 # このファイル
```

## 注意事項
- 初回起動時にSQLiteデータベースが自動作成されます
- バックエンドサーバーを先に起動してからフロントエンドを起動してください
- データはローカルのSQLiteファイルに保存されます
