import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const maxResults = searchParams.get('maxResults') || '10';

  if (!query) {
    return NextResponse.json(
      { error: 'クエリパラメータ q が必要です' },
      { status: 400 }
    );
  }

  try {
    // はてなブックマーク検索API
    const url = new URL('https://b.hatena.ne.jp/search/text');
    url.searchParams.set('q', query);
    url.searchParams.set('mode', 'rss');
    url.searchParams.set('sort', 'count'); // ブックマーク数順
    url.searchParams.set('safe', 'on');

    console.log('Hatena API URL:', url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HatenaBookmarkAPI/1.0)',
      },
      redirect: 'follow'
    });
    
    console.log('Hatena API Response status:', response.status);
    
    if (!response.ok) {
      console.error('Hatena API Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `はてなブックマークAPI エラー: ${response.status}` },
        { status: response.status }
      );
    }

    const xmlText = await response.text();
    console.log('Hatena API Response length:', xmlText.length);
    console.log('Hatena API Response preview:', xmlText.substring(0, 500));
    
    // XMLをパースしてJSONに変換
    const items = parseHatenaRSS(xmlText);
    const limitedItems = items.slice(0, parseInt(maxResults));

    console.log('Parsed items count:', items.length);

    return NextResponse.json({
      items: limitedItems,
      totalCount: items.length
    });

  } catch (error) {
    console.error('はてなブックマーク Search API エラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}

// RSS XMLをパースしてJSONに変換
function parseHatenaRSS(xmlText: string) {
  const items: any[] = [];
  
  // RDF/RSS 1.0形式のitemを正規表現で抽出
  const itemMatches = xmlText.match(/<item rdf:about="[^"]*">[\s\S]*?<\/item>/g) || [];
  
  itemMatches.forEach(itemXml => {
    // HTMLエンティティをデコード
    const decodeHTML = (str: string) => {
      return str
        .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');
    };

    const titleMatch = itemXml.match(/<title>(.*?)<\/title>/s);
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>/s);
    const descriptionMatch = itemXml.match(/<description>(.*?)<\/description>/s);
    const dateMatch = itemXml.match(/<dc:date>(.*?)<\/dc:date>/s);
    const bookmarkCountMatch = itemXml.match(/<hatena:bookmarkcount>(\d+)<\/hatena:bookmarkcount>/s);
    const imageMatch = itemXml.match(/<hatena:imageurl>(.*?)<\/hatena:imageurl>/s);

    if (titleMatch && linkMatch) {
      const title = decodeHTML(titleMatch[1]);
      const link = linkMatch[1];
      const description = descriptionMatch ? decodeHTML(descriptionMatch[1]) : '';
      const pubDate = dateMatch ? dateMatch[1] : '';
      const bookmarkCount = bookmarkCountMatch ? parseInt(bookmarkCountMatch[1]) : 0;
      const imageUrl = imageMatch ? imageMatch[1] : null;

      // 感情分析
      const sentiment = analyzeSentiment(title + ' ' + description);

      items.push({
        title,
        link,
        description,
        pubDate,
        bookmarkCount,
        imageUrl,
        sentiment,
        source: 'はてなブックマーク'
      });
    }
  });

  return items;
}

// 簡易感情分析（日本語対応）
function analyzeSentiment(text: string): { score: number; label: string; emoji: string } {
  const positiveWords = [
    '面白い', '楽しい', '素晴らしい', '神ゲー', '名作', 'おすすめ', '買い', 
    '完成度高い', 'クオリティ', '良作', '最高', '感動', 'すごい', 'いい',
    'good', 'great', 'amazing', 'awesome', 'excellent', 'fantastic', 'love'
  ];

  const negativeWords = [
    'つまらない', '残念', '微妙', 'クソゲー', '駄作', 'がっかり', '期待外れ', 
    'ボリューム不足', 'バグ', '手抜き', 'ひどい', 'だめ', '最悪',
    'bad', 'terrible', 'awful', 'boring', 'disappointing', 'worst', 'hate'
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