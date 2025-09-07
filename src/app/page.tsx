"use client";
import { useState, useEffect } from "react";

/**
 * Switch 2 ゲーム詳細ページ
 * Nintendo公式サイトの色反転バージョンを目指したデザイン
 * 
 * カラーテーマ:
 * - メイン背景: #333c5e (深い青紫)
 * - カード背景: グレー系
 * - アクセント: Nintendo風の赤・オレンジ系
 */

// ===== ATOMS（基本的な最小単位のコンポーネント） =====

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * ボタンコンポーネント - Nintendo風のデザイン
 * primary: Nintendo赤、secondary: グレー、outline: 枠線のみ
 */
const Button = ({ variant, size = 'md', children, onClick, className = '' }: ButtonProps) => {
  const baseClasses = 'font-medium rounded-lg transition-colors'; // Nintendo風に角丸を大きく
  const variantClasses = {
    primary: 'bg-red-500 text-white hover:bg-red-600', // Nintendo風の赤色、シャドウ削除
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white'
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button 
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

interface BadgeProps {
  variant: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

/**
 * バッジコンポーネント - ポイント数や評価を表示
 */
const Badge = ({ variant, children }: BadgeProps) => {
  const variantClasses = {
    info: 'bg-blue-500 text-white',
    success: 'bg-orange-500 text-white', // Nintendo風にオレンジに変更
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-500 text-white'
  };
  
  return (
    <span className={`px-2 py-1 text-xs rounded-full ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

interface GameTagProps {
  children: React.ReactNode;
  color?: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';
}

/**
 * ゲームタグコンポーネント - ゲームのジャンルや特徴を表示
 * アクション、RPG、マルチプレイヤーなどのタグ用
 */
const GameTag = ({ children, color = 'blue' }: GameTagProps) => {
  const colorClasses = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white', 
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    orange: 'bg-orange-500 text-white',
    pink: 'bg-pink-500 text-white'
  };
  
  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${colorClasses[color]}`}>
      {children}
    </span>
  );
};

interface TextProps {
  variant: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  children: React.ReactNode;
  className?: string;
}

/**
 * テキストコンポーネント - 各種見出しと本文
 * Nintendo風の読みやすいフォント設定
 * 優しめの黒色調で読みやすいデザイン
 */
const Text = ({ variant, children, className = '' }: TextProps) => {
  const variants = {
    h1: 'text-3xl font-bold text-gray-800',      // 優しめの黒
    h2: 'text-2xl font-semibold text-gray-800',  // 優しめの黒
    h3: 'text-xl font-semibold text-gray-800',   // 優しめの黒
    body: 'text-gray-700',                       // 本文は少し薄めの黒
    caption: 'text-sm text-gray-600'             // キャプションは薄めの黒
  };
  
  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

interface CountdownTextProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * カウントダウン表示コンポーネント
 * 発売日まで「日・時間・分・秒」をリアルタイム表示
 * Nintendo風の親しみやすいオレンジ系カラー
 */
const CountdownText = ({ days, hours, minutes, seconds, size = 'md' }: CountdownTextProps) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl', 
    lg: 'text-3xl'
  };
  
  // 発売日が過ぎた場合
  if (days <= 0 && hours <= 0 && minutes <= 0 && seconds <= 0) {
    return <span className="text-gray-300">🎮 発売済み</span>;
  }
  
  return (
    <div className={`font-bold ${sizeClasses[size]}`}>
      <div className="flex gap-3 items-center justify-center">
        {/* 日 */}
        <div className="text-center">
          <div className="text-3xl text-orange-600">{days}</div>
          <div className="text-sm text-gray-600">日</div>
        </div>
        <span className="text-gray-500">:</span>
        
        {/* 時間 */}
        <div className="text-center">
          <div className="text-2xl text-orange-600">{hours.toString().padStart(2, '0')}</div>
          <div className="text-sm text-gray-600">時間</div>
        </div>
        <span className="text-gray-500">:</span>
        
        {/* 分 */}
        <div className="text-center">
          <div className="text-2xl text-orange-600">{minutes.toString().padStart(2, '0')}</div>
          <div className="text-sm text-gray-600">分</div>
        </div>
        <span className="text-gray-500">:</span>
        
        {/* 秒（アニメーション的に目立つ色） */}
        <div className="text-center">
          <div className="text-2xl text-red-600">{seconds.toString().padStart(2, '0')}</div>
          <div className="text-sm text-gray-600">秒</div>
        </div>
      </div>
    </div>
  );
};

// ===== MOLECULES（複数のAtomsを組み合わせた小さなコンポーネント） =====

interface TabButtonProps {
  isActive: boolean;
  children: React.ReactNode;
  onClick: () => void;
}

/**
 * タブボタンコンポーネント
 * 情報源切り替え用（YouTube/Reddit/はてブ/サイト内）
 */
const TabButton = ({ isActive, children, onClick }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors rounded-t-lg ${
      isActive 
        ? 'border-red-500 text-red-600 bg-gray-50' // Nintendo赤でアクティブ状態
        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

interface CommentCardProps {
  author: string;
  content: string;
  score?: number;
  source: 'youtube' | 'reddit' | 'hatena' | 'site';
}

/**
 * コメントカードコンポーネント
 * 各情報源からの口コミを表示
 * 左の色線で情報源を区別
 */
const CommentCard = ({ author, content, score, source }: CommentCardProps) => {
  const sourceColors = {
    youtube: 'border-l-red-500',     // YouTube: 赤
    reddit: 'border-l-orange-500',   // Reddit: オレンジ
    hatena: 'border-l-blue-500',     // はてブ: 青
    site: 'border-l-green-500'       // サイト内: 緑
  };
  
  return (
    <div className={`bg-white p-4 rounded-xl border-l-4 shadow-sm ${sourceColors[source]}`}>
      <div className="flex justify-between items-start mb-2">
        <Text variant="caption">{author}</Text>
        {score && <Badge variant="info">{score} pts</Badge>}
      </div>
      <Text variant="body">{content}</Text>
    </div>
  );
};

interface VideoCardProps {
  title: string;
  thumbnail: string;
  views: string;
  publishedAt: string;
}

/**
 * YouTube動画カードコンポーネント
 * 動画のサムネイル、タイトル、再生数、投稿日を表示
 */
const VideoCard = ({ title, thumbnail, views, publishedAt }: VideoCardProps) => (
  <div className="bg-white rounded-xl p-4 hover:bg-gray-50 transition-colors shadow-sm">
    <div className="bg-gray-100 rounded-lg aspect-video mb-3 flex items-center justify-center">
      <span className="text-gray-500">🎬 動画サムネ</span>
    </div>
    <Text variant="body" className="font-medium mb-2 line-clamp-2">{title}</Text>
    <div className="flex justify-between">
      <Text variant="caption">👀 {views} 再生</Text>
      <Text variant="caption">📅 {publishedAt}</Text>
    </div>
  </div>
);

interface CountdownTimerProps {
  releaseDate: string;
}

/**
 * 発売日カウントダウンタイマー
 * 1秒ごとに自動更新されるリアルタイムカウントダウン
 * Nintendo風のシンプルで親しみやすいデザイン
 */
const CountdownTimer = ({ releaseDate }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // 残り時間を計算する関数
    const calculateTimeLeft = () => {
      const now = new Date();
      const release = new Date(releaseDate);
      const diffTime = release.getTime() - now.getTime();
      
      if (diffTime <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);
      
      return { days, hours, minutes, seconds };
    };

    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft());
    };

    updateTimer(); // 初回実行
    const interval = setInterval(updateTimer, 1000); // 1秒ごとに更新

    return () => clearInterval(interval);
  }, [releaseDate]);
  
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <Text variant="caption" className="text-gray-600">🗓️ 発売予定日</Text>
      <Text variant="body" className="text-xl font-semibold text-orange-600 mt-1">
        {releaseDate}
      </Text>
      <div className="mt-3">
        <CountdownText 
          days={timeLeft.days} 
          hours={timeLeft.hours} 
          minutes={timeLeft.minutes} 
          seconds={timeLeft.seconds} 
        />
      </div>
    </div>
  );
};

// ===== ORGANISMS（大きなセクションレベルのコンポーネント） =====

interface GameInfoSectionProps {
  gameData: {
    title: string;
    platform: string;
    releaseDate: string;
    description: string;
    tags: Array<{
      name: string;
      color: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';
    }>;
  };
}

/**
 * ゲーム基本情報セクション
 * ページ上部に配置されるメインコンテンツエリア
 * ゲーム画像、タイトル、発売日カウントダウン、説明文を表示
 */
const GameInfoSection = ({ gameData }: GameInfoSectionProps) => (
  <div className="bg-[#333c5e] shadow-lg border-b border-gray-600">
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* ゲーム画像エリア */}
        <div className="md:w-1/3">
          <div className="bg-gray-600 rounded-xl aspect-video flex items-center justify-center">
            <span className="text-gray-400">🎮 ゲーム画像/トレーラー</span>
          </div>
        </div>
        
        {/* ゲーム情報エリア */}
        <div className="md:w-2/3">
          <Text variant="h1" className="mb-2 text-white">{gameData.title}</Text>
          <Text variant="body" className="text-lg text-orange-400 mb-4">
            🎯 {gameData.platform}
          </Text>
          <CountdownTimer releaseDate={gameData.releaseDate} />
          <Text variant="body" className="mt-4 leading-relaxed text-white">
            {gameData.description}
          </Text>
          
          {/* ゲームタグエリア */}
          <div className="mt-4">
            <Text variant="caption" className="mb-2 block text-white">🏷️ ジャンル・特徴</Text>
            <div className="flex flex-wrap gap-2">
              {gameData.tags.map((tag, index) => (
                <GameTag key={index} color={tag.color}>
                  {tag.name}
                </GameTag>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

type TabType = 'youtube' | 'reddit' | 'hatena' | 'site';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  showComparison: boolean;
  onToggleComparison: () => void;
}

/**
 * タブナビゲーションコンポーネント
 * 4つの情報源とび較表示ボタンを配置
 * デスクトップ版の横並びタブUI
 */
const TabNavigation = ({ activeTab, onTabChange, showComparison, onToggleComparison }: TabNavigationProps) => (
  <div className="border-b border-gray-200 mb-6 bg-white p-4 rounded-t-xl shadow-sm">
    <div className="flex justify-between items-center">
      {/* タブボタン群 */}
      <nav className="flex space-x-6">
        <TabButton 
          isActive={activeTab === 'youtube'} 
          onClick={() => onTabChange('youtube')}
        >
          🎥 YouTube
        </TabButton>
        <TabButton 
          isActive={activeTab === 'reddit'} 
          onClick={() => onTabChange('reddit')}
        >
          🤖 Reddit
        </TabButton>
        <TabButton 
          isActive={activeTab === 'hatena'} 
          onClick={() => onTabChange('hatena')}
        >
          📖 はてブ
        </TabButton>
        <TabButton 
          isActive={activeTab === 'site'} 
          onClick={() => onTabChange('site')}
        >
          💬 サイト内口コミ
        </TabButton>
      </nav>
      
      <div className="flex gap-2">
        {/* 比較表示切り替えボタン */}
        <Button 
          variant={showComparison ? 'primary' : 'outline'} 
          size="sm"
          onClick={onToggleComparison}
        >
          📊 比較表示
        </Button>
        
        {/* APIテストボタン */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open('/api-test', '_blank')}
        >
          🧪 APIテスト
        </Button>
      </div>
    </div>
  </div>
);

interface CommentTabsSectionProps {
  activeTab: TabType;
  showComparison: boolean;
}

/**
 * コメントタブセクション
 * 各情報源のコンテンツを表示するメインエリア
 * 通常表示と比較表示モードを切り替え可能
 */
const CommentTabsSection = ({ activeTab, showComparison }: CommentTabsSectionProps) => {
  // 各タブのコンテンツをレンダリングする関数
  const renderContent = (tab: TabType) => {
    switch (tab) {
      case 'youtube':
        return (
          <div>
            <Text variant="h3" className="mb-4">YouTube動画・コメント</Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <VideoCard 
                title="マリオカート9 新情報リーク！Switch 2で進化するレース体験"
                thumbnail=""
                views="123,456"
                publishedAt="2日前"
              />
              <VideoCard 
                title="Switch 2 マリオカート9 予想まとめ"
                thumbnail=""
                views="87,654"
                publishedAt="1週間前"
              />
            </div>
            <div className="space-y-3">
              <CommentCard 
                author="ゲーマー太郎"
                content="マリオカート9めっちゃ楽しみ！新コース期待してる"
                score={124}
                source="youtube"
              />
              <CommentCard 
                author="レーシング好き"
                content="Switch 2の性能でどこまで進化するか気になる"
                score={89}
                source="youtube"
              />
            </div>
          </div>
        );
      case 'reddit':
        return (
          <div>
            <Text variant="h3" className="mb-4">Reddit投稿・コメント</Text>
            <div className="space-y-4">
              <CommentCard 
                author="u/nintendo_fan2025"
                content="Mario Kart 9 leak suggests new anti-gravity mechanics for Switch 2"
                score={1247}
                source="reddit"
              />
              <CommentCard 
                author="u/racing_expert"
                content="Really hoping they bring back Double Dash mechanics in MK9"
                score={856}
                source="reddit"
              />
            </div>
          </div>
        );
      case 'hatena':
        return (
          <div>
            <Text variant="h3" className="mb-4">はてブ記事・コメント</Text>
            <div className="space-y-4">
              <CommentCard 
                author="game_news_jp"
                content="Nintendo Switch 2とマリオカート9の発売時期について"
                score={89}
                source="hatena"
              />
              <CommentCard 
                author="tech_watcher"
                content="Switch 2のスペック予想とゲームへの影響"
                score={67}
                source="hatena"
              />
            </div>
          </div>
        );
      case 'site':
        return (
          <div>
            <Text variant="h3" className="mb-4">サイト内口コミ</Text>
            <div className="bg-gray-50 p-4 rounded mb-4 border border-gray-200">
              <Text variant="body" className="font-medium mb-2">
                期待コメント投稿
              </Text>
              <textarea 
                className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-red-500 focus:outline-none transition-colors" 
                placeholder="このゲームへの期待を書いてください..."
                rows={3}
              />
              <Button variant="primary" size="sm" className="mt-2">
                投稿する
              </Button>
            </div>
            <div className="space-y-3">
              <CommentCard 
                author="期待ユーザー1"
                content="Switch 2でのマリオカート、グラフィック向上が楽しみです！"
                source="site"
              />
              <CommentCard 
                author="レース愛好家"
                content="新コースとキャラクター追加に期待"
                source="site"
              />
            </div>
          </div>
        );
    }
  };

  if (showComparison) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <Text variant="h2" className="mb-6">比較表示モード</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded p-4 bg-gray-50">
            {renderContent('youtube')}
          </div>
          <div className="border border-gray-200 rounded p-4 bg-gray-50">
            {renderContent('reddit')}
          </div>
          <div className="border border-gray-200 rounded p-4 bg-gray-50">
            {renderContent('hatena')}
          </div>
          <div className="border border-gray-200 rounded p-4 bg-gray-50">
            {renderContent('site')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-b-lg shadow-lg p-6 min-h-[500px] border-x border-b border-gray-200">
      {renderContent(activeTab)}
    </div>
  );
};

// ===== TEMPLATES（全体レイアウトとページ構成） =====

interface GameDetailTemplateProps {
  gameData: {
    title: string;
    platform: string;
    releaseDate: string;
    description: string;
    tags: Array<{
      name: string;
      color: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';
    }>;
  };
}

/**
 * ゲーム詳細ページテンプレート
 * 全体のレイアウトと状態管理を担当
 * Nintendo風のダークテーマデザイン
 */
const GameDetailTemplate = ({ gameData }: GameDetailTemplateProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('youtube');
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div className="min-h-screen bg-[#333c5e]">
      {/* ゲーム基本情報エリア */}
      <GameInfoSection gameData={gameData} />
      
      {/* コンテンツエリア */}
      <div className="max-w-6xl mx-auto p-6">
        {/* タブナビゲーション */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showComparison={showComparison}
          onToggleComparison={() => setShowComparison(!showComparison)}
        />
        
        {/* タブコンテンツ */}
        <CommentTabsSection
          activeTab={activeTab}
          showComparison={showComparison}
        />
      </div>
    </div>
  );
};

// ===== PAGES（実際のページコンポーネント） =====

/**
 * ゲーム詳細ページのメインコンポーネント
 * テスト用のダミーデータでマリオカート9の詳細ページを表示
 * 
 * 機能:
 * - リアルタイム発売日カウントダウン
 * - 4つの情報源タブ切り替え
 * - 比較表示モード
 * - Nintendo風ダークテーマ
 */
export default function GameDetailPage() {
  // テスト用のゲームデータ
  const gameData = {
    title: "マリオカート9",
    platform: "Nintendo Switch 2",
    releaseDate: "2025-12-31",
    description: "Nintendo Switch 2で登場予定の最新マリオカート。新コースやキャラクター、そして新要素が追加され、これまで以上に楽しいレーシングゲーム体験を提供します。Switch 2の性能を活かした美しいグラフィックと滑らかな60fpsでの動作が期待されています。",
    tags: [
      { name: "アクション", color: "red" as const },
      { name: "レーシング", color: "blue" as const },
      { name: "マルチプレイヤー", color: "green" as const },
      { name: "ファミリー", color: "orange" as const },
      { name: "オンライン対戦", color: "purple" as const },
      { name: "協力プレイ", color: "pink" as const }
    ]
  };

  return <GameDetailTemplate gameData={gameData} />;
}
