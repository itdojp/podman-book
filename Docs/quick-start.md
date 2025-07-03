# クイックスタート

このガイドでは、テンプレートを使って5分で最初の書籍を作成・公開する方法を説明します。

## 🎯 目標

このクイックスタートを完了すると、以下ができるようになります：
- テンプレートの基本構造を理解
- サンプル書籍をビルド
- GitHub Pagesで公開
- 簡単なカスタマイズ

## ⏱️ 所要時間

約5-10分（インターネット環境とPCの性能に依存）

## 📋 前提条件

- **Node.js** 16以上がインストール済み
- **Git** がインストール済み
- **GitHubアカウント** を持っている
- **基本的なコマンドライン操作** ができる

## 🚀 ステップ1: テンプレートの取得

### GitHub テンプレートから作成

1. [book-publishing-template](https://github.com/itdojp/book-publishing-template) にアクセス
2. 緑色の "Use this template" ボタンをクリック
3. "Create a new repository" を選択
4. リポジトリ名を入力（例: `my-first-book`）
5. "Create repository from template" をクリック

### ローカルにクローン

```bash
# 自分のリポジトリをクローン
git clone https://github.com/YOUR_USERNAME/my-first-book.git
cd my-first-book

# 依存関係をインストール
npm install
```

## 📝 ステップ2: 最初のビルド

### サンプル書籍のビルド

```bash
# Webサイト版をビルド
npm run build

# 開発サーバーで確認
npm run preview
```

ブラウザで http://localhost:8080 を開くと、サンプル書籍が表示されます。

### 動作確認ポイント

- ✅ トップページが表示される
- ✅ 目次が自動生成されている
- ✅ 章間のナビゲーションが動作する
- ✅ レスポンシブデザインになっている

## ⚙️ ステップ3: 基本設定

### 書籍情報の更新

`book-config.json` を編集：

```json
{
  "book": {
    "title": "私の最初の書籍",
    "subtitle": "Book Publishing Template で作成",
    "description": "テンプレートを使った書籍作成の学習記録",
    "author": {
      "name": "あなたの名前",
      "email": "your.email@example.com",
      "github": "your-github-username"
    }
  }
}
```

### 再ビルドして確認

```bash
npm run build
npm run preview
```

変更が反映されていることを確認してください。

## 📚 ステップ4: コンテンツの編集

### 最初の章を編集

`src/chapters/chapter01/index.md` を開いて編集：

```markdown
# 第1章: はじめに

この章では、Book Publishing Template を使った書籍作成について説明します。

## 1.1 このテンプレートについて

このテンプレートは、技術書や学習資料を効率的に作成・公開するためのツールです。

### 主な特徴

- **Markdown記法**: 書きやすく、読みやすい
- **自動目次生成**: 章構成が自動で整理される
- **複数フォーマット出力**: Web、PDF、EPUBに対応
- **GitHub Pages連携**: 簡単にWebサイトとして公開

## 1.2 学習目標

この書籍を通じて、以下のスキルを身につけることができます：

1. Markdownでの技術文書作成
2. Gitを使ったバージョン管理
3. GitHub Pagesでの公開方法
4. 自動化ワークフローの構築

## まとめ

この章では、テンプレートの概要と学習目標について説明しました。
次の章では、具体的な使用方法について詳しく見ていきます。
```

### 新しい章を追加

```bash
# 新しい章のディレクトリを作成
mkdir -p src/chapters/chapter02

# 章のファイルを作成
cat > src/chapters/chapter02/index.md << 'EOF'
# 第2章: 実践的な使い方

この章では、テンプレートの実践的な活用方法について説明します。

## 2.1 執筆ワークフロー

### 基本的な執筆の流れ

1. **構想・設計**: 書籍の全体構成を考える
2. **環境準備**: 開発環境とリポジトリを設定
3. **執筆**: Markdownで内容を書く
4. **プレビュー**: ローカルで確認しながら調整
5. **公開**: GitHub Pagesにデプロイ

### ディレクトリ構造

```
src/
├── introduction/     # はじめに
├── chapters/        # 本章
│   ├── chapter01/
│   ├── chapter02/
│   └── ...
├── appendices/      # 付録
└── afterword/       # あとがき
```

## 2.2 効率的な執筆のコツ

### Markdownの活用

- **見出し構造**: `#`, `##`, `###` で階層を明確に
- **コードブロック**: シンタックスハイライト対応
- **リンク**: 章間の相互参照
- **表と図**: 視覚的な説明

### プレビュー機能の活用

```bash
# リアルタイムプレビュー
npm run preview
```

ファイルを保存すると自動的にページが更新されます。

## まとめ

効率的な執筆には、ツールの特性を理解し、ワークフローを確立することが重要です。
EOF
```

## 🌐 ステップ5: GitHub Pages で公開

### デプロイ設定

`package.json` の設定を確認：

```json
{
  "scripts": {
    "deploy": "bash scripts/deploy.sh"
  }
}
```

### GitHub Pages の有効化

1. GitHubリポジトリの "Settings" タブを開く
2. 左メニューから "Pages" を選択
3. Source を "Deploy from a branch" に設定
4. Branch を "gh-pages" に設定
5. "Save" をクリック

### デプロイ実行

```bash
# 変更をコミット
git add .
git commit -m "feat: Update sample content"
git push origin main

# デプロイ実行
npm run deploy
```

### 公開確認

数分後に `https://YOUR_USERNAME.github.io/my-first-book/` でアクセスできます。

## 🎨 ステップ6: 簡単なカスタマイズ

### 色とスタイルの変更

`_layouts/default.html` の CSS部分を編集：

```css
/* カスタム色の定義 */
:root {
  --primary-color: #3498db;     /* メインカラー */
  --secondary-color: #2c3e50;   /* セカンダリカラー */
  --accent-color: #e74c3c;      /* アクセントカラー */
}

.header h1 {
  color: var(--primary-color);
}

.navigation a {
  color: var(--secondary-color);
}

.navigation a:hover {
  color: var(--accent-color);
}
```

### ロゴの追加

`assets/images/` ディレクトリにロゴ画像を追加し、`_layouts/default.html` で使用：

```html
<div class="header">
    <img src="{{ '/assets/images/logo.png' | relative_url }}" alt="Logo" style="height: 40px;">
    <h1>{{ site.title }}</h1>
</div>
```

## 📊 ステップ7: 複数フォーマット出力（オプション）

### PDF出力

```bash
# PDF生成に必要なツールの確認
pandoc --version
xelatex --version

# PDF生成
npm run build:pdf
```

出力ファイル: `output/私の最初の書籍.pdf`

### EPUB出力

```bash
# EPUB生成
npm run build:epub
```

出力ファイル: `output/私の最初の書籍.epub`

### 全フォーマット一括出力

```bash
npm run build:all
```

## ✅ 完了チェックリスト

- [ ] テンプレートをクローンできた
- [ ] ローカルでビルド・プレビューできた
- [ ] 書籍情報を更新できた
- [ ] サンプル章を編集できた
- [ ] GitHub Pagesで公開できた
- [ ] 基本的なカスタマイズができた

## 🎉 次のステップ

クイックスタートを完了したら、以下に進んでください：

### 学習を深める
- **[コンテンツ作成ガイド](writing-guide.md)** - より高度な執筆技法
- **[設定リファレンス](configuration.md)** - 詳細なカスタマイズ
- **[ベストプラクティス](best-practices.md)** - 効率的な開発手法

### 実際のプロジェクトで活用
- **[チーム開発](collaboration.md)** - 複数人での執筆管理
- **[自動化](automation.md)** - CI/CDでの自動公開
- **[パフォーマンス最適化](performance.md)** - 大規模プロジェクトでの最適化

### コミュニティに参加
- **[GitHub Discussions](https://github.com/itdojp/book-publishing-template/discussions)** - 質問や情報交換
- **[Issues](https://github.com/itdojp/book-publishing-template/issues)** - バグ報告や機能要望
- **[Contributing](../CONTRIBUTING.md)** - プロジェクトへの貢献

## 🆘 困ったときは

### よくある問題
- **ビルドエラー**: [トラブルシューティング](../TROUBLESHOOTING.md) を確認
- **デプロイ失敗**: GitHub Actions のログを確認
- **表示が崩れる**: ブラウザのキャッシュを削除

### サポート
- **GitHub Issues**: 技術的な問題
- **GitHub Discussions**: 使用方法の質問
- **Email**: knowledge@itdo.jp（緊急時のみ）

---

**🎊 おめでとうございます！**

これで Book Publishing Template の基本的な使い方をマスターしました。
あなただけの素晴らしい書籍を作成してください！