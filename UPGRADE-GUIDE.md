# 🔄 Book Publishing Template アップグレードガイド

> 既存のテンプレートをv2.0に移行して、より使いやすい環境を手に入れましょう

## 🎯 アップグレードの利点

| 項目 | 現在 | v2.0 | 改善度 |
|------|------|------|--------|
| **初期設定** | 複雑（5段階） | 簡単（1コマンド） | 🟢🟢🟢 |
| **ビルド速度** | 遅い | 高速 | 🟢🟢 |
| **エラー対応** | 分かりにくい | 日本語で明確 | 🟢🟢🟢 |
| **依存関係** | 重い（エラー多発） | 軽量（安定） | 🟢🟢🟢 |
| **学習コスト** | 高い | 低い | 🟢🟢 |
| **リポジトリ構成** | デュアル（複雑） | 単一（シンプル） | 🟢🟢🟢 |

## 🚀 移行方法

### Option 1: 新規プロジェクトとして開始（推奨）

```bash
# 1. v2.0テンプレートをクローン
git clone https://github.com/itdojp/book-publishing-template2.git my-book-v2
cd my-book-v2

# 2. 簡単セットアップ
node easy-setup.js

# 3. 既存コンテンツを移行
cp -r ../old-project/src/* src/
cp -r ../old-project/assets/* assets/

# 4. ビルド＆確認
npm run build
npm run preview
```

### Option 2: 既存プロジェクトの段階的アップグレード

#### Step 1: 改善ツールの追加
```bash
# 既存プロジェクトに移動
cd your-existing-project

# v2.0の改善ツールをダウンロード
curl -O https://raw.githubusercontent.com/itdojp/book-publishing-template2/main/easy-setup-legacy.js
curl -O https://raw.githubusercontent.com/itdojp/book-publishing-template2/main/scripts/build-simple.js

# 簡単セットアップを実行
node easy-setup-legacy.js
```

#### Step 2: 軽量ビルドの利用
```bash
# package.jsonに追加
"scripts": {
  "build:simple": "node scripts/build-simple.js",
  "start": "npm run build:simple && npm run preview"
}

# 軽量ビルドでテスト
npm run build:simple
```

#### Step 3: 問題があれば完全移行
```bash
# 問題が解決しない場合は Option 1 を選択
```

### Option 3: 現状維持 + 改善ツール利用

```bash
# 既存環境を保持しつつ、便利ツールのみ追加
wget https://raw.githubusercontent.com/itdojp/book-publishing-template2/main/easy-setup-legacy.js
node easy-setup-legacy.js
```

## 📁 データ移行チェックリスト

### 必須ファイル
- [ ] `src/` - 原稿ファイル
- [ ] `assets/` - 画像・リソース
- [ ] `_config.yml` - Jekyll設定
- [ ] `book-config.json` - 書籍設定

### オプションファイル
- [ ] カスタムCSS（`assets/css/`）
- [ ] カスタムテンプレート（`_layouts/`）
- [ ] プラグイン設定
- [ ] 独自スクリプト

### 設定の移行

#### book-config.json の更新
```json
{
  "book": {
    "title": "あなたの書籍タイトル",
    "author": {
      "name": "著者名",
      "github": "your-github-username"
    },
    "description": "書籍の説明"
  },
  "deployment": {
    "sourceFolder": "docs",
    "siteUrl": "https://username.github.io/book-name/"
  }
}
```

#### package.json の簡略化
```json
{
  "scripts": {
    "setup": "node easy-setup.js",
    "build": "node scripts/build-simple.js",
    "preview": "npm run build && npx http-server docs -p 8080"
  },
  "dependencies": {
    "fs-extra": "^11.1.0",
    "gray-matter": "^4.0.3"
  }
}
```

## 🔧 トラブルシューティング

### 移行中によくある問題

#### 1. ビルドエラー
**問題**: 依存関係のエラー
```bash
# 解決策
rm -rf node_modules package-lock.json
npm install fs-extra gray-matter
npm run build
```

#### 2. 設定ファイルエラー
**問題**: book-config.json の形式エラー
```bash
# 解決策: 設定を再生成
node easy-setup.js
```

#### 3. コンテンツが表示されない
**問題**: ファイル構造の違い
```bash
# v2.0の構造に合わせる
mkdir -p src/introduction src/chapters/chapter01
mv content/* src/chapters/
```

#### 4. GitHub Pagesエラー
**問題**: ページが表示されない
```bash
# 解決策: GitHub Pages設定を確認
# Settings > Pages > Source: main branch /docs folder
# docs/フォルダがコミットされているか確認
```

## 📊 移行後の検証

### 機能チェックリスト
- [ ] ローカルビルドが成功する
- [ ] プレビューサーバーで表示される
- [ ] 数式（LaTeX）が正しく表示される
- [ ] 画像が正しく表示される
- [ ] 目次が自動生成される
- [ ] GitHub Pages デプロイが成功する

### パフォーマンス比較
```bash
# ビルド速度測定
time npm run build

# ファイルサイズ確認
du -sh docs/

# 依存関係確認
npm ls --depth=0
```

## 🆘 移行サポート

### セルフサポート
1. **ドキュメント**: [QUICK-START.md](QUICK-START.md)
2. **比較表**: 機能差分の確認
3. **FAQ**: よくある質問

### コミュニティサポート
1. **GitHub Issues**: 技術的な問題
2. **Discussions**: 使用方法の相談
3. **Examples**: 実際の移行例

### 直接サポート
- **緊急時**: knowledge@itdo.jp
- **移行支援**: GitHub Issues with `migration` label

## 📅 移行スケジュール推奨

### 個人プロジェクト
- **Week 1**: バックアップ作成
- **Week 2**: v2.0でテスト環境構築
- **Week 3**: データ移行・動作確認
- **Week 4**: 本番環境切り替え

### チームプロジェクト
- **Month 1**: チーム内でv2.0評価
- **Month 2**: 段階的移行開始
- **Month 3**: 全体移行完了

## ✨ 移行後の新機能

### 即座に利用可能
- ワンコマンドセットアップ
- 高速ビルド
- 分かりやすいエラーメッセージ
- 軽量な依存関係

### 段階的に利用可能
- 高度なプラグインシステム
- テーマカスタマイズ
- 多言語対応
- PDF/EPUB自動生成

---

**📝 移行に関する質問やサポートが必要な場合は、遠慮なくお知らせください！**