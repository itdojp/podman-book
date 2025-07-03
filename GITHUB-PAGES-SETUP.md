# GitHub Pages設定ガイド

## 概要

Book Publishing Template v3.0では、GitHub Pagesの2つの設定方式に対応しています。

## 推奨設定：Legacy方式（Deploy from a branch）

### 手順

1. **リポジトリ設定画面を開く**
   - GitHub上でリポジトリに移動
   - `Settings` タブをクリック

2. **Pages設定を開く**
   - 左メニューから `Pages` をクリック

3. **Source設定**
   - `Source` で `Deploy from a branch` を選択
   - `Branch` で `main` を選択
   - `Folder` で `/docs` を選択
   - `Save` をクリック

4. **確認**
   - GitHub Actionsが自動実行される
   - 数分後に `https://[ユーザー名].github.io/[リポジトリ名]/` でアクセス可能

### 特徴
- ✅ 設定が簡単
- ✅ 確実に動作
- ✅ エラーが少ない
- ✅ ワンステップでの公開

## 代替設定：GitHub Actions方式

### 手順

1. **リポジトリ設定画面を開く**
   - GitHub上でリポジトリに移動
   - `Settings` タブをクリック

2. **Pages設定を開く**
   - 左メニューから `Pages` をクリック

3. **Source設定**
   - `Source` で `GitHub Actions` を選択

4. **ワークフロー変更**
   ```bash
   # 現在のワークフローをバックアップ
   cp .github/workflows/build.yml .github/workflows/build-legacy.yml
   
   # Actions対応ワークフローをコピー
   cp templates/github-workflows/build-actions.yml .github/workflows/build.yml
   
   # コミット・プッシュ
   git add .github/workflows/build.yml
   git commit -m "Switch to GitHub Actions workflow"
   git push
   ```

### 特徴
- ✅ 新しい方式
- ✅ 高度な制御が可能
- ⚠️ 設定がやや複雑
- ⚠️ デバッグが困難

## トラブルシューティング

### 404エラーが発生する場合

1. **ワークフローの実行確認**
   - `Actions` タブで最新のワークフローが成功しているか確認
   - エラーがある場合はログを確認

2. **Pages設定の確認**
   - `Settings > Pages` で正しい設定になっているか確認
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`

3. **ファイル構造の確認**
   ```bash
   # docsディレクトリの内容を確認
   ls -la docs/
   
   # index.mdの存在確認
   ls -la docs/index.md
   ```

4. **_config.ymlの確認**
   ```yaml
   # docs/_config.yml
   baseurl: "/[リポジトリ名]"  # 正しいリポジトリ名か確認
   url: "https://[ユーザー名].github.io"  # 正しいユーザー名か確認
   ```

### ビルドが失敗する場合

1. **依存関係のインストール**
   ```bash
   npm ci
   ```

2. **手動ビルド実行**
   ```bash
   npm run build
   ```

3. **ログの確認**
   - GitHub Actions のログで詳細なエラーメッセージを確認

### サイトが古い内容を表示する場合

1. **キャッシュのクリア**
   - ブラウザのキャッシュをクリア
   - 強制リロード（Ctrl+F5）

2. **GitHub Pages のビルド確認**
   - `Settings > Pages` でビルド状況を確認
   - `Actions` タブで最新のワークフローが完了しているか確認

## 設定方式の比較

| 項目 | Legacy方式 | GitHub Actions方式 |
|------|------------|-------------------|
| **設定の簡単さ** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **動作の安定性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **デバッグのしやすさ** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **カスタマイズ性** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **今後の対応** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 推奨

**初回セットアップや安定性重視の場合**: Legacy方式を推奨

**高度なカスタマイズや最新機能を使いたい場合**: GitHub Actions方式を検討