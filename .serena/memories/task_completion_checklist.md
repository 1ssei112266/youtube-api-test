# タスク完了時チェックリスト

## 必須実行コマンド
```bash
# 1. リンターチェック
npm run lint

# 2. TypeScriptコンパイルチェック  
npx tsc --noEmit

# 3. 開発サーバーでの動作確認
npm run dev
```

## コード品質チェック
- [ ] TypeScript型エラーなし
- [ ] ESLintエラー/警告なし  
- [ ] コンポーネントの適切な型定義
- [ ] Atomic Designパターン準拠

## 機能テスト
- [ ] ローカルでの動作確認 (http://localhost:3000)
- [ ] レスポンシブ表示確認
- [ ] タブ切り替え動作確認
- [ ] 比較表示モード動作確認

## ファイル整合性チェック
- [ ] 不要なファイル削除
- [ ] import文整理
- [ ] 未使用変数/関数削除

## Git管理
```bash
# 変更内容確認
git status
git diff

# ステージング（必要に応じて）
git add .

# コミット（明確なメッセージで）
git commit -m "feature: 具体的な変更内容"
```

## 本番ビルドテスト
```bash
# ビルドエラーチェック
npm run build

# 本番環境動作確認
npm start
```

## ドキュメント更新
- [ ] README.md更新（必要に応じて）
- [ ] コメント追加/更新
- [ ] 型定義ドキュメント更新