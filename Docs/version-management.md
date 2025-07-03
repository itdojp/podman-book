# バージョン管理機能ガイド

書籍プロジェクトの複数バージョンを効率的に管理し、改訂版や異なるエディションの管理を支援するバージョン管理機能の使用方法を説明します。

## 機能概要

### 主要機能

- **バージョンタグの管理**: セマンティックバージョニングに対応したバージョン管理
- **バージョン間の差分表示**: 任意の2つのバージョン間の変更内容を可視化
- **特定バージョンのビルド**: 指定したバージョンでビルドを実行
- **リリースノート自動生成**: バージョン間の変更から自動的にリリースノートを生成
- **Git連携**: Gitタグとの連携によるバージョン追跡

### バージョニング戦略

本システムはセマンティックバージョニング（Semantic Versioning）を採用しています：

- **メジャーバージョン** (X.0.0): 互換性のない大幅な変更
- **マイナーバージョン** (1.X.0): 後方互換性のある機能追加
- **パッチバージョン** (1.0.X): 後方互換性のあるバグ修正

## 基本的な使用方法

### 1. 新しいバージョンの作成

```bash
# 基本的なバージョン作成
npm run version:create 1.0.0 "初回リリース"

# 詳細な説明付き
node scripts/version-manager.js create 1.1.0 "新章追加とバグ修正"
```

### 2. バージョン一覧の確認

```bash
# 登録されている全バージョンを表示
npm run version:list

# 現在のバージョンを表示
npm run version:current
```

### 3. 特定バージョンでのビルド

```bash
# 指定バージョンでビルド
npm run build -- --version=1.2.0

# 通常のビルド（バージョン指定なし）
npm run build
```

### 4. バージョン間の比較

```bash
# バージョン比較（基本）
npm run compare-versions 1.0.0 1.1.0

# 比較結果をファイルに保存
npm run compare-versions 1.0.0 1.1.0 --save

# 最新の変更を確認
node scripts/version-compare.js latest 10
```

### 5. リリースノートの生成

```bash
# 特定バージョンのリリースノート生成
npm run release-notes generate 1.1.0

# 全バージョンのリリースノート生成
npm run release-notes:all

# 最新バージョンのリリースノート生成
npm run release-notes:latest
```

## 詳細機能

### バージョン情報の確認

```bash
# 特定バージョンの詳細情報を表示
npm run version:info 1.1.0
```

### Git連携

バージョン管理システムはGitと連携して動作します：

```bash
# Gitタグの作成（推奨）
git tag -a v1.1.0 -m "Version 1.1.0: 新章追加とバグ修正"
git push origin --tags
```

### 設定オプション

`book-config.json`でバージョン管理の動作をカスタマイズできます：

```json
{
  "versionManagement": {
    "enabled": true,
    "autoCreateTags": true,
    "autoGenerateReleaseNotes": true,
    "semanticVersioning": true,
    "releaseNotesInPublic": true,
    "versionInFooter": true
  }
}
```

#### 設定項目の説明

- `enabled`: バージョン管理機能の有効/無効
- `autoCreateTags`: ビルド時の自動タグ作成
- `autoGenerateReleaseNotes`: リリースノートの自動生成
- `semanticVersioning`: セマンティックバージョニングの強制
- `releaseNotesInPublic`: パブリックディレクトリへのリリースノートコピー
- `versionInFooter`: フッターへのバージョン情報表示

## ワークフロー例

### 1. 新しい章を追加する場合

```bash
# 1. 新しいブランチを作成
git checkout -b feature/chapter-5

# 2. 内容を編集・コミット
# ... 編集作業 ...
git add .
git commit -m "feat: Add chapter 5 on advanced topics"

# 3. メインブランチにマージ
git checkout main
git merge feature/chapter-5

# 4. 新しいバージョンを作成
npm run version:create 1.2.0 "第5章「応用編」を追加"

# 5. そのバージョンでビルド
npm run build -- --version=1.2.0

# 6. リリースノートを生成
npm run release-notes generate 1.2.0
```

### 2. バグ修正の場合

```bash
# 1. 修正作業
git checkout -b fix/typo-chapter2
# ... 修正作業 ...
git commit -m "fix: Correct typos in chapter 2"

# 2. マージ
git checkout main
git merge fix/typo-chapter2

# 3. パッチバージョンを作成
npm run version:create 1.2.1 "第2章の誤字修正"

# 4. ビルドとリリースノート生成
npm run build -- --version=1.2.1
npm run release-notes generate 1.2.1
```

### 3. リリース前の確認

```bash
# 1. 前回バージョンからの変更を確認
npm run compare-versions 1.1.0 1.2.0

# 2. 最新の変更履歴を確認
node scripts/version-compare.js latest 20

# 3. 全バージョンのリリースノートを更新
npm run release-notes:all
```

## 出力ファイル

### バージョン管理ファイル

- `version-config.json`: バージョンメタデータの保存
- `release-notes/`: リリースノートファイル
- `version-comparisons/`: バージョン比較結果

### パブリックディレクトリ

ビルド時に以下がパブリックディレクトリにコピーされます：

- `public/release-notes/`: リリースノート
- バージョン情報がコンテンツに埋め込まれる（設定による）

## トラブルシューティング

### よくある問題

1. **無効なバージョン形式エラー**
   ```bash
   Error: Invalid version format: 1.0. Use semantic versioning (e.g., 1.0.0)
   ```
   → セマンティックバージョニング形式（X.Y.Z）を使用してください

2. **バージョンが見つからないエラー**
   ```bash
   Error: Version 1.2.0 not found
   ```
   → `npm run version:list`で利用可能なバージョンを確認してください

3. **Git関連エラー**
   ```bash
   Warning: Failed to get Git changes
   ```
   → Gitリポジトリが正しく初期化されているか確認してください

### ログとデバッグ

詳細な情報が必要な場合：

```bash
# バージョン情報の詳細表示
npm run version:info 1.1.0

# 比較結果の詳細保存
npm run compare-versions 1.0.0 1.1.0 --save
# → version-comparisons/ ディレクトリに詳細な JSON と Markdown が保存されます
```

## ベストプラクティス

### バージョニング

1. **一貫性のあるバージョニング**: プロジェクト全体でセマンティックバージョニングを遵守
2. **意味のある説明**: バージョン作成時には分かりやすい説明を付与
3. **定期的なリリース**: 大きな変更は小分けにして定期的にリリース

### ブランチ管理

1. **機能ブランチ**: 新機能や修正は専用ブランチで作業
2. **分かりやすいコミットメッセージ**: `feat:`, `fix:`, `docs:` などのプレフィックスを使用
3. **マージ前のテスト**: メインブランチにマージ前に必ずビルドテストを実行

### リリース管理

1. **リリース前チェック**: バージョン比較で変更内容を確認
2. **リリースノート**: 自動生成されたリリースノートを必要に応じて編集
3. **タグ管理**: 重要なリリースはGitタグも作成

これらの機能を活用することで、書籍プロジェクトの複数バージョンを効率的に管理し、改訂版の作成やメンテナンスを大幅に簡素化できます。