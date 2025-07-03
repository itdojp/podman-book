# テンプレートリポジトリ作成チェックリスト

## 事前準備 ✅

- [ ] GitHubアカウントの準備
- [ ] ローカル開発環境の準備（Node.js, Git）
- [ ] 元プロジェクトファイルへのアクセス

## ファイル作成 📁

### 基本構造
- [ ] ディレクトリ構造の作成
  ```
  book-publishing-template/
  ├── scripts/
  ├── src/chapters/chapter01/
  ├── _layouts/
  ├── assets/images/
  ├── .github/workflows/
  ```

### スクリプト
- [ ] `scripts/build.js` - ビルドスクリプト
- [ ] `scripts/build-incremental.js` - インクリメンタルビルド
- [ ] `scripts/deploy.sh` - デプロイスクリプト（汎用化済み）
- [ ] `scripts/init-template.js` - 初期化スクリプト

### 設定ファイル
- [ ] `package.json` - プロジェクト設定（テンプレート化）
- [ ] `_config.yml` - Jekyll設定（テンプレート化）
- [ ] `.gitignore` - Git除外設定
- [ ] `LICENSE` - MITライセンス

### レイアウト・デザイン
- [ ] `_layouts/default.html` - HTMLテンプレート（汎用化）
- [ ] `assets/images/` - 画像用ディレクトリ

### GitHub Actions
- [ ] `.github/workflows/deploy.yml` - 自動デプロイ設定

### サンプルコンテンツ
- [ ] `index.md` - トップページサンプル
- [ ] `src/chapters/chapter01/index.md` - 章サンプル

### ドキュメント
- [ ] `README.md` - プロジェクト説明（英語・日本語）
- [ ] `book-template-guide.md` - 完全ガイド
- [ ] `template-structure.md` - 構造説明
- [ ] `template-quickstart.md` - クイックスタート

## ファイルの汎用化 🔧

- [ ] プロジェクト固有の情報を削除
  - [ ] 書籍タイトル → プレースホルダー
  - [ ] 著者名 → プレースホルダー
  - [ ] リポジトリ名 → 変数化
  
- [ ] deploy.shの変数化
  ```bash
  PUBLIC_REPO="YOUR_PUBLIC_REPO"
  GITHUB_USER="YOUR_GITHUB_USERNAME"
  ```

- [ ] _config.ymlの汎用化
  ```yaml
  title: {{BOOK_TITLE}}
  author: Your Name
  baseurl: "/{{PUBLIC_REPO_NAME}}"
  ```

## GitHubリポジトリ作成 🚀

### リポジトリ作成
- [ ] 新規リポジトリ作成（`book-publishing-template`）
- [ ] Public リポジトリとして設定
- [ ] 初期化なし（README、.gitignore、ライセンスなし）

### ローカルからプッシュ
- [ ] `git init`
- [ ] `git add .`
- [ ] `git commit -m "Initial template commit"`
- [ ] `git remote add origin https://github.com/username/book-publishing-template.git`
- [ ] `git push -u origin main`

### テンプレート設定
- [ ] Settings → General → Template repository ✓
- [ ] About セクションの設定
  - [ ] Description追加
  - [ ] Topics追加
  - [ ] Website URL（デモサイト）

## デモサイト作成（オプション）🌐

- [ ] gh-pagesブランチ作成
- [ ] デモコンテンツのビルド
- [ ] GitHub Pages有効化
- [ ] カスタムドメイン設定（必要に応じて）

## リリース作成 🏷️

- [ ] v1.0.0 タグ作成
- [ ] リリースノート作成
- [ ] 主要機能の説明
- [ ] 使用方法へのリンク

## テスト 🧪

### テンプレート使用テスト
- [ ] "Use this template"でリポジトリ作成
- [ ] クローンと初期設定
- [ ] `npm install`実行
- [ ] `npm run init`実行
- [ ] ビルド・デプロイテスト

### 機能確認
- [ ] インクリメンタルビルド動作
- [ ] プライベートコンテンツフィルタリング
- [ ] GitHub Actions動作
- [ ] GitHub Pages表示

## ドキュメント最終確認 📋

- [ ] README.mdの誤字脱字
- [ ] インストール手順の正確性
- [ ] サンプルコードの動作確認
- [ ] リンクの有効性

## 公開準備 📢

- [ ] ソーシャルメディア告知文作成
- [ ] ブログ記事作成（オプション）
- [ ] コミュニティへの共有
  - [ ] Reddit (r/github, r/webdev)
  - [ ] Twitter/X
  - [ ] Qiita記事（日本語）

## メンテナンス計画 🔧

- [ ] Issue テンプレート作成
- [ ] Pull Request テンプレート作成
- [ ] CONTRIBUTING.md 作成
- [ ] CODE_OF_CONDUCT.md 作成
- [ ] 定期更新スケジュール設定

## 完了後のタスク ✨

- [ ] スター数・使用状況の監視
- [ ] ユーザーフィードバックの収集
- [ ] 改善案のリスト化
- [ ] v1.1.0の計画

---

## 推定所要時間

- ファイル準備・作成: 2-3時間
- テスト・デバッグ: 1-2時間
- ドキュメント作成: 1-2時間
- **合計: 4-7時間**

## 注意事項

1. **ライセンス**: MITライセンスが適切か確認
2. **著作権**: 元プロジェクトのクレジット明記
3. **セキュリティ**: トークンや個人情報が含まれていないか確認
4. **依存関係**: 最新版で動作確認

このチェックリストを使用して、漏れなくテンプレートリポジトリを作成してください！