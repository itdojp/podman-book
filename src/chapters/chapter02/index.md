# 第2章: 実装方法とカスタマイズ

前章で学んだ基本概念を実際のプロジェクトに適用する方法を説明します。

## 2.1 セットアップ手順

### 1. プロジェクト初期化
```bash
# リポジトリをクローン
git clone https://github.com/your-org/book-publishing-template2.git
cd book-publishing-template2

# 依存関係をインストール
npm install

# サンプルビルドを実行
npm run build
```

### 2. 設定ファイルの編集
`book-config.json` を編集して、書籍の基本情報を設定：

```json
{
  "book": {
    "title": "あなたの書籍タイトル",
    "description": "書籍の説明文",
    "author": {
      "name": "著者名",
      "email": "author@example.com"
    }
  }
}
```

## 2.2 コンテンツ作成

### ディレクトリ構造
```
src/
├── introduction/
│   └── index.md
├── chapters/
│   ├── chapter01/
│   │   └── index.md
│   └── chapter02/
│       └── index.md
└── appendices/
    └── appendix-a/
        └── index.md
```

### Markdownの書き方
```markdown
# 章タイトル

## セクション

### サブセクション

本文テキストはここに書きます。**強調**や*斜体*も使用できます。

- リスト項目1
- リスト項目2

1. 順序付きリスト
2. 項目2

> 引用文はこのように書きます。

\`\`\`javascript
// コードブロックの例
function example() {
  console.log('Hello, World!');
}
\`\`\`
```

## 2.3 テーマカスタマイズ

### カラーパレットの変更
`templates/styles/main.css` でカスタムカラーを定義：

```css
:root {
  /* ブランドカラーをカスタマイズ */
  --color-primary: #your-brand-color;
  --color-primary-hover: #darker-brand-color;
  
  /* カスタムカラーを追加 */
  --color-accent: #ff6b6b;
  --color-success: #51cf66;
  --color-warning: #ffd43b;
}
```

### フォントの変更
```css
:root {
  --font-family-base: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
  --font-family-mono: 'Fira Code', 'Consolas', monospace;
}
```

## 2.4 ナビゲーションカスタマイズ

### サイドバーの調整
`templates/includes/sidebar-nav.html` を編集：

```html
<!-- カスタムセクションを追加 -->
<div class="nav-section">
  <h3 class="nav-section-title">参考資料</h3>
  <ul class="nav-list">
    <li class="nav-item">
      <a href="/references/" class="nav-link">
        <span class="nav-title">参考文献</span>
      </a>
    </li>
  </ul>
</div>
```

### ページナビゲーションの調整
```html
<!-- カスタムボタンを追加 -->
<div class="page-nav-item page-nav-custom">
  <a href="/feedback/" class="nav-card">
    <div class="nav-direction">📝 フィードバック</div>
  </a>
</div>
```

## 2.5 JavaScript機能の拡張

### カスタムテーマの追加
```javascript
// templates/js/theme.js を拡張
class ExtendedThemeManager extends ThemeManager {
  constructor() {
    super();
    this.availableThemes = ['light', 'dark', 'sepia'];
  }
  
  setTheme(theme) {
    if (!this.availableThemes.includes(theme)) {
      theme = 'light';
    }
    super.setTheme(theme);
  }
}
```

### 検索機能の追加
```javascript
// templates/js/search.js (新規作成)
class SearchManager {
  constructor() {
    this.searchIndex = [];
    this.init();
  }
  
  async init() {
    await this.buildSearchIndex();
    this.setupSearchUI();
  }
  
  async buildSearchIndex() {
    // 全ページを読み込んで検索インデックスを構築
    const pages = await this.fetchAllPages();
    this.searchIndex = pages.map(page => ({
      title: page.title,
      content: page.content,
      url: page.url
    }));
  }
}
```

## 2.6 ビルドプロセスのカスタマイズ

### カスタムビルドステップの追加
`scripts/build-simple.js` を拡張：

```javascript
class CustomBuild extends SimpleBuild {
  async build() {
    // 標準ビルドを実行
    await super.build();
    
    // カスタムステップを追加
    await this.generateSitemap();
    await this.optimizeImages();
    await this.generateRSS();
  }
  
  async generateSitemap() {
    // サイトマップ生成ロジック
  }
}
```

## 2.7 デプロイメント

### GitHub Pages
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

### Netlify
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "docs"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 404
```

## 2.8 パフォーマンス最適化

### 画像最適化
```javascript
// 画像の遅延読み込み
const images = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      imageObserver.unobserve(img);
    }
  });
});

images.forEach(img => imageObserver.observe(img));
```

### CSS最適化
```css
/* クリティカルCSSの分離 */
.critical {
  /* Above-the-fold content styles */
}

/* 非クリティカルCSSは別ファイルに */
@import url('non-critical.css') print;
```

## まとめ

この章では、v3.0テンプレートの実装とカスタマイズ方法を学びました：

- ✅ プロジェクトセットアップ
- ✅ コンテンツ作成方法
- ✅ テーマカスタマイズ
- ✅ ナビゲーション調整
- ✅ JavaScript機能拡張
- ✅ ビルドプロセス最適化
- ✅ デプロイメント設定

次に付録で、より詳細な設定オプションやトラブルシューティングを確認しましょう。