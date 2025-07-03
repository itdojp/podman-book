# GitHubベース技術書制作・出版フレームワーク

## 1. プロジェクト構成

```
book-project/
├── src/                    # 原稿ソース
│   ├── chapters/          # 章ごとのMarkdown
│   │   ├── 01-introduction.md
│   │   ├── 02-theory.md
│   │   └── ...
│   ├── figures/           # 図表ソース
│   │   ├── diagrams/     # PlantUML/Mermaid
│   │   └── images/       # 静的画像
│   └── equations/         # LaTeX数式定義
│       └── macros.tex
├── build/                 # ビルド成果物
│   ├── web/              # GitHub Pages用HTML
│   ├── pdf/              # PDF版
│   └── epub/             # EPUB版
├── scripts/               # ビルドスクリプト
│   ├── generate.py       # AI連携スクリプト
│   ├── build.sh          # ビルドパイプライン
│   └── validate.py       # 品質チェック
├── templates/             # 出力テンプレート
│   ├── html/
│   └── latex/
├── .github/workflows/     # GitHub Actions
├── LICENSE               # ライセンス定義
└── README.md
```

## 2. 技術スタック

### 執筆環境
- **Markdown**: 本文記述（CommonMark + 拡張）
- **LaTeX**: 数式記述（KaTeX for Web、LaTeX for PDF）
- **図表**: Mermaid（フローチャート）、PlantUML（UML図）、TikZ（複雑な図）
- **変換**: Pandoc + カスタムフィルタ

### AI活用スクリプト例

```python
# scripts/generate.py
import os
from anthropic import Anthropic

class ChapterGenerator:
    def __init__(self):
        self.client = Anthropic()
        self.context = self.load_context()
    
    def generate_section(self, chapter, section, prompt):
        """Claude APIを使用した節生成"""
        system_prompt = f"""
        技術書の執筆アシスタント。
        章: {chapter}
        節: {section}
        既存コンテキスト: {self.context}
        
        要件:
        - 数式はLaTeX形式
        - 図表はMermaid/PlantUML
        - 論理的で簡潔な説明
        """
        
        response = self.client.messages.create(
            model="claude-3-opus-20240229",
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return self.validate_content(response.content)
    
    def validate_content(self, content):
        """生成内容の検証"""
        # LaTeX構文チェック
        # 参照整合性確認
        # スタイルガイド準拠
        pass
```

## 3. ビルドパイプライン

### GitHub Actions設定

```yaml
# .github/workflows/build-deploy.yml
name: Build and Deploy Book

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Build Environment
      run: |
        sudo apt-get update
        sudo apt-get install -y pandoc texlive-full plantuml
        pip install -r requirements.txt
    
    - name: Generate Dynamic Content
      run: python scripts/generate.py --update
    
    - name: Build Figures
      run: |
        scripts/build_figures.sh
    
    - name: Build Web Version
      run: |
        pandoc src/chapters/*.md \
          --katex \
          --toc \
          --template=templates/html/book.html \
          -o build/web/index.html
    
    - name: Build PDF Version
      run: |
        pandoc src/chapters/*.md \
          --pdf-engine=xelatex \
          --template=templates/latex/book.tex \
          -o build/pdf/book.pdf
    
    - name: Build EPUB Version
      run: |
        pandoc src/chapters/*.md \
          --epub-metadata=metadata.xml \
          -o build/epub/book.epub
    
    - name: Deploy to GitHub Pages
      if: github.ref == 'refs/heads/main'
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./build/web
```

## 4. 出版チャネル戦略

### チャネル別コンテンツ配分

| チャネル | 公開範囲 | 特徴 | 収益モデル |
|---------|---------|------|-----------|
| GitHub Pages | 全章（基本内容） | インタラクティブ、最新版 | 無料 |
| Zenn | 各章サマリー + 1-2節 | 技術者コミュニティ | 有料記事 |
| Kindle | 全章 + 追加コンテンツ | 演習問題、詳細解説 | 書籍販売 |

### 差別化戦略

**GitHub Pages版**
- 基本理論と実装例
- コミュニティからのフィードバック
- 継続的更新

**Kindle版追加要素**
- 章末演習問題と解答
- 実務応用事例（3-5件/章）
- 包括的な索引
- オフライン閲覧最適化

## 5. 著作権管理

### ライセンス構成

```
リポジトリ全体: MIT License（コード部分）
文書コンテンツ: CC BY-NC-SA 4.0
├── 商用利用: 要相談
├── 改変: 同一ライセンスで許可
└── クレジット: 必須

Kindle限定コンテンツ: All Rights Reserved
├── /kindle-exclusive/ フォルダ
└── .gitignore で管理
```

### リスク対策

1. **時差リリース**
   - Kindle版: 即時
   - Zenn版: 1ヶ月後
   - GitHub版: 3ヶ月後（基本内容のみ）

2. **コンテンツ保護**
   ```bash
   # scripts/protect.sh
   #!/bin/bash
   # Kindle向けビルド時に専用コンテンツを注入
   if [ "$BUILD_TARGET" = "kindle" ]; then
     cp -r kindle-exclusive/* build/kindle/
   fi
   ```

3. **トラッキング**
   - Google Analytics（Web版）
   - 販売数モニタリング
   - 不正利用検知

## 6. 品質管理

### 自動検証

```python
# scripts/validate.py
import re
from pathlib import Path

class BookValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
    
    def validate_all(self):
        """全章の検証"""
        self.check_structure()
        self.check_equations()
        self.check_references()
        self.check_consistency()
        
    def check_equations(self):
        """数式の妥当性確認"""
        for file in Path("src/chapters").glob("*.md"):
            content = file.read_text()
            # LaTeX数式の括弧対応
            # 未定義マクロの検出
            # 数式番号の重複チェック
            
    def check_references(self):
        """相互参照の整合性"""
        # 図表参照の存在確認
        # 章節番号の連続性
        # 外部リンクの有効性
```

### レビュープロセス

1. AI生成 → 自動検証
2. プルリクエスト → ピアレビュー
3. ステージング環境でプレビュー
4. 本番デプロイ

## 7. 実行計画

### フェーズ1: 基盤構築（2週間）
- リポジトリ設定
- CI/CDパイプライン
- 基本テンプレート

### フェーズ2: コンテンツ制作（3ヶ月）
- AI活用による初稿生成
- 図表・数式の作成
- レビューと改訂

### フェーズ3: 出版展開（1ヶ月）
- 各フォーマットへの変換
- プラットフォーム別最適化
- マーケティング準備

## 8. 運用指針

### 更新サイクル
- GitHub: 継続的（PR駆動）
- Zenn: 月次バッチ
- Kindle: 四半期ごと（major update）

### フィードバック統合
```javascript
// Web版でのフィードバック収集
const FeedbackWidget = {
  collectIssue: (chapter, section) => {
    // GitHub Issue自動作成
    // 読者からの修正提案
  }
};
```

### 収益最適化
- Kindle Unlimited対応検討
- 企業向けライセンス
- ワークショップ・講演への展開