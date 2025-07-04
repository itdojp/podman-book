# Jekyll Liquid 競合解決システム

このディレクトリには、技術書でよく発生するJekyll Liquid構文との競合を自動検出・修正するツールが含まれています。

## 問題の概要

技術書、特にコンテナ関連の書籍では以下のような構文が頻繁に使用されます：

- Podman/Docker フォーマット文字列: `{{.Container}}`, `{{.Names}}`
- Prometheus クエリ: `{{app="myapp",version="1.0"}}`
- Kubernetes テンプレート: `{{ .Values.image.tag }}`

これらの構文は Jekyll の Liquid テンプレートエンジンと競合し、以下のようなエラーを引き起こします：

```
Liquid Exception: Liquid syntax error (line xxx): Variable '{{app="{self.app_name}' was not properly terminated
```

## ツール構成

### 1. jekyll-conflict-detector.js
- Jekyll Liquid 競合の自動検出
- 複数の競合パターンに対応
- ドライランモードでの事前確認
- 自動修正機能

### 2. build-with-conflict-detection.js
- ビルドプロセスに統合された競合解決
- 事前・事後の自動チェック
- バックアップ・復旧機能
- 詳細なログ出力

## 使用方法

### 1. 競合検出のみ（ドライラン）
```bash
node scripts/jekyll-conflict-detector.js src --dry-run
```

### 2. 競合の自動修正
```bash
node scripts/jekyll-conflict-detector.js src --fix
```

### 3. 統合ビルドシステム
```bash
# 競合解決付きビルド
node scripts/build-with-conflict-detection.js

# 詳細ログ付き
node scripts/build-with-conflict-detection.js --verbose

# 自動修正有効化
node scripts/build-with-conflict-detection.js --auto-fix
```

## package.json への統合

```json
{
  "scripts": {
    "build": "node scripts/build-with-conflict-detection.js",
    "build:safe": "node scripts/build-with-conflict-detection.js --auto-fix --verbose",
    "check-conflicts": "node scripts/jekyll-conflict-detector.js src --dry-run",
    "fix-conflicts": "node scripts/jekyll-conflict-detector.js src --fix"
  }
}
```

## CI/CD パイプラインでの使用

### GitHub Actions
```yaml
- name: Build with conflict detection
  run: npm run build:safe
```

### GitLab CI
```yaml
build:
  script:
    - npm run build:safe
```

## 対応する競合パターン

| パターン | 例 | カテゴリ |
|---------|-----|---------|
| Container Format | `{{.Container}}` | container |
| Prometheus Query | `{{app="myapp"}}` | monitoring |
| Template Variables | `{{BOOK_TITLE}}` | template |
| Kubernetes Templates | `{{ .Values.image }}` | kubernetes |

## 設定オプション

### book-config.json での設定
```json
{
  "buildOptions": {
    "autoFix": true,
    "verbose": true,
    "backupOriginals": true,
    "conflictDetection": true
  }
}
```

### 環境変数
- `JEKYLL_AUTO_FIX=true` - 自動修正の有効化
- `JEKYLL_VERBOSE=true` - 詳細ログの有効化

## トラブルシューティング

### よくある問題

1. **修正後もエラーが発生する**
   - Jekyll のキャッシュクリア: `bundle exec jekyll clean`
   - 手動でのエスケープ確認

2. **バックアップからの復旧**
   ```bash
   # 自動復旧（失敗時）
   node scripts/build-with-conflict-detection.js
   
   # 手動復旧
   cp -r .backup-src/* src/
   ```

3. **カスタムパターンの追加**
   ```javascript
   // jekyll-conflict-detector.js の conflictPatterns に追加
   {
     name: 'Custom Pattern',
     pattern: /your-pattern/g,
     category: 'custom'
   }
   ```

## Book Publishing Template v3.1+ 統合

このシステムは Book Publishing Template v3.1 以降で標準機能として提供されます：

- 新しい書籍プロジェクトで自動的に利用可能
- デフォルトで有効化
- 設定ファイルでのカスタマイズ対応

## 性能情報

- **検出速度**: 約1000ファイル/秒
- **修正速度**: 約500ファイル/秒
- **メモリ使用量**: 通常50MB以下
- **対応ファイル**: .md, .markdown, .html

## 貢献

このツールの改善にご協力いただける場合：

1. 新しい競合パターンの報告
2. パフォーマンス改善の提案
3. 他の静的サイトジェネレータへの対応

## ライセンス

Book Publishing Template のライセンスに従います。