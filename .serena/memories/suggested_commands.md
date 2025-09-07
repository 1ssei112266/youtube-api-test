# 推奨コマンド

## 開発コマンド
```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動  
npm start

# リンター実行
npm run lint
```

## 開発用URL
- **ローカル開発**: http://localhost:3000

## Git管理
```bash
# 現在の状態確認
git status

# 変更をステージング
git add .

# コミット
git commit -m "message"

# ブランチ確認
git branch

# ログ確認
git log --oneline
```

## Darwinシステム固有コマンド
```bash
# ファイル検索
find . -name "*.tsx" -type f

# パターン検索  
grep -r "pattern" src/

# ディレクトリ一覧
ls -la

# ファイル内容確認
cat filename

# プロセス確認
ps aux | grep node
```

## TypeScript開発
```bash
# 型チェック（tsconfig.json設定済み）
npx tsc --noEmit

# ESLint実行
npx eslint src/
```

## パッケージ管理
```bash
# 依存関係インストール
npm install

# 新しいパッケージ追加
npm install package-name

# 開発依存関係追加
npm install -D package-name
```