# デプロイメントガイド

このドキュメントでは、v2.0の簡素化されたデプロイプロセスについて詳しく説明します。

## 概要

v2.0では単一リポジトリ構成を採用し、GitHub Pagesへのデプロイが大幅に簡素化されました。トークン設定は不要で、GitHub Actionsまたは手動でのデプロイが可能です。

## 前提条件

1. **リポジトリのセットアップ**
   - 単一リポジトリ: `yourusername/your-book-name`
   - プライベートまたはパブリックリポジトリ（どちらでも可）

2. **必要な権限**
   - リポジトリへの Write アクセス（通常のGitHub認証）
   - トークン設定は不要

3. **GitHub Pages の設定**
   - リポジトリで GitHub Pages を有効化
   - mainブランチの /docs フォルダからデプロイ

## 初期セットアップ

### 新規プロジェクトでの準備

#### 1. プロジェクトの作成

```bash
# テンプレートをクローン
git clone https://github.com/itdojp/book-publishing-template2.git my-book
cd my-book

# セットアップウィザードを実行
node easy-setup.js
```

#### 2. GitHub Pages の有効化

1. GitHubでリポジトリを開く
2. Settings → Pages に移動
3. Source を設定：
   - **手動デプロイの場合**: Deploy from a branch → main → /docs
   - **自動デプロイの場合**: GitHub Actions

## デプロイ方法

### Option 1: 手動デプロイ（シンプル）

```bash
# ビルド
npm run build

# コミット＆プッシュ
git add .
git commit -m "Update book content"
git push origin main
```

GitHub Pagesが自動的に /docs フォルダの内容を公開します。

### Option 2: GitHub Actions による自動デプロイ

`.github/workflows/build.yml` が自動的に作成されています。
mainブランチへのプッシュ時に自動的にビルド・デプロイされます。

## トラブルシューティング

### ページが表示されない

1. Settings → Pages で設定を確認
2. ビルドが成功しているか確認（Actions タブ）
3. URLが正しいか確認: `https://[username].github.io/[repo-name]/`

### ビルドエラー

```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

## セキュリティ

v2.0では、プライベートコンテンツの自動フィルタリング機能により：
- ドラフトファイルは自動的に除外
- プライベートコメントは削除
- 安全な公開が保証されます

詳細は [REPOSITORY-ACCESS-GUIDE.md](../../REPOSITORY-ACCESS-GUIDE.md) を参照してください。