# はてなブックマーク API 機能概要と口コミ活用

## 📋 はてなブックマーク APIの基本情報

**はてなブックマークAPIの特徴:**
- ✅ **APIキー不要** - 認証なしでアクセス可能
- ✅ **日本語コンテンツ特化** - 日本のユーザーによる質の高い記事とコメント
- ✅ **高品質な議論** - 記事に対する建設的なブックマークコメント
- ✅ **タグ機能** - カテゴリ別での記事分類
- ✅ **人気度指標** - ブックマーク数による記事の注目度測定

## 🎮 口コミサイトに活用できるAPI機能

### 1. キーワード検索API
```
GET http://b.hatena.ne.jp/search/text?q={keyword}&mode=rss
```
**パラメータ:**
- `q`: 検索キーワード（ゲーム名等）
- `mode`: 出力形式（rss, json等）
- `sort`: ソート順（count, date, title）
- `safe`: セーフサーチ（on/off）

**口コミ活用例:**
- ゲーム名で検索して関連記事を取得
- レビュー記事やニュース記事の収集

### 2. 人気エントリーAPI
```
GET http://b.hatena.ne.jp/hotentry?mode=rss
GET http://b.hatena.ne.jp/entrylist?mode=rss&sort=hot
```
**口コミ活用例:**
- 話題のゲーム関連記事を自動収集
- トレンドゲームの発見

### 3. カテゴリ別エントリー取得
```
GET http://b.hatena.ne.jp/hotentry/game?mode=rss
```
**利用可能カテゴリ:**
- `game` - ゲーム・アニメ
- `it` - テクノロジー  
- `entertainment` - エンタメ
- `knowledge` - 学び

### 4. ブックマーク情報API
```
GET http://b.hatena.ne.jp/entry/jsonlite/?url={url}
```
**取得できる情報:**
- ブックマーク数
- ユーザーコメント一覧
- タグ情報
- ブックマーク日時

## 📊 口コミデータとして取得できる情報

### ブックマークエントリー情報
```xml
<item>
  <title>ゲーム記事のタイトル</title>
  <link>記事のURL</link>
  <description>142 users</description>
  <pubDate>投稿日時</pubDate>
  <hatena:bookmarkcount>142</hatena:bookmarkcount>
</item>
```

### ブックマークコメント情報
```json
{
  "bookmarks": [
    {
      "user": "ユーザー名",
      "comment": "記事に対するコメント",
      "timestamp": "2024-01-01 12:00:00",
      "tags": ["ゲーム", "レビュー", "Nintendo"]
    }
  ]
}
```

## 🎯 口コミサイトでの具体的活用方法

### 1. ゲーム関連記事の収集
```javascript
// 検索例
const queries = [
  "マリオカート 評価",
  "Nintendo Switch レビュー", 
  "ゲーム 感想",
  "新作ゲーム 面白い"
];

// 複数キーワードでの並行検索
const articles = await Promise.all(
  queries.map(q => searchHatenaBookmarks(q))
);
```

### 2. 記事の品質判定
- **ブックマーク数**: 10以上で注目記事
- **コメント質**: 建設的な議論があるか
- **タグ分析**: ゲーム関連タグの有無
- **投稿時期**: 最新性の確認

### 3. 感情・評価分析に使える要素

#### ポジティブ指標
```javascript
const positiveWords = [
  "面白い", "楽しい", "素晴らしい", "神ゲー", "名作",
  "おすすめ", "買い", "完成度高い", "クオリティ", "良作"
];
```

#### ネガティブ指標
```javascript
const negativeWords = [
  "つまらない", "残念", "微妙", "クソゲー", "駄作", 
  "がっかり", "期待外れ", "ボリューム不足", "バグ", "手抜き"
];
```

#### 中立・分析的指標
```javascript
const neutralWords = [
  "分析", "考察", "まとめ", "比較", "検証",
  "レビュー", "評価", "紹介", "解説", "攻略"
];
```

### 4. タグベース分析
```javascript
// ゲーム関連の有用なタグ
const gameTags = [
  "Nintendo", "Switch", "ゲーム", "レビュー", 
  "RPG", "アクション", "インディーゲーム",
  "新作", "リメイク", "続編", "評価", "感想"
];

// タグの出現頻度で記事の信頼性を判定
function analyzeArticleReliability(tags) {
  const gameTagCount = tags.filter(tag => 
    gameTags.includes(tag)
  ).length;
  
  return gameTagCount >= 2 ? "高信頼" : "要確認";
}
```

## 🔧 実装時の技術的考慮事項

### 1. データ取得の最適化
- **RSS/XML形式**: パース処理が必要
- **レート制限**: 穏やか（1秒間隔推奨）
- **キャッシュ**: 同一記事は24時間キャッシュ

### 2. データ品質フィルタリング
```javascript
// 質の高い記事の条件
function isHighQualityArticle(entry) {
  return (
    entry.bookmarkCount >= 10 &&          // 一定のブックマーク数
    entry.comments.length >= 3 &&         // コメント数
    entry.title.length >= 10 &&           // タイトルの詳細さ
    !entry.isSpam                         // スパム除外
  );
}
```

### 3. 記事の重複除去
```javascript
// URLベースでの重複チェック
function removeDuplicateArticles(articles) {
  const seen = new Set();
  return articles.filter(article => {
    const normalizedUrl = normalizeUrl(article.url);
    if (seen.has(normalizedUrl)) return false;
    seen.add(normalizedUrl);
    return true;
  });
}
```

## 📈 口コミ分析の活用例

### 1. ゲーム評価トレンド分析
- 発売前後のブックマーク数推移
- コメントの感情変化
- 話題の持続期間測定

### 2. ユーザー層分析
- ブックマークユーザーの傾向
- コメントの専門性レベル
- 影響力のあるユーザー特定

### 3. 競合ゲーム比較
```javascript
// 複数ゲームの比較分析
async function compareGames(gameList) {
  const comparisons = await Promise.all(
    gameList.map(async (game) => {
      const articles = await searchHatenaBookmarks(game);
      return {
        game,
        totalBookmarks: articles.reduce((sum, a) => sum + a.bookmarkCount, 0),
        averageRating: calculateAverageRating(articles),
        discussionVolume: articles.length
      };
    })
  );
  
  return comparisons.sort((a, b) => b.totalBookmarks - a.totalBookmarks);
}
```

### 4. 時系列分析
- 新作発表時の反応
- アップデート後の評価変化
- セール期間中の注目度

## 💡 実装のベストプラクティス

### 1. 効率的なデータ収集
```javascript
// バッチ処理での記事収集
async function collectGameArticles(gameKeywords) {
  const batchSize = 5;
  const results = [];
  
  for (let i = 0; i < gameKeywords.length; i += batchSize) {
    const batch = gameKeywords.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(keyword => searchHatenaBookmarks(keyword))
    );
    results.push(...batchResults.flat());
    
    // レート制限対応
    await delay(1000);
  }
  
  return removeDuplicates(results);
}
```

### 2. コメント品質の評価
```javascript
function evaluateCommentQuality(comment) {
  // 長さチェック（短すぎる・長すぎるコメントを除外）
  if (comment.length < 5 || comment.length > 500) return false;
  
  // 建設的なキーワードの存在
  const constructiveWords = ["面白い", "参考", "良い", "勉強", "なるほど"];
  const hasConstructive = constructiveWords.some(word => 
    comment.includes(word)
  );
  
  return hasConstructive;
}
```

### 3. 記事の信頼性判定
```javascript
function calculateArticleCredibility(article) {
  let score = 0;
  
  // ブックマーク数による加点
  if (article.bookmarkCount >= 50) score += 3;
  else if (article.bookmarkCount >= 20) score += 2;
  else if (article.bookmarkCount >= 10) score += 1;
  
  // コメント品質による加点
  const qualityComments = article.comments.filter(evaluateCommentQuality);
  score += Math.min(qualityComments.length, 3);
  
  // タグの関連性による加点
  const relevantTags = article.tags.filter(tag => 
    gameTags.includes(tag)
  ).length;
  score += Math.min(relevantTags, 2);
  
  return Math.min(score, 10); // 最大10点
}
```

はてなブックマークAPIを活用することで、日本語での高品質なゲーム関連の口コミ・評価情報を効率的に収集・分析できます。