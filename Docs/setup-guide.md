# 📚 Book Publishing Template セットアップガイド

このガイドでは、Book Publishing Templateを使用して書籍プロジェクトをセットアップする手順を詳しく説明します。

## 目次

1. [はじめに](#はじめに)
2. [前提条件](#前提条件)
3. [クイックスタート](#クイックスタート)
4. [詳細セットアップ](#詳細セットアップ)
5. [設定のカスタマイズ](#設定のカスタマイズ)
6. [トラブルシューティング](#トラブルシューティング)

## はじめに

Book Publishing Template v2.0は、GitHubを使用した技術書籍の執筆と公開を支援する簡素化されたシステムです。以下の特徴があります：

- **単一リポジトリシステム**: 1つのリポジトリで執筆から公開まで完結
- **自動ビルド**: Markdownファイルから美しいWebサイトを自動生成
- **プライバシー保護**: TODOコメントや下書きを自動的に除外
- **GitHub Pages対応**: 無料でホスティング可能、トークン不要

## 前提条件

以下のツールがインストールされていることを確認してください：

- **Node.js** (バージョン18以上推奨)
- **Git** (基本操作のみ)
- **GitHubアカウント**

```bash
# バージョン確認
git --version
node --version
npm --version
```

## クイックスタート

### 1. テンプレートをクローン

```bash
# テンプレートをクローン
git clone https://github.com/itdojp/book-publishing-template2.git my-book
cd my-book
```

### 2. 簡単セットアップ

```bash
# セットアップウィザードを実行
node easy-setup.js
```

ウィザードが以下をガイドします：
- 書籍のタイトル入力
- 著者情報の設定
- GitHubリポジトリの作成
- 必要なファイルの自動生成

### 3. GitHub Pages の設定

1. GitHubでリポジトリを開く
2. Settings → Pages に移動
3. Sourceを設定：
   - Deploy from a branch
   - Branch: main / docs
4. Saveをクリック

### 4. 初回ビルドとデプロイ

```bash
# ビルド
npm run build

# コミット＆プッシュ
git add .
git commit -m "Initial book setup"
git push origin main
```

数分後、`https://[username].github.io/[repo-name]/` で書籍が公開されます！

プライベートリポジトリで：

1. Settings → Secrets and variables → Actions
2. 「New repository secret」をクリック
3. Name: `DEPLOY_TOKEN`
4. Value: 個人アクセストークンを入力
5. 「Add secret」をクリック

個人アクセストークンの作成：
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 「Generate new token」をクリック
3. Note: `Book deployment`
4. Expiration: 必要に応じて設定
5. スコープ: `repo`にチェック
6. 「Generate token」をクリック
7. トークンをコピー（一度しか表示されません）

</details>

#### ローカル開発用設定

```bash
# 環境変数を設定
export PUBLIC_REPO_URL="https://github.com/YOUR_USERNAME/my-book-public.git"
export GITHUB_TOKEN="your-personal-access-token"
# または
export DEPLOY_TOKEN="your-personal-access-token"
```

### 5. 最初のビルドとデプロイ

```bash
# コンテンツをビルド
npm run build

# ローカルでプレビュー
npm run preview
# ブラウザで http://localhost:8080 を開く

# 公開リポジトリにデプロイ
npm run deploy
```

### 6. GitHub Pagesの有効化

公開リポジトリで：

1. Settings → Pages
2. Source: 「Deploy from a branch」を選択
3. Branch: `gh-pages` / `/ (root)`
4. 「Save」をクリック

数分後、`https://YOUR_USERNAME.github.io/my-book-public/`でアクセス可能になります。

## 詳細セットアップ

### ディレクトリ構造

```
my-book-private/
├── src/                    # 原稿ファイル
│   ├── introduction/       # はじめに
│   ├── chapters/          # 各章
│   │   ├── chapter01/
│   │   │   ├── index.md   # 公開用
│   │   │   └── draft.md   # 下書き（非公開）
│   │   └── chapter02/
│   ├── tutorials/         # チュートリアル
│   ├── appendices/        # 付録
│   └── afterword/         # あとがき
├── assets/                # 画像などの素材
│   └── images/
├── scripts/               # ビルドスクリプト
├── public/                # ビルド出力（自動生成）
├── _config.yml           # Jekyll設定
├── _layouts/             # レイアウトテンプレート
├── book-config.json      # 書籍設定
└── package.json          # プロジェクト設定
```

### 章の追加

新しい章を追加する場合：

```bash
# 新しい章のディレクトリを作成
mkdir -p src/chapters/chapter03

# index.mdを作成
cat > src/chapters/chapter03/index.md << 'EOF'
# 第3章 タイトル

## 3.1 セクション1

本文をここに記述...

## 3.2 セクション2

本文をここに記述...
EOF
```

### プライベートコンテンツの管理

以下のコンテンツは自動的に公開版から除外されます：

1. **ファイル名によるフィルタリング**:
   - `draft.md`
   - `notes.md`
   - `private.md`
   - `*.tmp`

2. **コメントによるフィルタリング**:
   ```markdown
   公開される内容

   <!-- TODO: ここは公開されません -->
   <!-- PRIVATE: 個人的なメモ -->
   <!-- FIXME: 修正が必要 -->
   ```

### 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `PUBLIC_REPO_URL` | 公開リポジトリのURL | - |
| `DEPLOY_BRANCH` | デプロイ先ブランチ | `gh-pages` |
| `BUILD_DIR` | ビルド出力ディレクトリ | `public` |
| `GIT_USER_EMAIL` | Gitコミット用メール | `actions@github.com` |
| `GIT_USER_NAME` | Gitコミット用名前 | `GitHub Actions` |

## 設定のカスタマイズ

### book-config.json

```json
{
  "contentSections": [
    {
      "name": "chapters",
      "title": "本章",
      "directory": "chapters",
      "enabled": true,
      "order": 2,
      "numbering": true
    }
  ],
  "tableOfContents": {
    "enabled": true,
    "title": "目次",
    "maxDepth": 3
  },
  "excludePatterns": [
    "draft.md",
    "private.md"
  ]
}
```

### _config.yml (Jekyll設定)

```yaml
title: あなたの書籍タイトル
description: 書籍の説明
author: 著者名
baseurl: "/my-book-public"
url: "https://YOUR_USERNAME.github.io"

# テーマの選択
remote_theme: pages-themes/minimal@v0.2.0
```

## トラブルシューティング

### よくある問題と解決方法

#### ビルドが失敗する

```bash
# キャッシュをクリア
npm run clean

# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# 再度ビルド
npm run build
```

#### デプロイが失敗する

1. **認証エラー**: トークンの権限を確認
2. **リポジトリが見つからない**: PUBLIC_REPO_URLを確認
3. **ブランチが存在しない**: 初回デプロイ時は自動作成されます

#### GitHub Pagesが表示されない

1. Settings → Pages でステータスを確認
2. Actions タブでビルドログを確認
3. ブラウザのキャッシュをクリア

### ログの確認

```bash
# ビルドログの詳細表示
npm run build -- --verbose

# Gitの詳細ログ
GIT_TRACE=1 npm run deploy
```

## 次のステップ

- [執筆ガイド](writing-guide.md): Markdownでの執筆方法
- [高度な設定](advanced-configuration.md): カスタマイズオプション
- [ベストプラクティス](best-practices.md): 効率的な執筆フロー

## サポート

問題が解決しない場合は：

1. [Issues](https://github.com/itdojp/book-publishing-template/issues)で質問
2. [Discussions](https://github.com/itdojp/book-publishing-template/discussions)で相談
3. ドキュメントの[FAQ](faq.md)を確認

---

最終更新: 2024年6月