import { NextRequest, NextResponse } from 'next/server';

// Reddit投稿の型定義
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
}

// 簡易感情分析関数
function analyzeSentiment(text: string): { sentiment: 'positive' | 'negative' | 'neutral', score: number } {
  const lowerText = text.toLowerCase();
  
  // ポジティブ単語（日本語＋英語）
  const positiveWords = [
    'good', 'great', 'awesome', 'amazing', 'excellent', 'fantastic', 'wonderful', 'love', 'best', 'perfect',
    'fun', 'enjoy', 'like', 'recommend', 'worth', 'beautiful', 'impressive', 'cool', 'nice', 'solid',
    '良い', 'いい', '素晴らしい', '最高', '楽しい', '面白い', '好き', 'おすすめ', 'すごい', '神ゲー',
    '神', '最強', 'やばい', 'ヤバい', '感動', '満足', '完璧', '傑作', 'クオリティ', '名作'
  ];
  
  // ネガティブ単語（日本語＋英語）
  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'boring', 'disappointing', 'frustrating', 'annoying',
    'broken', 'buggy', 'glitchy', 'lag', 'slow', 'expensive', 'overpriced', 'waste', 'regret', 'avoid',
    '悪い', 'だめ', 'ダメ', 'つまらない', '退屈', '最悪', '糞', 'クソ', 'ひどい', '酷い',
    'がっかり', 'バグ', 'ラグ', '重い', '高い', 'もったいない', '後悔', '残念', '微妙', 'イマイチ'
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  // 単語カウント
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  // スコア計算（-1.0 から 1.0）
  const totalWords = positiveCount + negativeCount;
  if (totalWords === 0) {
    return { sentiment: 'neutral', score: 0 };
  }
  
  const score = (positiveCount - negativeCount) / totalWords;
  
  if (score > 0.2) {
    return { sentiment: 'positive', score };
  } else if (score < -0.2) {
    return { sentiment: 'negative', score };
  } else {
    return { sentiment: 'neutral', score };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'Nintendo Switch';
  const subreddit = searchParams.get('subreddit') || 'NintendoSwitch';
  const limit = parseInt(searchParams.get('limit') || '10');
  const after = searchParams.get('after') || ''; // ページネーション用

  try {
    // RedditのJSON APIを使用（認証不要）
    const redditUrl = `https://www.reddit.com/r/${subreddit}/search.json`;
    const params = new URLSearchParams({
      q: query,
      sort: 'top',
      t: 'month',
      limit: Math.min(limit, 25).toString(),
      restrict_sr: 'true'
    });
    
    // ページネーション対応
    if (after) {
      params.append('after', after);
    }

    const response = await fetch(`${redditUrl}?${params}`, {
      headers: {
        'User-Agent': 'Nintendo-Switch-Game-Info-Site/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    
    // データを処理して感情分析を追加
    const posts: RedditPost[] = data.data.children.map((item: any) => {
      const postData = item.data;
      const textToAnalyze = `${postData.title} ${postData.selftext}`;
      const sentimentAnalysis = analyzeSentiment(textToAnalyze);
      
      // 高品質画像の取得
      let highQualityImage = '';
      
      // 1. preview画像（高解像度）を優先
      if (postData.preview && postData.preview.images && postData.preview.images.length > 0) {
        const images = postData.preview.images[0];
        if (images.resolutions && images.resolutions.length > 0) {
          // 解像度の高い画像を選択（通常複数サイズあり）
          const resolutions = images.resolutions;
          const highRes = resolutions[resolutions.length - 1]; // 最高解像度
          highQualityImage = highRes.url.replace(/&amp;/g, '&'); // HTMLエスケープを修正
        } else if (images.source) {
          highQualityImage = images.source.url.replace(/&amp;/g, '&');
        }
      }
      
      // 2. url_overridden_by_dest（外部リンク画像）
      else if (postData.url_overridden_by_dest && 
               (postData.url_overridden_by_dest.includes('.jpg') || 
                postData.url_overridden_by_dest.includes('.png') ||
                postData.url_overridden_by_dest.includes('.gif') ||
                postData.url_overridden_by_dest.includes('imgur.com'))) {
        highQualityImage = postData.url_overridden_by_dest;
      }
      
      // 3. フォールバック: 通常のサムネイル（品質改善）
      else if (postData.thumbnail && 
               postData.thumbnail !== 'self' && 
               postData.thumbnail !== 'default' &&
               postData.thumbnail !== 'nsfw') {
        highQualityImage = postData.thumbnail;
      }

      return {
        id: postData.id,
        title: postData.title,
        selftext: postData.selftext || '',
        author: postData.author,
        score: postData.score,
        upvote_ratio: postData.upvote_ratio,
        num_comments: postData.num_comments,
        created_utc: postData.created_utc,
        subreddit: postData.subreddit,
        permalink: postData.permalink,
        url: postData.url,
        thumbnail: highQualityImage,
        sentiment: sentimentAnalysis.sentiment,
        sentimentScore: sentimentAnalysis.score
      };
    });

    // スコア順にソート
    posts.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      data: posts,
      count: posts.length,
      query,
      subreddit,
      after: data.data.after || null, // 次ページのトークン
      summary: {
        total: posts.length,
        positive: posts.filter(p => p.sentiment === 'positive').length,
        negative: posts.filter(p => p.sentiment === 'negative').length,
        neutral: posts.filter(p => p.sentiment === 'neutral').length,
        averageScore: posts.length > 0 ? posts.reduce((sum, post) => sum + post.score, 0) / posts.length : 0
      }
    });

  } catch (error) {
    console.error('Reddit API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch Reddit posts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}