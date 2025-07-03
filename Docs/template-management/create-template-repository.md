# GitHubテンプレートリポジトリ作成手順

## 概要

理論計算機科学教科書の書籍作成・公開システムを基に、再利用可能なGitHubテンプレートリポジトリを作成する手順です。

## 準備作業

### 1. テンプレート用のローカルリポジトリを作成

```bash
# 新しいディレクトリを作成
mkdir book-publishing-template
cd book-publishing-template
git init

# 基本的なディレクトリ構造を作成
mkdir -p scripts src/chapters/chapter01 _layouts assets/images .github/workflows
```

### 2. 必要なファイルをコピー・作成

#### A. ビルドスクリプト

```bash
# 現在のプロジェクトからスクリプトをコピー
cp /path/to/theoretical-cs-textbook/scripts/build.js scripts/
cp /path/to/theoretical-cs-textbook/scripts/build-incremental.js scripts/
cp /path/to/theoretical-cs-textbook/scripts/deploy.sh scripts/
cp /path/to/theoretical-cs-textbook/scripts/init-template.js scripts/

# deploy.shを汎用化
sed -i 's/{{PUBLIC_REPO_NAME}}/YOUR_PUBLIC_REPO/g' scripts/deploy.sh
sed -i 's/itdojp/YOUR_GITHUB_USERNAME/g' scripts/deploy.sh
```

#### B. 設定ファイルのテンプレート化

**package.json**を作成:
```json
{
  "name": "your-book-title",
  "version": "1.0.0",
  "description": "{{BOOK_DESCRIPTION}}",
  "author": "Your Name <{{AUTHOR_EMAIL}}>",
  "license": "MIT",
  "scripts": {
    "init": "node scripts/init-template.js",
    "build": "node scripts/build.js",
    "build:incremental": "node scripts/build-incremental.js",
    "deploy": "bash scripts/deploy.sh",
    "deploy:full": "bash scripts/deploy.sh --full",
    "preview": "npm run build:incremental && npx http-server public -p 8080",
    "clean": "rm -rf public .build-meta.json",
    "lint": "markdownlint '**/*.md' --ignore node_modules --ignore public"
  },
  "devDependencies": {
    "fs-extra": "^11.1.0",
    "glob": "^8.0.3",
    "gray-matter": "^4.0.3",
    "http-server": "^14.1.1",
    "markdownlint-cli": "^0.33.0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/{{GITHUB_USERNAME}}/{{REPO_NAME}}.git"
  }
}
```

**_config.yml**を作成:
```yaml
# Jekyll設定
title: {{BOOK_TITLE}}
description: {{BOOK_DESCRIPTION}}
author: Your Name
baseurl: "/{{PUBLIC_REPO_NAME}}"
url: "https://{{GITHUB_USERNAME}}.github.io"

# テーマ
remote_theme: pages-themes/minimal@v0.2.0
plugins:
  - jekyll-remote-theme

# 言語設定
lang: ja

# その他の設定
show_downloads: false
google_analytics:

# ビルド設定
exclude:
  - README.md
  - package.json
  - package-lock.json
  - node_modules/
  - scripts/
  - .gitignore
  - LICENSE
  - CONTRIBUTING.md
  - src/
```

#### C. レイアウトテンプレート

```bash
# default.htmlをコピーして汎用化
cp /path/to/theoretical-cs-textbook/_layouts/default.html _layouts/

# プロジェクト固有の情報を削除
sed -i 's/コンピュータサイエンスの理論と数学的基礎/{{ site.title }}/g' _layouts/default.html
sed -i 's/理論計算機科学の教科書/{{ site.description }}/g' _layouts/default.html
```

#### D. GitHubワークフロー

**.github/workflows/deploy.yml**を作成:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy to public repository
      run: |
        git config --global user.name "GitHub Actions"
        git config --global user.email "actions@github.com"
        npm run deploy
      env:
        DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

### 3. サンプルコンテンツの追加

**src/chapters/chapter01/index.md**:
```markdown
# 第1章 はじめに

この章では、本書の概要と使い方について説明します。

## 1.1 本書の目的

[あなたの書籍の目的をここに記述]

## 1.2 対象読者

本書は以下の方を対象としています：

- [対象読者1]
- [対象読者2]
- [対象読者3]

## 1.3 本書の構成

[本書の構成について説明]

## まとめ

この章では、本書の概要について説明しました。次章では、[次の内容]について詳しく見ていきます。
```

**index.md** (ルートディレクトリ):
```markdown
# Book Title

Welcome to [{{BOOK_TITLE}}]. This is a comprehensive guide to [topic].

## Table of Contents

- [Chapter 1: Introduction](src/chapters/chapter01/)
- [Chapter 2: [Title]](src/chapters/chapter02/)
- More chapters coming soon...

## About the Author

[Author bio]

## License

This book is published under the [MIT License](LICENSE).

---

Published with [Book Publishing Template](https://github.com/{{GITHUB_USERNAME}}/book-publishing-template)
```

### 4. ドキュメントの追加

**README.md**:
```markdown
# 📚 Book Publishing Template

A professional book publishing system for technical documentation using GitHub Pages.

[English](#english) | [日本語](#japanese)

## English

### Features

- 🚀 **Dual Repository System**: Private repo for writing, public repo for publishing
- 📝 **Markdown-based**: Write in Markdown with full LaTeX math support
- 🎨 **Beautiful Output**: Clean, responsive design with syntax highlighting
- 🔧 **Incremental Builds**: Fast rebuilds by processing only changed files
- 🔒 **Private Content**: Automatic filtering of private comments and drafts
- 🌏 **Multi-platform**: GitHub Pages, Zenn, and Kindle support

### Quick Start

1. **Use this template**
   - Click "Use this template" button
   - Create your private repository

2. **Initial Setup**
   ```bash
   git clone https://github.com/{{GITHUB_USERNAME}}/{{PRIVATE_REPO_NAME}}.git
   cd {{PRIVATE_REPO_NAME}}
   npm install
   npm run init
   ```

3. **Configure GitHub**
   - Create a public repository for the published content
   - Add `DEPLOY_TOKEN` secret with repo access
   - Enable GitHub Pages on the public repository

4. **Start Writing**
   ```bash
   npm run build
   npm run preview
   npm run deploy
   ```

### Documentation

- [Complete Guide](book-template-guide.md)
- [Quick Start](template-quickstart.md)
- [Template Structure](template-structure.md)

---

## Japanese

### 機能

- 🚀 **デュアルリポジトリシステム**: 執筆用プライベート、公開用パブリック
- 📝 **Markdownベース**: LaTeX数式完全サポート
- 🎨 **美しい出力**: レスポンシブデザインとシンタックスハイライト
- 🔧 **インクリメンタルビルド**: 変更ファイルのみ処理で高速化
- 🔒 **プライベートコンテンツ**: 非公開コメントの自動フィルタリング
- 🌏 **マルチプラットフォーム**: GitHub Pages、Zenn、Kindle対応

### クイックスタート

1. **テンプレートを使用**
   - "Use this template"ボタンをクリック
   - プライベートリポジトリを作成

2. **初期設定**
   ```bash
   git clone https://github.com/{{GITHUB_USERNAME}}/{{PRIVATE_REPO_NAME}}.git
   cd {{PRIVATE_REPO_NAME}}
   npm install
   npm run init
   ```

3. **GitHub設定**
   - 公開用のパブリックリポジトリを作成
   - `DEPLOY_TOKEN`シークレットを追加
   - パブリックリポジトリでGitHub Pagesを有効化

4. **執筆開始**
   ```bash
   npm run build
   npm run preview
   npm run deploy
   ```

### ドキュメント

- [完全ガイド](book-template-guide.md)
- [クイックスタート](template-quickstart.md)
- [テンプレート構造](template-structure.md)

---

## License

This template is available under the MIT License. See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

Based on the publishing system used for the [Theoretical Computer Science Textbook](https://github.com/itdojp/{{PUBLIC_REPO_NAME}}).
```

### 5. その他の必要ファイル

**.gitignore**:
```
# Dependencies
node_modules/
package-lock.json

# Build output
public/
.build-meta.json

# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/
*.swp
*.swo
*~

# Logs
*.log
npm-debug.log*

# Environment
.env
.env.local

# Temporary files
*.tmp
*.temp
```

**LICENSE**:
```
MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 6. ドキュメントファイルのコピー

```bash
# 作成したガイドドキュメントをコピー
cp /path/to/theoretical-cs-textbook/book-template-guide.md .
cp /path/to/theoretical-cs-textbook/template-structure.md .
cp /path/to/theoretical-cs-textbook/template-quickstart.md .
```

## GitHubでのテンプレートリポジトリ作成

### 1. リポジトリの作成とプッシュ

```bash
# すべてのファイルをコミット
git add .
git commit -m "Initial template commit"

# GitHubでリポジトリを作成後
git remote add origin https://github.com/{{GITHUB_USERNAME}}/book-publishing-template.git
git push -u origin main
```

### 2. テンプレートリポジトリとして設定

1. GitHubでリポジトリを開く
2. Settings → General セクション
3. "Template repository"にチェック
4. Save

### 3. リポジトリの説明を追加

**About**セクションに以下を設定：
- **Description**: "📚 Professional book publishing template for GitHub Pages with dual-repo system, incremental builds, and multi-platform support"
- **Website**: デモサイトのURL（あれば）
- **Topics**: `github-pages`, `book`, `template`, `publishing`, `markdown`, `jekyll`, `technical-writing`

### 4. GitHub Pagesでデモサイト作成（オプション）

```bash
# gh-pagesブランチを作成してデモコンテンツをプッシュ
git checkout -b gh-pages
npm run build
cp -r public/* .
git add .
git commit -m "Demo site"
git push origin gh-pages
```

Settings → Pages → Source: Deploy from branch (gh-pages)

### 5. リリースの作成

1. Releases → Create a new release
2. Tag: `v1.0.0`
3. Title: "Initial Release - Book Publishing Template"
4. Description:
   ```markdown
   ## 🎉 Initial Release

   First stable release of the Book Publishing Template.

   ### Features
   - Dual repository system (private/public)
   - Incremental build system
   - GitHub Pages integration
   - LaTeX math support
   - Mermaid diagram support
   - Private content filtering
   - Multi-language support
   - Responsive design

   ### Getting Started
   See the [Quick Start Guide](template-quickstart.md) for instructions.
   ```

## 使用方法の案内

テンプレートリポジトリが完成したら、以下のように使用できます：

1. https://github.com/{{GITHUB_USERNAME}}/book-publishing-template にアクセス
2. "Use this template"ボタンをクリック
3. 新しいリポジトリ名を入力（例: `my-awesome-book-private`）
4. "Create repository from template"をクリック
5. クローンして`npm run init`を実行

## メンテナンス

### 定期的な更新

- 依存関係の更新
- セキュリティパッチの適用
- 新機能の追加
- ドキュメントの改善

### コミュニティ

- Issuesでの質問受付
- Pull Requestsの歓迎
- Discussionsでの意見交換

これで、再利用可能な書籍作成テンプレートリポジトリが完成します！