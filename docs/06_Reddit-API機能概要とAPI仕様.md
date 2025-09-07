# Reddit API 機能概要とAPI仕様

## 📋 Reddit APIの基本情報

**Reddit APIの特徴:**
- ✅ **無料利用可能** - 認証なしでも基本的な読み取り可能
- ✅ **豊富なコミュニティデータ** - ゲーム関連の活発な議論
- ✅ **リアルタイム性** - 最新の口コミ・評価情報
- ✅ **スコア機能** - upvote/downvoteによる評価システム
- ✅ **JSON形式** - 扱いやすいデータ形式

## 🎮 口コミまとめ機能に関連するAPI

### 1. Subreddit投稿検索
```
GET https://www.reddit.com/r/{subreddit}/search.json
```
**パラメータ:**
- `q`: 検索キーワード（ゲーム名など）
- `sort`: ソート順（relevance, new, top, comments）
- `t`: 期間（hour, day, week, month, year, all）
- `limit`: 取得件数（1-100）
- `restrict_sr`: サブレディット内限定検索

**用途:** 特定ゲームの投稿を検索

### 2. 人気投稿取得
```
GET https://www.reddit.com/r/{subreddit}/hot.json
GET https://www.reddit.com/r/{subreddit}/top.json
```
**用途:** 話題の投稿・高評価投稿を取得

### 3. コメント取得
```
GET https://www.reddit.com/r/{subreddit}/comments/{post_id}.json
```
**用途:** 投稿の詳細なコメント・議論内容を取得

### 4. 複数サブレディット検索
```
GET https://www.reddit.com/search.json
```
**用途:** 全Reddit横断でのゲーム関連投稿検索

## 🎯 口コミまとめに最適なサブレディット

### Nintendo系
- `r/NintendoSwitch` - Switch全般
- `r/nintendo` - Nintendo総合
- `r/gaming` - ゲーム全般（大規模）
- `r/Games` - ゲーム議論特化
- `r/patientgamers` - じっくりレビュー

### 日本語コミュニティ
- `r/GamersJP` - 日本語ゲーム議論
- `r/newsokur` - 日本語総合（ゲーム話題含む）

## 📊 取得できるデータ構造

```json
{
  "data": {
    "children": [
      {
        "data": {
          "title": "投稿タイトル",
          "selftext": "本文テキスト", 
          "author": "投稿者名",
          "score": 1250,              // upvote-downvote
          "upvote_ratio": 0.89,       // 支持率
          "num_comments": 45,         // コメント数
          "created_utc": 1672531200,  // 投稿時刻
          "subreddit": "NintendoSwitch",
          "permalink": "/r/NintendoSwitch/comments/...",
          "url": "投稿URL",
          "thumbnail": "サムネイル画像URL"
        }
      }
    ]
  }
}
```

## 🛠️ 口コミまとめ機能の実装方針

### 1. データ収集戦略
```typescript
// 複数サブレディットから並行取得
const gameSubreddits = [
  'NintendoSwitch', 'nintendo', 'gaming', 'Games'
];

// 検索クエリ例
const queries = [
  'マリオカート Switch',
  'Mario Kart Nintendo', 
  'マリオカート 評価',
  'Mario Kart review'
];
```

### 2. 評価スコア算出
- **スコア**: upvote数 - downvote数
- **支持率**: upvote / (upvote + downvote) 
- **人気度**: スコア × コメント数 × 時間補正

### 3. 感情分析対象
- 投稿タイトル
- 投稿本文（selftext）
- 上位コメント
- フレア（カテゴリタグ）

### 4. フィルタリング条件
- スコア最低値（例：+10以上）
- コメント数最低値（例：5件以上）
- 投稿期間（例：過去1年）
- 言語判定（日本語/英語）

## ⚡ API制限と対策

### レート制限
- **制限**: 60リクエスト/分
- **対策**: リクエスト間隔調整（1秒間隔）

### データ量制限
- **制限**: 1回最大100件
- **対策**: ページネーション実装

### キャッシュ戦略
```typescript
// 推奨キャッシュ時間
const CACHE_DURATION = {
  hot: 30 * 60 * 1000,    // 30分（人気投稿）
  search: 60 * 60 * 1000, // 1時間（検索結果）
  comments: 2 * 60 * 60 * 1000 // 2時間（コメント）
};
```

## 🔧 実装例

### 基本的な検索実装
```typescript
async function searchGameOnReddit(gameName: string) {
  const subreddits = ['NintendoSwitch', 'nintendo', 'gaming'];
  const results = [];
  
  for (const sub of subreddits) {
    const url = `https://www.reddit.com/r/${sub}/search.json`;
    const params = {
      q: `${gameName} Switch`,
      sort: 'top',
      t: 'month',
      limit: '25',
      restrict_sr: 'true'
    };
    
    const response = await fetch(`${url}?${new URLSearchParams(params)}`);
    const data = await response.json();
    results.push(...data.data.children);
    
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results.sort((a, b) => b.data.score - a.data.score);
}
```

## 📈 口コミデータの活用方法

### 1. センチメント分析
- ポジティブ/ネガティブ判定
- 評価軸の抽出（グラフィック、ゲームプレイ等）

### 2. トレンド分析
- 時系列での評価変化
- 発売前後の話題推移

### 3. 比較分析  
- 類似ゲームとの評価比較
- プラットフォーム別評価

### 4. 要約生成
- 主要な口コミポイントの抽出
- ユーザー層別の傾向分析

これらのAPIを活用して、包括的なゲーム口コミまとめ機能を実装できます。