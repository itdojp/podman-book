# 複数出力フォーマット対応

このテンプレートは、書籍を複数のフォーマットで出力することができます。

## 対応フォーマット

### 📱 Web (HTML)
- **用途**: GitHub Pages、Webサイト公開
- **特徴**: レスポンシブデザイン、検索可能、リンク対応
- **出力**: HTMLファイル群
- **コマンド**: `npm run build`

### 📄 PDF
- **用途**: 印刷、配布、アーカイブ
- **特徴**: ページネーション、目次、表紙
- **出力**: 単一PDFファイル
- **コマンド**: `npm run build:pdf`

### 📖 EPUB
- **用途**: 電子書籍リーダー、モバイル端末
- **特徴**: リフロー可能、フォントサイズ調整可能
- **出力**: .epubファイル
- **コマンド**: `npm run build:epub`

## クイックスタート

### 全フォーマットを一括ビルド

```bash
npm run build:all
```

### 個別フォーマットのビルド

```bash
# Webサイト版（HTML）
npm run build

# PDF版
npm run build:pdf

# EPUB版
npm run build:epub

# 複数フォーマットを指定
npm run build:formats web pdf
```

## 必要な依存関係

### PDF生成
- **Pandoc**: ドキュメント変換エンジン
- **XeLaTeX**: PDF生成エンジン
- **フォント**: CJK対応フォント

#### インストール手順

**macOS (Homebrew):**
```bash
brew install pandoc
brew install --cask mactex
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install pandoc texlive-xetex texlive-fonts-recommended texlive-fonts-extra
```

**Windows:**
- [Pandoc公式サイト](https://pandoc.org/installing.html)からインストーラーをダウンロード
- [TeX Live](https://www.tug.org/texlive/)をインストール

### EPUB生成
- **Pandoc**: 必須
- **epubcheck**: 検証ツール（オプション）

```bash
# epubcheckのインストール（オプション）
# Java 8以上が必要
wget https://github.com/w3c/epubcheck/releases/download/v4.2.6/epubcheck-4.2.6.zip
unzip epubcheck-4.2.6.zip
sudo ln -s /path/to/epubcheck-4.2.6/epubcheck.jar /usr/local/bin/epubcheck
```

## 設定オプション

### book-config.json での設定

```json
{
  "book": {
    "title": "書籍タイトル",
    "subtitle": "サブタイトル",
    "author": {
      "name": "著者名",
      "email": "author@example.com"
    },
    "description": "書籍の説明"
  },
  "pdf": {
    "engine": "pandoc",
    "paperSize": "A4",
    "margin": "2cm",
    "fontSize": "11pt",
    "fontFamily": "DejaVu Sans",
    "includeTableOfContents": true,
    "includeCoverPage": true
  },
  "epub": {
    "engine": "pandoc",
    "coverImage": "assets/images/cover.jpg",
    "includeTableOfContents": true,
    "chapterLevel": 1,
    "language": "ja",
    "publisher": "出版社名",
    "rights": "© 2024 著者名. All rights reserved."
  }
}
```

### PDF設定詳細

| オプション | 説明 | デフォルト値 | 可能な値 |
|-----------|------|-------------|----------|
| `engine` | PDF生成エンジン | `pandoc` | `pandoc`, `puppeteer` |
| `paperSize` | 用紙サイズ | `A4` | `A4`, `A5`, `Letter`, `Legal` |
| `margin` | 余白 | `2cm` | CSS形式（`2cm`, `1in`など） |
| `fontSize` | フォントサイズ | `11pt` | `10pt`, `11pt`, `12pt`など |
| `fontFamily` | フォントファミリー | `DejaVu Sans` | システムフォント名 |
| `includeTableOfContents` | 目次を含める | `true` | `true`, `false` |
| `includeCoverPage` | 表紙を含める | `true` | `true`, `false` |

### EPUB設定詳細

| オプション | 説明 | デフォルト値 | 可能な値 |
|-----------|------|-------------|----------|
| `engine` | EPUB生成エンジン | `pandoc` | `pandoc` |
| `coverImage` | 表紙画像パス | `null` | 画像ファイルパス |
| `includeTableOfContents` | 目次を含める | `true` | `true`, `false` |
| `chapterLevel` | 章のレベル | `1` | `1`, `2`, `3` |
| `language` | 言語コード | `ja` | `ja`, `en`, `zh`など |
| `publisher` | 出版社 | `""` | 任意の文字列 |
| `rights` | 著作権情報 | `""` | 任意の文字列 |

## ビルドプロセス

### Webビルド
1. Markdownファイルの処理
2. 目次の自動生成
3. アセットのコピー
4. HTMLテンプレートの適用

### PDFビルド
1. Markdownファイルの結合
2. LaTeX形式への変換
3. XeLaTeXでPDF生成
4. 表紙と目次の追加

### EPUBビルド
1. 章ごとのファイル分割
2. メタデータの設定
3. アセットの埋め込み
4. EPUB形式での出力

## カスタマイゼーション

### PDFスタイリング

LaTeX テンプレートをカスタマイズする場合：

```latex
% custom-template.tex
\documentclass[$fontsize$,a4paper]{book}
\usepackage{xeCJK}
\setCJKmainfont{Noto Sans CJK JP}

% カスタムスタイル
\usepackage{fancyhdr}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[LE,RO]{\thepage}
\fancyhead[LO]{\leftmark}
\fancyhead[RE]{\rightmark}

$body$
```

使用方法：
```bash
pandoc input.md -o output.pdf --template=custom-template.tex
```

### EPUBスタイリング

CSSファイルでスタイルをカスタマイズ：

```css
/* epub-style.css */
body {
    font-family: "Georgia", serif;
    line-height: 1.6;
    margin: 1em;
}

h1, h2, h3 {
    color: #2c3e50;
    margin-top: 2em;
}

code {
    background-color: #f8f9fa;
    padding: 2px 4px;
    border-radius: 3px;
}
```

## トラブルシューティング

### PDF生成エラー

**エラー: `pandoc: xelatex not found`**
```bash
# XeLaTeXのインストール
sudo apt-get install texlive-xetex
```

**エラー: `Font not found`**
```bash
# CJKフォントのインストール
sudo apt-get install fonts-noto-cjk
```

**文字化け問題:**
- `book-config.json`でフォントファミリーを変更
- システムにインストールされたフォントを確認

### EPUB生成エラー

**エラー: `Failed to create EPUB`**
- ファイルパスに日本語が含まれていないか確認
- 画像ファイルのパスが正しいか確認

**検証エラー:**
```bash
# EPUBの検証
epubcheck output.epub
```

### メモリ不足エラー

大きなファイルの処理時：
```bash
# Node.jsメモリ制限の増加
node --max-old-space-size=4096 scripts/build-pdf.js
```

## GitHub Actions での自動化

`.github/workflows/build-all-formats.yml`:

```yaml
name: Build All Formats

on:
  push:
    branches: [ main ]
  release:
    types: [ published ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Pandoc and TeXLive
      run: |
        sudo apt-get update
        sudo apt-get install -y pandoc texlive-xetex texlive-fonts-recommended texlive-fonts-extra fonts-noto-cjk
    
    - name: Build all formats
      run: npm run build:all
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: book-outputs
        path: |
          public/
          output/
```

## 最適化のヒント

### ファイルサイズ削減
- 画像の最適化（WebP形式の使用）
- 不要なアセットの除外
- 圧縮オプションの活用

### ビルド速度向上
- インクリメンタルビルドの活用
- 並列処理の利用
- キャッシュの活用

### 品質向上
- 自動テストの導入
- リント設定の最適化
- プレビュー機能の活用

## よくある質問

**Q: 数式を含む文書はどうすればよいですか？**
A: LaTeX記法またはMathJaxを使用してください。PDF出力では自動的に処理されます。

**Q: カスタムフォントを使用できますか？**
A: はい。システムにインストールされたフォントを`fontFamily`で指定できます。

**Q: 大量の画像がある場合の注意点は？**
A: 画像の最適化とパス設定に注意してください。相対パスの使用を推奨します。

**Q: 商用利用は可能ですか？**
A: テンプレート自体はMITライセンスです。生成された書籍の利用は著者の判断によります。

---

詳細な設定オプションやカスタマイズ方法については、各スクリプトのソースコードを参照してください。