# 第1章: v3.0デザインシステムの基本概念

本章では、Book Publishing Template v3.0で導入された新しいデザインシステムの基本概念について説明します。

## 1.1 設計思想

### ユーザー中心設計
v3.0では、読者の体験を最優先に考えた設計を採用しています：

- **可読性**: 75文字幅、1.5行間で最適な読みやすさ
- **ナビゲーション**: 迷子にならない直感的な移動
- **アクセシビリティ**: すべての人が利用できる設計

### モバイルファースト
```css
/* レスポンシブデザインの例 */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}
```

## 1.2 CSS変数システム

### テーマ対応
```css
:root {
  /* ライトテーマ */
  --color-bg-primary: #ffffff;
  --color-text-primary: #212529;
  --color-primary: #0366d6;
}

[data-theme="dark"] {
  /* ダークテーマ */
  --color-bg-primary: #0d1117;
  --color-text-primary: #f0f6fc;
  --color-primary: #58a6ff;
}
```

### スペーシングシステム
```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-4: 1rem;     /* 16px */
  --space-8: 2rem;     /* 32px */
}
```

## 1.3 タイポグラフィ階層

### フォントサイズ
```css
:root {
  --font-size-xs: 0.75rem;   /* 12px - キャプション */
  --font-size-sm: 0.875rem;  /* 14px - 小さなテキスト */
  --font-size-base: 1rem;    /* 16px - 本文 */
  --font-size-lg: 1.125rem;  /* 18px - リード文 */
  --font-size-xl: 1.25rem;   /* 20px - 小見出し */
  --font-size-2xl: 1.5rem;   /* 24px - セクション */
  --font-size-3xl: 1.875rem; /* 30px - 章タイトル */
  --font-size-4xl: 2.25rem;  /* 36px - メインタイトル */
}
```

## 1.4 レイアウトシステム

### Grid構造
```html
<div class="book-layout">
  <header class="book-header">...</header>
  <aside class="book-sidebar">...</aside>
  <main class="book-main">...</main>
</div>
```

### Flexbox活用
```css
.page-nav {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--space-4);
  align-items: stretch;
}
```

## 1.5 コンポーネント設計

### 再利用可能な設計
各UIコンポーネントは独立性を保ちながら、一貫したデザイン言語を使用：

1. **ボタン**: 統一されたスタイルとホバーエフェクト
2. **カード**: コンテンツをグループ化
3. **ナビゲーション**: 階層的な情報構造を表現

### アトミックデザイン
```
Atoms (原子)
├── Button
├── Input  
└── Text

Molecules (分子)
├── SearchBox
├── NavigationItem
└── CodeBlock

Organisms (生物)
├── Header
├── Sidebar
└── PageNavigation
```

## 1.6 アクセシビリティ

### WAI-ARIA実装
```html
<nav aria-label="Main navigation" role="navigation">
  <ul>
    <li><a href="/" aria-current="page">ホーム</a></li>
    <li><a href="/chapter01/">第1章</a></li>
  </ul>
</nav>
```

### キーボードナビゲーション
- **Tab**: フォーカス移動
- **Enter/Space**: アクション実行
- **Escape**: モーダル/メニュー閉じる
- **矢印キー**: リスト内移動

## まとめ

この章では、v3.0デザインシステムの基本概念を学びました：

- ✅ ユーザー中心の設計思想
- ✅ CSS変数による統一されたテーマシステム
- ✅ 階層的なタイポグラフィ
- ✅ 柔軟なレイアウトシステム
- ✅ アクセシブルなコンポーネント設計

次章では、これらの概念を実際のプロジェクトでどのように実装するかを学習します。