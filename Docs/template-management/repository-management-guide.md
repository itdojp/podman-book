# リポジトリ管理ガイド

このドキュメントでは、書籍テンプレートプロジェクトのリポジトリ管理方法について説明します。

## プロジェクト情報

| 項目 | 値の例 |
|------|--------|
| GitHubのユーザー名または組織名 | `yourusername` |
| 連絡先メールアドレス | `knowledge@itdo.jp` |
| 組織名 | `ITDO Inc.` |

## リポジトリ構成

v2.0では単一リポジトリ構成を採用しています：

**単一リポジトリ** (`your-book-name`)
- 執筆・編集・公開を1つのリポジトリで管理
- プライベート/パブリックどちらでも設定可能
- ビルドシステムが自動的にプライベートコンテンツをフィルタリング
- GitHub Pages でホスティング（/docs フォルダ）

## 著作権とライセンス

### 著作権表示

公開リポジトリには以下の著作権表示を必ず含めてください：

```
Copyright (c) 2025 ITDO Inc. All rights reserved.
```

### ライセンス

- プライベートリポジトリの場合：All Rights Reserved
- パブリックリポジトリの場合：Creative Commons Attribution 4.0 International (CC BY 4.0) 推奨

プロジェクトの性質に応じて適切なライセンスを選択してください。

## リポジトリ設定

### 基本設定

1. **アクセス権限**
   - Settings > Manage access で適切なメンバーを追加
   - 執筆者には Write 権限を付与
   - レビュアーには Read 権限を付与

2. **ブランチ保護**（チーム開発の場合）
   - main ブランチに保護ルールを設定
   - プルリクエストを必須に
   - レビューを必須に（可能であれば）

3. **GitHub Pages設定**

   - Settings > Pages
   - Source: 
     - 手動デプロイ: Deploy from a branch → main → /docs
     - 自動デプロイ: GitHub Actions
   - Custom domain: 必要に応じて設定

4. **セキュリティ設定**
   - プライベートコンテンツの自動フィルタリングが有効
   - ドラフトファイル（*.draft.md）は自動除外
   - プライベートコメント（<!-- private: ... -->）は自動削除

5. **重要なファイル**
   - `CNAME`: カスタムドメインを使用する場合（docs/フォルダに配置）
   - **注意**: `.nojekyll`ファイルは作成しない（Jekyll処理が必要なため）

6. **favicon設定**
   - ファイル名: `favicon.png`
   - 配置場所: `/assets/images/`
   - _layouts/default.htmlで適切に参照

## Git設定

新しいリポジトリをクローンした際は、以下のようにGit設定を行います：

```bash
git config user.name "Your Name"
git config user.email "knowledge@itdo.jp"
```

組織のプロジェクトの場合は、組織のメールアドレス（`knowledge@itdo.jp`）を使用することを推奨します。

## ワークフロー管理

### 継続的インテグレーション (CI)

`.github/workflows/build.yml` により以下が自動化されます：

- **自動ビルド**: main ブランチへのプッシュ時
- **自動デプロイ**: GitHub Pages へのデプロイ
- **コンテンツ検証**: ビルド時のエラーチェック

## プライバシーとセキュリティ

### コンテンツフィルタリング

ビルドシステムが自動的に以下をフィルタリング：
- ドラフトファイル（*.draft.md, draft/フォルダ）
- プライベートコメント（<!-- private: ... -->）
- 特定のメタデータ（draft: true）

### リポジトリの公開設定

- **プライベートリポジトリ推奨**: 執筆中の書籍
- **パブリックリポジトリ可能**: OSSドキュメント、教材など

詳細は [REPOSITORY-ACCESS-GUIDE.md](../../REPOSITORY-ACCESS-GUIDE.md) を参照してください。