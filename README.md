# 薬の在庫管理アプリ

ユーザー認証機能付きの薬の在庫管理システム

## 構成
- **フロントエンド**: Vite + React + Tailwind CSS + Lucide React (ポート: 5173)
- **バックエンド**: Express.js + SQLite + JWT認証 (ポート: 3001)

## 機能

### 認証機能
- ユーザー登録・ログイン
- JWT トークンベース認証
- パスワードハッシュ化（bcrypt）
- ユーザー別データ管理

### 薬管理機能
- 薬の追加・削除
- 既存薬への在庫追加
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
- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:3001/api

## API仕様

### 認証API

#### ユーザー登録
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "ユーザー名",
  "email": "user@example.com",
  "password": "password123"
}
```

#### ログイン
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### ユーザー情報取得
```
GET /api/auth/me
Authorization: Bearer <JWT_TOKEN>
```

### 薬管理API（認証必須）

#### 薬一覧取得
```
GET /api/medicines
Authorization: Bearer <JWT_TOKEN>
```

#### 薬追加
```
POST /api/medicines
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "ロキソニン錠",
  "quantity": 30,
  "dosage": "1錠",
  "frequency": "1日3回食後",
  "notes": "胃に注意"
}
```

#### 既存薬に在庫追加
```
PUT /api/medicines/:id/add-stock
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "quantity": 10,
  "notes": "追加処方"
}
```

#### 薬服用
```
PUT /api/medicines/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "action": "take"
}
```

#### 薬削除
```
DELETE /api/medicines/:id
Authorization: Bearer <JWT_TOKEN>
```

#### 履歴取得
```
GET /api/history
Authorization: Bearer <JWT_TOKEN>
```

#### ヘルスチェック
```
GET /api/health
```

## データベース
SQLiteファイル（backend/medicine_auth.db）に以下のテーブルが作成されます：
- `users`: ユーザー情報（認証用）
- `medicines`: 薬の基本情報（ユーザー別）
- `medicine_history`: 処方・服用履歴（ユーザー別）

## 技術スタック

### フロントエンド
- **React 18**: UIライブラリ
- **Vite**: ビルドツール・開発サーバー
- **Tailwind CSS**: CSSフレームワーク
- **Lucide React**: アイコンライブラリ
- **カスタムHooks**: useAuth, useMedicine

### バックエンド
- **Express.js**: Webフレームワーク
- **SQLite3**: データベース
- **JWT**: 認証トークン
- **bcryptjs**: パスワードハッシュ化
- **CORS**: クロスオリジン対応

## プロジェクト構造
```
React_MedichinMS/
├── package.json              # フロントエンド依存関係
├── vite.config.js            # Vite設定
├── tailwind.config.js        # Tailwind CSS設定
├── postcss.config.js         # PostCSS設定
├── index.html                # HTMLテンプレート
├── src/
│   ├── main.jsx              # Reactエントリーポイント
│   ├── App.jsx               # メインアプリケーション
│   ├── index.css             # グローバルスタイル
│   ├── components/           # Reactコンポーネント
│   │   ├── auth/             # 認証関連コンポーネント
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── layout/           # レイアウトコンポーネント
│   │   │   └── Header.jsx
│   │   ├── medicine/         # 薬管理コンポーネント
│   │   │   ├── AddMedicineForm.jsx
│   │   │   ├── MedicineCard.jsx
│   │   │   ├── MedicineList.jsx
│   │   │   └── MedicineHistory.jsx
│   │   └── ui/               # UIコンポーネント
│   │       ├── ErrorAlert.jsx
│   │       ├── LoadingSpinner.jsx
│   │       └── StockAlert.jsx
│   ├── hooks/                # カスタムHooks
│   │   ├── useAuth.js        # 認証管理
│   │   └── useMedicine.js    # 薬管理
│   └── utils/                # ユーティリティ
│       └── api.js            # API通信
├── backend/
│   ├── package.json          # バックエンド依存関係
│   ├── server.js             # Express.jsサーバー
│   └── medicine_auth.db      # SQLiteデータベース（自動生成）
└── README.md                 # このファイル
```

## 開発
```bash
# バックエンド（nodemonで自動リロード）
cd backend
npm run dev

# フロントエンド（Viteの開発サーバー）
npm run dev
```

## セキュリティ機能
- パスワードのハッシュ化（bcrypt）
- JWT トークンベース認証
- ユーザー別データ分離
- CORS設定
- 認証必須API

## 注意事項
- 初回起動時にSQLiteデータベースが自動作成されます
- バックエンドサーバーを先に起動してからフロントエンドを起動してください
- データはローカルのSQLiteファイルに保存されます
- JWTトークンの有効期限は24時間です
- 本番環境では JWT_SECRET を環境変数で設定してください
- フロントエンドの開発サーバーはポート5173で起動します（Viteのデフォルト）

## 使用方法
1. アプリケーションにアクセス
2. 新規ユーザーの場合は「新規登録」からアカウント作成
3. 既存ユーザーの場合はログイン
4. 薬の追加・管理・服用記録を行う
5. 履歴から過去の記録を確認
