# Atomic Design コンポーネント設計ガイド

## 📚 Atomic Design とは？

Atomic Design は、Webサイトやアプリのデザインシステムを体系的に構築するための設計手法です。化学の原子理論にインスパイアされ、小さな部品から大きな構造体を組み立てていきます。

### 5つの階層構造

```
🔬 Atoms（原子）
    ↓
🧪 Molecules（分子）  
    ↓
🦠 Organisms（有機体）
    ↓  
📄 Templates（テンプレート）
    ↓
📱 Pages（ページ）
```

**なぜAtomic Designを使うのか？**
- **再利用性**: 同じコンポーネントを様々な場所で使い回せる
- **保守性**: 修正が1箇所で済む
- **一貫性**: デザインの統一性を保てる
- **開発効率**: チームでの分業がしやすい

## 🔬 Atoms（原子） - 最小単位のパーツ

### 特徴
- **最小単位**: これ以上分割できない
- **汎用的**: どこでも使える
- **プロパティ駆動**: 外部から見た目を制御

### 🔘 Button コンポーネント詳細解説

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Button = ({ 
  variant, 
  size = 'md', 
  children, 
  onClick, 
  className = '',
  disabled = false,
  type = 'button'
}: ButtonProps) => {
  // ベースとなるスタイル
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // variant（種類）によるスタイル
  const variantClasses = {
    primary: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 active:bg-red-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800',
    outline: 'border-2 border-red-500 text-red-500 bg-transparent hover:bg-red-50 focus:ring-red-500 active:bg-red-100'
  };
  
  // size（サイズ）によるスタイル
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  // disabled（無効）状態のスタイル
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
    : 'cursor-pointer';

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};
```

**使用例:**
```typescript
// プライマリボタン（メインアクション用）
<Button variant="primary" size="lg" onClick={handleSubmit}>
  送信する
</Button>

// アウトラインボタン（サブアクション用）
<Button variant="outline" size="md" onClick={handleCancel}>
  キャンセル
</Button>

// 小さなボタン（補助的なアクション用）
<Button variant="secondary" size="sm" onClick={handleEdit}>
  編集
</Button>
```

### 🏷️ Badge コンポーネント詳細解説

```typescript
interface BadgeProps {
  variant: 'info' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  rounded?: boolean;
}

const Badge = ({ 
  variant, 
  size = 'md', 
  children, 
  className = '',
  rounded = true 
}: BadgeProps) => {
  const baseClasses = 'inline-flex items-center font-medium';
  
  const variantClasses = {
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200', 
    error: 'bg-red-100 text-red-800 border border-red-200',
    neutral: 'bg-gray-100 text-gray-800 border border-gray-200'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  const roundedClass = rounded ? 'rounded-full' : 'rounded-md';

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${roundedClass} ${className}`}>
      {children}
    </span>
  );
};
```

**使用例:**
```typescript
// 成功状態
<Badge variant="success">完了</Badge>

// 警告状態  
<Badge variant="warning">注意</Badge>

// エラー状態
<Badge variant="error">エラー</Badge>

// 数値表示
<Badge variant="info" size="sm">12</Badge>
```

### 📝 Text コンポーネント詳細解説

```typescript
interface TextProps {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'overline';
  children: React.ReactNode;
  className?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

const Text = ({ 
  variant, 
  children, 
  className = '',
  color = 'primary',
  align = 'left',
  weight 
}: TextProps) => {
  // タイポグラフィの定義
  const variants = {
    h1: 'text-3xl font-bold leading-tight',
    h2: 'text-2xl font-semibold leading-tight', 
    h3: 'text-xl font-semibold leading-snug',
    h4: 'text-lg font-medium leading-snug',
    body: 'text-base leading-relaxed',
    caption: 'text-sm leading-normal',
    overline: 'text-xs font-medium uppercase tracking-wide'
  };
  
  // カラーバリエーション
  const colors = {
    primary: 'text-gray-900',
    secondary: 'text-gray-600', 
    success: 'text-green-700',
    warning: 'text-yellow-700',
    error: 'text-red-700'
  };
  
  // テキスト配置
  const alignments = {
    left: 'text-left',
    center: 'text-center', 
    right: 'text-right'
  };
  
  // フォントウェイト（指定された場合のみ適用）
  const weights = weight ? {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }[weight] : '';

  // HTMLタグの決定
  const getTag = () => {
    switch (variant) {
      case 'h1': return 'h1';
      case 'h2': return 'h2';
      case 'h3': return 'h3';
      case 'h4': return 'h4';
      default: return 'p';
    }
  };

  const Tag = getTag() as keyof JSX.IntrinsicElements;

  return (
    <Tag className={`${variants[variant]} ${colors[color]} ${alignments[align]} ${weights} ${className}`}>
      {children}
    </Tag>
  );
};
```

**使用例:**
```typescript
// 見出し
<Text variant="h1" color="primary">ページタイトル</Text>
<Text variant="h2" color="secondary">セクションタイトル</Text>

// 本文
<Text variant="body">これは本文のテキストです。</Text>

// キャプション
<Text variant="caption" color="secondary" align="center">
  画像の説明文
</Text>

// オーバーライン（ラベル等）
<Text variant="overline" color="secondary">
  カテゴリ
</Text>
```

## 🧪 Molecules（分子） - Atomsを組み合わせた部品

### 特徴
- **複数のAtomsを組合せ**
- **単一の責任**: 1つの機能に特化
- **再利用可能**: 様々な場所で使える

### 🎛️ TabButton コンポーネント詳細解説

```typescript
interface TabButtonProps {
  isActive: boolean;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
}

const TabButton = ({ 
  isActive, 
  children, 
  onClick, 
  disabled = false,
  icon,
  badge 
}: TabButtonProps) => {
  const baseClasses = 'relative py-2 px-4 font-medium text-sm transition-all duration-200 border-b-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2';
  
  const stateClasses = isActive 
    ? 'bg-white text-red-600 border-red-500 shadow-sm' 
    : 'bg-gray-50 text-gray-700 border-transparent hover:bg-gray-100 hover:text-gray-900';
    
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${stateClasses} ${disabledClasses}`}
    >
      <div className="flex items-center space-x-2">
        {/* アイコン表示 */}
        {icon && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
        
        {/* タブ名 */}
        <span>{children}</span>
        
        {/* バッジ表示 */}
        {badge && (
          <Badge variant="info" size="sm">
            {badge}
          </Badge>
        )}
      </div>
    </button>
  );
};
```

**使用例:**
```typescript
<TabButton 
  isActive={activeTab === 'youtube'} 
  onClick={() => setActiveTab('youtube')}
  icon={<YouTubeIcon />}
  badge={videoCount}
>
  YouTube
</TabButton>
```

### 💬 CommentCard コンポーネント詳細解説

```typescript
interface CommentCardProps {
  author: string;
  content: string;
  score?: number;
  timestamp: string;
  source: 'youtube' | 'reddit' | 'hatena' | 'internal';
  avatar?: string;
  replies?: number;
  onReply?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
}

const CommentCard = ({ 
  author, 
  content, 
  score, 
  timestamp, 
  source,
  avatar,
  replies,
  onReply,
  onLike,
  isLiked = false
}: CommentCardProps) => {
  // 情報源ごとのスタイル設定
  const sourceStyles = {
    youtube: {
      borderColor: 'border-l-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      icon: '🎥'
    },
    reddit: {
      borderColor: 'border-l-orange-500', 
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      icon: '📱'
    },
    hatena: {
      borderColor: 'border-l-blue-500',
      bgColor: 'bg-blue-50', 
      textColor: 'text-blue-700',
      icon: '📑'
    },
    internal: {
      borderColor: 'border-l-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700', 
      icon: '💬'
    }
  };

  const style = sourceStyles[source];
  
  // タイムスタンプのフォーマット
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}日前`;
    if (diffHours > 0) return `${diffHours}時間前`;
    return '1時間以内';
  };

  return (
    <div className={`p-4 border-l-4 rounded-r-lg ${style.borderColor} ${style.bgColor} hover:shadow-md transition-shadow`}>
      {/* ヘッダー部分 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* アバター */}
          {avatar ? (
            <img src={avatar} alt={author} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <Text variant="caption" className="text-gray-600">
                {author.charAt(0).toUpperCase()}
              </Text>
            </div>
          )}
          
          {/* 作成者情報 */}
          <div>
            <Text variant="caption" weight="medium">{author}</Text>
            <div className="flex items-center space-x-2">
              <span className="text-xs">{style.icon}</span>
              <Text variant="caption" color="secondary">
                {formatTimestamp(timestamp)}
              </Text>
            </div>
          </div>
        </div>
        
        {/* ソース情報 */}
        <Badge variant="neutral" size="sm">
          {source.charAt(0).toUpperCase() + source.slice(1)}
        </Badge>
      </div>

      {/* コメント内容 */}
      <div className="mb-3">
        <Text variant="body" className="whitespace-pre-wrap">
          {content}
        </Text>
      </div>

      {/* フッター部分 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* いいねボタン */}
          {onLike && (
            <button 
              onClick={onLike}
              className={`flex items-center space-x-1 text-sm ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-600 transition-colors`}
            >
              <span>{isLiked ? '❤️' : '🤍'}</span>
              {score && <span>{score}</span>}
            </button>
          )}
          
          {/* 返信ボタン */}
          {onReply && (
            <button 
              onClick={onReply}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <span>💬</span>
              <span>返信</span>
              {replies && <span>({replies})</span>}
            </button>
          )}
        </div>
        
        {/* スコア表示 */}
        {score && (
          <div className="flex items-center space-x-1">
            <Text variant="caption" color="secondary">
              スコア: {score}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 📹 VideoCard コンポーネント詳細解説

```typescript
interface VideoCardProps {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  viewCount: string;
  likeCount?: string;
  duration: string;
  publishedAt: string;
  onPlay?: (videoId: string) => void;
  onChannelClick?: (channelTitle: string) => void;
}

const VideoCard = ({
  id,
  title,
  description,
  thumbnailUrl,
  channelTitle, 
  viewCount,
  likeCount,
  duration,
  publishedAt,
  onPlay,
  onChannelClick
}: VideoCardProps) => {
  
  // 再生数のフォーマット
  const formatViewCount = (count: string) => {
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };
  
  // 動画時間のフォーマット（PT1H2M3S → 1:02:03）
  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      {/* サムネイル部分 */}
      <div className="relative" onClick={() => onPlay?.(id)}>
        <img 
          src={thumbnailUrl} 
          alt={title}
          className="w-full h-48 object-cover"
        />
        
        {/* 再生時間表示 */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
          {formatDuration(duration)}
        </div>
        
        {/* 再生ボタンオーバーレイ */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
          <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-2xl text-red-500">▶️</span>
          </div>
        </div>
      </div>

      {/* コンテンツ部分 */}
      <div className="p-4">
        {/* タイトル */}
        <Text variant="h4" className="line-clamp-2 mb-2">
          {title}
        </Text>
        
        {/* チャンネル名 */}
        <button 
          onClick={() => onChannelClick?.(channelTitle)}
          className="block mb-2 hover:text-blue-600 transition-colors"
        >
          <Text variant="caption" color="secondary">
            {channelTitle}
          </Text>
        </button>
        
        {/* 統計情報 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>👀 {formatViewCount(viewCount)}</span>
            {likeCount && (
              <span>👍 {formatViewCount(likeCount)}</span>
            )}
          </div>
          
          <Text variant="caption" color="secondary">
            {new Date(publishedAt).toLocaleDateString('ja-JP')}
          </Text>
        </div>
        
        {/* 説明文 */}
        {description && (
          <Text variant="caption" color="secondary" className="mt-3 line-clamp-3">
            {description}
          </Text>
        )}
      </div>
    </div>
  );
};
```

## 🦠 Organisms（有機体） - Moleculesを組み合わせた大きな部品

### 特徴
- **複数のMoleculesを統合**
- **特定の機能領域**: 明確な役割を持つ
- **状態管理**: 内部で状態を持つことがある

### 📊 TabNavigation コンポーネント詳細解説

```typescript
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  showComparison?: boolean;
  onToggleComparison?: () => void;
  className?: string;
}

const TabNavigation = ({
  tabs,
  activeTab,
  onTabChange,
  showComparison = false,
  onToggleComparison,
  className = ''
}: TabNavigationProps) => {
  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center justify-between">
        {/* タブボタン群 */}
        <div className="flex">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              isActive={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              disabled={tab.disabled}
              icon={tab.icon}
              badge={tab.badge}
            >
              {tab.label}
            </TabButton>
          ))}
        </div>

        {/* 比較表示トグルボタン */}
        {onToggleComparison && (
          <div className="px-4">
            <Button
              variant={showComparison ? 'primary' : 'outline'}
              size="sm"
              onClick={onToggleComparison}
            >
              📊 {showComparison ? '通常表示' : '比較表示'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 🎮 GameInfoSection コンポーネント詳細解説

```typescript
interface GameData {
  title: string;
  description: string;
  releaseDate: string;
  imageUrl: string;
  tags: string[];
  rating?: number;
  developer?: string;
  publisher?: string;
  platforms: string[];
}

interface GameInfoSectionProps {
  gameData: GameData;
  className?: string;
}

const GameInfoSection = ({ gameData, className = '' }: GameInfoSectionProps) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="md:flex">
        {/* ゲーム画像 */}
        <div className="md:w-1/3">
          <img 
            src={gameData.imageUrl} 
            alt={gameData.title}
            className="w-full h-64 md:h-full object-cover"
          />
        </div>

        {/* ゲーム情報 */}
        <div className="md:w-2/3 p-6">
          {/* タイトルと評価 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Text variant="h1" className="mb-2">
                {gameData.title}
              </Text>
              
              {/* 開発・発売元情報 */}
              <div className="space-y-1">
                {gameData.developer && (
                  <Text variant="caption" color="secondary">
                    開発: {gameData.developer}
                  </Text>
                )}
                {gameData.publisher && (
                  <Text variant="caption" color="secondary">
                    発売: {gameData.publisher}
                  </Text>
                )}
              </div>
            </div>

            {/* 評価 */}
            {gameData.rating && (
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">
                  {gameData.rating}
                </div>
                <Text variant="caption" color="secondary">
                  評価
                </Text>
              </div>
            )}
          </div>

          {/* 発売日カウントダウン */}
          <div className="mb-4">
            <CountdownTimer releaseDate={gameData.releaseDate} />
          </div>

          {/* 説明文 */}
          <Text variant="body" className="mb-4 leading-relaxed">
            {gameData.description}
          </Text>

          {/* タグ */}
          <div className="flex flex-wrap gap-2 mb-4">
            {gameData.tags.map((tag, index) => (
              <GameTag key={index} color={getTagColor(index)}>
                {tag}
              </GameTag>
            ))}
          </div>

          {/* プラットフォーム */}
          <div>
            <Text variant="caption" color="secondary" className="mb-2">
              対応プラットフォーム:
            </Text>
            <div className="flex flex-wrap gap-2">
              {gameData.platforms.map((platform, index) => (
                <Badge key={index} variant="neutral" size="sm">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// タグの色をローテーションで決める
const getTagColor = (index: number): 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' => {
  const colors: ('red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink')[] = 
    ['red', 'blue', 'green', 'purple', 'orange', 'pink'];
  return colors[index % colors.length];
};
```

### 💬 CommentTabsSection コンポーネント詳細解説

```typescript
interface CommentTabsSectionProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  showComparison: boolean;
  onToggleComparison: () => void;
  gameData: GameData;
  className?: string;
}

const CommentTabsSection = ({
  activeTab,
  onTabChange,
  showComparison,
  onToggleComparison,
  gameData,
  className = ''
}: CommentTabsSectionProps) => {
  
  // タブの定義
  const tabs = [
    { 
      id: 'youtube', 
      label: 'YouTube', 
      icon: '🎥',
      badge: '10' // 実際はAPIから取得
    },
    { 
      id: 'reddit', 
      label: 'Reddit', 
      icon: '📱',
      badge: '25' 
    },
    { 
      id: 'hatena', 
      label: 'はてブ', 
      icon: '📑',
      badge: '5' 
    },
    { 
      id: 'internal', 
      label: 'サイト内', 
      icon: '💬',
      badge: '8' 
    }
  ];

  // コンテンツレンダリング関数
  const renderContent = (tabId: TabType) => {
    switch (tabId) {
      case 'youtube':
        return <YouTubeContent gameData={gameData} />;
      case 'reddit':
        return <RedditContent gameData={gameData} />;
      case 'hatena':
        return <HatenaContent gameData={gameData} />;
      case 'internal':
        return <InternalContent gameData={gameData} />;
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* タブナビゲーション */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        showComparison={showComparison}
        onToggleComparison={onToggleComparison}
      />

      {/* コンテンツ表示エリア */}
      <div className="p-6">
        {showComparison ? (
          // 比較表示：4つ同時表示
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tabs.map((tab) => (
              <div key={tab.id} className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <span>{tab.icon}</span>
                  <Text variant="h3">{tab.label}</Text>
                  {tab.badge && (
                    <Badge variant="info" size="sm">{tab.badge}</Badge>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {renderContent(tab.id as TabType)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // 通常表示：選択されたタブのみ
          <div>
            {renderContent(activeTab)}
          </div>
        )}
      </div>
    </div>
  );
};
```

## 📄 Templates（テンプレート） - 全体のレイアウト

### 特徴
- **ページの骨格**: 全体的なレイアウトを決める
- **Organismsの配置**: 各Organismをどこに配置するか
- **レスポンシブ対応**: 画面サイズに応じた配置

### 🎮 GameDetailTemplate 詳細解説

```typescript
interface GameDetailTemplateProps {
  gameData: GameData;
  className?: string;
}

const GameDetailTemplate = ({ gameData, className = '' }: GameDetailTemplateProps) => {
  // 状態管理
  const [activeTab, setActiveTab] = useState<TabType>('youtube');
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* ヘッダー（オプション） */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Text variant="h2">Switch 2 ゲーム情報</Text>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* ゲーム基本情報セクション */}
          <GameInfoSection 
            gameData={gameData}
            className="animate-fade-in"
          />

          {/* コメント・タブセクション */}
          <CommentTabsSection
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showComparison={showComparison}
            onToggleComparison={() => setShowComparison(!showComparison)}
            gameData={gameData}
            className="animate-fade-in animation-delay-200"
          />

          {/* 関連情報セクション（オプション） */}
          <RelatedGamesSection 
            currentGame={gameData}
            className="animate-fade-in animation-delay-400"
          />
          
        </div>
      </main>

      {/* フッター（オプション） */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <Text variant="caption" color="secondary" align="center">
            © 2024 Switch 2 ゲーム情報サイト
          </Text>
        </div>
      </footer>
    </div>
  );
};
```

## 📱 Pages（ページ） - 実際のページ

### 特徴  
- **データの注入**: APIから取得したデータをTemplateに渡す
- **メタデータ設定**: SEO対策
- **エラーハンドリング**: データ取得失敗時の処理

### 🎮 GameDetailPage 詳細解説

```typescript
export default function GameDetailPage() {
  // ダミーデータ（実際はAPIから取得）
  const gameData: GameData = {
    title: "スプラトゥーン3 デラックス",
    description: "Nintendo Switch 2で新たに登場するスプラトゥーンシリーズ最新作。より美しいグラフィックと新機能でイカたちの戦いが更に激化！",
    releaseDate: "2025-03-15T00:00:00Z",
    imageUrl: "https://example.com/splatoon3-deluxe.jpg",
    tags: ["アクション", "シューター", "マルチプレイヤー", "オンライン"],
    rating: 9.2,
    developer: "Nintendo EPD",
    publisher: "Nintendo",
    platforms: ["Nintendo Switch 2"]
  };

  return (
    <>
      {/* SEO対策 */}
      <Head>
        <title>{gameData.title} - Switch 2 ゲーム情報</title>
        <meta name="description" content={gameData.description} />
        <meta property="og:title" content={gameData.title} />
        <meta property="og:description" content={gameData.description} />
        <meta property="og:image" content={gameData.imageUrl} />
      </Head>

      {/* メインコンテンツ */}
      <GameDetailTemplate gameData={gameData} />
    </>
  );
}
```

## 🎨 スタイリングとテーマ管理

### Tailwind CSS設定の最適化

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // カスタムカラー
      colors: {
        primary: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        // ゲーム情報源の色分け
        youtube: '#ff0000',
        reddit: '#ff4500', 
        hatena: '#00a4de',
        internal: '#10b981',
      },
      
      // アニメーション
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    }
  },
  plugins: [
    // 行数制限
    require('@tailwindcss/line-clamp'),
  ],
}
```

### CSS-in-JS との組み合わせ

```typescript
// styled-components を使う場合（オプション）
import styled from 'styled-components';

const StyledCard = styled.div<{ source: string }>`
  border-left: 4px solid ${props => {
    switch (props.source) {
      case 'youtube': return '#ff0000';
      case 'reddit': return '#ff4500';
      case 'hatena': return '#00a4de';
      case 'internal': return '#10b981';
      default: return '#6b7280';
    }
  }};
  
  background-color: ${props => {
    switch (props.source) {
      case 'youtube': return '#fef2f2';
      case 'reddit': return '#fff7ed';
      case 'hatena': return '#eff6ff';
      case 'internal': return '#ecfdf5';
      default: return '#f9fafb';
    }
  }};
`;
```

## 🔄 状態管理のベストプラクティス

### Context API の活用

```typescript
// GameContext.tsx
interface GameContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  showComparison: boolean;
  setShowComparison: (show: boolean) => void;
  gameData: GameData | null;
  setGameData: (data: GameData) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = useState<TabType>('youtube');
  const [showComparison, setShowComparison] = useState(false);
  const [gameData, setGameData] = useState<GameData | null>(null);

  return (
    <GameContext.Provider value={{
      activeTab, setActiveTab,
      showComparison, setShowComparison,
      gameData, setGameData
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within GameProvider');
  }
  return context;
};
```

## 🧪 テスト戦略

### コンポーネントテストの例

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button variant="primary" onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button variant="primary" disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## 📚 実装時のコツと注意点

### 1. コンポーネントの責任分離
```typescript
// ❌ 悪い例：1つのコンポーネントが多くの責任を持つ
const GamePage = () => {
  // API呼び出し、状態管理、表示ロジックが混在
  const [data, setData] = useState();
  const fetchData = async () => { /* ... */ };
  // 長大なJSXが続く...
};

// ✅ 良い例：責任を分離
const GamePage = () => {
  return <GameDetailTemplate gameData={gameData} />;
};
```

### 2. Props の型定義を厳密に
```typescript
// ❌ 悪い例
interface Props {
  data: any; // any は避ける
  onClick: Function; // Function も避ける
}

// ✅ 良い例  
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline'; // 厳密な型
  onClick: (event: MouseEvent<HTMLButtonElement>) => void; // 具体的な型
}
```

### 3. 再利用可能性を意識する
```typescript
// ✅ 良い例：汎用的な実装
const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-lg shadow-md ${className}`} {...props}>
    {children}
  </div>
);

// 様々な用途で使用可能
<Card className="p-4">ユーザー情報</Card>
<Card className="p-6 border">ゲーム情報</Card>
```

### 4. パフォーマンスを意識する
```typescript
// React.memo でレンダリング最適化
export const CommentCard = React.memo(({ author, content, ...props }: CommentCardProps) => {
  // コンポーネントの実装
});

// useCallback でコールバック最適化
const handleTabChange = useCallback((tab: TabType) => {
  setActiveTab(tab);
}, []);
```

これで Atomic Design の完全な実装ガイドが完成です。このパターンを使うことで、保守性が高く再利用可能なコンポーネントシステムを構築できます！