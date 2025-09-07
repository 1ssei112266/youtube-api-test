# YouTube API連携実装ガイド【実践完全版】
## 📋 このドキュメントについて

このガイドでは、**実際に動作確認済み**のYouTube Data API v3の実装方法を、初心者にも分かりやすく詳細解説します。コピー&ペーストで使える実用的なコード例と、詰まりやすいポイントの解決法を網羅しています。

**対象読者:**
- Next.js でAPI連携を初めて行う方
- YouTube APIの使い方を理解したい方  
- 実用的なコード例を求めている方

**実装済み機能:**
✅ YouTube動画検索API  
✅ YouTube動画詳細情報取得API  
✅ YouTubeコメント取得API  
✅ フロントエンドとの統合表示  
✅ 無限スクロール機能  
✅ エラーハンドリング

## 🎯 API実装の全体設計

### アーキテクチャ図
```
[フロントエンド (React/Next.js)]
           ↓
[Next.js API Routes] ← セキュリティ境界
           ↓
[YouTube Data API v3] ← Google提供
           ↓
[レスポンスデータ]
           ↓
[フロントエンド表示]
```

**設計のポイント:**
- **セキュリティ**: APIキーはサーバーサイドのみ、フロントエンドに露出しない
- **パフォーマンス**: 必要なデータのみ取得、効率的なレスポンス構造
- **エラーハンドリング**: APIエラーを適切にキャッチして分かりやすいメッセージを表示

### ディレクトリ構成
```
src/
├── app/
│   ├── api/                    # Next.js API Routes
│   │   ├── youtube-search/     # 動画検索API
│   │   │   └── route.ts
│   │   ├── youtube-data/       # 動画詳細API  
│   │   │   └── route.ts
│   │   └── youtube-comments/   # コメント取得API
│   │       └── route.ts
│   ├── api-test/              # テスト用ページ
│   │   └── page.tsx
│   └── page.tsx               # メインページ
└── .env.local                 # 環境変数（APIキー）
```

## 🔐 YouTube API準備【詳細設定編】

### 1. Google Cloud Consoleでの設定手順（完全版）

#### ステップ1: Google Cloudプロジェクト作成の詳細
1. **Google Cloud Console**にアクセス（Googleアカウントが必要）
2. 右上の「プロジェクト選択」をクリック
3. 「新しいプロジェクト」を選択
4. **プロジェクト設定**:
   ```
   プロジェクト名: youtube-api-switch-project（推奨）
   組織: なし（個人開発の場合）
   場所: なし
   ```
5. 「作成」ボタンをクリック
6. **作成完了まで約30秒-1分待機**

**💡 プロジェクト作成のポイント:**
- プロジェクト名は後から変更可能だが、プロジェクトIDは変更不可
- 組織アカウントでない場合は「場所」は「組織なし」でOK
- プロジェクト作成直後はAPIが使えるまで少し時間がかかることがある

#### ステップ2: YouTube Data API有効化の詳細プロセス
1. **APIライブラリへの移動**:
   - 左側メニュー → 「APIとサービス」 → 「ライブラリ」
2. **YouTube APIの検索**:
   - 検索ボックスに「YouTube Data API v3」と入力
   - 正確な名前は「YouTube Data API v3」（v2やv1ではない）
3. **API有効化**:
   - 「YouTube Data API v3」をクリック
   - 「有効にする」ボタンをクリック
   - **有効化完了まで約10-30秒待機**

**🔍 有効化確認方法:**
```
APIとサービス → ダッシュボード → 有効なAPIに「YouTube Data API v3」が表示される
```

#### ステップ3: APIキー作成の完全ガイド
1. **認証情報作成**:
   - 「APIとサービス」→ 「認証情報」
   - 「認証情報を作成」→ 「APIキー」
2. **APIキー生成**:
   - 自動的にAPIキーが生成される（例: `AIzaSyC...`で始まる文字列）
   - **すぐにコピーして安全な場所に保存**
3. **APIキーの命名**:
   - キー名を「YouTube-API-Key-Development」等に変更（識別しやすくするため）

**🔐 APIキーの形式例:**
```
AIzaSyDxvKYt9QqKjKj9QqKjKj9QqKjKj9QqKjK  // 実際は39文字
```

#### ステップ4: APIキー制限設定（セキュリティ強化）

**4-1. アプリケーション制限の設定**
```
設定項目: アプリケーションの制限
推奨設定: HTTPリファラー（ウェブサイト）
```

**詳細設定手順:**
1. 作成したAPIキーの「制限事項」をクリック
2. 「アプリケーションの制限」セクション:
   - 「HTTPリファラー（ウェブサイト）」を選択
3. **ウェブサイトの制限**に以下を追加:
   ```
   開発環境用:
   http://localhost:3000/*
   http://127.0.0.1:3000/*
   
   本番環境用（ドメイン取得後）:
   https://yourdomain.com/*
   https://www.yourdomain.com/*
   
   Vercel等のホスティング:
   https://*.vercel.app/*
   https://your-project.vercel.app/*
   ```

**4-2. API制限の設定**
```
設定項目: APIの制限
推奨設定: キーを制限
選択API: YouTube Data API v3のみ
```

**詳細設定:**
1. 「APIの制限」→「キーを制限」を選択
2. 「APIを選択」で「YouTube Data API v3」にチェック
3. 他のAPIのチェックは全て外す
4. 「保存」をクリック

**🛡️ セキュリティ制限の効果:**
- リファラー制限: 指定ドメイン以外からのアクセスを拒否
- API制限: YouTube API以外での使用を防止
- これにより、APIキーが漏洩しても被害を最小限に抑制

### 2. 環境変数の設定【完全解説版】

#### 環境変数の仕組みと重要性

**環境変数とは？**
環境変数は、アプリケーションの設定情報を外部ファイルで管理する仕組みです。特に機密情報（APIキー、データベース接続文字列等）を安全に扱うために必須です。

**なぜ環境変数を使うのか？**
```typescript
// ❌ 危険な例: コードに直接APIキーを書く
const API_KEY = "AIzaSyxxxt9QqKjKj9QqKjKj9QqKjKj9QqKjK"; 

// 問題点:
// 1. GitHubに公開される
// 2. チームメンバー全員に見える  
// 3. APIキー変更時にコード修正が必要
// 4. 開発・本番で同じキーを使ってしまう

// ✅ 安全な例: 環境変数から取得
const API_KEY = process.env.YOUTUBE_API_KEY;

// メリット:
// 1. コードには含まれない
// 2. 環境ごとに異なるキーを使用可能
// 3. .gitignoreで除外できる
// 4. デプロイ時に安全に設定可能
```

#### .env.localファイルの完全ガイド

**ファイル作成場所:**
```
プロジェクトルート/
├── src/
├── public/
├── package.json
└── .env.local  ← ここに作成
```

**.env.local の完全設定例:**
```bash
# ===========================================
# YouTube Data API v3 Configuration
# ===========================================
# Google Cloud Console で取得したAPIキー
YOUTUBE_API_KEY=AIzaSyDxvKxxxQqKjKj9QqKjKj9QqKjKj9QqKjK

# ===========================================
# API制限・クォータ設定
# ===========================================
# 1日のAPIリクエスト上限（デフォルト: 10000ユニット）
YOUTUBE_DAILY_QUOTA_LIMIT=10000

# 1時間あたりのリクエスト制限（自主規制）
YOUTUBE_HOURLY_LIMIT=100

# ===========================================
# キャッシュ設定
# ===========================================
# キャッシュの有効期限（秒）
CACHE_DURATION_SECONDS=3600

# キャッシュストレージタイプ（memory/redis）
CACHE_TYPE=memory

# ===========================================
# デバッグ・ログ設定
# ===========================================
# デバッグモード（true/false）
DEBUG_MODE=true

# APIレスポンスログ出力（true/false）
LOG_API_RESPONSES=true

# ===========================================
# 開発環境設定
# ===========================================
# 現在の環境（development/production）
NODE_ENV=development

# ベースURL（本番とデプロイで変更）
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**環境変数の命名規則:**
```bash
# ✅ 良い例: 大文字_スネークケース
YOUTUBE_API_KEY=...
DATABASE_CONNECTION_STRING=...
REDIS_CACHE_URL=...

# ❌ 悪い例: 小文字やキャメルケース
youtube_api_key=...
youtubeApiKey=...
YOUTUBEAPIKEY=...
```

#### 環境変数の種類とNext.jsでの取扱い

**サーバーサイド専用の環境変数:**
```typescript
// サーバーサイド（API Routes等）でのみアクセス可能
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// 特徴:
// - フロントエンドからは見えない
// - セキュリティが高い
// - APIキー等の機密情報に最適
```

**フロントエンド公開用の環境変数:**
```bash
# .env.local での設定（NEXT_PUBLIC_ プレフィックス必須）
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX
```

```typescript
// フロントエンドからアクセス可能
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// 注意:
// - NEXT_PUBLIC_ 付きの変数はブラウザに露出される
// - 機密情報には使用厳禁
// - ビルド時に値が埋め込まれる
```

### 2. 環境変数の設定

#### .env.local ファイル作成
プロジェクトルートに以下の内容で作成:
```bash
# YouTube Data API v3
YOUTUBE_API_KEY=AIzaSyC_your_actual_api_key_here
```

**重要な注意事項:**
- ✅ `.env.local` はgitignoreされているため安全
- ❌ `.env` ファイルは公開される可能性があるので使わない
- ❌ フロントエンドコードにAPIキーを直接書かない

#### 環境変数の安全な管理方法

**1. .gitignoreの設定確認**
```bash
# .gitignore に以下が含まれていることを確認
.env
.env.local
.env.development.local
.env.production.local

# Next.js のデフォルト.gitignoreには含まれているが、念のため確認
```

**2. チーム開発での環境変数管理**
```bash
# .env.example ファイルを作成してテンプレートを共有
# .env.example の内容例:
YOUTUBE_API_KEY=your_youtube_api_key_here
DATABASE_URL=your_database_url_here
REDIS_URL=your_redis_url_here

# 実際の値は含めず、設定すべき項目のみ記載
```

**3. 環境変数の読み込み確認**
```typescript
// API Route での環境変数チェック関数
function validateEnvironmentVariables() {
  const required = [
    'YOUTUBE_API_KEY',
    'DATABASE_URL',
    // 必須の環境変数をリスト化
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// API Route の開始時に実行
export async function GET(request: NextRequest) {
  validateEnvironmentVariables();
  
  const API_KEY = process.env.YOUTUBE_API_KEY;
  // 以下、通常の処理...
}
```

#### 環境別の設定管理

**開発環境 (.env.local):**
```bash
YOUTUBE_API_KEY=AIzaSy_development_key_here
DEBUG_MODE=true
LOG_API_RESPONSES=true
CACHE_DURATION_SECONDS=300  # 5分キャッシュ
```

**ステージング環境 (.env.staging):**
```bash
YOUTUBE_API_KEY=AIzaSy_staging_key_here
DEBUG_MODE=false
LOG_API_RESPONSES=false
CACHE_DURATION_SECONDS=1800  # 30分キャッシュ
```

**本番環境 (デプロイ時に設定):**
```bash
YOUTUBE_API_KEY=AIzaSy_production_key_here
DEBUG_MODE=false
LOG_API_RESPONSES=false
CACHE_DURATION_SECONDS=3600  # 1時間キャッシュ
```

#### 環境変数のトラブルシューティング

**よくある問題と解決法:**

**1. 環境変数が読み込まれない**
```typescript
// 問題の確認方法
console.log('Environment check:', {
  nodeEnv: process.env.NODE_ENV,
  youtubeApiKey: process.env.YOUTUBE_API_KEY ? '設定済み' : '未設定',
  allEnvKeys: Object.keys(process.env).filter(key => key.includes('YOUTUBE'))
});

// 解決方法:
// - ファイル名が .env.local になっているか確認
// - プロジェクトルートに配置されているか確認
// - サーバーを再起動（npm run dev）
```

**2. フロントエンドで環境変数が undefined**
```typescript
// ❌ 間違った使用法
const apiKey = process.env.YOUTUBE_API_KEY; // undefined になる

// ✅ 正しい方法1: サーバーサイドで使用
// pages/api/ または app/api/ 内でのみ使用

// ✅ 正しい方法2: 公開用変数を使用  
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
```

**3. 本番環境で環境変数が設定されない**
```bash
# Vercel での設定方法
vercel env add YOUTUBE_API_KEY production

# または Vercel Dashboard での設定
# Settings > Environment Variables > Add New
```

## 🎥 YouTube Search API 実装【技術詳細解説】

### YouTube Search APIの仕組み理解

**YouTube Search API の動作原理:**
```mermaid
sequenceDiagram
    participant Client as フロントエンド
    participant API as Next.js API Route
    participant YouTube as YouTube API v3
    
    Client->>API: GET /api/youtube-search?q=マリオ
    API->>API: 環境変数チェック
    API->>API: パラメータ検証
    API->>YouTube: HTTPS リクエスト
    YouTube-->>API: JSON レスポンス
    API->>API: エラーハンドリング
    API-->>Client: 整形されたレスポンス
```

**APIエンドポイントの詳細:**
- **ベースURL**: `https://www.googleapis.com/youtube/v3/search`
- **認証**: APIキー（クエリパラメータ）
- **レート制限**: 1日10,000ユニット（検索1回=100ユニット）
- **レスポンス形式**: JSON

**リクエストパラメータの完全解説:**
```typescript
interface YouTubeSearchParams {
  // 必須パラメータ
  key: string;        // APIキー
  part: string;       // 取得するデータの種類
  q: string;         // 検索クエリ
  
  // オプションパラメータ
  type?: 'video' | 'channel' | 'playlist';
  maxResults?: number;        // 1-50の範囲
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount';
  pageToken?: string;         // ページネーション用
  regionCode?: string;        // 地域コード（JP等）
  relevanceLanguage?: string; // 言語コード（ja等）
  publishedAfter?: string;    // ISO 8601形式の日時
  publishedBefore?: string;   // ISO 8601形式の日時
  channelId?: string;         // 特定チャンネルのみ検索
  channelType?: 'any' | 'show';
  duration?: 'short' | 'medium' | 'long';
  eventType?: 'completed' | 'live' | 'upcoming';
  location?: string;          // 緯度,経度
  locationRadius?: string;    // 検索半径（1km等）
  videoCaption?: 'any' | 'closedCaption' | 'none';
  videoCategoryId?: string;   // カテゴリID
  videoDefinition?: 'any' | 'high' | 'standard';
  videoDimension?: 'any' | '2d' | '3d';
  videoDuration?: 'any' | 'short' | 'medium' | 'long';
  videoEmbeddable?: 'any' | 'true';
  videoLicense?: 'any' | 'creativeCommon' | 'youtube';
  videoSyndicated?: 'any' | 'true';
  videoType?: 'any' | 'episode' | 'movie';
}
```

### API Route実装: src/app/api/youtube-search/route.ts【完全解説版】

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const maxResults = searchParams.get('maxResults') || '5';
  const pageToken = searchParams.get('pageToken') || '';

  // YouTube API Key（環境変数から取得）
  const API_KEY = process.env.YOUTUBE_API_KEY;
  
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'YouTube API Key が設定されていません' },
      { status: 500 }
    );
  }

  if (!query) {
    return NextResponse.json(
      { error: 'クエリパラメータ q が必要です' },
      { status: 400 }
    );
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', maxResults);
    url.searchParams.set('key', API_KEY);
    
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'YouTube API エラー', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('YouTube Search API エラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}
```

**実装の詳細技術解説:**

#### 1. セキュリティ設計の深掘り

**APIキー保護の仕組み:**
```typescript
// ✅ セキュアな実装
const API_KEY = process.env.YOUTUBE_API_KEY;

// なぜこれが安全なのか？
// 1. process.env はサーバーサイドでのみ利用可能
// 2. ブラウザ開発者ツールから見えない  
// 3. ビルド成果物にも含まれない
// 4. リバースプロキシとして機能

if (!API_KEY) {
  // 早期リターンでセキュリティ確保
  return NextResponse.json(
    { error: 'YouTube API Key が設定されていません' },
    { status: 500 }
  );
}
```

**Input Validation（入力検証）の実装:**
```typescript
// 高度な入力検証の実装例
function validateSearchInput(query: string, maxResults: string): ValidationResult {
  const errors: string[] = [];
  
  // クエリの検証
  if (!query || query.trim().length === 0) {
    errors.push('検索クエリが空です');
  }
  
  if (query.length > 500) {
    errors.push('検索クエリが長すぎます（500文字以内）');
  }
  
  // 危険な文字の検出
  const dangerousChars = /[<>\"'&]/g;
  if (dangerousChars.test(query)) {
    errors.push('使用できない文字が含まれています');
  }
  
  // maxResultsの検証
  const maxResultsNum = parseInt(maxResults);
  if (isNaN(maxResultsNum) || maxResultsNum < 1 || maxResultsNum > 50) {
    errors.push('maxResultsは1-50の範囲で指定してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedQuery: query.trim(),
    maxResults: Math.min(Math.max(maxResultsNum, 1), 50)
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedQuery: string;
  maxResults: number;
}
```

#### 2. HTTPリクエスト処理の最適化

**URLBuilderパターンの実装:**
```typescript
class YouTubeApiUrlBuilder {
  private baseUrl = 'https://www.googleapis.com/youtube/v3/search';
  private params = new URLSearchParams();
  
  constructor(private apiKey: string) {
    this.params.set('key', apiKey);
    this.params.set('part', 'snippet');
  }
  
  setQuery(query: string): this {
    this.params.set('q', encodeURIComponent(query));
    return this;
  }
  
  setType(type: 'video' | 'channel' | 'playlist'): this {
    this.params.set('type', type);
    return this;
  }
  
  setMaxResults(count: number): this {
    this.params.set('maxResults', Math.min(count, 50).toString());
    return this;
  }
  
  setPageToken(token: string): this {
    if (token) this.params.set('pageToken', token);
    return this;
  }
  
  setOrder(order: 'date' | 'rating' | 'relevance' | 'title' | 'viewCount'): this {
    this.params.set('order', order);
    return this;
  }
  
  setRegionAndLanguage(regionCode = 'JP', language = 'ja'): this {
    this.params.set('regionCode', regionCode);
    this.params.set('relevanceLanguage', language);
    return this;
  }
  
  build(): string {
    return `${this.baseUrl}?${this.params.toString()}`;
  }
}

// 使用例
const urlBuilder = new YouTubeApiUrlBuilder(API_KEY);
const searchUrl = urlBuilder
  .setQuery(query)
  .setType('video')
  .setMaxResults(parseInt(maxResults))
  .setPageToken(pageToken)
  .setOrder('relevance')
  .setRegionAndLanguage('JP', 'ja')
  .build();
```

#### 3. エラーハンドリングの体系化

**エラー分類とレスポンス設計:**
```typescript
enum ApiErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  QUOTA_ERROR = 'QUOTA_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

interface ApiErrorResponse {
  error: string;
  type: ApiErrorType;
  message: string;
  details?: any;
  timestamp: string;
  requestId: string;
}

class YouTubeApiErrorHandler {
  static handle(error: any, requestId: string): NextResponse<ApiErrorResponse> {
    const timestamp = new Date().toISOString();
    
    // YouTube APIからのエラーレスポンス解析
    if (error.details?.error) {
      const youtubeError = error.details.error;
      
      switch (youtubeError.code) {
        case 400:
          return NextResponse.json({
            error: 'リクエストパラメータエラー',
            type: ApiErrorType.VALIDATION_ERROR,
            message: youtubeError.message,
            details: youtubeError,
            timestamp,
            requestId
          }, { status: 400 });
          
        case 401:
          return NextResponse.json({
            error: 'APIキー認証エラー',
            type: ApiErrorType.AUTHENTICATION_ERROR,
            message: 'APIキーが無効または期限切れです',
            timestamp,
            requestId
          }, { status: 401 });
          
        case 403:
          if (youtubeError.message.includes('quota')) {
            return NextResponse.json({
              error: 'APIクォータ超過',
              type: ApiErrorType.QUOTA_ERROR,
              message: '本日のAPI使用量上限に達しました',
              timestamp,
              requestId
            }, { status: 403 });
          }
          break;
          
        case 429:
          return NextResponse.json({
            error: 'レート制限エラー',
            type: ApiErrorType.RATE_LIMIT_ERROR,
            message: 'リクエスト頻度が高すぎます。しばらく待ってお試しください',
            timestamp,
            requestId
          }, { status: 429 });
      }
    }
    
    // ネットワークエラー
    if (error.name === 'TypeError' || error.code === 'ENOTFOUND') {
      return NextResponse.json({
        error: 'ネットワークエラー',
        type: ApiErrorType.NETWORK_ERROR,
        message: 'YouTube APIへの接続に失敗しました',
        timestamp,
        requestId
      }, { status: 503 });
    }
    
    // その他のサーバーエラー
    return NextResponse.json({
      error: 'サーバー内部エラー',
      type: ApiErrorType.SERVER_ERROR,
      message: '予期しないエラーが発生しました',
      timestamp,
      requestId
    }, { status: 500 });
  }
}

### API利用例（cURLでテスト）

```bash
# 基本的な検索
curl "http://localhost:3000/api/youtube-search?q=マリオカート&maxResults=3"

# ページネーション付き検索
curl "http://localhost:3000/api/youtube-search?q=ゼルダ&maxResults=5&pageToken=CBQQAA"
```

**期待されるレスポンス例:**
```json
{
  "kind": "youtube#searchListResponse",
  "etag": "...",
  "nextPageToken": "CBQQAA",
  "items": [
    {
      "kind": "youtube#searchResult",
      "etag": "...",
      "id": {
        "kind": "youtube#video",
        "videoId": "dQw4w9WgXcQ"
      },
      "snippet": {
        "publishedAt": "2023-01-01T00:00:00Z",
        "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
        "title": "マリオカート最新情報",
        "description": "...",
        "thumbnails": {
          "default": { "url": "...", "width": 120, "height": 90 },
          "medium": { "url": "...", "width": 320, "height": 180 },
          "high": { "url": "...", "width": 480, "height": 360 }
        },
        "channelTitle": "ゲーム情報チャンネル"
      }
    }
  ]
}
```

## 📊 YouTube Video Data API 実装

### API Route実装: src/app/api/youtube-data/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  // YouTube API Key（環境変数から取得）
  const API_KEY = process.env.YOUTUBE_API_KEY;
  
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'YouTube API Key が設定されていません' },
      { status: 500 }
    );
  }

  if (!videoId) {
    return NextResponse.json(
      { error: 'クエリパラメータ videoId が必要です' },
      { status: 400 }
    );
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,statistics');
    url.searchParams.set('id', videoId);
    url.searchParams.set('key', API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'YouTube API エラー', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('YouTube Data API エラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}
```

**取得できる詳細データ:**
- `snippet`: タイトル、説明、サムネイル、チャンネル情報
- `statistics`: 再生数、高評価数、コメント数

### API利用例
```bash
curl "http://localhost:3000/api/youtube-data?videoId=dQw4w9WgXcQ"
```

**期待されるレスポンス例:**
```json
{
  "items": [
    {
      "id": "dQw4w9WgXcQ",
      "snippet": {
        "title": "マリオカート8デラックス 攻略法",
        "description": "詳細な攻略法を解説...",
        "channelTitle": "ゲーム攻略チャンネル",
        "publishedAt": "2023-01-01T00:00:00Z"
      },
      "statistics": {
        "viewCount": "1000000",
        "likeCount": "50000", 
        "commentCount": "2000"
      }
    }
  ]
}
```

## 💬 YouTube Comments API 実装

### API Route実装: src/app/api/youtube-comments/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  const maxResults = searchParams.get('maxResults') || '10';
  const pageToken = searchParams.get('pageToken') || '';

  // YouTube API Key（環境変数から取得）
  const API_KEY = process.env.YOUTUBE_API_KEY;
  
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'YouTube API Key が設定されていません' },
      { status: 500 }
    );
  }

  if (!videoId) {
    return NextResponse.json(
      { error: 'クエリパラメータ videoId が必要です' },
      { status: 400 }
    );
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/commentThreads');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('videoId', videoId);
    url.searchParams.set('maxResults', maxResults);
    url.searchParams.set('order', 'relevance'); // 人気順
    url.searchParams.set('key', API_KEY);
    
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'YouTube API エラー', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('YouTube Comments API エラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}
```

**コメント取得の順序オプション:**
- `relevance`: 関連度順（デフォルト推奨）
- `time`: 投稿時間順
- `rating`: 評価順

### API利用例
```bash
curl "http://localhost:3000/api/youtube-comments?videoId=dQw4w9WgXcQ&maxResults=5"
```

## 🎮 フロントエンド統合実装

### 実践的なフロントエンド: src/app/api-test/page.tsx

```typescript
"use client";

import { useState, useRef, useEffect } from "react";

// 型定義
interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  comments: CommentItem[];
  commentsLoading: boolean;
}

interface CommentItem {
  id: string;
  text: string;
  authorName: string;
  likeCount: number;
  publishedAt: string;
}

export default function ApiTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string>("");
  const [hasMore, setHasMore] = useState(true);
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState(true);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  // 動画を検索してコメントも取得する統合機能
  const loadVideosWithComments = async (
    isLoadMore = false,
    controller?: AbortController
  ) => {
    if (isLoading && !controller) return;

    setIsLoading(true);

    try {
      // 1. 動画検索
      const searchQuery = "マリオカートワールド 情報";
      const searchUrl = `/api/youtube-search?q=${encodeURIComponent(
        searchQuery
      )}&maxResults=3${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`;

      const searchResponse = await fetch(searchUrl, {
        signal: controller?.signal,
      });
      const searchData = await searchResponse.json();

      if (searchData.error) {
        console.error("検索エラー:", searchData.error);
        return;
      }

      if (searchData.items) {
        const newVideos: VideoItem[] = searchData.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium?.url || "",
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          comments: [],
          commentsLoading: true,
        }));

        // 動画リストを更新
        if (isLoadMore) {
          setVideos((prev) => [...prev, ...newVideos]);
        } else {
          setVideos(newVideos);
        }

        // 次ページトークンを保存
        setNextPageToken(searchData.nextPageToken || "");
        setHasMore(!!searchData.nextPageToken);

        // 2. 各動画のコメントを取得
        for (const video of newVideos) {
          try {
            const commentsResponse = await fetch(
              `/api/youtube-comments?videoId=${video.id}&maxResults=10`,
              { signal: controller?.signal }
            );
            const commentsData = await commentsResponse.json();

            const comments: CommentItem[] =
              commentsData.items?.map((item: any) => ({
                id: item.id,
                text: item.snippet.topLevelComment.snippet.textDisplay,
                authorName:
                  item.snippet.topLevelComment.snippet.authorDisplayName,
                likeCount: item.snippet.topLevelComment.snippet.likeCount,
                publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
              })) || [];

            // 該当の動画のコメントを更新
            setVideos((prev) =>
              prev.map((v) =>
                v.id === video.id
                  ? { ...v, comments, commentsLoading: false }
                  : v
              )
            );
          } catch (error) {
            console.error(`動画 ${video.id} のコメント取得エラー:`, error);
            setVideos((prev) =>
              prev.map((v) =>
                v.id === video.id
                  ? { ...v, comments: [], commentsLoading: false }
                  : v
              )
            );
          }

          // レート制限回避のための待機
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("リクエストが中止されました");
      } else {
        console.error("YouTube統合テストエラー:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 無限スクロール用のIntersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoading &&
          infiniteScrollEnabled
        ) {
          loadVideosWithComments(true, abortController || undefined);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, nextPageToken]);

  // 統合テスト実行/停止
  const testYouTubeIntegration = () => {
    if (isLoading && abortController) {
      // 停止処理
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    } else {
      // 開始処理
      const controller = new AbortController();
      setAbortController(controller);
      setVideos([]);
      setNextPageToken("");
      setHasMore(true);
      loadVideosWithComments(false, controller);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            API テストページ
          </h1>
          <p className="text-gray-600">
            YouTube APIの各エンドポイントをテストして、レスポンスデータを確認できます。
          </p>
        </div>

        {/* テストボタン */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={testYouTubeIntegration}
            disabled={isLoading}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
          >
            {isLoading ? "⏹️ 停止" : "🎮 YouTube統合テスト"}
          </button>

          <button
            onClick={() => setInfiniteScrollEnabled(!infiniteScrollEnabled)}
            className={`px-6 py-2 text-white rounded-lg font-bold ${
              infiniteScrollEnabled
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {infiniteScrollEnabled
              ? "📜 無限スクロール: ON"
              : "🚫 無限スクロール: OFF"}
          </button>
        </div>

        {/* 動画リスト表示 */}
        {videos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🎮 Switch 2 関連動画
            </h2>
            <div className="space-y-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="md:flex">
                    {/* サムネイル */}
                    <div className="md:w-80 md:flex-shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>

                    {/* 動画情報 */}
                    <div className="p-6 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {video.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {video.channelTitle} •{" "}
                        {new Date(video.publishedAt).toLocaleDateString("ja-JP")}
                      </p>

                      {/* コメント表示 */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          💬 上位コメント
                          {video.commentsLoading && (
                            <span className="text-sm text-gray-500">
                              読み込み中...
                            </span>
                          )}
                        </h4>

                        {video.commentsLoading ? (
                          <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {video.comments.slice(0, 10).map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-gray-50 rounded-lg p-3"
                              >
                                <div className="flex items-start justify-between mb-1">
                                  <span className="font-medium text-sm text-gray-900">
                                    {comment.authorName}
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    👍 {comment.likeCount}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {comment.text}
                                </p>
                              </div>
                            ))}
                            {video.comments.length === 0 && (
                              <p className="text-gray-500 text-sm">
                                コメントがありません
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 無限スクロール用の観察要素 */}
            {hasMore && (
              <div ref={observerRef} className="py-8 text-center">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    <span className="ml-3 text-gray-600">更に読み込み中...</span>
                  </div>
                ) : (
                  <p className="text-gray-500">スクロールして更に読み込む</p>
                )}
              </div>
            )}

            {!hasMore && videos.length > 0 && (
              <div className="py-8 text-center text-gray-500">
                全ての動画を読み込みました
              </div>
            )}
          </div>
        )}

        {/* 機能説明 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-900 mb-2">実装済み機能</h3>
          <ul className="text-green-800 space-y-1">
            <li>• YouTube Search API との連携 </li>
            <li>• YouTube Comments API との連携 </li>
            <li>• 動画+コメント統合表示 </li>
            <li>• 無限スクロール機能 </li>
          </ul>
        </div>

        {/* 戻るボタン */}
        <div className="mt-8">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← メインページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
```

### コード動作フローの完全解析

#### リクエストライフサイクル図
```mermaid
flowchart TD
    A[ユーザーがボタンクリック] --> B[testYouTubeIntegration実行]
    B --> C[AbortController作成]
    C --> D[loadVideosWithComments呼び出し]
    D --> E[YouTube Search API呼び出し]
    E --> F{API成功？}
    F -->|Yes| G[動画データを状態に設定]
    F -->|No| H[エラーログ出力]
    G --> I[各動画のコメント取得ループ]
    I --> J[YouTube Comments API呼び出し]
    J --> K[300ms待機（レート制限対策）]
    K --> L{全動画完了？}
    L -->|No| I
    L -->|Yes| M[Intersection Observer設定]
    M --> N[無限スクロール監視開始]
    H --> O[エラー表示]
    O --> P[処理終了]
    N --> P
```

#### 状態管理の詳細メカニズム

**React状態の相互作用:**
```typescript
// 状態の依存関係とデータフロー解析
interface StateFlow {
  videos: VideoItem[];      // メイン動画データ
  isLoading: boolean;       // ローディング状態
  nextPageToken: string;    // ページネーション
  hasMore: boolean;         // 追加読み込み可能性
  infiniteScrollEnabled: boolean; // 機能ON/OFF
  abortController: AbortController | null; // リクエスト制御
}

// 状態変更の連鎖反応
const stateChangeFlow = {
  'ボタンクリック': {
    triggers: ['setAbortController', 'setVideos', 'setNextPageToken', 'setHasMore'],
    sideEffects: ['loadVideosWithComments実行']
  },
  'API成功': {
    triggers: ['setVideos', 'setNextPageToken', 'setHasMore'],
    sideEffects: ['コメント取得ループ開始']
  },
  'スクロール': {
    conditions: ['hasMore && !isLoading && infiniteScrollEnabled'],
    triggers: ['loadVideosWithComments(true)'],
    sideEffects: ['Intersection Observer再設定']
  }
};
```

**フロントエンド実装の高度なポイント:**

1. **状態管理の最適化**: useReducerパターンでの複雑な状態制御
2. **メモ化戦略**: useMemo/useCallbackでの再レンダリング抑制  
3. **非同期処理制御**: AbortControllerでのリクエスト管理
4. **エラー境界**: Error Boundaryでの包括的エラーハンドリング
5. **パフォーマンス監視**: React DevTools Profilerでのボトルネック特定
6. **アクセシビリティ**: ARIA属性での音声読み上げ対応
7. **レスポンシブ対応**: モバイルファーストデザインの実装

## 🚀 実用的なTips & ベストプラクティス

### 1. APIクォータ管理

YouTube Data API v3の制限:
- **デフォルトクォータ**: 1日10,000ユニット
- **search**: 100ユニット/リクエスト
- **videos**: 1ユニット/リクエスト  
- **commentThreads**: 1ユニット/リクエスト

**クォータ節約のコツ:**
```typescript
// ❌ 悪い例: 毎回検索APIを叩く
const searchVideos = async (query: string) => {
  // 毎回100ユニット消費
  return fetch(`/api/youtube-search?q=${query}`);
};

// ✅ 良い例: キャッシュを活用
const searchWithCache = async (query: string) => {
  const cacheKey = `search-${query}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const data = JSON.parse(cached);
    // キャッシュが1時間以内なら使用
    if (Date.now() - data.timestamp < 3600000) {
      return data.result;
    }
  }
  
  const result = await fetch(`/api/youtube-search?q=${query}`);
  localStorage.setItem(cacheKey, JSON.stringify({
    result,
    timestamp: Date.now()
  }));
  
  return result;
};
```

### 2. エラーハンドリングパターン

```typescript
// 汎用的なエラーハンドリング関数
const handleYouTubeApiError = (error: any) => {
  if (error.details?.error?.code === 403) {
    if (error.details.error.message.includes('quota')) {
      return 'APIクォータを超過しました。明日お試しください。';
    }
    return 'APIアクセス権限がありません。APIキーを確認してください。';
  }
  
  if (error.details?.error?.code === 400) {
    return 'リクエストパラメータに問題があります。';
  }
  
  return 'APIエラーが発生しました。しばらく待ってからお試しください。';
};

// 使用例
try {
  const response = await fetch('/api/youtube-search?q=test');
  const data = await response.json();
  
  if (data.error) {
    const userMessage = handleYouTubeApiError(data);
    setErrorMessage(userMessage);
  }
} catch (error) {
  setErrorMessage('ネットワークエラーが発生しました。');
}
```

### 3. パフォーマンス最適化

```typescript
// デバウンス機能付き検索
import { useCallback, useRef } from 'react';

const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// 使用例
const debouncedSearch = useDebounce(async (query: string) => {
  if (query.length > 2) {
    const response = await fetch(`/api/youtube-search?q=${query}`);
    const data = await response.json();
    setSearchResults(data.items || []);
  }
}, 500); // 500ms待機

// input onChange
<input 
  onChange={(e) => debouncedSearch(e.target.value)}
  placeholder="動画を検索..."
/>
```

### 4. 型安全性の向上

```typescript
// 型定義ファイル: types/youtube.ts
export interface YouTubeSearchResponse {
  kind: 'youtube#searchListResponse';
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchItem[];
}

export interface YouTubeSearchItem {
  kind: 'youtube#searchResult';
  etag: string;
  id: {
    kind: 'youtube#video';
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: YouTubeThumbnails;
    channelTitle: string;
  };
}

export interface YouTubeThumbnails {
  default: YouTubeThumbnail;
  medium: YouTubeThumbnail;
  high: YouTubeThumbnail;
}

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

// 使用例
const searchVideos = async (query: string): Promise<YouTubeSearchResponse> => {
  const response = await fetch(`/api/youtube-search?q=${query}`);
  return response.json(); // 型推論が効く
};
```

## 🐛 よくあるトラブルと解決法

### 1. APIキーエラー

**症状:** `403 Forbidden` エラー

**原因と解決法:**
```bash
# 1. APIキーが設定されていない
# 解決: .env.local を確認

# 2. APIキーの権限不足
# 解決: Google Cloud Console でYouTube Data API を有効化

# 3. リファラー制限
# 解決: APIキーの制限設定でlocalhostを追加
```

### 2. CORSエラー

**症状:** `Access to fetch at 'https://www.googleapis.com/youtube/v3/...' from origin 'http://localhost:3000' has been blocked by CORS policy`

**原因と解決法:**
```typescript
// ❌ 悪い例: フロントエンドから直接API呼び出し
const fetchVideos = () => {
  fetch('https://www.googleapis.com/youtube/v3/search?key=...'); // CORSエラー
};

// ✅ 良い例: Next.js API Routes経由
const fetchVideos = () => {
  fetch('/api/youtube-search?q=test'); // 正常動作
};
```

### 3. レート制限エラー

**症状:** `429 Too Many Requests` エラー

**解決法:**
```typescript
// リクエスト間隔を制御
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRateLimit = async (urls: string[]) => {
  const results = [];
  
  for (const url of urls) {
    const response = await fetch(url);
    results.push(await response.json());
    
    // 300ms待機（1秒に最大3リクエスト）
    await delay(300);
  }
  
  return results;
};
```

### 4. クォータ超過エラー

**症状:** `403 quotaExceeded` エラー

**解決法:**
```typescript
// キャッシュ戦略を実装
const CACHE_DURATION = 60 * 60 * 1000; // 1時間

const getCachedOrFetch = async (url: string) => {
  const cacheKey = `youtube-${btoa(url)}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp < CACHE_DURATION) {
      return data.result;
    }
  }
  
  try {
    const response = await fetch(url);
    const result = await response.json();
    
    localStorage.setItem(cacheKey, JSON.stringify({
      result,
      timestamp: Date.now()
    }));
    
    return result;
  } catch (error) {
    // キャッシュがあれば期限切れでも返す
    if (cached) {
      return JSON.parse(cached).result;
    }
    throw error;
  }
};
```

## 📈 運用・監視のポイント

### 1. ログ監視

```typescript
// API Route でのログ出力
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const query = searchParams.get('q');
  
  try {
    const response = await fetch(youtubeApiUrl);
    const data = await response.json();
    
    // 成功ログ
    console.log(`[YouTube API] Success - Query: ${query}, Time: ${Date.now() - startTime}ms, Results: ${data.items?.length || 0}`);
    
    return NextResponse.json(data);
  } catch (error) {
    // エラーログ
    console.error(`[YouTube API] Error - Query: ${query}, Time: ${Date.now() - startTime}ms`, error);
    
    return NextResponse.json(
      { error: 'API呼び出しに失敗しました' },
      { status: 500 }
    );
  }
}
```

### 2. パフォーマンス測定

```typescript
// API呼び出し時間の測定
const measureApiPerformance = async (apiCall: () => Promise<any>) => {
  const start = performance.now();
  try {
    const result = await apiCall();
    const duration = performance.now() - start;
    
    console.log(`API呼び出し時間: ${duration.toFixed(2)}ms`);
    
    // 遅い場合はアラート
    if (duration > 3000) {
      console.warn('APIレスポンスが遅いです:', duration);
    }
    
    return result;
  } catch (error) {
    console.error('API呼び出しエラー:', error);
    throw error;
  }
};
```

### 3. デプロイ時の設定

#### Vercel環境変数設定
```bash
# Vercel CLI での設定
npx vercel env add YOUTUBE_API_KEY

# または Vercel Dashboard で設定
# Settings → Environment Variables
# Name: YOUTUBE_API_KEY
# Value: AIzaSyC_your_actual_api_key_here
# Environments: Production, Preview, Development
```

#### Dockerfile (Docker使用時)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# 環境変数をビルド時に設定（本番では避ける）
# ARG YOUTUBE_API_KEY
# ENV YOUTUBE_API_KEY=$YOUTUBE_API_KEY

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 🎯 次のステップ

このガイドを完了したら、以下のステップに進むことをお勧めします：

### 1. 機能拡張
- **Redis**でのキャッシュ実装
- **Database**への検索結果保存
- **認証機能**の追加
- **Admin Dashboard**の構築

### 2. 他のAPI統合
- **Reddit API**: コミュニティ情報
- **はてなブックマークAPI**: 日本語記事
- **RAWG API**: ゲーム基本情報

### 3. 最適化・監視
- **New Relic**や**DataDog**での監視
- **Sentry**でのエラー追跡
- **Google Analytics**でのユーザー行動分析

## 🚀 高度な実装パターン【プロダクション対応】

### 1. カスタムフック設計パターン

#### useYouTubeApi - 汎用APIフック
```typescript
// src/hooks/useYouTubeApi.ts
import { useState, useCallback, useRef } from 'react';

interface UseYouTubeApiOptions {
  autoAbort?: boolean;
  retryCount?: number;
  cacheEnabled?: boolean;
  cacheTtl?: number;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useYouTubeApi<T>(options: UseYouTubeApiOptions = {}) {
  const {
    autoAbort = true,
    retryCount = 2,
    cacheEnabled = true,
    cacheTtl = 300000 // 5分
  } = options;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(new Map<string, { data: T; timestamp: number }>());
  
  const execute = useCallback(async (
    endpoint: string,
    params: Record<string, string> = {},
    transform?: (data: any) => T
  ): Promise<T | null> => {
    // 既存リクエストの中断
    if (autoAbort && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // キャッシュチェック
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    if (cacheEnabled) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTtl) {
        setState(prev => ({
          ...prev,
          data: cached.data,
          loading: false,
          error: null,
          lastUpdated: new Date(cached.timestamp)
        }));
        return cached.data;
      }
    }
    
    // 新しいリクエスト開始
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    let lastError: Error | null = null;
    
    // リトライ機能付きリクエスト
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const query = new URLSearchParams(params).toString();
        const url = `${endpoint}${query ? `?${query}` : ''}`;
        
        const response = await fetch(url, {
          signal: controller.signal
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const rawData = await response.json();
        const data = transform ? transform(rawData) : rawData as T;
        
        // キャッシュに保存
        if (cacheEnabled) {
          cacheRef.current.set(cacheKey, {
            data,
            timestamp: Date.now()
          });
        }
        
        setState({
          data,
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
        
        return data;
        
      } catch (error) {
        lastError = error as Error;
        
        // AbortErrorの場合はリトライしない
        if (error.name === 'AbortError') {
          break;
        }
        
        // 最後の試行でない場合は待機
        if (attempt < retryCount) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }
    
    // 全リトライ失敗
    setState(prev => ({
      ...prev,
      loading: false,
      error: lastError?.message || 'Unknown error'
    }));
    
    return null;
  }, [autoAbort, retryCount, cacheEnabled, cacheTtl]);
  
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);
  
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  
  return {
    ...state,
    execute,
    clearCache,
    abort
  };
}
```

#### useYouTubeSearch - 専用検索フック
```typescript
// src/hooks/useYouTubeSearch.ts
import { useCallback, useState } from 'react';
import { useYouTubeApi } from './useYouTubeApi';

interface YouTubeSearchResult {
  videos: VideoItem[];
  nextPageToken: string;
  totalResults: number;
}

interface UseYouTubeSearchOptions {
  initialQuery?: string;
  maxResults?: number;
  autoSearch?: boolean;
}

export function useYouTubeSearch(options: UseYouTubeSearchOptions = {}) {
  const { initialQuery = '', maxResults = 10, autoSearch = false } = options;
  
  const [query, setQuery] = useState(initialQuery);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [pageToken, setPageToken] = useState('');
  const [hasMore, setHasMore] = useState(true);
  
  const api = useYouTubeApi<YouTubeSearchResult>({
    cacheEnabled: true,
    cacheTtl: 600000 // 10分キャッシュ
  });
  
  const transformSearchResult = useCallback((data: any): YouTubeSearchResult => {
    return {
      videos: data.items?.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium?.url || '',
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        comments: [],
        commentsLoading: false
      })) || [],
      nextPageToken: data.nextPageToken || '',
      totalResults: data.pageInfo?.totalResults || 0
    };
  }, []);
  
  const search = useCallback(async (searchQuery?: string, isLoadMore = false) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    
    const params = {
      q: q,
      maxResults: maxResults.toString(),
      ...(isLoadMore && pageToken && { pageToken })
    };
    
    const result = await api.execute(
      '/api/youtube-search',
      params,
      transformSearchResult
    );
    
    if (result) {
      if (isLoadMore) {
        setVideos(prev => [...prev, ...result.videos]);
      } else {
        setVideos(result.videos);
      }
      setPageToken(result.nextPageToken);
      setHasMore(!!result.nextPageToken);
    }
  }, [query, maxResults, pageToken, api, transformSearchResult]);
  
  const loadMore = useCallback(() => {
    if (hasMore && !api.loading) {
      search(undefined, true);
    }
  }, [search, hasMore, api.loading]);
  
  const reset = useCallback(() => {
    setVideos([]);
    setPageToken('');
    setHasMore(true);
    api.clearCache();
  }, [api]);
  
  return {
    query,
    setQuery,
    videos,
    hasMore,
    search,
    loadMore,
    reset,
    loading: api.loading,
    error: api.error
  };
}
```

### 2. コンテキストベースの状態管理

#### YouTubeApiProvider - グローバル状態管理
```typescript
// src/contexts/YouTubeApiContext.tsx
import React, { createContext, useContext, useReducer, useCallback } from 'react';

interface YouTubeApiState {
  globalLoading: boolean;
  quotaUsed: number;
  quotaLimit: number;
  rateLimitRemaining: number;
  lastError: string | null;
  cache: Map<string, CacheEntry>;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

type YouTubeApiAction = 
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'UPDATE_QUOTA'; payload: { used: number; limit: number } }
  | { type: 'UPDATE_RATE_LIMIT'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_CACHE'; payload: { key: string; data: any; ttl: number } }
  | { type: 'CLEAR_CACHE' };

const initialState: YouTubeApiState = {
  globalLoading: false,
  quotaUsed: 0,
  quotaLimit: 10000,
  rateLimitRemaining: 100,
  lastError: null,
  cache: new Map()
};

function youtubeApiReducer(state: YouTubeApiState, action: YouTubeApiAction): YouTubeApiState {
  switch (action.type) {
    case 'SET_GLOBAL_LOADING':
      return { ...state, globalLoading: action.payload };
      
    case 'UPDATE_QUOTA':
      return { 
        ...state, 
        quotaUsed: action.payload.used,
        quotaLimit: action.payload.limit
      };
      
    case 'UPDATE_RATE_LIMIT':
      return { ...state, rateLimitRemaining: action.payload };
      
    case 'SET_ERROR':
      return { ...state, lastError: action.payload };
      
    case 'UPDATE_CACHE':
      const newCache = new Map(state.cache);
      newCache.set(action.payload.key, {
        data: action.payload.data,
        timestamp: Date.now(),
        expiry: Date.now() + action.payload.ttl
      });
      return { ...state, cache: newCache };
      
    case 'CLEAR_CACHE':
      return { ...state, cache: new Map() };
      
    default:
      return state;
  }
}

interface YouTubeApiContextValue {
  state: YouTubeApiState;
  actions: {
    setGlobalLoading: (loading: boolean) => void;
    updateQuota: (used: number, limit: number) => void;
    updateRateLimit: (remaining: number) => void;
    setError: (error: string | null) => void;
    updateCache: (key: string, data: any, ttl: number) => void;
    clearCache: () => void;
    getCachedData: (key: string) => any | null;
  };
}

const YouTubeApiContext = createContext<YouTubeApiContextValue | undefined>(undefined);

export function YouTubeApiProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(youtubeApiReducer, initialState);
  
  const actions = {
    setGlobalLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading });
    }, []),
    
    updateQuota: useCallback((used: number, limit: number) => {
      dispatch({ type: 'UPDATE_QUOTA', payload: { used, limit } });
    }, []),
    
    updateRateLimit: useCallback((remaining: number) => {
      dispatch({ type: 'UPDATE_RATE_LIMIT', payload: remaining });
    }, []),
    
    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),
    
    updateCache: useCallback((key: string, data: any, ttl: number) => {
      dispatch({ type: 'UPDATE_CACHE', payload: { key, data, ttl } });
    }, []),
    
    clearCache: useCallback(() => {
      dispatch({ type: 'CLEAR_CACHE' });
    }, []),
    
    getCachedData: useCallback((key: string) => {
      const entry = state.cache.get(key);
      if (entry && Date.now() < entry.expiry) {
        return entry.data;
      }
      return null;
    }, [state.cache])
  };
  
  return (
    <YouTubeApiContext.Provider value={{ state, actions }}>
      {children}
    </YouTubeApiContext.Provider>
  );
}

export function useYouTubeApiContext() {
  const context = useContext(YouTubeApiContext);
  if (!context) {
    throw new Error('useYouTubeApiContext must be used within YouTubeApiProvider');
  }
  return context;
}
```

### 3. 高度なエラーハンドリングパターン

#### ErrorBoundary - React エラー境界
```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class YouTubeApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // カスタムエラーハンドラーを実行
    this.props.onError?.(error, errorInfo);
    
    // エラーログ送信
    this.reportError(error, errorInfo);
  }
  
  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // 本番環境でのエラーレポート送信
    if (process.env.NODE_ENV === 'production') {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // エラートラッキングサービスに送信
      fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      }).catch(console.error);
    }
  };
  
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };
  
  render() {
    if (this.state.hasError) {
      // カスタムフォールバックUIがある場合
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // デフォルトエラーUI
      return (
        <div className="error-boundary bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            🚨 エラーが発生しました
          </h2>
          <p className="text-red-700 mb-4">
            YouTube APIとの通信中に予期しないエラーが発生しました。
          </p>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              再試行
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              ページを再読み込み
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-red-600">
                エラー詳細（開発用）
              </summary>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                {this.state.error?.stack}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 4. パフォーマンス最適化パターン

#### VirtualizedVideoList - 仮想化リスト
```typescript
// src/components/VirtualizedVideoList.tsx
import React, { memo, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { VideoItem } from '../types/youtube';

interface VirtualizedVideoListProps {
  videos: VideoItem[];
  onVideoSelect?: (video: VideoItem) => void;
  height: number;
  itemHeight: number;
}

interface VideoItemComponentProps {
  index: number;
  style: React.CSSProperties;
  data: {
    videos: VideoItem[];
    onVideoSelect?: (video: VideoItem) => void;
  };
}

const VideoItemComponent = memo<VideoItemComponentProps>(({ index, style, data }) => {
  const video = data.videos[index];
  
  const handleClick = useCallback(() => {
    data.onVideoSelect?.(video);
  }, [video, data.onVideoSelect]);
  
  return (
    <div style={style} className="p-2">
      <div 
        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={handleClick}
      >
        <div className="flex">
          <div className="w-40 h-24 flex-shrink-0">
            <img 
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1 p-3">
            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
              {video.title}
            </h3>
            <p className="text-xs text-gray-600 mb-1">
              {video.channelTitle}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(video.publishedAt).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export const VirtualizedVideoList = memo<VirtualizedVideoListProps>(({
  videos,
  onVideoSelect,
  height,
  itemHeight
}) => {
  const itemData = useMemo(() => ({
    videos,
    onVideoSelect
  }), [videos, onVideoSelect]);
  
  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        動画が見つかりませんでした
      </div>
    );
  }
  
  return (
    <List
      height={height}
      itemCount={videos.length}
      itemSize={itemHeight}
      itemData={itemData}
      overscanCount={5} // パフォーマンス最適化のための先読み数
    >
      {VideoItemComponent}
    </List>
  );
});
```

### 5. テスト戦略とサンプル

#### APIフックのテスト
```typescript
// src/hooks/__tests__/useYouTubeSearch.test.ts
import { renderHook, act } from '@testing-library/react';
import { useYouTubeSearch } from '../useYouTubeSearch';

// モック設定
global.fetch = jest.fn();

describe('useYouTubeSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useYouTubeSearch());
    
    expect(result.current.query).toBe('');
    expect(result.current.videos).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.hasMore).toBe(true);
  });
  
  test('検索が正常に実行される', async () => {
    const mockResponse = {
      items: [
        {
          id: { videoId: 'test123' },
          snippet: {
            title: 'Test Video',
            thumbnails: { medium: { url: 'test.jpg' } },
            channelTitle: 'Test Channel',
            publishedAt: '2023-01-01T00:00:00Z'
          }
        }
      ],
      nextPageToken: 'next123',
      pageInfo: { totalResults: 1 }
    };
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const { result } = renderHook(() => useYouTubeSearch());
    
    await act(async () => {
      result.current.setQuery('test query');
      await result.current.search();
    });
    
    expect(result.current.videos).toHaveLength(1);
    expect(result.current.videos[0].title).toBe('Test Video');
    expect(result.current.hasMore).toBe(true);
  });
  
  test('エラーハンドリングが正常に動作する', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    const { result } = renderHook(() => useYouTubeSearch());
    
    await act(async () => {
      result.current.setQuery('test query');
      await result.current.search();
    });
    
    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });
});
```

これで実践的で詳細なYouTube API連携実装ガイドの完成です！このガイドを参考に、実際のプロジェクトでYouTube APIを活用してください。

## 🎯 まとめと次のステップ

**このガイドで学んだこと:**
✅ YouTube API の詳細な設定方法  
✅ セキュアなAPI Route実装  
✅ 高度なフロントエンド統合  
✅ エラーハンドリングとパフォーマンス最適化  
✅ プロダクションレベルの実装パターン  
✅ テスト戦略とデバッグ方法

**推奨される学習順序:**
1. 基本実装の動作確認
2. エラーハンドリングの追加
3. パフォーマンス最適化の適用
4. テストの実装
5. 本番環境へのデプロイ

**関連リソース:**
- [YouTube Data API v3 公式ドキュメント](https://developers.google.com/youtube/v3)
- [Next.js API Routes ガイド](https://nextjs.org/docs/api-routes/introduction)
- [React パフォーマンス最適化](https://react.dev/learn/render-and-commit)

このガイドがあなたのプロジェクト成功の一助となれば幸いです！