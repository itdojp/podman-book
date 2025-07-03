# 付録A: 設定リファレンス

Book Publishing Template v3.0の詳細な設定オプションと機能リファレンスです。

## A.1 book-config.json

### 基本設定
```json
{
  "book": {
    "title": "書籍タイトル",
    "subtitle": "サブタイトル（オプション）",
    "description": "書籍の説明文",
    "author": {
      "name": "著者名",
      "email": "author@example.com",
      "url": "https://author-website.com"
    },
    "version": "1.0.0",
    "language": "ja",
    "isbn": "978-4-XXXX-XXXX-X"
  }
}
```

### コンテンツセクション
```json
{
  "contentSections": [
    {
      "name": "preface",
      "directory": "preface",
      "enabled": true,
      "order": 0,
      "title": "まえがき"
    },
    {
      "name": "introduction", 
      "directory": "introduction",
      "enabled": true,
      "order": 1,
      "title": "はじめに"
    },
    {
      "name": "chapters",
      "directory": "chapters", 
      "enabled": true,
      "order": 2,
      "title": "章"
    },
    {
      "name": "appendices",
      "directory": "appendices",
      "enabled": true, 
      "order": 3,
      "title": "付録"
    },
    {
      "name": "afterword",
      "directory": "afterword",
      "enabled": false,
      "order": 4,
      "title": "あとがき"
    }
  ]
}
```

### ビルド設定
```json
{
  "build": {
    "outputDirectory": "docs",
    "enableV3DesignSystem": true,
    "enableNavigation": true,
    "enableSyntaxHighlighting": true,
    "enableSearchIndex": false,
    "enablePWA": false,
    "minifyCSS": false,
    "minifyJS": false
  }
}
```

## A.2 CSS変数リファレンス

### カラーシステム
```css
:root {
  /* 背景色 */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8f9fa;
  --color-bg-tertiary: #e9ecef;
  
  /* テキスト色 */
  --color-text-primary: #212529;
  --color-text-secondary: #6c757d;
  --color-text-muted: #adb5bd;
  
  /* ボーダー */
  --color-border: #dee2e6;
  --color-border-light: #f1f3f4;
  
  /* ブランドカラー */
  --color-primary: #0366d6;
  --color-primary-hover: #0256cc;
  
  /* セマンティックカラー */
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-danger: #dc3545;
  --color-info: #17a2b8;
  
  /* コードカラー */
  --color-code-bg: #f6f8fa;
  --color-code-border: #e1e4e8;
  --color-code-text: #24292e;
}
```

### タイポグラフィ
```css
:root {
  /* フォントファミリー */
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-family-mono: 'SFMono-Regular', Consolas, monospace;
  --font-family-heading: var(--font-family-base);
  
  /* フォントサイズ */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  
  /* 行間 */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

### スペーシング
```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### レイアウト
```css
:root {
  --sidebar-width: 280px;
  --sidebar-width-collapsed: 60px;
  --content-max-width: 800px;
  --header-height: 60px;
}
```

## A.3 JavaScript API

### ThemeManager
```javascript
// テーマの取得
const currentTheme = window.themeManager.getCurrentTheme();

// テーマの設定
window.themeManager.setTheme('dark');

// テーマ変更イベントの監視
window.addEventListener('themechange', (event) => {
  console.log('Theme changed to:', event.detail.theme);
});
```

### SidebarManager
```javascript
// サイドバー状態の取得
const { isOpen, isMobile } = window.sidebarManager.getSidebarState();

// サイドバーの開閉
window.sidebarManager.open();
window.sidebarManager.close();
window.sidebarManager.toggle();
```

### CodeCopyManager
```javascript
// 手動でコピー機能を初期化
new CodeCopyManager();

// カスタムコピーハンドラ
document.addEventListener('codecopy', (event) => {
  console.log('Code copied:', event.detail.code);
});
```

## A.4 Liquid テンプレート変数

### サイトレベル変数
```liquid
{{ site.title }}                    <!-- サイトタイトル -->
{{ site.description }}              <!-- サイト説明 -->
{{ site.author }}                   <!-- 著者情報 -->
{{ site.baseurl }}                  <!-- ベースURL -->
{{ site.repository.github }}       <!-- GitHubリポジトリURL -->
```

### ページレベル変数
```liquid
{{ page.title }}                    <!-- ページタイトル -->
{{ page.description }}              <!-- ページ説明 -->
{{ page.url }}                      <!-- ページURL -->
{{ page.path }}                     <!-- ソースファイルパス -->
{{ page.lang }}                     <!-- ページ言語 -->
```

### ナビゲーションデータ
```liquid
{% for chapter in site.data.navigation.chapters %}
  <a href="{{ site.baseurl }}{{ chapter.path }}">
    {{ chapter.title }}
  </a>
{% endfor %}

{% for appendix in site.data.navigation.appendices %}
  <a href="{{ site.baseurl }}{{ appendix.path }}">
    {{ appendix.title }}
  </a>
{% endfor %}
```

## A.5 コマンドラインオプション

### ビルドコマンド
```bash
# 標準ビルド
npm run build

# 開発モード（ファイル監視）
npm run dev

# プレビューサーバー起動
npm run preview

# 本番用ビルド（最適化あり）
npm run build:production

# クリーンビルド（キャッシュクリア）
npm run build:clean
```

### カスタムオプション
```bash
# 出力ディレクトリ指定
node scripts/build-simple.js --output=public

# デバッグモード
node scripts/build-simple.js --debug

# ナビゲーション無効
node scripts/build-simple.js --no-navigation

# v2互換モード
node scripts/build-simple.js --legacy
```

## A.6 ファイル構造

### テンプレートファイル
```
templates/
├── styles/
│   ├── main.css                    # メインCSS
│   └── syntax-highlighting.css    # シンタックスハイライト
├── layouts/
│   └── book.html                   # 書籍レイアウト
├── includes/
│   ├── sidebar-nav.html            # サイドバーナビゲーション
│   ├── breadcrumb.html             # パンくずリスト
│   └── page-navigation.html        # ページナビゲーション
├── js/
│   ├── theme.js                    # テーマ管理
│   ├── sidebar.js                  # サイドバー制御
│   └── code-copy.js                # コードコピー機能
└── data/
    └── navigation.yml              # ナビゲーションデータ
```

### ビルド出力
```
docs/
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   └── syntax-highlighting.css
│   └── js/
│       ├── theme.js
│       ├── sidebar.js
│       └── code-copy.js
├── _layouts/
│   └── book.html
├── _includes/
│   ├── sidebar-nav.html
│   ├── breadcrumb.html
│   └── page-navigation.html
├── _data/
│   └── navigation.yml
├── _config.yml
└── index.md
```

## A.7 トラブルシューティング

### 一般的な問題

#### ビルドエラー
```bash
# Node.jsバージョン確認
node --version  # v14.0.0以上推奨

# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# キャッシュクリア
npm run build:clean
```

#### CSS/JSが読み込まれない
1. `_config.yml` の `baseurl` 設定を確認
2. ファイルパスの大文字小文字を確認
3. ブラウザキャッシュをクリア

#### ナビゲーションが表示されない
1. `src/` ディレクトリ構造を確認
2. Markdownファイルに `# タイトル` があることを確認
3. `_data/navigation.yml` が生成されているかチェック

### デバッグ方法
```javascript
// デバッグログの有効化
localStorage.setItem('debug', 'true');

// テーママネージャーの状態確認
console.log(window.themeManager);

// サイドバーマネージャーの状態確認  
console.log(window.sidebarManager.getSidebarState());
```

---

この付録では、v3.0テンプレートの全機能と設定オプションを網羅しました。詳細な実装例や高度な用途については、公式ドキュメントも併せてご確認ください。