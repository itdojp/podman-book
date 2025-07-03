# Book Publishing Template ドキュメント

このテンプレートを使用して効率的に書籍を作成・公開するための包括的なガイド集です。

## 📚 ドキュメント一覧

### 🚀 開始ガイド
- **[セットアップガイド](../setup-guide.md)** - 初期設定と環境構築
- **[クイックスタート](quick-start.md)** - 5分で始める書籍作成
- **[基本概念](concepts.md)** - テンプレートの構造と仕組み

### 📝 執筆ガイド
- **[コンテンツ作成](writing-guide.md)** - Markdownでの執筆方法
- **[構造化ガイド](content-structure.md)** - 章立てとファイル構成
- **[スタイルガイド](style-guide.md)** - 一貫した書式と表現

### 🔧 設定とカスタマイズ
- **[設定リファレンス](configuration.md)** - book-config.jsonの詳細設定
- **[テーマカスタマイズ](theming.md)** - 見た目とレイアウトの変更
- **[プラグイン開発](plugins.md)** - 機能拡張の方法

### 📤 出力と公開
- **[複数フォーマット対応](output-formats.md)** - Web, PDF, EPUB出力
- **[GitHub Pages デプロイ](deployment.md)** - 自動公開の設定
- **[CI/CD設定](ci-cd.md)** - 継続的な統合とデプロイ

### 🛠️ 開発とメンテナンス
- **[ベストプラクティス](best-practices.md)** - 効率的な開発手法
- **[トラブルシューティング](../TROUBLESHOOTING.md)** - 問題解決ガイド
- **[FAQ](faq.md)** - よくある質問と回答

### 🎯 高度な活用
- **[自動化](automation.md)** - ワークフローの自動化
- **[チーム開発](collaboration.md)** - 複数人での執筆管理
- **[パフォーマンス最適化](performance.md)** - ビルド時間とファイルサイズの最適化

## 📋 チュートリアル

### 初心者向け
1. **[はじめての書籍作成](tutorials/first-book.md)**
2. **[GitHub Pagesでの公開](tutorials/github-pages.md)**
3. **[基本的なカスタマイズ](tutorials/basic-customization.md)**

### 中級者向け
1. **[複数フォーマット出力](tutorials/multi-format.md)**
2. **[自動化ワークフロー](tutorials/automation.md)**
3. **[SEO最適化](tutorials/seo-optimization.md)**

### 上級者向け
1. **[カスタムテーマ開発](tutorials/custom-theme.md)**
2. **[プラグイン作成](tutorials/plugin-development.md)**
3. **[大規模プロジェクト管理](tutorials/large-projects.md)**

## 🔗 外部リソース

### 公式リンク
- **[GitHub Repository](https://github.com/itdojp/book-publishing-template)**
- **[Issues & Bug Reports](https://github.com/itdojp/book-publishing-template/issues)**
- **[Discussions](https://github.com/itdojp/book-publishing-template/discussions)**

### 関連技術
- **[Markdown記法](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)**
- **[GitHub Pages Documentation](https://docs.github.com/pages)**
- **[Pandoc User's Guide](https://pandoc.org/MANUAL.html)**
- **[Jekyll Documentation](https://jekyllrb.com/docs/)**

### コミュニティ
- **[ユーザーコミュニティ](#)** - 情報交換と質問
- **[事例集](#)** - 実際の使用例
- **[貢献ガイド](../CONTRIBUTING.md)** - プロジェクトへの貢献方法

## 📊 ステータス

| 機能 | 状態 | ドキュメント |
|------|------|-------------|
| 基本ビルド | ✅ 完成 | [セットアップガイド](../setup-guide.md) |
| Web出力 | ✅ 完成 | [出力フォーマット](output-formats.md) |
| PDF出力 | ✅ 完成 | [出力フォーマット](output-formats.md) |
| EPUB出力 | ✅ 完成 | [出力フォーマット](output-formats.md) |
| 自動デプロイ | ✅ 完成 | [デプロイ](deployment.md) |
| 国際化 | 🚧 開発中 | [多言語対応](i18n.md) |

## 💡 使い方のヒント

### 効率的な学習順序
1. **[セットアップガイド](../setup-guide.md)** で環境を構築
2. **[クイックスタート](quick-start.md)** でサンプル書籍を作成
3. **[コンテンツ作成](writing-guide.md)** で執筆方法を学習
4. **[設定リファレンス](configuration.md)** でカスタマイズ
5. **[出力フォーマット](output-formats.md)** で公開形式を選択

### よく使うコマンド
```bash
# 開発サーバー起動
npm run preview

# 全フォーマットビルド
npm run build:all

# デプロイ
npm run deploy

# クリーンビルド
npm run clean && npm run build
```

### トラブル時の対処
1. **[トラブルシューティング](../TROUBLESHOOTING.md)** で一般的な問題を確認
2. **[FAQ](faq.md)** でよくある質問をチェック
3. **[Issues](https://github.com/itdojp/book-publishing-template/issues)** で既知の問題を検索
4. 解決しない場合は新しいIssueを作成

## 🤝 サポート

### 質問・相談
- **GitHub Discussions**: 一般的な質問や使用法の相談
- **GitHub Issues**: バグ報告や機能要望
- **Email**: knowledge@itdo.jp（緊急時のみ）

### コントリビューション
このプロジェクトはオープンソースです。改善提案やバグ修正など、あらゆる貢献を歓迎します。

- **[貢献ガイド](../CONTRIBUTING.md)** - 貢献方法の詳細
- **[開発環境構築](development.md)** - 開発者向けセットアップ
- **[コーディング規約](coding-standards.md)** - コード品質の基準

---

**📅 最終更新:** 2024年6月16日  
**📧 メンテナー:** ITDO Inc. <knowledge@itdo.jp>  
**📄 ライセンス:** MIT License