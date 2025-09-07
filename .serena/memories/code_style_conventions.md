# コードスタイルと規約

## TypeScript設定
- **strict mode**: 有効
- **target**: ES2017
- **jsx**: preserve (Next.js用)
- **パスエイリアス**: @/* → ./src/*

## ESLint設定
- **ベース設定**: next/core-web-vitals, next/typescript
- **除外ディレクトリ**: node_modules, .next, out, build, next-env.d.ts

## コンポーネント設計規約
### Atomic Design適用
- **命名規則**: PascalCase (例: GameDetailPage, CommentCard)
- **Props型定義**: 必須（例: ButtonProps, GameInfoSectionProps）
- **ファイル構成**: 単一ファイルに全コンポーネント記述

### React規約
- **Hooks**: useState使用（状態管理）
- **TypeScript**: interface使用（Props型定義）
- **関数コンポーネント**: アロー関数形式

## Tailwind CSS規約
- **レスポンシブ**: md:プレフィックス使用
- **カラーパレット**: 
  - YouTube: red系
  - Reddit: orange系  
  - はてブ: blue系
  - サイト内: green系

## ファイル命名規約
- **コンポーネント**: page.tsx, layout.tsx
- **スタイル**: globals.css
- **設定ファイル**: *.config.* (mjs/ts)

## コメント規約
- **日本語**: プロジェクト固有の説明
- **英語**: 汎用的な技術説明
- **JSDoc**: 型定義補完用