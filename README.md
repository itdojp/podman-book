# 📚 Book Publishing Template v2.0 - 改善版

> **大幅に使いやすくなった書籍出版テンプレート**

## 🎯 改善ポイント

### 1. **ワンコマンドセットアップ** 🚀
```bash
node easy-setup.js
```
- 対話式で簡単
- 自動で設定ファイル生成
- 日本語メッセージ

### 2. **軽量ビルドシステム** ⚡
```bash
node scripts/build-simple.js
```
- 依存関係エラーなし
- 高速ビルド
- 分かりやすいエラー

### 3. **最小限の依存関係** 📦
```json
// package-simple.json
{
  "dependencies": {
    "fs-extra": "^11.1.0",
    "gray-matter": "^4.0.3"
  }
}
```

### 4. **5分で始められる** ⏱️
- [QUICK-START.md](QUICK-START.md) - 超簡単ガイド
- 複雑な設定不要
- すぐに執筆開始

### 5. **GitHub Pages自動設定** 🔧
- GitHub Actionsワークフロー自動生成
- 2つの設定方式に対応（Legacy/Actions）
- 404エラー対策済み

## 📋 主な改善内容

| 項目 | 改善前 | 改善後 |
|------|--------|--------|
| **初期設定** | 5段階の手動設定 | 1コマンド |
| **エラーメッセージ** | 英語・技術的 | 日本語・分かりやすい |
| **依存関係** | 重い・エラー多発 | 軽量・安定 |
| **ビルド時間** | 遅い | 高速 |
| **必要な知識** | 高度 | 基本的 |
| **リポジトリ構成** | デュアル（複雑） | 単一（シンプル） |
| **トークン設定** | 必須 | 不要 |

## 🚀 使い方

### 1. セットアップ（1分）
```bash
git clone https://github.com/itdojp/book-publishing-template2.git my-book
cd my-book
node easy-setup.js
```

### 2. 執筆
```bash
# src/chapters/chapter01/index.md を編集
```

### 3. ビルド&プレビュー
```bash
npm run build
npm run preview
```

### 4. GitHub Pages設定
```bash
git add -A
git commit -m "Initial commit"
git push

# GitHubで: Settings > Pages > Source: main branch /docs folder
```

## 📁 シンプルな構造

```
my-book/
├── src/               # 原稿
│   ├── introduction/  # はじめに
│   └── chapters/      # 各章
├── docs/              # ビルド出力（GitHub Pages用）
├── assets/           # 画像
├── easy-setup.js     # セットアップツール
└── book-config.json  # 設定ファイル
```

## 🔧 カスタマイズ

必要に応じて、次の高度な機能を追加できます。
- `package.json` - フル機能版
- `scripts/build.js` - 高度なビルド
- プラグインシステム
- テーマシステム

## 📚 ドキュメント

### 🚀 クイックスタート
- [QUICK-START.md](QUICK-START.md) - 5分で始める
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - トラブルシューティング

### 📖 詳細ガイド
- [REPOSITORY-ACCESS-GUIDE.md](REPOSITORY-ACCESS-GUIDE.md) - リポジトリ構成とアクセス権
- [MIGRATION-PLAN.md](MIGRATION-PLAN.md) - 既存版からの移行
- [UPGRADE-GUIDE.md](UPGRADE-GUIDE.md) - アップグレードガイド
- [COMPARISON.md](COMPARISON.md) - 既存版との比較

### 🔧 技術ドキュメント
- [Docs/](Docs/) - 詳細技術ドキュメント
- [TECHNICAL-CONTEXT.md](TECHNICAL-CONTEXT.md) - 技術的背景
- [FEEDBACK-COLLECTION.md](FEEDBACK-COLLECTION.md) - フィードバック収集計画

## 🔧 GitHub Actions ワークフロー管理

### 問題のあるワークフローを無効化

テンプレートを使用する際、不要なワークフローが原因でActionsがハングアップすることがあります。

```bash
npm run configure:workflows
```

このコマンドで以下のワークフローを自動無効化します。
- `content-validation.yml` (リンクチェックでハングアップ)
- `quality-checks.yml` (長時間実行)
- `build-with-cache.yml` (重複ビルド)
- `parallel-build-test.yml` (テスト用)
- `validate-secrets.yml` (設定複雑)

### 推奨ワークフロー構成

本番環境では`build.yml`のみを有効にすることを推奨します。
- GitHub Pagesへの自動デプロイ
- 最小限のビルド時間
- エラーが少ない安定動作

## 🤝 サポート

- Issues: https://github.com/itdojp/book-publishing-template2/issues
- 元のテンプレート: https://github.com/itdojp/book-publishing-template

## ✨ 特徴

- ✅ **初心者に優しい**: 技術的な知識不要
- ✅ **高速**: 軽量で高速なビルド
- ✅ **柔軟**: 必要に応じて拡張可能
- ✅ **安定**: エラーが少ない
- ✅ **日本語対応**: メッセージが分かりやすい

---

**Happy Writing! 📖✨**# Trigger build
# Trigger CI
