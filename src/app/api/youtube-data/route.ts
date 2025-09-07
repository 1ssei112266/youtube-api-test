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