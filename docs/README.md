# Switch 2 ゲーム情報サイト - YouTube API連携実装

## 📚 ドキュメント一覧（実装順序）

このプロジェクトのYouTube API連携を実装するためのドキュメント集です。番号順に進めることを推奨します。

### 🚀 実装手順

| No | ドキュメント | 内容 | 所要時間（目安） |
|----|-------------|------|------------------|
| **00** | **実装ドキュメント一覧** | 全体概要とドキュメントの使い方 | 15分 |
| **01** | **YouTube API連携実装ガイド** | YouTube API の具体的実装手順 | 2-3時間 |
| 02 | プログラミング初心者向け完全実装ガイド | React/Next.js の基本理解 | 3-4時間 |
| 03 | Atomic Design コンポーネント設計ガイド | コンポーネント設計パターン | 2-3時間 |
| 04 | API連携完全実装ガイド | 4つの外部API統合方法 | 4-5時間 |
| 05 | 実際のプロジェクト実装手順書 | 本番プロジェクト構築手順 | 3-4時間 |

### 🎯 今回の実装目標

**YouTube API連携を最優先で実装する**

1. ✅ **YouTube Data API v3** の設定と実装
2. ✅ **動画検索機能** の実装
3. ✅ **コメント取得機能** の実装
4. ✅ **Next.js API Routes** での統合
5. ✅ **フロントエンド表示** の実装

## 🚀 クイックスタート（YouTube API連携のみ）

### 前提条件
- Node.js 18+ がインストール済み
- このプロジェクトが既にセットアップ済み
- Google アカウントを持っている

### 手順

#### 1. YouTube API設定（10分）
1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. YouTube Data API v3 を有効化
3. APIキーを取得

#### 2. 環境変数設定（2分）
```bash
# .env.local ファイルを作成
echo "YOUTUBE_API_KEY=your_api_key_here" > .env.local
```

#### 3. 実装ファイル作成（90分）
**01_YouTube-API連携実装ガイド.md** の手順に従って以下を作成：
- `src/types/youtube.ts` - 型定義
- `src/lib/youtube.ts` - API クライアント
- `src/app/api/youtube/search/route.ts` - 検索API
- `src/app/api/youtube/comments/route.ts` - コメントAPI
- `src/hooks/useYouTubeData.ts` - カスタムフック

#### 4. 動作確認（10分）
```bash
# 開発サーバー起動
npm run dev

# ブラウザでテスト
# http://localhost:3000/api/youtube/search?q=スプラトゥーン3
```

## 📋 必要なファイル（チェックリスト）

### 型定義
- [ ] `src/types/youtube.ts`

### API クライアント  
- [ ] `src/lib/youtube.ts`

### API Routes
- [ ] `src/app/api/youtube/search/route.ts`
- [ ] `src/app/api/youtube/comments/route.ts`

### フロントエンド
- [ ] `src/hooks/useYouTubeData.ts`
- [ ] 既存コンポーネントの更新

### 設定
- [ ] `.env.local` (APIキー設定)

## 🔧 トラブルシューティング

### よくあるエラー

#### 1. "YouTube API key is not configured"
```bash
# .env.local ファイルを確認
cat .env.local

# APIキーが正しく設定されているか確認
echo $YOUTUBE_API_KEY
```

#### 2. "API key invalid" 
- Google Cloud Console でAPIキーの制限設定を確認
- YouTube Data API v3 が有効化されているか確認

#### 3. "CORS error"
- Next.js API Routes を経由してAPIアクセスしているか確認
- フロントエンドから直接 googleapis.com にアクセスしていないか確認

## 📊 実装後の確認項目

- [ ] YouTube動画検索が動作する
- [ ] 動画情報（タイトル、サムネイル、再生数など）が正しく表示される  
- [ ] コメント取得が動作する
- [ ] エラーハンドリングが適切に動作する
- [ ] ローディング状態が表示される
- [ ] レスポンシブデザインが崩れない

## 🎉 実装完了後

YouTube API連携が完了したら：

```bash
# 変更をコミット
git add .
git commit -m "feat: YouTube API integration complete"

# 次のブランチへ（Reddit API等を実装する場合）
git checkout -b feature/reddit-api-integration
```

## 💡 実装のコツ

### 段階的実装
1. **APIキー設定** → 動作確認
2. **基本的な検索** → 動作確認  
3. **コメント取得** → 動作確認
4. **エラーハンドリング追加** → 動作確認
5. **UI統合** → 最終確認

### デバッグ方法
```javascript
// ブラウザのコンソールで直接APIテスト
fetch('/api/youtube/search?q=テストゲーム')
  .then(res => res.json())
  .then(data => console.log(data))
```

### パフォーマンス対策
- 検索結果のキャッシュ実装
- 画像の遅延読み込み
- ページネーション実装

---

**🎯 目標**: YouTube API連携を完璧に動作させて、実際のゲーム動画データを取得・表示できるようにする！

詳細な実装手順は **01_YouTube-API連携実装ガイド.md** を参照してください。
