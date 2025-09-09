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

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  score: number;
  upvote_ratio: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
  permalink: string;
  url: string;
  thumbnail: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  comments?: RedditComment[];
  commentsLoading?: boolean;
}

interface RedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
  depth: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
}

interface HatenaBookmark {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  bookmarkCount: number;
  imageUrl?: string;
  sentiment: {
    score: number;
    label: string;
    emoji: string;
  };
  source: string;
  comments?: HatenaComment[];
  commentsLoading?: boolean;
}

interface HatenaComment {
  user: string;
  comment: string;
  timestamp: string;
  tags: string[];
  sentiment: {
    score: number;
    label: string;
    emoji: string;
  };
}

export default function ApiTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string>("");
  const [hasMore, setHasMore] = useState(true);
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState(true);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  // Reddit関連の状態
  const [redditPosts, setRedditPosts] = useState<RedditPost[]>([]);
  const [redditLoading, setRedditLoading] = useState(false);
  const [redditAfter, setRedditAfter] = useState<string>('');
  const [redditHasMore, setRedditHasMore] = useState(true);

  // はてなブックマーク関連の状態
  const [hatenaBookmarks, setHatenaBookmarks] = useState<HatenaBookmark[]>([]);
  const [hatenaLoading, setHatenaLoading] = useState(false);
  const [redditSummary, setRedditSummary] = useState<{
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    averageScore: number;
  } | null>(null);
  const redditObserverRef = useRef<HTMLDivElement>(null);

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

          // レート制限回避
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

  // Reddit用の無限スクロール
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          redditHasMore &&
          !redditLoading
        ) {
          loadRedditPostsWithComments(true);
        }
      },
      { threshold: 0.1 }
    );

    if (redditObserverRef.current) {
      observer.observe(redditObserverRef.current);
    }

    return () => observer.disconnect();
  }, [redditHasMore, redditLoading, redditAfter]);

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

  // Reddit投稿とコメント取得（無限スクロール対応）
  const loadRedditPostsWithComments = async (isLoadMore = false) => {
    if (redditLoading) return;
    
    setRedditLoading(true);

    try {
      const searchQuery = "Mario Kart World";
      const searchUrl = `/api/reddit-search?q=${encodeURIComponent(searchQuery)}&subreddit=NintendoSwitch&limit=20${
        isLoadMore && redditAfter ? `&after=${redditAfter}` : ''
      }`;

      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.success) {
        const newPosts: RedditPost[] = searchData.data.map((post: RedditPost) => ({
          ...post,
          comments: [],
          commentsLoading: true
        }));

        // 投稿リストを更新
        if (isLoadMore) {
          setRedditPosts(prev => [...prev, ...newPosts]);
        } else {
          setRedditPosts(newPosts);
          setRedditSummary(searchData.summary);
        }

        // ページネーション設定
        setRedditAfter(searchData.after || '');
        setRedditHasMore(!!searchData.after);

        // 各投稿のコメントを取得
        for (const post of newPosts) {
          try {
            const commentsResponse = await fetch(
              `/api/reddit-comments?subreddit=${post.subreddit}&postId=${post.id}&limit=8`
            );
            const commentsData = await commentsResponse.json();

            if (commentsData.success) {
              // 該当投稿のコメントを更新
              setRedditPosts(prev => 
                prev.map(p => 
                  p.id === post.id 
                    ? { ...p, comments: commentsData.data, commentsLoading: false }
                    : p
                )
              );
            }
          } catch (error) {
            console.error(`Failed to get comments for post ${post.id}:`, error);
            setRedditPosts(prev => 
              prev.map(p => 
                p.id === post.id 
                  ? { ...p, comments: [], commentsLoading: false }
                  : p
              )
            );
          }

          // レート制限対策
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        console.error("Reddit API Error:", searchData.error);
      }
    } catch (error) {
      console.error("Reddit Integration Error:", error);
    } finally {
      setRedditLoading(false);
    }
  };

  // Reddit統合テスト実行
  const testRedditIntegration = () => {
    setRedditPosts([]);
    setRedditAfter('');
    setRedditHasMore(true);
    setRedditSummary(null);
    loadRedditPostsWithComments(false);
  };

  // はてなブックマーク統合テスト実行
  const handleHatenaTest = async () => {
    console.log('はてなブックマークテスト開始');
    setHatenaLoading(true);
    setHatenaBookmarks([]);

    try {
      const url = '/api/hatena-search?q=マリオカート ワールド&maxResults=20';
      console.log('Fetching:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`はてなブックマーク API エラー: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      setHatenaBookmarks(data.items || []);
      console.log('はてなブックマーク結果:', data.items?.length || 0, '件');
    } catch (error) {
      console.error('はてなブックマーク取得エラー:', error);
      alert(`エラー: ${error.message}`);
    } finally {
      setHatenaLoading(false);
    }
  };

  // はてなブックマークコメント取得
  const loadHatenaComments = async (url: string, index: number) => {
    setHatenaBookmarks(prev => prev.map((bookmark, i) => 
      i === index ? { ...bookmark, commentsLoading: true } : bookmark
    ));

    try {
      const response = await fetch(`/api/hatena-comments?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error('コメント取得エラー');
      }

      const data = await response.json();
      
      setHatenaBookmarks(prev => prev.map((bookmark, i) => 
        i === index 
          ? { 
              ...bookmark, 
              comments: data.bookmarks || [], 
              commentsLoading: false 
            } 
          : bookmark
      ));
    } catch (error) {
      console.error('はてなコメント取得エラー:', error);
      setHatenaBookmarks(prev => prev.map((bookmark, i) => 
        i === index ? { ...bookmark, commentsLoading: false } : bookmark
      ));
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
            YouTube
            APIの各エンドポイントをテストして、レスポンスデータを確認できます。
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
            onClick={testRedditIntegration}
            disabled={redditLoading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
          >
            {redditLoading ? "🔄 取得中..." : "📱 Reddit統合テスト"}
          </button>

          <button
            onClick={handleHatenaTest}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
            disabled={hatenaLoading}
          >
            {hatenaLoading ? "🔄 取得中..." : "📚 はてなブックマーク統合テスト"}
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
                        {new Date(video.publishedAt).toLocaleDateString(
                          "ja-JP"
                        )}
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
                    <span className="ml-3 text-gray-600">
                      更に読み込み中...
                    </span>
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

        {/* Reddit投稿表示 */}
        {redditPosts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                📱 Reddit 口コミ分析
              </h2>
              {redditSummary && (
                <div className="flex gap-4 text-sm">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                    ✅ ポジティブ: {redditSummary.positive}件
                  </span>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
                    ❌ ネガティブ: {redditSummary.negative}件
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                    ➖ 中立: {redditSummary.neutral}件
                  </span>
                </div>
              )}
            </div>


            <div className="space-y-4">
              {redditPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="md:flex">
                    {/* サムネイル画像 */}
                    {post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default' && (
                      <div className="md:w-64 md:flex-shrink-0">
                        <img
                          src={post.thumbnail}
                          alt={post.title}
                          className="w-full h-40 md:h-48 object-cover rounded-l-lg"
                          loading="lazy"
                          onError={(e) => {
                            // 画像読み込みエラー時は親要素を非表示
                            const parent = e.currentTarget.parentElement;
                            if (parent) parent.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* 投稿内容 */}
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {post.title}
                          </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span>👤 u/{post.author}</span>
                        <span>📍 r/{post.subreddit}</span>
                        <span>📅 {new Date(post.created_utc * 1000).toLocaleDateString("ja-JP")}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {/* 感情分析結果 */}
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        post.sentiment === 'positive' 
                          ? 'bg-green-100 text-green-800' 
                          : post.sentiment === 'negative'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {post.sentiment === 'positive' ? '😊 ポジティブ' :
                         post.sentiment === 'negative' ? '😔 ネガティブ' : '😐 中立'}
                      </div>
                      {/* スコア表示 */}
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-sm">
                          <span className="text-orange-500">⬆️</span>
                          {post.score}
                        </span>
                        <span className="text-sm text-gray-500">
                          💬 {post.num_comments}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {post.selftext && (
                    <div className="text-gray-700 text-sm mb-3 bg-gray-50 p-3 rounded">
                      {post.selftext.length > 200 
                        ? `${post.selftext.substring(0, 200)}...` 
                        : post.selftext}
                    </div>
                  )}
                  
                  {/* コメント表示 */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      💬 上位コメント
                      {post.commentsLoading && (
                        <span className="text-sm text-gray-500">読み込み中...</span>
                      )}
                    </h4>

                    {post.commentsLoading ? (
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
                        {post.comments && post.comments.slice(0, 8).map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-1">
                              <span className="font-medium text-sm text-gray-900">
                                u/{comment.author}
                              </span>
                              <div className="flex items-center gap-2">
                                {/* コメントの感情分析結果 */}
                                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  comment.sentiment === 'positive' 
                                    ? 'bg-green-100 text-green-700' 
                                    : comment.sentiment === 'negative'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {comment.sentiment === 'positive' ? '😊' :
                                   comment.sentiment === 'negative' ? '😔' : '😐'}
                                </div>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  ⬆️ {comment.score}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {comment.body.length > 300 
                                ? `${comment.body.substring(0, 300)}...`
                                : comment.body}
                            </p>
                          </div>
                        ))}
                        {(!post.comments || post.comments.length === 0) && (
                          <p className="text-gray-500 text-sm">コメントがありません</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t mt-4">
                    <div className="text-xs text-gray-500">
                      支持率: {Math.round(post.upvote_ratio * 100)}%
                    </div>
                    <a
                      href={`https://reddit.com${post.permalink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Reddit で見る →
                    </a>
                  </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reddit用無限スクロール */}
            {redditHasMore && (
              <div ref={redditObserverRef} className="py-8 text-center">
                {redditLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <span className="ml-3 text-gray-600">
                      更にReddit投稿を読み込み中...
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-500">スクロールして更にReddit投稿を読み込む</p>
                )}
              </div>
            )}

            {!redditHasMore && redditPosts.length > 0 && (
              <div className="py-8 text-center text-gray-500">
                全てのReddit投稿を読み込みました
              </div>
            )}
          </div>
        )}

        {/* はてなブックマーク結果表示 */}
        {hatenaBookmarks.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
              📚 はてなブックマーク結果 ({hatenaBookmarks.length}件)
            </h3>

            <div className="grid gap-4">
              {hatenaBookmarks.map((bookmark, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md border border-purple-100">
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {/* サムネイル画像 */}
                      {bookmark.imageUrl && (
                        <div className="flex-shrink-0">
                          <img 
                            src={bookmark.imageUrl} 
                            alt={bookmark.title}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 flex-1 mr-4">
                            <a
                              href={bookmark.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-700 hover:text-purple-900 hover:underline"
                            >
                              {bookmark.title}
                            </a>
                          </h4>
                          
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                              bookmark.sentiment.label === 'ポジティブ' 
                                ? 'bg-green-100 text-green-700' 
                                : bookmark.sentiment.label === 'ネガティブ'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {bookmark.sentiment.emoji} {bookmark.sentiment.label}
                            </div>
                            
                            <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                              📖 {bookmark.bookmarkCount}
                            </div>
                          </div>
                        </div>

                        {bookmark.description && (
                          <p className="text-gray-600 mb-4 leading-relaxed">
                            {bookmark.description.length > 200 
                              ? `${bookmark.description.substring(0, 200)}...`
                              : bookmark.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="text-xs text-gray-500">
                            投稿日: {new Date(bookmark.pubDate).toLocaleDateString('ja-JP')}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => loadHatenaComments(bookmark.link, index)}
                              disabled={bookmark.commentsLoading}
                              className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 disabled:opacity-50"
                            >
                              {bookmark.commentsLoading ? '読み込み中...' : 
                               bookmark.comments ? `コメント(${bookmark.comments.length})` : 'コメント表示'}
                            </button>
                            <div className="text-xs text-purple-600 font-medium">
                              {bookmark.source}
                            </div>
                          </div>
                        </div>

                        {bookmark.comments && bookmark.comments.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-purple-100">
                            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              💬 ブックマークコメント ({bookmark.comments.length}件)
                            </h5>
                            
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {bookmark.comments.slice(0, 5).map((comment, commentIndex) => (
                                <div key={commentIndex} className="bg-purple-50 rounded-lg p-3">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="font-medium text-sm text-gray-900">
                                      {comment.user}
                                    </span>
                                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      comment.sentiment.label === 'ポジティブ' 
                                        ? 'bg-green-100 text-green-700' 
                                        : comment.sentiment.label === 'ネガティブ'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {comment.sentiment.emoji}
                                    </div>
                                  </div>
                                  {comment.comment && (
                                    <p className="text-sm text-gray-700 leading-relaxed mb-2">
                                      {comment.comment.length > 150 
                                        ? `${comment.comment.substring(0, 150)}...`
                                        : comment.comment}
                                    </p>
                                  )}
                                  {comment.tags && comment.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {comment.tags.slice(0, 3).map((tag, tagIndex) => (
                                        <span 
                                          key={tagIndex}
                                          className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded"
                                        >
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            実装済み機能
          </h3>
          <ul className="text-green-800 space-y-1">
            <li>• YouTube Search API との連携 </li>
            <li>• YouTube Comments API との連携 </li>
            <li>• 動画+コメント統合表示 </li>
            <li>• 無限スクロール機能 </li>
            <li>• Reddit API との連携 </li>
            <li>• はてなブックマーク API との連携 </li>
            <li>• 感情分析機能（ポジティブ/ネガティブ判定）</li>
            <li>• 口コミデータの可視化 </li>
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
