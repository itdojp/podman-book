# Book Publishing Template v3.1 統合ガイド

## Jekyll Liquid 競合解決システムの統合

この文書では、Jekyll Liquid 競合解決システムを Book Publishing Template に統合するための手順を説明します。

## 1. 統合の背景と価値

### 問題
技術書、特に以下の分野では Jekyll Liquid 構文との競合が頻発します：
- **コンテナ技術**: Podman/Docker の `{{.Container}}` 構文
- **監視・メトリクス**: Prometheus の `{{app="name"}}` 構文  
- **クラウドネイティブ**: Kubernetes の `{{ .Values.xxx }}` 構文
- **テンプレート**: 一般的な `{{VARIABLE}}` 構文

### 解決策の価値
- **自動化**: 手動でのエスケープ作業が不要
- **品質保証**: ビルドエラーの事前防止
- **効率化**: CI/CD パイプラインでの自動処理
- **一貫性**: 全プロジェクトで統一されたアプローチ

## 2. テンプレートへの組み込み手順

### 2.1 ファイル構成
```
book-publishing-template/
├── scripts/
│   ├── jekyll-conflict-detector.js    # 新規追加
│   ├── build-with-conflict-detection.js  # 新規追加
│   └── README.md                      # 更新
├── package.json                       # 更新
├── book-config.json                   # 更新
└── docs/
    └── jekyll-conflicts.md            # 新規追加
```

### 2.2 package.json の更新
```json
{
  "scripts": {
    "build": "node scripts/build-with-conflict-detection.js",
    "build:original": "node scripts/build-simple.js",
    "build:safe": "node scripts/build-with-conflict-detection.js --auto-fix --verbose",
    "check-conflicts": "node scripts/jekyll-conflict-detector.js src --dry-run",
    "fix-conflicts": "node scripts/jekyll-conflict-detector.js src --fix",
    "preview": "cd docs && bundle exec jekyll serve --host 0.0.0.0 --port 4000"
  },
  "dependencies": {
    "fs-extra": "^11.0.0"
  }
}
```

### 2.3 book-config.json の拡張
```json
{
  "buildOptions": {
    "autoFix": true,
    "verbose": false,
    "backupOriginals": true,
    "conflictDetection": true,
    "buildScript": "build-simple.js"
  },
  "jekyllConflicts": {
    "enabled": true,
    "patterns": {
      "container": true,
      "monitoring": true,
      "template": true,
      "kubernetes": true
    },
    "customPatterns": []
  }
}
```

### 2.4 GitHub Actions ワークフローの更新
```yaml
# .github/workflows/build.yml
name: Build and Deploy
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install --no-optional
        
      - name: Check for Jekyll conflicts
        run: npm run check-conflicts
        
      - name: Build with conflict resolution
        run: npm run build:safe
        
      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

## 3. ユーザー向けドキュメント

### 3.1 README.md への追加
```markdown
## Jekyll Liquid 競合について

技術書では、以下のような構文が Jekyll の Liquid テンプレートと競合することがあります：

- `{{.Container}}` (Podman/Docker)
- `{{app="name"}}` (Prometheus)
- `{{ .Values.xxx }}` (Kubernetes)

このテンプレートでは自動的に検出・修正されます。

### 手動での確認・修正
```bash
# 競合をチェック
npm run check-conflicts

# 競合を修正
npm run fix-conflicts

# 安全にビルド
npm run build:safe
```
```

### 3.2 専用ドキュメント (docs/jekyll-conflicts.md)
```markdown
# Jekyll Liquid 競合ガイド

## 概要
このガイドでは、技術書でよく発生する Jekyll Liquid 構文との競合について説明します。

## よくある競合パターン

### 1. コンテナフォーマット文字列
```
# 問題のある記述
podman ps --format "{{.Names}}"

# 自動修正後
podman ps --format "\{\{.Names\}\}"
```

### 2. Prometheus クエリ
```
# 問題のある記述
rate(http_requests_total{{app="myapp"}}[5m])

# 自動修正後  
rate(http_requests_total\{\{app="myapp"\}\}[5m])
```

### 3. GitHub Actions構文は安全
```
# これは競合しません（${{ }} は安全）
${{ secrets.GITHUB_TOKEN }}
```

## 自動修正システム

このテンプレートでは、以下の機能が自動的に動作します：

1. **事前チェック**: ビルド前に競合を検出
2. **自動修正**: 競合パターンを自動エスケープ
3. **事後検証**: ビルド後の結果確認
4. **バックアップ**: 修正前の状態を保存

## 設定のカスタマイズ

book-config.json で動作を制御できます：

```json
{
  "buildOptions": {
    "autoFix": true,        // 自動修正を有効化
    "verbose": false,       // 詳細ログを表示
    "backupOriginals": true // バックアップを作成
  }
}
```

## トラブルシューティング

### Q: 修正後もエラーが発生する
A: Jekyll のキャッシュをクリアしてください
```bash
cd docs && bundle exec jekyll clean
```

### Q: 特定のパターンを除外したい
A: 一時的に自動修正を無効化
```bash
node scripts/build-simple.js
```

### Q: カスタムパターンを追加したい
A: scripts/jekyll-conflict-detector.js を編集
```

## 4. 後方互換性の確保

### 4.1 既存プロジェクトへの適用
```bash
# 1. スクリプトファイルをコピー
cp jekyll-conflict-detector.js your-project/scripts/
cp build-with-conflict-detection.js your-project/scripts/

# 2. package.json を更新
npm install fs-extra

# 3. 新しいビルドコマンドを使用
npm run build:safe
```

### 4.2 段階的な移行
```json
{
  "scripts": {
    "build": "node scripts/build-simple.js",
    "build:new": "node scripts/build-with-conflict-detection.js",
    "migrate": "npm run check-conflicts && npm run build:new"
  }
}
```

## 5. 品質保証とテスト

### 5.1 テストケース
```bash
# scripts/test-conflict-detection.sh
#!/bin/bash

echo "Testing Jekyll conflict detection..."

# テスト用ファイル作成
mkdir -p test/src
cat > test/src/test.md << 'EOF'
# Test File
Container format: {{.Container}}
Prometheus: rate(http_requests_total{{app="test"}}[5m])
Safe GitHub Actions: ${{ secrets.TOKEN }}
EOF

# 検出テスト
node scripts/jekyll-conflict-detector.js test/src --dry-run

# 修正テスト  
node scripts/jekyll-conflict-detector.js test/src --fix

# 結果確認
grep "\\\\{\\\\{" test/src/test.md && echo "✓ Fix applied" || echo "✗ Fix failed"

# クリーンアップ
rm -rf test
```

### 5.2 継続的統合
```yaml
# CI での品質チェック
- name: Test conflict detection
  run: |
    chmod +x scripts/test-conflict-detection.sh
    ./scripts/test-conflict-detection.sh
```

## 6. 今後の拡張予定

### 6.1 対応予定パターン
- **Ansible**: `{{ inventory_hostname }}`
- **Terraform**: `${var.name}`
- **Helm**: `{{ .Chart.Name }}`

### 6.2 改善予定機能
- **パフォーマンス向上**: 並列処理対応
- **UI改善**: プログレスバー表示
- **設定の柔軟化**: パターン別の有効/無効切り替え

## 7. 実装スケジュール

| フェーズ | 内容 | 期間 |
|----------|------|------|
| Phase 1 | 基本機能の統合 | 完了 |
| Phase 2 | テンプレート配布 | 次週 |
| Phase 3 | ドキュメント整備 | 今月中 |
| Phase 4 | フィードバック収集 | 来月 |

この統合により、Book Publishing Template を使用するすべてのプロジェクトで Jekyll Liquid 競合の問題が自動的に解決され、より信頼性の高い技術書作成環境が提供されます。