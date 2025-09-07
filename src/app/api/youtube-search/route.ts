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