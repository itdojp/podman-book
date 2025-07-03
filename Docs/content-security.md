# 🛡️ コンテンツセキュリティガイド

このガイドでは、Book Publishing Templateのプライベートコンテンツセーフガードシステムについて説明します。

## 概要

Book Publishing Templateには、機密情報の誤公開を防ぐための多層防御システムが組み込まれています。このシステムは以下の機能を提供します：

- **自動検出**: APIキー、パスワード、個人情報などの機密データを自動検出
- **コンテンツフィルタリング**: プライベートコメントや下書きの自動除去
- **ファイル除外**: 機密ファイルの公開版からの自動除外
- **セキュリティレポート**: 検出された問題の詳細レポート

## セーフガードの種類

### 1. 機密データの検出

以下のような機密データを自動的に検出し、含まれるファイルを公開から除外します：

#### APIキーとトークン
```markdown
<!-- 検出例 -->
export GITHUB_TOKEN="ghp_1234567890abcdef1234567890abcdef123456"
export OPENAI_API_KEY="sk-1234567890abcdef1234567890abcdef12345678"
export AWS_ACCESS_KEY="AKIA1234567890ABCDEF"
```

#### 個人情報
```markdown
<!-- 検出例 -->
電話番号: 03-1234-5678
クレジットカード番号: 4111-1111-1111-1111
```

#### データベース接続文字列
```markdown
<!-- 検出例 -->
mongodb://user:password@localhost:27017/database
postgresql://user:secret@localhost:5432/mydb
```

#### IPアドレス
```markdown
<!-- 検出例 -->
内部サーバー: 192.168.1.100
開発環境: 10.0.0.50
```

### 2. プライベートコンテンツの検出

以下のパターンに一致するコンテンツを自動的にクリーニングします：

#### コメントパターン
```markdown
<!-- TODO: 後で修正が必要 -->
<!-- FIXME: このコードは動作しない -->
<!-- PRIVATE: 内部メモ -->
<!-- SECRET: 機密情報 -->
<!-- CONFIDENTIAL: 社外秘 -->
<!-- INSTRUCTOR: 講師向け情報 -->
<!-- INTERNAL: 内部用 -->
<!-- DO NOT PUBLISH: 公開禁止 -->
<!-- 非公開: 日本語でのプライベートマーカー -->
<!-- 秘匿: 秘匿情報 -->
```

#### セクションパターン
```markdown
## 講師向け
講師のみが参照する情報

## Instructor
For instructors only

## Private
Internal information

## Internal
Company internal use

## 非公開
非公開情報
```

### 3. ファイル除外

以下のパターンに一致するファイルは公開版から自動的に除外されます：

```
*.draft.md        # 下書きファイル
*.private.md      # プライベートファイル
*.internal.md     # 内部ファイル
*.secret.md       # 機密ファイル
*.confidential.md # 社外秘ファイル
*.notes.md        # メモファイル
*.todo.md         # TODOファイル
*.instructor.md   # 講師向けファイル
*.solutions.md    # 解答ファイル
*.tmp             # 一時ファイル
*.temp            # 一時ファイル
*.backup          # バックアップファイル
*.bak             # バックアップファイル
*_private.*       # プライベート接尾辞
*_secret.*        # 機密接尾辞
*_internal.*      # 内部接尾辞
```

## 使用方法

### 手動チェック

プライベートコンテンツのセーフガードチェックを手動で実行：

```bash
# 基本チェック
npm run safeguard

# 詳細レポート付き
npm run safeguard -- --save-report

# 特定ディレクトリのみチェック
node scripts/content-safeguard.js src/chapters
```

### 自動チェック

セーフガードチェックは以下のタイミングで自動実行されます：

```bash
# ビルド時に自動実行
npm run build

# インクリメンタルビルド時も実行
npm run build:incremental
```

### 出力例

```
🛡️  PRIVATE CONTENT SAFEGUARD REPORT
============================================================
📊 Statistics:
   Files scanned: 15
   Violations found: 3
   Warnings issued: 8
   Sensitive data detected: 2

🚨 CRITICAL VIOLATIONS (WILL BE EXCLUDED):
   📁 src/chapters/chapter01/private.md
      ⚠️  SENSITIVE_DATA: ghp_********************************1234 (Line: 7)
      ⚠️  SENSITIVE_DATA: 192.*****.100 (Line: 9)

⚠️  WARNINGS (CONTENT WILL BE CLEANED):
   📁 src/chapters/chapter02/index.md
      💡 PRIVATE_CONTENT: <!-- TODO: セクションを追加 -->... (Line: 15)

📋 Summary: 1 files will be excluded, 7 files will be cleaned.
```

## セキュリティレベル

### HIGH (重大な違反)
- **APIキー、トークン**: 完全にファイルを除外
- **パスワード、ハッシュ**: 完全にファイルを除外  
- **個人情報**: 完全にファイルを除外
- **データベース接続文字列**: 完全にファイルを除外

**対処**: 該当ファイルは公開版から完全に除外されます。ビルドも中断されます。

### MEDIUM (警告)
- **TODOコメント**: コンテンツをクリーニング
- **プライベートコメント**: コンテンツをクリーニング
- **講師向けセクション**: コンテンツをクリーニング

**対処**: 該当コンテンツは自動的に除去され、ファイルは公開されます。

## ベストプラクティス

### 1. 機密情報の取り扱い

```markdown
<!-- ❌ 悪い例 -->
API_KEY="sk-actual-api-key-here"

<!-- ✅ 良い例 -->
API_KEY="your-api-key-here"
# または環境変数を使用
API_KEY="${OPENAI_API_KEY}"
```

### 2. プライベートコンテンツの管理

```markdown
<!-- ✅ 推奨: プライベートコメントの使用 -->
<!-- PRIVATE: 内部レビュー用メモ
この部分は社内でのみ議論し、公開版では自動的に削除される
-->

<!-- ✅ 推奨: 別ファイルでの管理 -->
# notes.md または draft.md で下書きを管理
```

### 3. ファイル命名規則

```
✅ 推奨ファイル名:
- chapter01/index.md     # 公開用メインファイル
- chapter01/draft.md     # 下書き（自動除外）
- chapter01/notes.md     # メモ（自動除外）
- chapter01/private.md   # プライベート（自動除外）

❌ 避けるべき:
- chapter01/main.md      # 曖昧な名前
- chapter01/content.md   # 用途が不明確
```

### 4. 環境変数の活用

```markdown
<!-- ✅ 環境変数の使用例 -->
```bash
# 実際の値は環境変数で設定
export DATABASE_URL="${DB_CONNECTION_STRING}"
export API_ENDPOINT="${PRODUCTION_API_URL}"
```

## トラブルシューティング

### セーフガードチェックが失敗する

**症状**: ビルド時にセーフガードチェックでエラーが発生

**解決方法**:
1. セーフガードレポートを確認
```bash
npm run safeguard
cat .safeguard-report.json
```

2. 機密情報を含むファイルを修正または除外
3. プライベートコンテンツを適切にマーク

### 誤検出への対処

**症状**: 正当なコンテンツが機密データとして検出される

**解決方法**:
1. コンテンツを環境変数やプレースホルダーに変更
2. ファイルを `.private.md` に移動
3. 設定で除外パターンを追加

### パフォーマンスの最適化

**症状**: セーフガードチェックに時間がかかる

**解決方法**:
```bash
# 特定ディレクトリのみチェック
node scripts/content-safeguard.js src/chapters

# レポート保存を無効化
node scripts/content-safeguard.js src --no-report
```

## 設定のカスタマイズ

### book-config.json での設定

```json
{
  "contentExcludePatterns": [
    "<!-- TODO:",
    "<!-- FIXME:",
    "<!-- PRIVATE:",
    "<!-- CUSTOM-MARKER:"
  ],
  "excludePatterns": [
    "draft.md",
    "notes.md",
    "private.md",
    "custom-private.md"
  ]
}
```

### カスタムパターンの追加

機密データ検出パターンを追加する場合は、`scripts/content-safeguard.js` を編集してください。

## セキュリティチェックリスト

公開前に以下をチェックしてください：

- [ ] セーフガードチェックが通る
- [ ] .safeguard-report.json にCRITICAL違反がない
- [ ] 実際のAPIキーやパスワードが含まれていない
- [ ] プライベートファイルが適切に命名されている
- [ ] 環境変数が適切に使用されている
- [ ] プライベートコメントが適切に使用されている

---

最終更新: 2024年6月