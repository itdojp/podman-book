# 📚 リポジトリアクセス権と公開範囲ガイド

> Book Publishing Template v2.0 のリポジトリ構成とセキュリティについて

## 📋 概要

Book Publishing Template v2.0は、シンプルな**単一リポジトリ構成**を採用し、GitHub Pagesとの統合により簡単に書籍を公開できます。コンテンツフィルタリング機能により、下書きや内部メモを自動的に除外し、完成したコンテンツのみを公開します。

## 🏗️ リポジトリ構成

### 単一リポジトリシステム

本テンプレートは1つのリポジトリで完結する設計です：

```mermaid
graph LR
    A[ソースファイル<br/>src/] -->|ビルド| B[公開用ファイル<br/>docs/]
    B --> C[GitHub Pages<br/>Webサイト]
    
    style A fill:#f9f,stroke:#333,stroke-width:4px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bfb,stroke:#333,stroke-width:2px
```

#### リポジトリ構成
- **リポジトリ名例**: `my-book`
- **推奨設定**: プライベートまたはパブリック（用途に応じて）
- **ディレクトリ構成**:
  ```
  my-book/
  ├── src/                 # ソースファイル（執筆用）
  │   ├── introduction/    # はじめに
  │   ├── chapters/        # 各章
  │   ├── draft.md ❌       # ビルドから除外
  │   └── notes.md ❌       # ビルドから除外
  ├── docs/                # ビルド出力（GitHub Pages用）
  │   ├── introduction/    # 公開用コンテンツ
  │   ├── chapters/        # 公開用コンテンツ
  │   └── index.md         # メインページ
  ├── book-config.json     # 設定ファイル
  └── package.json         # npm設定
  ```

## 🔐 セキュリティ機能

### コンテンツ保護メカニズム

単一リポジトリ構成でも、ビルド時に以下のコンテンツ保護が機能します：

#### 1. **自動除外ファイル**
以下のファイルは自動的に公開リポジトリから除外されます：

```
*.draft.md        # 下書きファイル
*.private.md      # プライベートファイル
*.internal.md     # 内部用ファイル
*.secret.md       # 機密ファイル
*.confidential.md # 社外秘ファイル
*.notes.md        # メモファイル
*.todo.md         # TODOファイル
*.instructor.md   # 講師用ファイル
*.solutions.md    # 解答ファイル
```

#### 2. **コンテンツフィルタリング**
以下のマーカーを含む内容は自動的に削除されます：

```markdown
<!-- PRIVATE: 個人的なメモ -->
<!-- SECRET: 機密情報 -->
<!-- DRAFT: 執筆中の内容 -->
<!-- TODO: あとで修正 -->
<!-- FIXME: 要修正 -->
<!-- INTERNAL: 内部情報 -->
<!-- CONFIDENTIAL: 社外秘 -->
<!-- INSTRUCTOR: 講師専用 -->
<!-- SENSITIVE: 取扱注意 -->
```

#### 3. **機密情報検出**
以下のパターンが検出されるとビルドが停止します：

- APIキー: `api_key="..."`
- パスワード: `password="..."`
- GitHubトークン: `ghp_...`
- AWSキー: `AKIA...`
- 秘密鍵: `-----BEGIN PRIVATE KEY-----`
- メールアドレス（設定による）

## 💡 利用パターン

### パターン1: プライベートリポジトリ（推奨）

```
[プライベートリポジトリ]
my-book
├── src/                    # ソース（保護される）
│   ├── introduction/
│   ├── chapters/
│   ├── draft.md           # ビルドから除外
│   └── notes.md           # ビルドから除外
├── docs/                   # 公開用（GitHub Pages）
│   ├── introduction/
│   ├── chapters/
│   └── index.md
├── book-config.json
└── package.json
```

**メリット**:
- 完全な執筆内容の保護
- 安心して下書きやメモを残せる
- チーム内限定のレビュー可能
- 知的財産の保護
- GitHub Pagesへの簡単なデプロイ

### パターン2: パブリックリポジトリ（注意必要）

```
[パブリックリポジトリ]
my-book
├── src/                    # ソース（公開される！）
│   ├── introduction/
│   ├── chapters/
│   ├── draft.md ⚠️        # 閲覧可能！
│   └── notes.md ⚠️        # 閲覧可能！
├── docs/                   # 公開用（GitHub Pages）
│   ├── introduction/
│   ├── chapters/
│   └── index.md
├── book-config.json
└── package.json
```

**注意点**:
- すべてのソースファイルが公開される
- draft.mdもリポジトリでは閲覧可能
- コミット履歴もすべて公開
- 削除したコンテンツも履歴に残る

## 🚀 セットアップ手順

### 1. 基本セットアップ

```bash
# 1. テンプレートをクローン
git clone https://github.com/itdojp/book-publishing-template2.git my-book
cd my-book

# 2. セットアップ実行
node easy-setup.js

# 3. ビルド実行
npm run build

# 4. Gitにコミット
git add -A
git commit -m "Initial commit"

# 5. GitHubにリポジトリ作成してプッシュ
# GitHubでリポジトリ作成（PrivateまたはPublic）
git remote add origin https://github.com/username/my-book.git
git push -u origin main

# 6. GitHub Pages設定
# Settings > Pages > Source: Deploy from a branch
# Branch: main, Folder: /docs
```

### 2. パブリックリポジトリでの追加対策

```bash
# ⚠️ パブリックリポジトリを使う場合の追加設定

# 1. 下書きファイルを確実に除外
echo "*.draft.md" >> .gitignore
echo "*.private.md" >> .gitignore
echo "private/" >> .gitignore
echo "drafts/" >> .gitignore

# 2. 環境変数ファイルを保護
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore

# 3. ブランチ保護ルールを設定
# GitHubで: Settings > Branches > Add rule
# - Branch name pattern: main
# - Require pull request reviews before merging
# - Dismiss stale pull request approvals when new commits are pushed
```

## 📊 構成比較表

| 項目 | プライベートリポジトリ（推奨） | パブリックリポジトリ |
|------|------------------------|----------------|
| **下書き保護** | ✅ 完全保護 | ⚠️ リポジトリで閲覧可能 |
| **TODOコメント** | ✅ 非公開 | ⚠️ ソースで閲覧可能 |
| **編集履歴** | ✅ チーム内限定 | ⚠️ 全世界に公開 |
| **削除済みコンテンツ** | ✅ 履歴も非公開 | ⚠️ 履歴で閲覧可能 |
| **機密情報リスク** | ✅ 低い | ⚠️ 高い（要注意） |
| **コラボレーション** | ✅ 招待制 | ⚠️ 誰でも閲覧 |
| **GitHub料金** | 💰 プライベートリポジトリ枠 | 🆓 無料 |
| **知的財産保護** | ✅ 保護される | ⚠️ 公開される |
| **GitHub Pages** | ✅ 簡単設定 | ✅ 簡単設定 |

## 🛡️ セキュリティベストプラクティス

### すべての構成で守るべきこと

1. **環境変数の使用**
   ```bash
   # .env ファイル（必ず.gitignoreに追加）
   DEPLOY_TOKEN=ghp_xxxxxxxxxxxx
   API_KEY=your-api-key
   ```

2. **機密情報スキャン**
   ```bash
   # デプロイ前に必ず実行
   npm run scan-all
   npm run validate
   ```

3. **コミット前チェック**
   ```bash
   # pre-commitフックの設定
   npm run setup-hooks
   ```

### パブリックソースの追加対策

1. **専用の.gitignore設定**
   ```gitignore
   # 下書き・プライベートファイル
   *.draft.md
   *.private.md
   **/drafts/
   **/private/
   
   # 環境設定
   .env
   .env.*
   
   # 個人メモ
   personal-notes/
   TODO.md
   ```

2. **別リポジトリでの下書き管理**
   ```bash
   # 下書き専用プライベートリポジトリ
   git clone private-drafts
   # 完成したら本リポジトリにコピー
   ```

3. **ブランチ保護ルール**
   - mainブランチへの直接プッシュ禁止
   - プルリクエスト必須
   - レビュー必須

## ❓ よくある質問

### Q1: 単一リポジトリで安全に運用できますか？

**A**: はい、コンテンツフィルタリング機能により、下書きや内部メモは自動的に公開から除外されます。ただし、パブリックリポジトリの場合はソースファイル自体は閲覧可能なため注意が必要です。

### Q2: ビルドで除外されるファイルはどこに保存されますか？

**A**: 除外されるファイル（`*.draft.md`等）は`src/`ディレクトリにそのまま保存され、`docs/`ディレクトリにはコピーされません。

### Q3: GitHub Actionsは必須ですか？

**A**: いいえ、必須ではありません。手動で`npm run build`を実行して`docs/`フォルダをコミットすることでも運用可能です。GitHub Actionsは自動化のためのオプションです。

### Q4: チーム開発の場合は？

**A**: プライベートリポジトリを強く推奨します：
- メンバーを招待して共同編集
- ブランチ保護で品質管理
- プルリクエストでレビュー

## 🎯 まとめ

- **構成**: 単一リポジトリ + `docs/`フォルダでGitHub Pages
- **セキュリティ**: コンテンツフィルタリングで下書きを保護
- **柔軟性**: プライベート/パブリックどちらでも対応
- **簡単さ**: トークン設定不要、シンプルなワークフロー

適切なリポジトリ設定を選択することで、安全かつ簡単な技術書執筆環境を実現できます。