# YouTube API連携実装ガイド【後輩エンジニア向け詳細解説版】

## 🎯 このガイドについて

**対象者**: プログラミング経験1-2年の後輩エンジニア
**前提知識**: JavaScript/TypeScript、React の基本的な理解

このガイドでは、「なぜそうするのか」「何が起きているのか」を一つ一つ丁寧に解説します。
## 📚 まず最初に：YouTube API って何？

### YouTube API とは？
YouTube API（Application Programming Interface）は、YouTubeが提供する「外部のプログラムからYouTubeのデータにアクセスできる仕組み」です。

**具体的に何ができるの？**
- 動画を検索する
- 動画の詳細情報（タイトル、再生数、いいね数など）を取得する
- コメントを取得する
- チャンネル情報を取得する

**なぜAPIを使うの？**
- YouTubeの膨大なデータベースにアクセスできる
- 自分のアプリにYouTube機能を組み込める
- リアルタイムの最新データが取得できる

### 今回作るもの
Switch 2のゲーム情報サイトで、以下の機能を実装します：

1. **ゲーム名で動画を検索** → ゲーム関連の動画一覧を表示
2. **動画の詳細情報表示** → タイトル、再生数、いいね数、投稿日など
3. **コメント取得** → 動画に付いたコメントを表示

## 🔧 Step 1: Google Cloud Console でAPIを有効にする

### なぜGoogle Cloud Console を使うのか？
YouTube はGoogleのサービスなので、Googleが管理する「Google Cloud Console」でAPIの設定を行います。これは銀行でお金を借りる時に審査が必要なのと同じで、誰でも勝手にAPIを使えないよう管理されてます。

### 1-1. Google Cloud Console にアクセス

まず、[Google Cloud Console](https://console.cloud.google.com/) にアクセスします。

**⚠️ 注意点**
- 必ずGoogleアカウントでログインしてください
- 会社のアカウントより個人のアカウントの方が良いです

### 1-2. 新しいプロジェクトを作成

**なぜプロジェクトを作るの？**
Google Cloud では、関連するサービスを「プロジェクト」という単位で管理します。今回のゲーム情報サイト用に専用のプロジェクトを作ることで、他の用途と混ざらず管理がしやすくなります。

**手順:**
1. 画面上部の「プロジェクトを選択」をクリック
2. 「新しいプロジェクト」をクリック
3. プロジェクト名に「switch2-game-site」と入力
   - **なぜこの名前？** → 後で見た時に何のプロジェクトか分かりやすいから
4. 「作成」をクリック
5. 作成完了まで1-2分待つ

**📸 確認ポイント**
- 画面上部に「switch2-game-site」と表示されればOK

### 1-3. YouTube Data API v3 を有効化

**YouTube Data API v3 って何？**
- YouTubeのAPIにはいくつか種類があります
- 「v3」は現在の最新バージョン
- 「Data API」は動画やコメントなどのデータを取得するAPI

**手順:**
1. 左メニューから「APIとサービス」をクリック
2. 「ライブラリ」をクリック
3. 検索バーに「YouTube Data API v3」と入力
4. 検索結果の「YouTube Data API v3」をクリック
5. 「有効にする」ボタンをクリック

**📸 確認ポイント**
- 「APIが有効です」という表示が出ればOK

### 1-4. APIキーを作成

**APIキーって何？**
APIキーは、あなたが正当な利用者であることを証明する「パスワード」のようなものです。このキーがないと、YouTubeのデータにアクセスできません。

**手順:**
1. 左メニューから「APIとサービス」→「認証情報」をクリック
2. 画面上部の「+ 認証情報を作成」をクリック
3. 「APIキー」を選択
4. APIキーが生成される（例：`AIzaSyDxxxxxxxxxxxxxxxxxxxxx`）
5. **重要**: このAPIキーをコピーして安全な場所に保存

**🔒 セキュリティ設定（重要！）**
1. 生成されたAPIキーの右側の「鉛筆マーク（編集）」をクリック
2. 「APIの制限」を選択
3. 「YouTube Data API v3」にチェックを入れる
4. 「保存」をクリック

**なぜ制限するの？**
- APIキーが盗まれても、YouTube以外のサービスでは使えなくなる
- セキュリティが向上する

## 🏗️ Step 2: プロジェクト環境を準備する

### 2-1. 必要なディレクトリを作成

**まず、なぜこのディレクトリ構成なの？**
Next.js では決められたディレクトリ構成があり、それに従うことで機能が正しく動作します。

```bash
# プロジェクトルートで以下を実行
mkdir -p src/types
mkdir -p src/lib  
mkdir -p src/hooks
mkdir -p src/app/api/youtube/search
mkdir -p src/app/api/youtube/comments
```

**各ディレクトリの役割:**
- `src/types`: TypeScriptの型定義を入れる場所
- `src/lib`: APIクライアントなどのユーティリティ関数を入れる場所
- `src/hooks`: React のカスタムフックを入れる場所  
- `src/app/api/youtube`: YouTube API 用のサーバーサイドコードを入れる場所

### 2-2. 環境変数ファイルを作成

**環境変数って何？**
環境変数は「秘密の設定値」を保存するファイルです。APIキーのような機密情報は、コードに直接書かずに環境変数に保存します。

**プロジェクトルートに .env.local ファイルを作成:**

```bash
# ファイルを作成
touch .env.local
```

**.env.local ファイルの中身:**
```bash
# YouTube Data API v3のAPIキー
YOUTUBE_API_KEY=ここに先ほど取得したAPIキーを貼り付け

# 開発環境用設定
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**⚠️ 重要な注意点**
- `YOUTUBE_API_KEY=` の後にスペースを入れないこと
- APIキーは `""` で囲まないこと
- `.env.local` は絶対にGitにコミットしない（機密情報のため）

**確認方法:**
```bash
# .gitignore にちゃんと .env.local が入っているか確認
cat .gitignore | grep .env.local
```

## 📝 Step 3: TypeScript型定義を作成

### なぜ型定義が必要なの？

TypeScript を使う理由は「型安全性」です。型を定義することで：
- 間違ったデータ構造を使うとエラーになる
- IDEで自動補完が効く
- バグが早期発見できる

### 3-1. YouTube関連の型定義を作成

**src/types/youtube.ts を作成:**

```typescript
// YouTube動画の基本情報を表す型
// なぜこの型が必要？ → YouTube APIから返ってくるデータの形を明確にするため
export interface YouTubeVideo {
  id: string;              // 動画のID（例: "dQw4w9WgXcQ"）
  title: string;           // 動画のタイトル
  description: string;     // 動画の説明文
  thumbnailUrl: string;    // サムネイル画像のURL
  channelTitle: string;    // チャンネル名
  channelId: string;       // チャンネルID
  publishedAt: string;     // 投稿日時（ISO形式: "2023-12-01T10:00:00Z"）
  viewCount: string;       // 再生数（文字列で返ってくる）
  likeCount?: string;      // いいね数（?は「あるかもしれない」という意味）
  duration: string;        // 動画の長さ（ISO形式: "PT4M33S" = 4分33秒）
  tags?: string[];         // タグ（配列）
}

// YouTubeコメントの情報を表す型
export interface YouTubeComment {
  id: string;                      // コメントのID
  author: string;                  // 投稿者の名前
  authorProfileImageUrl: string;   // 投稿者のアバター画像URL
  text: string;                    // コメントの本文（元のテキスト）
  textDisplay: string;             // コメントの本文（HTML形式）
  likeCount: number;               // このコメントのいいね数
  publishedAt: string;             // 投稿日時
  updatedAt: string;               // 更新日時
}

// YouTube検索結果をまとめた型
export interface YouTubeSearchResult {
  videos: YouTubeVideo[];          // 検索でヒットした動画の配列
  nextPageToken?: string;          // 次のページがある場合のトークン
  totalResults: number;            // 検索結果の総数
  resultsPerPage: number;          // 1ページあたりの結果数
}

// コメント取得結果をまとめた型
export interface YouTubeCommentsResult {
  comments: YouTubeComment[];      // 取得したコメントの配列
  nextPageToken?: string;          // 次のページがある場合のトークン
}

// API呼び出しが失敗した時のエラー型
export interface YouTubeAPIError {
  error: {
    code: number;                  // HTTPステータスコード（例: 403, 500）
    message: string;               // エラーメッセージ
    errors: Array<{                // 詳細なエラー情報の配列
      domain: string;              // エラーのドメイン
      reason: string;              // エラーの理由
      message: string;             // 具体的なエラーメッセージ
    }>;
  };
}
```

**💡 解説ポイント**

1. **`?` の意味**: `likeCount?: string` の `?` は「このプロパティはあるかもしれないし、ないかもしれない」という意味です。YouTube API では、いいね数が非公開の場合があるためです。

2. **`string[]` の意味**: `tags: string[]` は「文字列の配列」という意味です。タグは複数あるので配列になります。

3. **なぜviewCountが文字列？**: YouTube APIでは数値も文字列として返ってきます。JavaScriptの数値の上限を超える可能性があるためです。

## 🔧 Step 4: YouTube APIクライアントを実装

### APIクライアントって何？

APIクライアントは「YouTube APIとやり取りする専用の関数集」です。これを作ることで：
- 他の部分でAPIを使いやすくなる
- API呼び出しロジックを一箇所に集約できる
- エラーハンドリングを統一できる

### 4-1. YouTube APIクライアントを作成

**src/lib/youtube.ts を作成:**

```typescript
// YouTube APIから取得したデータを扱うための型をインポート
import { 
  YouTubeVideo, 
  YouTubeComment, 
  YouTubeSearchResult,
  YouTubeCommentsResult
} from '@/types/youtube';

// YouTube API の基本URL（すべてのAPI呼び出しで使用）
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * YouTube動画を検索する関数
 * 
 * この関数がやること：
 * 1. YouTube APIで動画を検索
 * 2. 検索結果の動画IDを使って、詳細情報（再生数など）を取得
 * 3. 2つの情報を組み合わせて、完全な動画情報を返す
 * 
 * なぜ2回API呼び出しが必要？
 * → 検索APIでは基本情報しか取れず、詳細情報は別のAPIで取得する必要があるため
 */
export async function searchYouTubeVideos(
  query: string,              // 検索キーワード（例: "スプラトゥーン3 Switch 2"）
  maxResults: number = 10,    // 取得する動画数（デフォルト10件）
  pageToken?: string          // ページネーション用トークン（2ページ目以降で使用）
): Promise<YouTubeSearchResult> {
  
  // 環境変数からAPIキーを取得
  const API_KEY = process.env.YOUTUBE_API_KEY;
  
  // APIキーがない場合はエラー
  if (!API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  console.log('🔍 YouTube検索開始:', query);

  // ===== Step 1: 動画検索API呼び出し =====
  
  // URLSearchParams: URLのクエリパラメータを簡単に作れるクラス
  const searchParams = new URLSearchParams({
    key: API_KEY,                    // APIキー
    part: 'snippet',                 // 取得する情報の種類（snippet = 基本情報）
    type: 'video',                   // 動画のみを検索（プレイリストやチャンネルは除外）
    q: query,                        // 検索キーワード
    maxResults: maxResults.toString(), // 最大取得数（数値を文字列に変換）
    order: 'relevance',              // 関連度順でソート
    relevanceLanguage: 'ja',         // 日本語コンテンツ優先
    regionCode: 'JP',                // 日本地域設定
    safeSearch: 'moderate',          // 不適切なコンテンツを中程度フィルタリング
    videoCaption: 'any'              // 字幕の有無は問わない
  });

  // ページネーション用トークンがある場合は追加
  if (pageToken) {
    searchParams.append('pageToken', pageToken);
  }

  try {
    // fetch: HTTP リクエストを送信する関数
    const searchResponse = await fetch(
      `${YOUTUBE_API_BASE}/search?${searchParams}`,
      {
        headers: {
          'Accept': 'application/json',  // JSONデータを受け取ることを明示
        }
      }
    );

    // レスポンスが失敗（404や500など）の場合
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('❌ YouTube Search API Error:', errorData);
      throw new Error(`YouTube Search API error: ${searchResponse.status}`);
    }

    // レスポンスをJSONに変換
    const searchData = await searchResponse.json();
    
    console.log('✅ 検索API成功:', searchData.items.length + '件取得');

    // 動画IDを抽出（次のAPI呼び出しで使用）
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    
    // 検索結果が0件の場合は早期リターン
    if (videoIds.length === 0) {
      return {
        videos: [],
        totalResults: 0,
        resultsPerPage: maxResults,
        nextPageToken: searchData.nextPageToken
      };
    }

    // ===== Step 2: 動画詳細情報取得API呼び出し =====
    
    console.log('🔍 動画詳細取得開始:', videoIds);

    const detailsParams = new URLSearchParams({
      key: API_KEY,
      part: 'statistics,contentDetails,snippet',  // statistics=再生数など, contentDetails=長さなど
      id: videoIds                                 // 検索で取得した動画IDをカンマ区切りで送信
    });

    const detailsResponse = await fetch(
      `${YOUTUBE_API_BASE}/videos?${detailsParams}`
    );

    if (!detailsResponse.ok) {
      console.error('❌ YouTube Videos API Error:', detailsResponse.status);
      throw new Error(`YouTube Videos API error: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();
    
    console.log('✅ 詳細取得API成功:', detailsData.items.length + '件取得');

    // ===== Step 3: 検索結果と詳細情報を組み合わせ =====

    const videos: YouTubeVideo[] = searchData.items.map((searchItem: any, index: number) => {
      // 対応する詳細情報を探す
      const details = detailsData.items.find((item: any) => item.id === searchItem.id.videoId);
      
      return {
        id: searchItem.id.videoId,
        title: searchItem.snippet.title,
        description: searchItem.snippet.description,
        // サムネイル画像はmediumサイズを優先、なければdefaultサイズ
        thumbnailUrl: searchItem.snippet.thumbnails.medium?.url || 
                     searchItem.snippet.thumbnails.default?.url || '',
        channelTitle: searchItem.snippet.channelTitle,
        channelId: searchItem.snippet.channelId,
        publishedAt: searchItem.snippet.publishedAt,
        // 統計情報がない場合は"0"をデフォルト値に
        viewCount: details?.statistics?.viewCount || '0',
        likeCount: details?.statistics?.likeCount || '0',
        duration: details?.contentDetails?.duration || 'PT0S',
        tags: details?.snippet?.tags || []
      };
    });

    console.log('🎉 YouTube検索完了:', videos.length + '件の動画情報を取得');

    return {
      videos,
      totalResults: searchData.pageInfo.totalResults,
      resultsPerPage: searchData.pageInfo.resultsPerPage,
      nextPageToken: searchData.nextPageToken
    };

  } catch (error) {
    console.error('💥 YouTube search error:', error);
    
    // エラーオブジェクトの場合はそのまま再throw、それ以外は汎用エラー
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to search YouTube videos');
  }
}

/**
 * YouTube動画のコメントを取得する関数
 * 
 * 注意点：
 * - すべての動画でコメントが取得できるわけではない（非公開設定の場合など）
 * - 403エラーが返ってくる場合は、コメントが無効化されている
 */
export async function getYouTubeComments(
  videoId: string,            // 動画ID
  maxResults: number = 20,    // 取得するコメント数
  pageToken?: string          // ページネーション用トークン
): Promise<YouTubeCommentsResult> {
  
  const API_KEY = process.env.YOUTUBE_API_KEY;
  
  if (!API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  console.log('💬 YouTubeコメント取得開始:', videoId);

  const params = new URLSearchParams({
    key: API_KEY,
    part: 'snippet',             // コメントの基本情報
    videoId: videoId,            // 対象の動画ID
    maxResults: maxResults.toString(),
    order: 'relevance',          // 関連度順（人気のコメント優先）
    textFormat: 'plainText'      // プレーンテキスト形式（HTMLタグなし）
  });

  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/commentThreads?${params}`
    );
    
    if (!response.ok) {
      // 403エラーの場合はコメントが無効化されている
      if (response.status === 403) {
        console.warn('⚠️ Comments are disabled for this video:', videoId);
        return { comments: [] };  // 空の配列を返す
      }
      
      const errorData = await response.json();
      console.error('❌ YouTube Comments API Error:', errorData);
      throw new Error(`YouTube Comments API error: ${response.status}`);
    }

    const data = await response.json();
    
    // コメントデータを整形
    const comments: YouTubeComment[] = data.items.map((item: any) => {
      // topLevelComment: スレッドのトップレベルコメント（返信ではない）
      const snippet = item.snippet.topLevelComment.snippet;
      
      return {
        id: item.id,
        author: snippet.authorDisplayName,
        authorProfileImageUrl: snippet.authorProfileImageUrl,
        text: snippet.textOriginal,          // 元のテキスト
        textDisplay: snippet.textDisplay,    // 表示用テキスト（リンクなどが変換済み）
        likeCount: snippet.likeCount,
        publishedAt: snippet.publishedAt,
        updatedAt: snippet.updatedAt
      };
    });

    console.log('✅ YouTubeコメント取得完了:', comments.length + '件');
    
    return {
      comments,
      nextPageToken: data.nextPageToken
    };

  } catch (error) {
    console.error('💥 YouTube comments error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get YouTube comments');
  }
}

/**
 * 動画時間をフォーマットする関数
 * ISO 8601 duration format (PT1H2M3S) を人間が読みやすい形式に変換
 * 
 * 例: 
 * "PT4M33S" → "4:33"
 * "PT1H30M15S" → "1:30:15"
 */
export function formatDuration(duration: string): string {
  // 正規表現でISO 8601形式をパース
  // PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)? の意味：
  // - PT: 固定の接頭辞
  // - (?:(\d+)H)?: 時間部分（オプション、?:は非キャプチャグループ）
  // - (?:(\d+)M)?: 分部分（オプション）
  // - (?:(\d+)S)?: 秒部分（オプション）
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return '0:00';  // パースに失敗した場合
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  // 1時間以上の場合は "1:30:15" 形式
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // 1時間未満の場合は "4:33" 形式
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 数値を読みやすい形式にフォーマットする関数
 * 
 * 例:
 * 1234567 → "1.2M"
 * 12345 → "12.3K"  
 * 123 → "123"
 */
export function formatNumber(num: string | number): string {
  const value = typeof num === 'string' ? parseInt(num) : num;
  
  // NaN（数値でない）の場合は0を返す
  if (isNaN(value)) return '0';
  
  // 10億以上
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'B';  // Billion
  }
  // 100万以上
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';     // Million
  }
  // 1000以上
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';        // Thousand
  }
  
  // 1000未満はそのまま
  return value.toLocaleString();  // カンマ区切りで表示
}

/**
 * ゲーム名に基づいて最適化された検索クエリを生成する関数
 * 
 * なぜこの関数が必要？
 * → ユーザーが「スプラトゥーン3」と入力しても、
 *    「スプラトゥーン3 Switch 2」で検索した方がより関連性の高い動画が取得できるため
 */
export function generateOptimizedSearchQuery(gameName: string): string {
  // Switch 2 関連のキーワード候補
  const switch2Keywords = [
    'Switch 2',
    'Nintendo Switch 2', 
    'ニンテンドースイッチ2',
    'スイッチ2',
    'レビュー',
    '実況',
    '予想'
  ];
  
  // ランダムにキーワードを選択（検索結果の多様性を確保）
  const randomKeyword = switch2Keywords[Math.floor(Math.random() * switch2Keywords.length)];
  
  return `${gameName} ${randomKeyword}`;
}
```

**🧠 重要な概念解説**

1. **async/await**: 非同期処理を扱うJavaScriptの仕組みです。
   - `async function`: この関数は非同期処理を含むことを示す
   - `await`: 非同期処理の完了を待つ
   - `Promise<T>`: 非同期処理の結果を表す型

2. **fetch()**: WebAPIを呼び出すための関数です。
   - `await fetch(url)`: URLにHTTPリクエストを送信
   - `response.ok`: レスポンスが成功（200番台）かどうか
   - `response.json()`: レスポンスをJSONに変換

3. **URLSearchParams**: URLのクエリパラメータ（`?key=value&foo=bar`）を簡単に作成できるクラスです。

4. **エラーハンドリング**: `try-catch`でエラーをキャッチし、適切に処理します。

## 🌐 Step 5: Next.js API Routes を実装

### API Routesって何？

Next.js の API Routes は「フロントエンドとバックエンドを同じプロジェクトで作れる機能」です。

**なぜ必要？**
- フロントエンドから直接 YouTube API を呼ぶとAPIキーが露出してしまう
- APIキーはサーバーサイド（バックエンド）で管理する必要がある
- Next.js API Routes がサーバーサイドの役割を果たす

**動作の流れ:**
```
[ブラウザ] → [Next.js API Route] → [YouTube API]
           ←                     ←
```

### 5-1. YouTube検索 API Route を作成

**src/app/api/youtube/search/route.ts を作成:**

```typescript
// Next.js 13+ のApp Routerで必要なインポート
import { NextRequest, NextResponse } from 'next/server';
// 先ほど作成した関数をインポート
import { searchYouTubeVideos, generateOptimizedSearchQuery } from '@/lib/youtube';

/**
 * GET リクエストを処理する関数
 * 
 * この関数は以下のURLでアクセスされる：
 * GET /api/youtube/search?q=ゲーム名&maxResults=10&pageToken=xxx
 * 
 * Next.js では、ファイル名が route.ts で、export した関数名がHTTPメソッドになる
 * GET → GET リクエスト
 * POST → POST リクエスト
 */
export async function GET(request: NextRequest) {
  console.log('🚀 YouTube検索APIが呼び出されました');

  // CORS（Cross-Origin Resource Sharing）ヘッダーを設定
  // なぜCORSが必要？ → ブラウザのセキュリティ機能により、異なるドメイン間の通信は制限される
  // 今回は同一ドメインなので実際は不要だが、念のため設定
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // URLからクエリパラメータを抽出
    // 例: /api/youtube/search?q=スプラトゥーン3&maxResults=5
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');              // 検索キーワード
    const maxResults = parseInt(searchParams.get('maxResults') || '10');  // 最大取得数
    const pageToken = searchParams.get('pageToken') || undefined;         // ページネーション

    console.log('📝 受信したパラメータ:', { query, maxResults, pageToken });

    // ===== バリデーション（入力値チェック） =====

    // クエリが空の場合はエラーレスポンス
    if (!query) {
      console.log('❌ エラー: 検索クエリが空です');
      return NextResponse.json(
        { 
          error: 'Search query is required',
          message: 'クエリパラメータ "q" は必須です' 
        }, 
        { 
          status: 400,      // 400 = Bad Request（クライアントエラー）
          headers: corsHeaders 
        }
      );
    }

    // 最大取得数が多すぎる場合はエラー
    // なぜ50で制限？ → YouTube APIの制限とパフォーマンスを考慮
    if (maxResults > 50) {
      console.log('❌ エラー: maxResultsが大きすぎます:', maxResults);
      return NextResponse.json(
        { 
          error: 'maxResults must be 50 or less',
          message: 'maxResults は50以下である必要があります' 
        }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // ===== YouTube API呼び出し =====

    // 検索クエリを最適化（「スプラトゥーン3」→「スプラトゥーン3 Switch 2」）
    const optimizedQuery = generateOptimizedSearchQuery(query);
    console.log('🔧 最適化後の検索クエリ:', optimizedQuery);

    // YouTube APIクライアントを呼び出し
    const result = await searchYouTubeVideos(optimizedQuery, maxResults, pageToken);
    
    console.log('✅ YouTube API呼び出し成功:', result.videos.length + '件取得');

    // ===== 成功レスポンス =====
    return NextResponse.json({
      success: true,                    // 成功フラグ
      data: result,                     // 検索結果
      query: optimizedQuery,            // 実際に使用した検索クエリ
      timestamp: new Date().toISOString()  // タイムスタンプ
    }, { 
      headers: corsHeaders 
    });
    
  } catch (error) {
    // ===== エラーハンドリング =====
    console.error('💥 YouTube検索APIでエラー発生:', error);
    
    // エラーの詳細を取得
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // APIキー関連のエラーの場合は401（認証エラー）、それ以外は500（サーバーエラー）
    const statusCode = errorMessage.includes('API key') ? 401 : 500;
    
    // エラーレスポンス
    return NextResponse.json(
      { 
        error: 'Failed to search YouTube videos', 
        message: errorMessage,
        timestamp: new Date().toISOString()
      }, 
      { 
        status: statusCode, 
        headers: corsHeaders 
      }
    );
  }
}

/**
 * OPTIONS リクエストを処理する関数
 * 
 * OPTIONSとは？
 * → ブラウザがCORSチェックのために送信するプリフライトリクエスト
 * → 実際のGETリクエストの前に「このリクエストは送信しても大丈夫？」と確認する
 */
export async function OPTIONS() {
  console.log('🔍 CORS プリフライトリクエストを処理');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

### 5-2. YouTubeコメント取得 API Route を作成

**src/app/api/youtube/comments/route.ts を作成:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeComments } from '@/lib/youtube';

/**
 * GET /api/youtube/comments?videoId=xxx&maxResults=20&pageToken=xxx
 */
export async function GET(request: NextRequest) {
  console.log('🚀 YouTubeコメント取得APIが呼び出されました');

  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const maxResults = parseInt(searchParams.get('maxResults') || '20');
    const pageToken = searchParams.get('pageToken') || undefined;

    console.log('📝 受信したパラメータ:', { videoId, maxResults, pageToken });

    // ===== バリデーション =====

    // videoIdが空の場合
    if (!videoId) {
      console.log('❌ エラー: videoIdが空です');
      return NextResponse.json(
        { 
          error: 'Video ID is required',
          message: 'クエリパラメータ "videoId" は必須です' 
        }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // YouTube動画IDの形式チェック
    // YouTube動画IDは必ず11文字の英数字とアンダースコア、ハイフン
    const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/;
    if (!videoIdRegex.test(videoId)) {
      console.log('❌ エラー: 無効な動画IDフォーマット:', videoId);
      return NextResponse.json(
        { 
          error: 'Invalid video ID format',
          message: '無効な動画IDフォーマットです' 
        }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // maxResultsの上限チェック
    if (maxResults > 100) {
      console.log('❌ エラー: maxResultsが大きすぎます:', maxResults);
      return NextResponse.json(
        { 
          error: 'maxResults must be 100 or less',
          message: 'maxResults は100以下である必要があります' 
        }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // ===== YouTube API呼び出し =====

    const result = await getYouTubeComments(videoId, maxResults, pageToken);
    
    console.log('✅ YouTubeコメント取得成功:', result.comments.length + '件取得');

    // ===== 成功レスポンス =====
    return NextResponse.json({
      success: true,
      data: result,
      videoId,
      timestamp: new Date().toISOString()
    }, { 
      headers: corsHeaders 
    });
    
  } catch (error) {
    console.error('💥 YouTubeコメント取得APIでエラー発生:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('API key') ? 401 : 500;
    
    return NextResponse.json(
      { 
        error: 'Failed to get YouTube comments', 
        message: errorMessage,
        timestamp: new Date().toISOString()
      }, 
      { status: statusCode, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

**💡 API Route の重要ポイント**

1. **HTTPステータスコード**:
   - 200: 成功
   - 400: クライアントエラー（リクエストが間違っている）
   - 401: 認証エラー（APIキーが間違っているなど）
   - 500: サーバーエラー（サーバー側の問題）

2. **バリデーション**: ユーザーからの入力は必ずチェックする習慣をつけましょう

3. **エラーハンドリング**: エラーが起きても適切な情報を返すことで、デバッグがしやすくなります

## ⚛️ Step 6: React カスタムフックを実装

### カスタムフックって何？

カスタムフックは「状態管理とAPI呼び出しをまとめた再利用可能な関数」です。

**なぜ使うの？**
- コンポーネントが複雑になることを防げる
- 同じ処理を複数のコンポーネントで使い回せる
- テストしやすい

### 6-1. YouTube検索用カスタムフックを作成

**src/hooks/useYouTubeData.ts を作成:**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { YouTubeVideo, YouTubeComment, YouTubeSearchResult, YouTubeCommentsResult } from '@/types/youtube';

/**
 * YouTube検索用カスタムフックの戻り値の型定義
 */
interface UseYouTubeSearchResult {
  data: YouTubeSearchResult | null;     // 検索結果（初期値はnull）
  loading: boolean;                     // ローディング状態
  error: string | null;                 // エラーメッセージ（初期値はnull）
  search: (query: string, maxResults?: number) => Promise<void>;  // 検索実行関数
  loadMore: () => Promise<void>;        // 追加読み込み関数
  reset: () => void;                    // 状態リセット関数
}

/**
 * YouTube検索用カスタムフック
 * 
 * 使い方:
 * const { data, loading, error, search } = useYouTubeSearch();
 * search('スプラトゥーン3');
 */
export function useYouTubeSearch(): UseYouTubeSearchResult {
  // ===== State（状態）の定義 =====
  
  // 検索結果を保存する状態
  const [data, setData] = useState<YouTubeSearchResult | null>(null);
  
  // ローディング状態（true=読み込み中, false=完了）
  const [loading, setLoading] = useState(false);
  
  // エラー状態（null=エラーなし, string=エラーメッセージ）
  const [error, setError] = useState<string | null>(null);
  
  // 現在の検索クエリ（追加読み込みで使用）
  const [currentQuery, setCurrentQuery] = useState<string>('');

  /**
   * 検索を実行する関数
   * 
   * useCallback を使う理由：
   * → この関数が毎回新しく作られることを防ぎ、パフォーマンスを向上させる
   * → 依存配列が空なので、コンポーネントが再レンダリングされても同じ関数インスタンスを使用
   */
  const search = useCallback(async (query: string, maxResults: number = 10) => {
    console.log('🔍 検索開始:', query);
    
    // ローディング開始
    setLoading(true);
    setError(null);  // 前のエラーをクリア
    setCurrentQuery(query);  // 現在のクエリを保存

    try {
      // Next.js API Route を呼び出し
      // encodeURIComponent: URLに使えない文字をエンコード（日本語など）
      const response = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
      );

      // レスポンスが失敗の場合
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search YouTube videos');
      }

      const result = await response.json();
      
      console.log('✅ 検索成功:', result.data.videos.length + '件取得');
      
      // 検索結果を状態に保存
      setData(result.data);

    } catch (err) {
      // エラー処理
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ 検索エラー:', errorMessage);
      setError(errorMessage);
      
      // エラー時はデータをクリア
      setData(null);
      
    } finally {
      // ローディング終了（成功・失敗に関わらず実行）
      setLoading(false);
    }
  }, []); // 依存配列が空 = 関数は1度だけ作成される

  /**
   * 追加データを読み込む関数（ページネーション）
   * 
   * 例：最初に10件取得 → さらに10件取得 → 合計20件表示
   */
  const loadMore = useCallback(async () => {
    // 追加読み込みの条件チェック
    if (!data?.nextPageToken || !currentQuery || loading) {
      console.log('⚠️ 追加読み込み不可:', { 
        hasNextPage: !!data?.nextPageToken, 
        hasQuery: !!currentQuery, 
        isLoading: loading 
      });
      return;
    }

    console.log('📄 追加読み込み開始');
    setLoading(true);

    try {
      const response = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(currentQuery)}&maxResults=10&pageToken=${data.nextPageToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load more videos');
      }

      const result = await response.json();
      
      console.log('✅ 追加読み込み成功:', result.data.videos.length + '件追加');
      
      // 既存のデータに新しいデータを追加
      setData(prevData => ({
        ...result.data,  // 新しいページのメタデータ
        videos: [...(prevData?.videos || []), ...result.data.videos]  // 動画を結合
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ 追加読み込みエラー:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [data?.nextPageToken, currentQuery, loading]);

  /**
   * 状態をリセットする関数
   */
  const reset = useCallback(() => {
    console.log('🔄 検索状態をリセット');
    setData(null);
    setError(null);
    setLoading(false);
    setCurrentQuery('');
  }, []);

  // フックの戻り値
  return { 
    data, 
    loading, 
    error, 
    search, 
    loadMore,
    reset
  };
}

/**
 * YouTubeコメント取得用カスタムフックの戻り値の型定義
 */
interface UseYouTubeCommentsResult {
  comments: YouTubeComment[];           // コメントの配列
  loading: boolean;                     // ローディング状態
  error: string | null;                 // エラーメッセージ
  loadComments: (videoId: string, maxResults?: number) => Promise<void>;  // コメント取得関数
  loadMore: () => Promise<void>;        // 追加コメント取得関数
  reset: () => void;                    // 状態リセット関数
}

/**
 * YouTubeコメント取得用カスタムフック
 */
export function useYouTubeComments(): UseYouTubeCommentsResult {
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [currentVideoId, setCurrentVideoId] = useState<string>('');

  /**
   * 指定した動画のコメントを取得する関数
   */
  const loadComments = useCallback(async (videoId: string, maxResults: number = 20) => {
    console.log('💬 コメント取得開始:', videoId);
    
    setLoading(true);
    setError(null);
    setCurrentVideoId(videoId);
    setComments([]);  // 新しい動画のコメントを読み込む時は既存コメントをクリア

    try {
      const response = await fetch(
        `/api/youtube/comments?videoId=${videoId}&maxResults=${maxResults}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load comments');
      }

      const result = await response.json();
      
      console.log('✅ コメント取得成功:', result.data.comments.length + '件取得');
      
      setComments(result.data.comments);
      setNextPageToken(result.data.nextPageToken);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ コメント取得エラー:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 追加のコメントを読み込む関数
   */
  const loadMore = useCallback(async () => {
    if (!nextPageToken || !currentVideoId || loading) {
      return;
    }

    console.log('📄 追加コメント取得開始');
    setLoading(true);

    try {
      const response = await fetch(
        `/api/youtube/comments?videoId=${currentVideoId}&maxResults=20&pageToken=${nextPageToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load more comments');
      }

      const result = await response.json();
      
      console.log('✅ 追加コメント取得成功:', result.data.comments.length + '件追加');
      
      // 既存のコメントに新しいコメントを追加
      setComments(prevComments => [...prevComments, ...result.data.comments]);
      setNextPageToken(result.data.nextPageToken);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ 追加コメント取得エラー:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [nextPageToken, currentVideoId, loading]);

  /**
   * 状態をリセットする関数
   */
  const reset = useCallback(() => {
    console.log('🔄 コメント状態をリセット');
    setComments([]);
    setError(null);
    setLoading(false);
    setNextPageToken(undefined);
    setCurrentVideoId('');
  }, []);

  return { 
    comments, 
    loading, 
    error, 
    loadComments, 
    loadMore,
    reset
  };
}
```

**🧠 カスタムフックの重要概念**

1. **useState**: コンポーネントの状態を管理するReact Hook
2. **useCallback**: 関数を最適化するReact Hook（無駄な再作成を防ぐ）
3. **依存配列**: `useCallback([dependencies])` の `dependencies` 部分。この配列の値が変わった時だけ関数を再作成する

## 🧪 Step 7: 動作確認とテスト

### 7-1. 開発サーバーの起動

```bash
# プロジェクトルートで実行
npm run dev
```

**確認ポイント:**
- エラーが出ずにサーバーが起動する
- `http://localhost:3000` にアクセスして元のページが表示される

### 7-2. API の直接テスト

ブラウザのアドレスバーに以下のURLを入力して、APIが動作するかテスト：

```
# YouTube検索APIのテスト
http://localhost:3000/api/youtube/search?q=スプラトゥーン3&maxResults=3

# 期待する結果: JSONデータが表示される
{
  "success": true,
  "data": {
    "videos": [...],
    "totalResults": 1000000,
    ...
  },
  ...
}
```

**⚠️ エラーが出た場合の対処法:**

1. **"YouTube API key is not configured"**
   ```bash
   # .env.local ファイルを確認
   cat .env.local
   
   # 内容例（APIキーは実際の値に置き換え）
   YOUTUBE_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxx
   ```

2. **"API key invalid"** 
   - Google Cloud Console でAPIキーの設定を再確認
   - YouTube Data API v3 が有効になっているか確認

3. **"Module not found"**
   - ファイルのパスが正しいか確認
   - import文のスペルミスがないか確認

### 7-3. ブラウザのコンソールでのテスト

1. ブラウザで `http://localhost:3000` を開く
2. 開発者ツールを開く（F12キー）
3. Console タブで以下を実行：

```javascript
// YouTube検索のテスト
fetch('/api/youtube/search?q=マリオ&maxResults=3')
  .then(response => response.json())
  .then(data => {
    console.log('✅ 検索成功:', data);
  })
  .catch(error => {
    console.error('❌ 検索失敗:', error);
  });

// コメント取得のテスト（実際の動画IDに置き換えてください）
fetch('/api/youtube/comments?videoId=dQw4w9WgXcQ&maxResults=5')
  .then(response => response.json())
  .then(data => {
    console.log('✅ コメント取得成功:', data);
  })
  .catch(error => {
    console.error('❌ コメント取得失敗:', error);
  });
```

## 🎨 Step 8: フロントエンドでの表示実装

### 8-1. 簡単な検索ページを作成

まず、YouTube APIが動作することを確認するための簡単なテストページを作成しましょう。

**src/app/youtube-test/page.tsx を作成:**

```typescript
'use client';  // これはクライアントサイドで動作するコンポーネントであることを示す

import React, { useState } from 'react';
import { useYouTubeSearch, useYouTubeComments } from '@/hooks/useYouTubeData';
import { formatDuration, formatNumber } from '@/lib/youtube';

/**
 * YouTube API テスト用のページコンポーネント
 * 
 * このページでできること:
 * 1. ゲーム名を入力してYouTube動画を検索
 * 2. 検索結果の動画一覧を表示
 * 3. 動画をクリックするとコメントを取得・表示
 */
export default function YouTubeTestPage() {
  // ===== State（状態）の定義 =====
  
  // 検索キーワードの入力値
  const [searchQuery, setSearchQuery] = useState('');
  
  // 選択された動画（コメント表示用）
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // ===== カスタムフックの使用 =====
  
  // YouTube検索用のフックを取得
  const { 
    data: searchData,      // 検索結果データ
    loading: searchLoading, // 検索中かどうか
    error: searchError,    // 検索エラー
    search,                // 検索実行関数
    loadMore              // 追加読み込み関数
  } = useYouTubeSearch();

  // YouTubeコメント取得用のフックを取得
  const {
    comments,             // コメント配列
    loading: commentsLoading, // コメント取得中かどうか
    error: commentsError, // コメント取得エラー
    loadComments         // コメント取得実行関数
  } = useYouTubeComments();

  // ===== イベントハンドラー =====

  /**
   * 検索フォームの送信処理
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();  // フォームの通常送信を防ぐ
    
    if (!searchQuery.trim()) {
      alert('検索キーワードを入力してください');
      return;
    }

    console.log('🔍 検索実行:', searchQuery);
    await search(searchQuery.trim());
  };

  /**
   * 動画がクリックされた時の処理
   */
  const handleVideoClick = async (videoId: string, videoTitle: string) => {
    console.log('🎥 動画クリック:', videoTitle);
    setSelectedVideoId(videoId);
    await loadComments(videoId);
  };

  /**
   * 投稿日をフォーマットする関数
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  // ===== JSX（画面の構造）=====
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* ページタイトル */}
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          YouTube API テストページ
        </h1>

        {/* 検索フォーム */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4 max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}  // 入力値を状態に保存
              placeholder="ゲーム名を入力（例: スプラトゥーン3）"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={searchLoading}  // ローディング中は無効化
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {searchLoading ? '検索中...' : '🔍 検索'}
            </button>
          </div>
        </form>

        {/* エラー表示 */}
        {searchError && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <strong>エラー:</strong> {searchError}
          </div>
        )}

        {/* 検索結果表示 */}
        {searchData && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              検索結果: {searchData.totalResults.toLocaleString()} 件
            </h2>

            {/* 動画一覧 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchData.videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleVideoClick(video.id, video.title)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                >
                  {/* サムネイル */}
                  <div className="relative">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    {/* 動画時間表示 */}
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  </div>

                  {/* 動画情報 */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {video.channelTitle}
                    </p>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>👀 {formatNumber(video.viewCount)}</span>
                      <span>{formatDate(video.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* もっと読み込むボタン */}
            {searchData.nextPageToken && (
              <div className="text-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={searchLoading}
                  className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {searchLoading ? '読み込み中...' : '📄 もっと見る'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* コメント表示セクション */}
        {selectedVideoId && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              💬 コメント
            </h2>

            {commentsLoading && (
              <div className="text-center py-4">
                <div className="text-gray-600">コメントを読み込み中...</div>
              </div>
            )}

            {commentsError && (
              <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg mb-4">
                <strong>注意:</strong> {commentsError}
                <br />
                <small>この動画はコメントが無効になっている可能性があります。</small>
              </div>
            )}

            {/* コメント一覧 */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                  {/* アバター */}
                  <img
                    src={comment.authorProfileImageUrl}
                    alt={comment.author}
                    className="w-10 h-10 rounded-full"
                  />
                  
                  <div className="flex-1">
                    {/* 投稿者名と投稿日 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm text-gray-900">
                        {comment.author}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.publishedAt)}
                      </span>
                    </div>
                    
                    {/* コメント本文 */}
                    <p className="text-gray-700 mb-2">
                      {comment.text}
                    </p>
                    
                    {/* いいね数 */}
                    {comment.likeCount > 0 && (
                      <div className="text-xs text-gray-500">
                        👍 {comment.likeCount}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* コメントが0件の場合 */}
            {!commentsLoading && comments.length === 0 && !commentsError && (
              <div className="text-center text-gray-500 py-4">
                この動画にはコメントがありません
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 8-2. テストページにアクセス

```bash
# ブラウザで以下のURLにアクセス
http://localhost:3000/youtube-test
```

**確認ポイント:**
1. 検索フォームが表示される
2. ゲーム名を入力して検索ボタンをクリック
3. YouTube動画の一覧が表示される
4. 動画をクリックするとコメントが表示される

## 🐛 トラブルシューティング

### よくあるエラーと解決方法

#### 1. "Cannot read properties of undefined"
```
TypeError: Cannot read properties of undefined (reading 'videos')
```

**原因**: APIからのデータがまだ取得できていない
**解決方法**: データの存在確認を追加
```typescript
// ❌ 悪い例
searchData.videos.map(...)

// ✅ 良い例  
{searchData?.videos?.map(...)}
```

#### 2. "Module not found: Can't resolve '@/types/youtube'"
**原因**: パスエイリアスが正しく設定されていない
**解決方法**: `tsconfig.json` の確認
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 3. API呼び出しが失敗する
**デバッグ手順**:
1. ブラウザの Network タブで実際のリクエストを確認
2. サーバーのコンソールでエラーログを確認
3. `.env.local` ファイルのAPIキーを再確認

#### 4. "Hydration failed"
**原因**: サーバーサイドとクライアントサイドで異なるコンテンツがレンダリングされている
**解決方法**: `'use client'` の追加とuseEffectの使用
```typescript
'use client';  // ファイルの先頭に追加

// または、条件分岐でクライアントサイドのみ実行
useEffect(() => {
  // クライアントサイドでのみ実行される処理
}, []);
```

## 🎉 Step 9: 完成確認とまとめ

### 完成確認チェックリスト

以下の項目がすべて動作すれば実装完了です：

- [ ] **環境設定**
  - [ ] Google Cloud Console でプロジェクト作成済み
  - [ ] YouTube Data API v3 が有効化済み
  - [ ] APIキーが取得済み
  - [ ] `.env.local` にAPIキーが設定済み

- [ ] **ファイル作成**
  - [ ] `src/types/youtube.ts` が作成済み
  - [ ] `src/lib/youtube.ts` が作成済み  
  - [ ] `src/app/api/youtube/search/route.ts` が作成済み
  - [ ] `src/app/api/youtube/comments/route.ts` が作成済み
  - [ ] `src/hooks/useYouTubeData.ts` が作成済み
  - [ ] `src/app/youtube-test/page.tsx` が作成済み

- [ ] **動作確認**
  - [ ] 開発サーバーがエラーなく起動する
  - [ ] API直接呼び出しでJSONデータが取得できる
  - [ ] テストページで検索が動作する
  - [ ] 動画一覧が正しく表示される
  - [ ] 動画クリックでコメントが表示される

### 学んだ重要な概念

1. **API連携の基本フロー**
   ```
   フロントエンド → Next.js API Route → 外部API
   ```

2. **TypeScript型定義の重要性**
   - データの形を明確にする
   - IDEの補完機能が使える
   - バグの早期発見

3. **React カスタムフック**
   - 状態管理とAPI呼び出しを分離
   - 再利用可能なロジック
   - テストしやすい構造

4. **エラーハンドリング**
   - try-catch でのエラーキャッチ
   - 適切なHTTPステータスコード
   - ユーザーフレンドリーなエラーメッセージ

### 次のステップ

この実装を完了したら、以下に挑戦してみてください：

1. **既存のゲーム詳細ページへの組み込み**
   - `src/app/page.tsx` でYouTube機能を使用
   - 見た目を既存のデザインに合わせる

2. **追加機能の実装**
   - 検索履歴の保存
   - お気に入り動画の管理
   - コメントの並び替え機能

3. **パフォーマンス最適化**
   - 検索結果のキャッシュ
   - 画像の遅延読み込み
   - 無限スクロール

## 💌 最後に

お疲れさまでした！🎉

この実装を通じて、以下のスキルが身についたはずです：

- **外部APIとの連携方法**
- **TypeScriptでの型安全なプログラミング**
- **Reactカスタムフックの作成**
- **Next.js API Routesの実装**
- **エラーハンドリングのベストプラクティス**

分からないことがあれば、いつでも質問してください！
一緒にさらに良いコードを書いていきましょう 💪

---

**🚀 次回**: Reddit API連携の実装に挑戦してみましょう！