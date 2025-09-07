# 技術スタック

## フロントエンド
- **Next.js**: 15.5.2 (App Router)
- **React**: 19.1.0
- **TypeScript**: ^5
- **Tailwind CSS**: ^4 (スタイリング)

## 開発環境
- **ESLint**: ^9 (eslint-config-next 15.5.2)
- **PostCSS**: @tailwindcss/postcss ^4
- **Node Types**: @types/node ^20, @types/react ^19, @types/react-dom ^19

## プロジェクト構成
- **パッケージ管理**: npm
- **ビルドツール**: Next.js内蔵
- **TypeScript設定**: strict mode有効、パス設定(@/*)

## アーキテクチャ
- **デザインパターン**: Atomic Design
  - Atoms: Button, Badge, Text, CountdownText
  - Molecules: TabButton, CommentCard, VideoCard, CountdownTimer  
  - Organisms: GameInfoSection, TabNavigation, CommentTabsSection
  - Templates: GameDetailTemplate
  - Pages: GameDetailPage
  
## 外部API予定
- **YouTube Data API v3**: 動画・コメント情報取得
- **Reddit API**: コミュニティ情報取得
- **はてなブックマーク API**: 日本語記事・コメント取得
- **RAWG API**: ゲーム基本情報取得