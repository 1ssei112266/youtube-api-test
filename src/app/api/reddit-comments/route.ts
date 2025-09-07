import { NextRequest, NextResponse } from 'next/server';

// Redditコメントの型定義
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

// 簡易感情分析関数（reddit-search/route.tsと同じ）
function analyzeSentiment(text: string): { sentiment: 'positive' | 'negative' | 'neutral', score: number } {
  const lowerText = text.toLowerCase();
  
  const positiveWords = [
    'good', 'great', 'awesome', 'amazing', 'excellent', 'fantastic', 'wonderful', 'love', 'best', 'perfect',
    'fun', 'enjoy', 'like', 'recommend', 'worth', 'beautiful', 'impressive', 'cool', 'nice', 'solid',
    '良い', 'いい', '素晴らしい', '最高', '楽しい', '面白い', '好き', 'おすすめ', 'すごい', '神ゲー',
    '神', '最強', 'やばい', 'ヤバい', '感動', '満足', '完璧', '傑作', 'クオリティ', '名作'
  ];
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'boring', 'disappointing', 'frustrating', 'annoying',
    'broken', 'buggy', 'glitchy', 'lag', 'slow', 'expensive', 'overpriced', 'waste', 'regret', 'avoid',
    '悪い', 'だめ', 'ダメ', 'つまらない', '退屈', '最悪', '糞', 'クソ', 'ひどい', '酷い',
    'がっかり', 'バグ', 'ラグ', '重い', '高い', 'もったいない', '後悔', '残念', '微妙', 'イマイチ'
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
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

// Redditのコメントツリーを平坦化して上位コメントを抽出
function flattenComments(commentData: any[], maxDepth: number = 2): RedditComment[] {
  const comments: RedditComment[] = [];
  
  function extractComments(items: any[], currentDepth: number = 0) {
    if (currentDepth > maxDepth) return;
    
    for (const item of items) {
      if (item.kind === 't1' && item.data) { // t1 = comment
        const commentBody = item.data.body;
        
        // [deleted]や[removed]は除外
        if (commentBody && commentBody !== '[deleted]' && commentBody !== '[removed]') {
          const sentimentAnalysis = analyzeSentiment(commentBody);
          
          comments.push({
            id: item.data.id,
            body: commentBody,
            author: item.data.author || '[deleted]',
            score: item.data.score || 0,
            created_utc: item.data.created_utc,
            depth: currentDepth,
            sentiment: sentimentAnalysis.sentiment,
            sentimentScore: sentimentAnalysis.score
          });
        }
        
        // 返信コメントも処理（ネストした構造）
        if (item.data.replies && item.data.replies.data && item.data.replies.data.children) {
          extractComments(item.data.replies.data.children, currentDepth + 1);
        }
      }
    }
  }
  
  extractComments(commentData, 0);
  
  // スコア順にソートして上位を返す
  return comments.sort((a, b) => b.score - a.score);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get('subreddit');
  const postId = searchParams.get('postId');
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!subreddit || !postId) {
    return NextResponse.json(
      { 
        success: false,
        error: 'subreddit and postId parameters are required' 
      },
      { status: 400 }
    );
  }

  try {
    // RedditのコメントAPI（JSON形式）
    const commentsUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;
    
    const response = await fetch(commentsUrl, {
      headers: {
        'User-Agent': 'Nintendo-Switch-Game-Info-Site/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit Comments API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Reddit APIは[post_data, comments_data]の配列を返す
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid Reddit API response format');
    }
    
    const commentsData = data[1]; // 2番目の要素がコメントデータ
    
    if (!commentsData.data || !commentsData.data.children) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        summary: {
          total: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
          averageScore: 0
        }
      });
    }

    // コメントを平坦化して処理
    const allComments = flattenComments(commentsData.data.children, 2);
    const topComments = allComments.slice(0, limit);
    
    // 感情分析サマリー
    const summary = {
      total: topComments.length,
      positive: topComments.filter(c => c.sentiment === 'positive').length,
      negative: topComments.filter(c => c.sentiment === 'negative').length,
      neutral: topComments.filter(c => c.sentiment === 'neutral').length,
      averageScore: topComments.length > 0 
        ? topComments.reduce((sum, comment) => sum + comment.score, 0) / topComments.length 
        : 0
    };

    return NextResponse.json({
      success: true,
      data: topComments,
      count: topComments.length,
      postId,
      subreddit,
      summary
    });

  } catch (error) {
    console.error('Reddit Comments API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch Reddit comments',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}