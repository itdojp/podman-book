# 🚀 GitHub Pages セットアップガイド

v2.0では、GitHub Pagesの設定が大幅に簡素化されました！トークンは不要で、GitHub上の設定のみで公開できます。

## ✨ 新機能

- 🎯 **トークン不要** - GitHub Pagesの標準機能のみで公開
- 🧙‍♂️ **自動設定** - GitHub Actionsで自動ビルド・デプロイ
- ⚡ **単一リポジトリ** - ソースとデプロイが同じリポジトリで完結
- 📋 **最小設定** - 複雑な権限設定が不要

## 🚀 クイックセットアップ

### 1. リポジトリ作成とセットアップ

```bash
# プロジェクトセットアップ
node easy-setup.js
```

### 2. GitHub Pages を有効化

1. GitHubでリポジトリを開く
2. Settings → Pages に移動
3. Source: `Deploy from a branch` を選択
4. Branch: `main` / `docs` を選択
5. Save をクリック

### 3. 完了！

初回ビルドとプッシュ：

```bash
npm run build
git add .
git commit -m "Initial book content"
git push origin main
```

数分後、`https://[username].github.io/[repo-name]/` でアクセス可能になります。

## 🔧 GitHub Actions を使った自動デプロイ（オプション）

GitHub Actionsを使って自動ビルド・デプロイを設定する場合：

### 1. ワークフローファイルの確認

`.github/workflows/build.yml` が自動的に作成されています。

### 2. GitHub Pages の設定変更

1. Settings → Pages に移動
2. Source: `GitHub Actions` を選択
3. Save をクリック

これで、`main` ブランチへのプッシュ時に自動的にビルド・デプロイされます。

## 🎯 必要な権限

v2.0では特別なトークンは不要です：

- ✅ **リポジトリへの書き込み権限** - 通常のGitHub認証のみ
- ✅ **GitHub Pages** - リポジトリ設定で有効化するだけ
- ✅ **GitHub Actions** - デフォルトで利用可能（オプション）

> 💡 **ヒント**: 組織のリポジトリを使用する場合、組織の設定でGitHub Pagesが許可されていることを確認してください。

## 🔍 トラブルシューティング

### よくある問題

#### GitHub Pages が表示されない
```
404 Not Found
```
**解決**: 
1. Settings → Pages で設定を確認
2. ビルドが成功しているか確認（Actions タブ）
3. URLが正しいか確認: `https://[username].github.io/[repo-name]/`

#### ビルドエラー
```
Error: Cannot find module
```
**解決**: 
```bash
npm install
npm run build
```

#### GitHub Actions が動作しない
```
workflow not found
```
**解決**: `.github/workflows/build.yml` が存在することを確認

### 設定の確認

```bash
# ビルドのテスト
npm run build

# ローカルプレビュー
npm run preview
```

## 📚 関連ドキュメント

- [QUICK-START.md](../QUICK-START.md) - クイックスタートガイド
- [README.md](../README.md) - プロジェクト概要
- [トラブルシューティング](troubleshooting.md) - 詳細な問題解決

## ⚙️ 旧バージョンからの移行

デュアルリポジトリシステムから移行する場合：

1. 新しい単一リポジトリ構成に移行
2. トークン設定を削除（不要）
3. GitHub Pages設定を更新

詳細は [UPGRADE-GUIDE.md](../UPGRADE-GUIDE.md) を参照してください。

---

💡 **v2.0の簡素化されたデプロイをお楽しみください！**