# コードベース構造

## ディレクトリ構成
```
youtube-test/
├── .serena/           # Serenaプロジェクト設定
├── src/
│   └── app/           # Next.js App Router
│       ├── page.tsx   # メインページ（468行）
│       ├── layout.tsx # レイアウト設定
│       ├── globals.css # グローバルスタイル
│       └── favicon.ico
├── public/            # 静的ファイル
├── .tmp/              # 一時ファイル
└── [設定ファイル群]
```

## 主要ファイル
- **src/app/page.tsx**: 全コンポーネント定義（Atomic Design）
- **package.json**: 依存関係とスクリプト定義
- **tsconfig.json**: TypeScript設定
- **eslint.config.mjs**: ESLint設定
- **next.config.ts**: Next.js設定

## コンポーネント階層（page.tsx内）
```
GameDetailPage (Pages)
└── GameDetailTemplate (Templates)
    ├── GameInfoSection (Organisms)
    │   ├── CountdownTimer (Molecules)
    │   │   └── CountdownText (Atoms)
    │   └── GameTag (Molecules)
    │       └── Badge (Atoms)
    └── CommentTabsSection (Organisms)
        ├── TabNavigation (Molecules)
        │   └── TabButton (Molecules)
        └── [Content Areas]
            ├── VideoCard (Molecules)
            └── CommentCard (Molecules)
```

## 型定義構造
- **TabType**: タブ識別用
- **各コンポーネントProps**: 厳密な型定義
- **ダミーデータ**: gameData オブジェクト

## 状態管理
- **activeTab**: タブ切り替え状態
- **showComparison**: 比較表示モード状態
- **カウントダウン**: リアルタイム時間計算

## スタイリング
- **Tailwind CSS**: ユーティリティファースト
- **レスポンシブ**: md: ブレークポイント使用
- **カラーシステム**: ソース別色分け実装