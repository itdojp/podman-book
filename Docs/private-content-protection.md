# プライベートコンテンツ保護ガイド

本書籍執筆テンプレートには、プライベートコンテンツの誤公開を防ぐための包括的なセーフガード機能が実装されています。

## 🛡️ セーフガード機能一覧

### 1. 強化された.gitignore
- プライベートディレクトリ (`private/`, `secrets/`)
- 機密ファイル (`*.key`, `*.pem`, `credentials.json`)
- バックアップファイル (`*.bak`, `*.backup`)

### 2. プライベートコンテンツマーカー
以下のコメントマーカーでコンテンツを保護できます：

```markdown
<!-- PRIVATE: 個人メモ -->
<!-- SECRET: 機密情報 -->
<!-- DRAFT: 下書き -->
<!-- CONFIDENTIAL: 社外秘 -->
<!-- INSTRUCTOR: 講師向け情報 -->
<!-- INTERNAL: 内部情報 -->
<!-- SENSITIVE: 注意が必要な情報 -->
<!-- TODO: 作業メモ -->
<!-- FIXME: 修正が必要 -->
```

### 3. 機密情報検出パターン
以下のパターンが自動検出されます：
- API キー: `api_key="..."`
- パスワード: `password="..."`
- GitHub トークン: `github_token="ghp_..."`
- AWS キー: `aws_access_key_id="AKIA..."`
- 秘密鍵: `-----BEGIN PRIVATE KEY-----`
- メールアドレス: `email="...@..."`

## 🔍 スキャンツール

### プリコミットスキャン
```bash
npm run pre-commit
# または
npm run scan
```

ステージされたファイルをスキャンして、プライベートコンテンツや機密情報を検出します。

### 包括的スキャン
```bash
# 全体スキャン
npm run scan-all

# 高重要度のみ
npm run scan-high

# JSON形式で出力
npm run scan-all -- --json

# 詳細表示（除外ファイルも表示）
npm run scan-all -- --all
```

### 重要度レベル
- **High**: SECRET, CONFIDENTIAL, API キー, パスワード
- **Medium**: PRIVATE, SENSITIVE
- **Low**: TODO, FIXME, メールアドレス

## 🚀 デプロイ時のセーフガード

### セキュリティチェック付きデプロイ
```bash
npm run deploy
```

デプロイ前に以下がチェックされます：
1. ビルド済みコンテンツのプライベートマーカースキャン
2. 機密情報の検出
3. 警告がある場合の確認プロンプト

### ロールバック
```bash
npm run rollback
```

直前のデプロイを元に戻します。

## 📋 使用方法

### 1. 執筆時の保護
```markdown
# 第1章 概要

この章では...

<!-- PRIVATE: この部分は公開版では削除される -->
内部向けの詳細な説明...

<!-- SECRET: API仕様書へのリンク -->
内部API: https://internal.company.com/api

<!-- DRAFT: まだ執筆中 -->
この部分は後で書く予定...
```

### 2. 設定ファイルでの保護
```json
{
  "excludePatterns": [
    "draft.md",
    "private.md",
    "confidential.md"
  ],
  "contentExcludePatterns": [
    "<!-- PRIVATE:",
    "<!-- SECRET:"
  ]
}
```

### 3. 環境変数での設定
```bash
# 厳格モード（プリコミットでコミットを阻止）
export STRICT_PRECOMMIT=true

# CI環境での自動処理
export CI=true
```

## ⚙️ 設定のカスタマイズ

### book-config.json での設定
```json
{
  "sensitivePatterns": [
    "custom_secret_pattern",
    "internal_token\\s*=\\s*[\"'][^\"']+[\"']"
  ],
  "contentExcludePatterns": [
    "<!-- CUSTOM_PRIVATE:",
    "<!-- INTERNAL_ONLY:"
  ]
}
```

## 🔧 トラブルシューティング

### よくある問題

#### 1. プライベートコンテンツが公開された
```bash
# ロールバック実行
npm run rollback

# 原因の調査
npm run scan-all --high-only
```

#### 2. 誤検出の場合
設定ファイルでパターンを調整するか、コメントマーカーを使用してください：
```markdown
<!-- 誤検出を避けるためのマーカー -->
email: contact@example.com  <!-- このメールは公開用 -->
```

#### 3. スキャンが遅い場合
```bash
# 高重要度のみをチェック
npm run scan-high

# 特定ディレクトリのみスキャン
node scripts/content-scanner.js src/
```

## 🎯 ベストプラクティス

1. **執筆前**: プライベートコンテンツには適切なマーカーを使用
2. **コミット前**: `npm run pre-commit` でスキャン
3. **デプロイ前**: `npm run scan-all` で全体チェック
4. **定期的**: 機密情報の見直し

## 📚 関連ドキュメント

- [ベストプラクティスガイド](docs/best-practices.md)
- [トラブルシューティング](docs/troubleshooting.md)
- [デプロイメントガイド](deployment-guide.md)

---

このガイドに従うことで、プライベートコンテンツの誤公開を効果的に防ぐことができます。