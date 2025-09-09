import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'クエリパラメータ url が必要です' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`https://b.hatena.ne.jp/entry/jsonlite/?url=${encodeURIComponent(url)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HatenaBookmarkAPI/1.0)',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'はてなブックマークコメントAPI エラー' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // コメントに感情分析を追加
    const bookmarksWithSentiment = (data.bookmarks || []).map((bookmark: any) => {
      const sentiment = analyzeSentiment(bookmark.comment || '');
      return {
        ...bookmark,
        sentiment
      };
    });

    return NextResponse.json({
      bookmarks: bookmarksWithSentiment,
      count: bookmarksWithSentiment.length
    });

  } catch (error) {
    console.error('はてなブックマークコメント取得エラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}

// 簡易感情分析（日本語対応）
function analyzeSentiment(text: string): { score: number; label: string; emoji: string } {
  if (!text || text.trim() === '') {
    return { score: 0, label: '中立', emoji: '😐' };
  }

  const positiveWords = [
    '面白い', '楽しい', '素晴らしい', '神ゲー', '名作', 'おすすめ', '買い', 
    '完成度高い', 'クオリティ', '良作', '最高', '感動', 'すごい', 'いい',
    'good', 'great', 'amazing', 'awesome', 'excellent', 'fantastic', 'love',
    'なるほど', '参考', '勉強', '有用'
  ];

  const negativeWords = [
    'つまらない', '残念', '微妙', 'クソゲー', '駄作', 'がっかり', '期待外れ', 
    'ボリューム不足', 'バグ', '手抜き', 'ひどい', 'だめ', '最悪',
    'bad', 'terrible', 'awful', 'boring', 'disappointing', 'worst', 'hate',
    'くだらない', 'うざい', 'むかつく'
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  const lowerText = text.toLowerCase();

  positiveWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  });

  const score = positiveCount - negativeCount;
  
  if (score > 0) {
    return { score, label: 'ポジティブ', emoji: '😊' };
  } else if (score < 0) {
    return { score, label: 'ネガティブ', emoji: '😔' };
  } else {
    return { score, label: '中立', emoji: '😐' };
  }
}