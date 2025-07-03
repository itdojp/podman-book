# 書籍作成システム テンプレート構造

## 必要最小限のファイル構成

新しい書籍プロジェクトを開始するために必要な最小限のファイル構成です。

```plaintext
{{PRIVATE_REPO_NAME}}/
├── package.json                 # [要編集] プロジェクト設定
├── _config.yml                  # [要編集] Jekyll設定
├── .gitignore                   # Git除外設定
├── README.md                    # [要編集] プロジェクト説明
├── index.md                     # [要編集] トップページ
├── _layouts/
│   └── default.html            # レイアウトテンプレート
├── assets/
│   └── images/
│       └── favicon.png         # [要置換] ファビコン
├── scripts/
│   ├── build.js                # ビルドスクリプト
│   ├── build-incremental.js    # インクリメンタルビルド
│   ├── deploy.sh               # デプロイスクリプト
│   └── init-template.js        # [新規] 初期化スクリプト
├── src/
│   └── chapters/
│       └── chapter01/
│           └── index.md        # [要編集] サンプル章
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions設定
└── template-config.json        # [新規] テンプレート設定
```

## セットアップ手順

### 1. テンプレートのダウンロード

```bash
# テンプレートリポジトリをクローン
git clone https://github.com/{{GITHUB_USERNAME}}/book-template.git {{PRIVATE_REPO_NAME}}
cd {{PRIVATE_REPO_NAME}}

# Gitの初期化
rm -rf .git
git init
```

### 2. 初期設定の実行

```bash
# 必要な依存関係をインストール
npm install

# 初期化スクリプトを実行
npm run init
```

---

## Template Structure

### Minimum Required File Structure

This is the minimum file structure required to start a new book project.

```plaintext
{{PRIVATE_REPO_NAME}}/
├── package.json                 # [Edit] Project settings
├── _config.yml                  # [Edit] Jekyll settings
├── .gitignore                   # Git ignore settings
├── README.md                    # [Edit] Project description
├── index.md                     # [Edit] Top page
├── _layouts/
│   └── default.html            # Layout template
├── assets/
│   └── images/
│       └── favicon.png         # [Replace] Favicon
├── scripts/
│   ├── build.js                # Build script
│   ├── build-incremental.js    # Incremental build
│   ├── deploy.sh               # Deploy script
│   └── init-template.js        # [New] Initialization script
├── src/
│   └── chapters/
│       └── chapter01/
│           └── index.md        # [Edit] Sample chapter
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions settings
└── template-config.json        # [New] Template settings
```

### Setup Steps

#### 1. Download the Template

```bash
# Clone the template repository
git clone https://github.com/{{GITHUB_USERNAME}}/book-template.git {{PRIVATE_REPO_NAME}}
cd {{PRIVATE_REPO_NAME}}

# Initialize Git
rm -rf .git
git init
```

#### 2. Run Initial Setup

```bash
# Install required dependencies
npm install

# Run initialization script
npm run init
```

### 3. 設定ファイルの編集

#### template-config.json
```json
{
  "bookTitle": "あなたの書籍タイトル",
  "bookDescription": "書籍の説明",
  "authorName": "著者名",
  "authorEmail": "author@example.com",
  "githubUsername": "{{GITHUB_USERNAME}}",
  "publicRepoName": "{{PUBLIC_REPO_NAME}}",
  "language": "ja",
  "features": {
    "math": true,
    "mermaid": true,
    "zenn": true,
    "kindle": false
  }
}
```

### 4. GitHub設定

1. プライベートリポジトリの作成：
```bash
git remote add origin https://github.com/{{GITHUB_USERNAME}}/{{PRIVATE_REPO_NAME}}.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

2. パブリックリポジトリの作成：
- GitHubで`{{PUBLIC_REPO_NAME}}`リポジトリを作成
- 空のリポジトリとして初期化（READMEなし）

3. デプロイトークンの設定：
- GitHubで個人アクセストークンを生成（repo権限）
- プライベートリポジトリのSettings → Secrets → `DEPLOY_TOKEN`として追加

## カスタマイズポイント

### 必須の編集箇所

1. **package.json**
```json
{
  "name": "your-book-title",
  "description": "{{BOOK_DESCRIPTION}}",
  "author": "Your Name <{{AUTHOR_EMAIL}}>"
}
```

2. **_config.yml**
```yaml
title: あなたの書籍タイトル
description: 書籍の説明
author: あなたの名前
baseurl: "/{{PUBLIC_REPO_NAME}}"
url: "https://{{GITHUB_USERNAME}}.github.io"
```

3. **index.md**
- 書籍のトップページ内容
- 目次へのリンク
- 著者紹介

4. **README.md**
- プロジェクトの説明
- セットアップ手順
- 貢献ガイドライン

### オプション機能の設定

#### Zenn連携を使用する場合
```bash
# zenn-chaptersディレクトリを作成
mkdir zenn-chapters

# zenn-book-config.jsonを作成
cp templates/zenn-book-config.template.json zenn-book-config.json
# 編集してカスタマイズ
```

#### 数式・図表を使用しない場合
`_layouts/default.html`から以下を削除：
- MathJax関連のスクリプト
- Mermaid関連のスクリプト

## 初期化スクリプト (init-template.js)

```javascript
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with dashes
    .replace(/-+/g, '-')          // Replace multiple consecutive dashes with single dash
    .replace(/^-|-$/g, '');       // Remove leading and trailing dashes
}

function createPrivateRepoName(publicRepoName) {
  if (publicRepoName.endsWith('-public')) {
    return publicRepoName.replace('-public', '-private');
  } else if (publicRepoName.endsWith('public')) {
    return publicRepoName.replace('public', '-private');
  } else {
    return publicRepoName + '-private';
  }
}

async function initTemplate() {
  console.log('📚 書籍テンプレートの初期化を開始します...\n');

  // 設定情報の収集
  const config = {
    bookTitle: await prompt('書籍のタイトル: '),
    bookDescription: await prompt('書籍の説明: '),
    authorName: await prompt('著者名: '),
    authorEmail: await prompt('メールアドレス: '),
    githubUsername: await prompt('GitHubユーザー名: '),
    publicRepoName: await prompt('公開リポジトリ名 (例: {{PUBLIC_REPO_NAME}}): '),
  };

  // package.jsonの更新
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.name = createSlug(config.bookTitle);
  packageJson.description = config.bookDescription;
  packageJson.author = `${config.authorName} <${config.authorEmail}>`;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  // _config.ymlの更新
  let configYml = fs.readFileSync('_config.yml', 'utf8');
  configYml = configYml.replace(/title: .+/, `title: ${config.bookTitle}`);
  configYml = configYml.replace(/description: .+/, `description: ${config.bookDescription}`);
  configYml = configYml.replace(/author: .+/, `author: ${config.authorName}`);
  configYml = configYml.replace(/baseurl: .+/, `baseurl: "/${config.publicRepoName}"`);
  configYml = configYml.replace(/url: .+/, `url: "https://${config.githubUsername}.github.io"`);
  fs.writeFileSync('_config.yml', configYml);

  // deploy.shの更新
  let deployScript = fs.readFileSync('scripts/deploy.sh', 'utf8');
  deployScript = deployScript.replace(/PUBLIC_REPO=.+/, `PUBLIC_REPO="${config.publicRepoName}"`);
  deployScript = deployScript.replace(/GITHUB_USER=.+/, `GITHUB_USER="${config.githubUsername}"`);
  fs.writeFileSync('scripts/deploy.sh', deployScript);

  console.log('\n✅ テンプレートの初期化が完了しました！');
  console.log('\n次のステップ:');
  console.log('1. GitHubで以下のリポジトリを作成してください:');
  
  // Generate private repo name based on public repo name for consistency
  const privateRepoName = createPrivateRepoName(config.publicRepoName);
  
  console.log(`   - プライベート: ${config.githubUsername}/${privateRepoName}`);
  console.log(`   - パブリック: ${config.githubUsername}/${config.publicRepoName}`);
  console.log('2. DEPLOY_TOKENをGitHub Secretsに設定してください');
  console.log('3. npm run buildでビルドを実行してください');

  rl.close();
}

initTemplate().catch(console.error);
```

## 使用開始チェックリスト

- [ ] template-config.jsonを編集
- [ ] npm run init-templateを実行
- [ ] GitHubリポジトリ（プライベート・パブリック）を作成
- [ ] DEPLOY_TOKENを設定
- [ ] 初回コミット・プッシュ
- [ ] GitHub Pagesを有効化（パブリックリポジトリ）
- [ ] 最初の章を作成
- [ ] npm run buildでビルドテスト
- [ ] npm run deployでデプロイテスト

## よくある質問

### Q: 既存のMarkdownファイルを移行するには？

A: `src/chapters/`ディレクトリに配置し、`npm run build`を実行してください。

### Q: 章の順序を変更するには？

A: ファイル名の先頭に番号を付けるか、`index.md`で明示的に順序を指定してください。

### Q: プライベートコンテンツを追加するには？

A: `draft.md`、`notes.md`ファイルを使用するか、コメントで`<!-- PRIVATE: -->`を使用してください。

### Q: ビルドをカスタマイズするには？

A: `scripts/build.js`を編集してください。除外パターンや処理ロジックを変更できます。

## 📝 書籍コンテンツの作成方法

### 🎯 新機能: 自動目次生成

ビルドシステムは自動的にすべてのMarkdownファイルから見出しを抽出し、目次を生成します。

#### 目次の設定

`book-config.json` で目次生成をカスタマイズできます：

```json
{
  "tableOfContents": {
    "enabled": true,
    "outputFile": "table-of-contents.md",
    "title": "目次",
    "maxDepth": 3,
    "includeNumbers": true,
    "autoLink": true
  }
}
```

#### 生成される目次の例

```markdown
# 目次

- [はじめに](introduction/index.md#はじめに)
  - [本書の構成](introduction/index.md#本書の構成)
  - [対象読者](introduction/index.md#対象読者)
- [第1章: 基礎概念](chapters/chapter01/index.md#基礎概念)
  - [1.1 概要](chapters/chapter01/index.md#11-概要)
- [付録A: 参考資料](appendices/appendix01/index.md#付録a-参考資料)
- [あとがき](afterword/index.md#あとがき)
```

### 🔧 新機能: 柔軟なコンテンツ構成

#### book-config.json による設定

コンテンツの構成を `book-config.json` で自由にカスタマイズできます：

```json
{
  "contentSections": [
    {
      "name": "introduction",
      "title": "はじめに",
      "directory": "introduction",
      "enabled": true,
      "order": 1
    },
    {
      "name": "chapters",
      "title": "本章", 
      "directory": "chapters",
      "enabled": true,
      "order": 2,
      "numbering": true
    },
    {
      "name": "tutorials",
      "title": "チュートリアル",
      "directory": "tutorials",
      "enabled": true,
      "order": 3,
      "numbering": true
    },
    {
      "name": "appendices",
      "title": "付録",
      "directory": "appendices", 
      "enabled": true,
      "order": 4,
      "numbering": true,
      "numberingPrefix": "付録"
    }
  ]
}
```

#### カスタマイズ可能な項目

- **セクションの追加/削除**: `enabled` で制御
- **順序の変更**: `order` プロパティで制御  
- **ディレクトリ名**: `directory` で指定
- **番号付け**: `numbering` で章番号の有無を制御
- **番号のプレフィックス**: `numberingPrefix` でカスタマイズ

#### 除外パターンのカスタマイズ

```json
{
  "excludePatterns": [
    "draft.md",
    "notes.md", 
    "private.md",
    "*.tmp",
    "test_*.md"
  ],
  "contentExcludePatterns": [
    "<!-- TODO:",
    "<!-- FIXME:",
    "<!-- PRIVATE:",
    "<!-- INSTRUCTOR:"
  ]
}
```

### コンテンツの構成と順序

書籍は以下の順序で構成されます：

1. **はじめに** (`src/introduction/`)
2. **本章** (`src/chapters/`)
3. **付録** (`src/appendices/`)
4. **あとがき** (`src/afterword/`)

この順序は自動的に保持され、ビルド時に適切に配置されます。

### ファイル命名規則

#### 自動的に公開されるファイル

以下のディレクトリ構造に配置されたMarkdownファイルは自動的に公開版に含まれます：

```plaintext
src/
├── introduction/           # はじめに
│   └── index.md           # 必須: メインコンテンツ
├── chapters/              # 本章
│   ├── chapter01/
│   │   ├── index.md       # 必須: 章のメインコンテンツ
│   │   ├── draft.md       # 除外: 下書き
│   │   └── notes.md       # 除外: 執筆メモ
│   └── chapter02/
│       └── index.md
├── appendices/            # 付録
│   ├── appendix01/
│   │   └── index.md       # 付録A
│   └── appendix02/
│       └── index.md       # 付録B
└── afterword/             # あとがき
    └── index.md           # 必須: メインコンテンツ
```

#### 除外されるファイル

以下のファイル名パターンは公開版から自動的に除外されます：

- `draft.md` - 下書き
- `notes.md` - 執筆メモ
- `solutions.md` - 解答例
- `instructor.md` - 講師向け資料
- `private.md` - プライベートメモ
- `*.tmp` - 一時ファイル

#### プライベートコンテンツ

以下のHTMLコメントは公開版で自動的に削除されます：

```markdown
<!-- PRIVATE: 内部メモ -->
<!-- INSTRUCTOR: 講師向け情報 -->
<!-- TODO: タスク -->
<!-- FIXME: 修正が必要 -->
```

### コンテンツの追加方法

#### 1. はじめにの作成

```bash
mkdir src/introduction
```

`src/introduction/index.md`を作成：

```markdown
# はじめに

本書は[書籍タイトル]について...

## 本書の構成

本書は以下の構成になっています：

1. **はじめに** - 本書の概要
2. **第1章〜** - メインコンテンツ
3. **付録** - 補足資料
4. **あとがき** - 著者からのメッセージ
```

#### 2. 新しい章の追加

```bash
mkdir src/chapters/chapter02
```

`src/chapters/chapter02/index.md`を作成：

```markdown
# 第2章 [タイトル]

## 2.1 概要

章の概要...

## 2.2 詳細

詳細な説明...
```

#### 3. 付録の追加

```bash
mkdir src/appendices/appendix01
```

`src/appendices/appendix01/index.md`を作成：

```markdown
# 付録A: [タイトル]

## A.1 用語集

### [用語1]
説明...

## A.2 参考文献

1. [文献1]
2. [文献2]
```

#### 4. あとがきの作成

```bash
mkdir src/afterword
```

`src/afterword/index.md`を作成：

```markdown
# あとがき

この書籍を最後まで読んでいただき、ありがとうございました。

## 執筆の経緯

本書を執筆したきっかけは...
```

### ビルドとプレビュー

```bash
# フルビルド
npm run build

# インクリメンタルビルド（変更されたファイルのみ）
npm run build:incremental

# ローカルプレビュー
npm run preview
```

### 🚀 使用例とカスタマイズ

#### 例1: 技術書の構成

```json
{
  "contentSections": [
    {
      "name": "preface",
      "title": "はじめに",
      "directory": "preface",
      "enabled": true,
      "order": 1
    },
    {
      "name": "basics",
      "title": "基礎編",
      "directory": "basics",
      "enabled": true,
      "order": 2,
      "numbering": true
    },
    {
      "name": "advanced",
      "title": "応用編", 
      "directory": "advanced",
      "enabled": true,
      "order": 3,
      "numbering": true
    },
    {
      "name": "references",
      "title": "参考資料",
      "directory": "references",
      "enabled": true,
      "order": 4
    }
  ],
  "tableOfContents": {
    "enabled": true,
    "title": "技術書 目次",
    "maxDepth": 4,
    "includeNumbers": true
  }
}
```

#### 例2: 教材の構成

```json
{
  "contentSections": [
    {
      "name": "introduction",
      "title": "導入",
      "directory": "introduction",
      "enabled": true,
      "order": 1
    },
    {
      "name": "lessons",
      "title": "レッスン",
      "directory": "lessons",
      "enabled": true,
      "order": 2,
      "numbering": true
    },
    {
      "name": "exercises",
      "title": "演習",
      "directory": "exercises", 
      "enabled": true,
      "order": 3,
      "numbering": true
    },
    {
      "name": "solutions",
      "title": "解答例",
      "directory": "solutions",
      "enabled": false,
      "order": 4
    }
  ]
}
```

#### 目次のカスタマイズ例

```json
{
  "tableOfContents": {
    "enabled": true,
    "outputFile": "contents.md",
    "title": "Table of Contents",
    "maxDepth": 2,
    "includeNumbers": false
  }
}
```