# API連携完全実装ガイド - Switch 2 ゲーム情報サイト

## 📋 このドキュメントについて

このガイドでは、Switch 2 ゲーム情報サイトで使用する**4つのAPI**の実装方法を、プログラミング初心者でも理解できるよう詳しく解説します。

**対象API:**
1. **YouTube Data API v3** - 動画・コメント情報
2. **Reddit API** - コミュニティ情報
3. **はてなブックマーク API** - 日本語記事・コメント
4. **RAWG API** - ゲーム基本情報

## 🎯 API連携の全体設計

### データフローの理解
```
[ユーザー] → [フロントエンド] → [Next.js API Routes] → [外部API] 
                ↓
[データベース保存] → [キャッシュ] → [フロントエンド表示]
```

**なぜこの構成？**
- **セキュリティ**: APIキーを隠せる
- **パフォーマンス**: データをキャッシュできる
- **エラーハンドリング**: 統一的な処理が可能

### ディレクトリ構成
```
src/
├── app/
│   ├── api/                    # Next.js API Routes
│   │   ├── youtube/
│   │   │   ├── search/
│   │   │   │   └── route.ts    # YouTube動画検索API
│   │   │   └── comments/
│   │   │       └── route.ts    # YouTubeコメント取得API
│   │   ├── reddit/
│   │   │   └── route.ts        # Reddit情報取得API
│   │   ├── hatena/
│   │   │   └── route.ts        # はてなブックマークAPI
│   │   └── rawg/
│   │       └── route.ts        # ゲーム情報取得API
│   ├── lib/                    # ユーティリティ関数
│   │   ├── youtube.ts          # YouTube API関連
│   │   ├── reddit.ts           # Reddit API関連
│   │   ├── hatena.ts           # はてなブックマーク関連
│   │   ├── rawg.ts             # RAWG API関連
│   │   └── cache.ts            # キャッシュ管理
│   └── types/
│       └── api.ts              # API関連の型定義
└── .env.local                  # 環境変数（APIキー等）
```

## 🔐 環境変数の設定

### .env.local ファイル作成
```bash
# YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key_here

# Reddit API (無料版)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret

# RAWG API
RAWG_API_KEY=your_rawg_api_key_here

# はてなブックマーク（APIキー不要だが、レート制限対策用）
HATENA_USER_AGENT=YourAppName/1.0
```

### 環境変数の使い方
```typescript
// ✅ サーバーサイドでのみ使用可能
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// ❌ フロントエンドでは使わない（セキュリティリスク）
// const API_KEY = process.env.API_KEY; // これは危険
```

## 🎥 YouTube Data API v3 の実装

### 1. APIキーの取得方法
1. **Google Cloud Console** にアクセス
2. 新しいプロジェクトを作成
3. **YouTube Data API v3** を有効化
4. **APIキー** を作成
5. **リファラ制限** を設定（セキュリティ向上）

### 2. YouTube検索API実装

#### src/lib/youtube.ts
```typescript
// YouTube API関連の型定義
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  duration: string;
}

export interface YouTubeComment {
  id: string;
  author: string;
  text: string;
  likeCount: number;
  publishedAt: string;
}

// YouTube動画検索関数
export async function searchYouTubeVideos(
  query: string, 
  maxResults: number = 10
): Promise<YouTubeVideo[]> {
  
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  // 検索クエリの構築
  const searchParams = new URLSearchParams({
    key: API_KEY,
    part: 'snippet,statistics',
    type: 'video',
    q: query,
    maxResults: maxResults.toString(),
    order: 'relevance',
    relevanceLanguage: 'ja', // 日本語優先
    regionCode: 'JP'         // 日本地域
  });

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams}`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    // 動画の詳細情報を取得（再生数等）
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&part=statistics,contentDetails&id=${videoIds}`
    );
    
    const detailsData = await detailsResponse.json();
    
    // データを整形して返す
    return data.items.map((item: any, index: number) => {
      const details = detailsData.items[index];
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        viewCount: details?.statistics?.viewCount || '0',
        likeCount: details?.statistics?.likeCount || '0',
        duration: details?.contentDetails?.duration || 'PT0S'
      };
    });
    
  } catch (error) {
    console.error('YouTube search error:', error);
    throw new Error('Failed to search YouTube videos');
  }
}

// YouTubeコメント取得関数
export async function getYouTubeComments(
  videoId: string, 
  maxResults: number = 20
): Promise<YouTubeComment[]> {
  
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  const params = new URLSearchParams({
    key: API_KEY,
    part: 'snippet',
    videoId: videoId,
    maxResults: maxResults.toString(),
    order: 'relevance' // 関連度順
  });

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?${params}`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube Comments API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.items.map((item: any) => ({
      id: item.id,
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
      text: item.snippet.topLevelComment.snippet.textDisplay,
      likeCount: item.snippet.topLevelComment.snippet.likeCount,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt
    }));
    
  } catch (error) {
    console.error('YouTube comments error:', error);
    throw new Error('Failed to get YouTube comments');
  }
}
```

### 3. Next.js API Route実装

#### src/app/api/youtube/search/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeVideos } from '@/lib/youtube';

// GET リクエストの処理
export async function GET(request: NextRequest) {
  try {
    // URLパラメータから検索クエリを取得
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const maxResults = parseInt(searchParams.get('maxResults') || '10');

    // クエリが空の場合はエラー
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' }, 
        { status: 400 }
      );
    }

    // YouTube API呼び出し
    const videos = await searchYouTubeVideos(query, maxResults);
    
    // 成功レスポンス
    return NextResponse.json({
      success: true,
      data: videos,
      count: videos.length
    });
    
  } catch (error) {
    console.error('YouTube search API error:', error);
    
    // エラーレスポンス
    return NextResponse.json(
      { 
        error: 'Failed to search YouTube videos', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
```

### 4. フロントエンドでの使用方法

#### ゲーム詳細ページでの実装
```typescript
'use client';
import { useState, useEffect } from 'react';
import { YouTubeVideo } from '@/lib/youtube';

export default function GameDetailPage() {
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ゲーム名でYouTube動画を検索
  const fetchYouTubeData = async (gameName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Next.js API Route経由で検索
      const response = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(gameName + ' Switch 2')}&maxResults=10`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch YouTube data');
      }
      
      const result = await response.json();
      setYoutubeVideos(result.data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時に実行
  useEffect(() => {
    fetchYouTubeData('スプラトゥーン3'); // 例：スプラトゥーン3で検索
  }, []);

  return (
    <div>
      <h2>YouTube動画</h2>
      
      {loading && <div>読み込み中...</div>}
      {error && <div className="text-red-500">エラー: {error}</div>}
      
      <div className="grid gap-4">
        {youtubeVideos.map(video => (
          <div key={video.id} className="border p-4 rounded">
            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-48 object-cover" />
            <h3 className="font-bold mt-2">{video.title}</h3>
            <p className="text-gray-600">{video.channelTitle}</p>
            <p className="text-sm text-gray-500">
              再生数: {parseInt(video.viewCount).toLocaleString()} 回
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 📱 Reddit API の実装

### 1. Reddit API の特徴
- **無料で使用可能**
- **OAuth認証が必要**（読み取り専用なら簡単）
- **レート制限**: 1分間に60リクエスト

### 2. Reddit API実装

#### src/lib/reddit.ts
```typescript
export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  url: string;
  subreddit: string;
}

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
}

// Reddit検索関数
export async function searchRedditPosts(
  query: string,
  subreddit?: string,
  limit: number = 10
): Promise<RedditPost[]> {
  
  //検索URLの構築
  const baseUrl = subreddit 
    ? `https://www.reddit.com/r/${subreddit}/search.json`
    : 'https://www.reddit.com/search.json';
    
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    sort: 'relevance',
    t: 'all', // 全期間
    restrict_sr: subreddit ? 'true' : 'false'
  });

  try {
    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'User-Agent': process.env.HATENA_USER_AGENT || 'GameInfoSite/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.data.children.map((item: any) => ({
      id: item.data.id,
      title: item.data.title,
      selftext: item.data.selftext,
      author: item.data.author,
      score: item.data.score,
      num_comments: item.data.num_comments,
      created_utc: item.data.created_utc,
      url: item.data.url,
      subreddit: item.data.subreddit
    }));
    
  } catch (error) {
    console.error('Reddit search error:', error);
    throw new Error('Failed to search Reddit posts');
  }
}

// 特定のゲーム関連サブレディット検索
export async function searchGameOnReddit(gameName: string): Promise<RedditPost[]> {
  const gameSubreddits = [
    'NintendoSwitch',
    'nintendo', 
    'gaming',
    'Games',
    'NintendoSwitch2' // Switch 2専用（存在する場合）
  ];

  const allPosts: RedditPost[] = [];
  
  // 複数のサブレディットを並行検索
  const promises = gameSubreddits.map(subreddit => 
    searchRedditPosts(`${gameName} Switch`, subreddit, 5)
      .catch(error => {
        console.warn(`Failed to search ${subreddit}:`, error);
        return []; // エラーでも空配列を返して処理継続
      })
  );
  
  const results = await Promise.all(promises);
  
  // 結果をまとめてスコア順にソート
  return results
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, 20); // 上位20件
}
```

#### src/app/api/reddit/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { searchGameOnReddit } from '@/lib/reddit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameName = searchParams.get('game');

    if (!gameName) {
      return NextResponse.json(
        { error: 'Game name is required' }, 
        { status: 400 }
      );
    }

    const posts = await searchGameOnReddit(gameName);
    
    return NextResponse.json({
      success: true,
      data: posts,
      count: posts.length
    });
    
  } catch (error) {
    console.error('Reddit API error:', error);
    return NextResponse.json(
      { error: 'Failed to search Reddit' }, 
      { status: 500 }
    );
  }
}
```

## 📚 はてなブックマーク API の実装

### 1. はてなブックマークの特徴
- **APIキー不要**
- **日本語コンテンツが豊富**
- **レート制限が緩い**

### 2. はてなブックマーク実装

#### src/lib/hatena.ts
```typescript
export interface HatenaBookmark {
  title: string;
  url: string;
  count: number;
  entry_url: string;
  comments: HatenaComment[];
}

export interface HatenaComment {
  user: string;
  comment: string;
  timestamp: string;
  tags: string[];
}

// はてなブックマーク検索
export async function searchHatenaBookmarks(
  query: string,
  limit: number = 20
): Promise<HatenaBookmark[]> {
  
  try {
    // はてなブックマーク検索API（非公式だが利用可能）
    const response = await fetch(
      `http://b.hatena.ne.jp/search/text?q=${encodeURIComponent(query)}&mode=rss&sort=count`,
      {
        headers: {
          'User-Agent': process.env.HATENA_USER_AGENT || 'GameInfoSite/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Hatena API error: ${response.status}`);
    }

    const xmlText = await response.text();
    
    // XMLをパースしてJSONに変換（簡易版）
    const bookmarks = parseHatenaXML(xmlText, limit);
    
    // 各ブックマークのコメント取得
    const bookmarksWithComments = await Promise.all(
      bookmarks.map(async (bookmark) => ({
        ...bookmark,
        comments: await getHatenaComments(bookmark.url)
      }))
    );
    
    return bookmarksWithComments;
    
  } catch (error) {
    console.error('Hatena search error:', error);
    throw new Error('Failed to search Hatena bookmarks');
  }
}

// XMLパーサー（簡易版）
function parseHatenaXML(xmlText: string, limit: number): Omit<HatenaBookmark, 'comments'>[] {
  // 実際の実装では xml2js などのライブラリを使用することを推奨
  const items: Omit<HatenaBookmark, 'comments'>[] = [];
  
  // 正規表現でXMLを解析（デモ用の簡易実装）
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null && items.length < limit) {
    const itemContent = match[1];
    
    const title = extractXMLValue(itemContent, 'title');
    const link = extractXMLValue(itemContent, 'link');
    const description = extractXMLValue(itemContent, 'description');
    
    // はてブ数を抽出
    const countMatch = description.match(/(\d+)\s*users?/);
    const count = countMatch ? parseInt(countMatch[1]) : 0;
    
    if (title && link) {
      items.push({
        title: title,
        url: link,
        count: count,
        entry_url: `http://b.hatena.ne.jp/entry/${link}`
      });
    }
  }
  
  return items;
}

function extractXMLValue(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() : '';
}

// はてなブックマークコメント取得
async function getHatenaComments(url: string): Promise<HatenaComment[]> {
  try {
    const response = await fetch(
      `http://b.hatena.ne.jp/entry/jsonlite/?url=${encodeURIComponent(url)}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    return data.bookmarks?.map((bookmark: any) => ({
      user: bookmark.user,
      comment: bookmark.comment || '',
      timestamp: bookmark.timestamp,
      tags: bookmark.tags || []
    })) || [];
    
  } catch (error) {
    console.warn('Failed to get Hatena comments:', error);
    return [];
  }
}
```

## 🎮 RAWG API の実装

### 1. RAWG API の特徴
- **ゲーム情報特化**
- **無料版あり**（月20,000リクエスト）
- **豊富なゲームデータベース**

### 2. RAWG API実装

#### src/lib/rawg.ts
```typescript
export interface RAWGGame {
  id: number;
  name: string;
  description: string;
  released: string;
  background_image: string;
  rating: number;
  ratings_count: number;
  metacritic: number;
  platforms: RAWGPlatform[];
  genres: RAWGGenre[];
  developers: RAWGDeveloper[];
  publishers: RAWGPublisher[];
}

export interface RAWGPlatform {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface RAWGGenre {
  id: number;
  name: string;
  slug: string;
}

export interface RAWGDeveloper {
  id: number;
  name: string;
  slug: string;
}

export interface RAWGPublisher {
  id: number;
  name: string;
  slug: string;
}

// RAWG ゲーム検索
export async function searchRAWGGames(
  query: string,
  platforms?: string,
  limit: number = 10
): Promise<RAWGGame[]> {
  
  const API_KEY = process.env.RAWG_API_KEY;
  if (!API_KEY) {
    throw new Error('RAWG API key is not configured');
  }

  const params = new URLSearchParams({
    key: API_KEY,
    search: query,
    page_size: limit.toString(),
    ordering: '-rating'
  });

  // プラットフォーム指定（Nintendo Switch等）
  if (platforms) {
    params.append('platforms', platforms);
  }

  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?${params}`
    );
    
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }

    const data = await response.json();
    
    // 各ゲームの詳細情報も取得
    const gamesWithDetails = await Promise.all(
      data.results.slice(0, limit).map(async (game: any) => {
        const details = await getRAWGGameDetails(game.id);
        return { ...game, ...details };
      })
    );
    
    return gamesWithDetails;
    
  } catch (error) {
    console.error('RAWG search error:', error);
    throw new Error('Failed to search RAWG games');
  }
}

// ゲーム詳細情報取得
async function getRAWGGameDetails(gameId: number): Promise<Partial<RAWGGame>> {
  const API_KEY = process.env.RAWG_API_KEY;
  if (!API_KEY) return {};

  try {
    const response = await fetch(
      `https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`
    );
    
    if (!response.ok) return {};

    const data = await response.json();
    
    return {
      description: data.description_raw,
      developers: data.developers,
      publishers: data.publishers,
      genres: data.genres
    };
    
  } catch (error) {
    console.warn(`Failed to get details for game ${gameId}:`, error);
    return {};
  }
}

// Nintendo Switch専用の検索
export async function searchSwitchGames(query: string): Promise<RAWGGame[]> {
  // Nintendo SwitchのプラットフォームID: 7
  return searchRAWGGames(query, '7', 15);
}
```

## 💾 キャッシュ管理の実装

### src/lib/cache.ts
```typescript
// シンプルなメモリキャッシュ実装
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();

  // データをキャッシュに保存
  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    const now = Date.now();
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiry: now + (ttlMinutes * 60 * 1000)
    };
    this.cache.set(key, item);
  }

  // キャッシュからデータを取得
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // 有効期限チェック
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  // キャッシュクリア
  clear(): void {
    this.cache.clear();
  }

  // 期限切れアイテムを削除
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();

// キャッシュ付きAPI呼び出しヘルパー
export async function withCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlMinutes: number = 30
): Promise<T> {
  
  // キャッシュから取得を試行
  const cached = cache.get<T>(cacheKey);
  if (cached) {
    console.log(`Cache hit: ${cacheKey}`);
    return cached;
  }
  
  // キャッシュにない場合はAPI呼び出し
  console.log(`Cache miss: ${cacheKey}`);
  const data = await fetcher();
  
  // 結果をキャッシュに保存
  cache.set(cacheKey, data, ttlMinutes);
  
  return data;
}
```

## 🔄 統合API Routeの実装

### src/app/api/game/[id]/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeVideos } from '@/lib/youtube';
import { searchGameOnReddit } from '@/lib/reddit';
import { searchHatenaBookmarks } from '@/lib/hatena';
import { searchSwitchGames } from '@/lib/rawg';
import { withCache } from '@/lib/cache';

// ゲーム情報統合取得API
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id;
    const { searchParams } = new URL(request.url);
    const gameName = searchParams.get('name');

    if (!gameName) {
      return NextResponse.json(
        { error: 'Game name is required' }, 
        { status: 400 }
      );
    }

    // 並行して全APIを呼び出し（キャッシュ付き）
    const [youtubeData, redditData, hatenaData, rawgData] = await Promise.allSettled([
      withCache(
        `youtube-${gameName}`,
        () => searchYouTubeVideos(`${gameName} Switch 2`, 10),
        30 // 30分キャッシュ
      ),
      withCache(
        `reddit-${gameName}`,
        () => searchGameOnReddit(gameName),
        60 // 60分キャッシュ
      ),
      withCache(
        `hatena-${gameName}`,
        () => searchHatenaBookmarks(`${gameName} Switch`),
        120 // 120分キャッシュ
      ),
      withCache(
        `rawg-${gameName}`,
        () => searchSwitchGames(gameName),
        1440 // 24時間キャッシュ
      )
    ]);

    // 結果をまとめる
    const result = {
      gameId,
      gameName,
      youtube: {
        success: youtubeData.status === 'fulfilled',
        data: youtubeData.status === 'fulfilled' ? youtubeData.value : [],
        error: youtubeData.status === 'rejected' ? youtubeData.reason.message : null
      },
      reddit: {
        success: redditData.status === 'fulfilled',
        data: redditData.status === 'fulfilled' ? redditData.value : [],
        error: redditData.status === 'rejected' ? redditData.reason.message : null
      },
      hatena: {
        success: hatenaData.status === 'fulfilled',
        data: hatenaData.status === 'fulfilled' ? hatenaData.value : [],
        error: hatenaData.status === 'rejected' ? hatenaData.reason.message : null
      },
      rawg: {
        success: rawgData.status === 'fulfilled',
        data: rawgData.status === 'fulfilled' ? rawgData.value : [],
        error: rawgData.status === 'rejected' ? rawgData.reason.message : null
      }
    };

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Game API integration error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game data' },
      { status: 500 }
    );
  }
}
```

## 🎯 フロントエンドでの統合使用

### カスタムフック実装
```typescript
// src/hooks/useGameData.ts
import { useState, useEffect } from 'react';

interface GameData {
  gameId: string;
  gameName: string;
  youtube: { success: boolean; data: any[]; error: string | null };
  reddit: { success: boolean; data: any[]; error: string | null };
  hatena: { success: boolean; data: any[]; error: string | null };
  rawg: { success: boolean; data: any[]; error: string | null };
}

export function useGameData(gameId: string, gameName: string) {
  const [data, setData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId || !gameName) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/game/${gameId}?name=${encodeURIComponent(gameName)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch game data');
        }

        const result = await response.json();
        setData(result.data);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId, gameName]);

  return { data, loading, error };
}
```

### ページでの使用例
```typescript
// pages/game/[id].tsx
export default function GamePage() {
  const { data, loading, error } = useGameData('game-1', 'スプラトゥーン3');

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;
  if (!data) return <div>データが見つかりません</div>;

  return (
    <div>
      <h1>{data.gameName}</h1>
      
      {/* YouTube セクション */}
      <section>
        <h2>YouTube ({data.youtube.data.length}件)</h2>
        {data.youtube.success ? (
          <div className="grid gap-4">
            {data.youtube.data.map((video: any) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <p>YouTube データの取得に失敗しました: {data.youtube.error}</p>
        )}
      </section>

      {/* Reddit セクション */}
      <section>
        <h2>Reddit ({data.reddit.data.length}件)</h2>
        {/* ... */}
      </section>

      {/* はてなブックマーク セクション */}
      <section>
        <h2>はてなブックマーク ({data.hatena.data.length}件)</h2>
        {/* ... */}
      </section>
    </div>
  );
}
```

## 🚀 デプロイ時の注意点

### Vercel での環境変数設定
1. **Vercelダッシュボード** → **Settings** → **Environment Variables**
2. 以下の変数を設定：
   ```
   YOUTUBE_API_KEY=your_key_here
   REDDIT_CLIENT_ID=your_id_here
   REDDIT_CLIENT_SECRET=your_secret_here
   RAWG_API_KEY=your_key_here
   HATENA_USER_AGENT=YourApp/1.0
   ```

### API制限の対策
1. **キャッシュの活用**: 同じリクエストを減らす
2. **エラーハンドリング**: APIが落ちても表示を継続
3. **リクエスト制限**: 1分間のリクエスト数を制限
4. **フォールバック**: 一部APIが失敗しても他は表示

## 💡 初心者向けのコツ

### デバッグ方法
```typescript
// コンソールでAPIレスポンスを確認
console.log('API Response:', data);

// Networkタブで実際のリクエストを確認
// Developer Tools → Network → Fetch/XHR
```

### エラー対策
```typescript
// 段階的な実装
// 1. まず1つのAPIで動作確認
// 2. エラーハンドリングを追加
// 3. 他のAPIを追加
// 4. キャッシュを実装
```

これで全APIの実装が完了です！次は実際のプロジェクトでの応用方法を学んでいきましょう。