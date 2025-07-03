# ビルドスクリプトエラーハンドリング仕様書

## 概要

ビルドスクリプトのエラーハンドリングが強化され、問題発生時の原因特定と復旧が容易になりました。

## 新機能

### 1. 統一的なエラーハンドリング機構

- **カスタムエラークラス (`BuildError`)**
  - 構造化されたエラー情報
  - エラーコードによる分類
  - コンテキスト情報の保持

- **エラーコード体系**
  ```
  E001-E099: ファイルシステムエラー
  E101-E199: 設定エラー  
  E201-E299: ビルドエラー
  E301-E399: デプロイエラー
  E999:      汎用エラー
  ```

### 2. 詳細なエラーログの出力

- **ログレベル対応**
  - `DEBUG`: 詳細なデバッグ情報
  - `INFO`: 一般的な情報メッセージ
  - `WARN`: 警告メッセージ
  - `ERROR`: エラーメッセージ

- **構造化ログ**
  - タイムスタンプ付き
  - コンテキスト情報を含む
  - ファイル出力対応

### 3. リトライ機能

- **自動リトライ**
  - 設定可能な最大試行回数
  - 指数バックオフによる待機時間
  - リトライ条件の指定

- **使用例**
  ```javascript
  await RetryManager.retry(async () => {
    await fs.copyFile(src, dest);
  }, {
    maxRetries: 3,
    delay: 1000,
    retryCondition: (error) => error.code === 'EMFILE'
  });
  ```

### 4. エラー時のロールバック処理

- **RollbackManager**
  - 操作の逆順実行
  - 部分的な失敗に対する回復
  - ロールバック操作の登録と実行

- **使用例**
  ```javascript
  const rollback = new RollbackManager();
  rollback.addOperation(
    async () => await fs.rm(tempDir, { recursive: true }),
    '一時ディレクトリの削除'
  );
  ```

### 5. エラーレポートの自動生成

- **包括的なエラーレポート**
  - 発生したすべてのエラーの詳細
  - 自動診断機能
  - よくあるエラーパターンの特定

### 6. よくあるエラーの自動診断

- **パターン認識**
  - ファイル不在エラー (ENOENT)
  - アクセス権限エラー (EACCES)
  - メモリ不足エラー
  - ファイルハンドル不足エラー

## 環境変数

### ログ制御

```bash
# デバッグモードの有効化
export DEBUG=true

# ログファイルの指定
export LOG_FILE="/path/to/logfile.log"

# ログレベルの設定
export LOG_LEVEL=1  # 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR
```

### デプロイスクリプト用

```bash
# GitHubトークン（CI環境）
export GITHUB_TOKEN="your_token_here"

# リポジトリ情報
export GITHUB_REPOSITORY="username/repo-name"

# Git設定
export GIT_USER_EMAIL="user@example.com"
export GIT_USER_NAME="User Name"

# デプロイ設定
export DEPLOY_BRANCH="gh-pages"
export BUILD_DIR="public"
export PUBLIC_REPO_URL="https://github.com/user/repo.git"
```

## エラーハンドリングの使用方法

### 基本的な使用方法

```javascript
const { 
  BuildError, 
  RetryManager, 
  RollbackManager, 
  ERROR_CODES, 
  logger 
} = require('./utils/error-handler');

try {
  // 処理実行
  await someOperation();
  logger.info('処理が成功しました');
} catch (error) {
  throw new BuildError(
    '処理に失敗しました',
    ERROR_CODES.BUILD_PROCESS_FAILED,
    { originalError: error.message }
  );
}
```

### リトライとロールバックの組み合わせ

```javascript
const rollback = new RollbackManager();

try {
  // ディレクトリ作成
  await ensureDir(outputDir);
  rollback.addOperation(
    async () => await fs.rm(outputDir, { recursive: true }),
    '出力ディレクトリの削除'
  );
  
  // ファイルコピー（リトライ付き）
  await RetryManager.retry(async () => {
    await copyFiles(src, dest);
  }, { maxRetries: 3 });
  
  // 成功時はロールバック操作をクリア
  rollback.clear();
  
} catch (error) {
  // エラー時はロールバック実行
  await rollback.execute();
  throw error;
}
```

## トラブルシューティング

### よくあるエラーと対処法

#### 1. ファイルアクセスエラー

**エラー**: `EACCES: permission denied`
**対処法**:
```bash
# ファイル権限の確認
ls -la filename

# 権限の修正
chmod 644 filename
chmod 755 directory
```

#### 2. ファイル不在エラー

**エラー**: `ENOENT: no such file or directory`
**対処法**:
- ファイルパスの確認
- 相対パスと絶対パスの確認
- ディレクトリ構造の確認

#### 3. メモリ不足エラー

**エラー**: `FATAL ERROR: Ineffective mark-compacts near heap limit`
**対処法**:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 4. ネットワークエラー

**エラー**: Git操作やHTTPSアクセスの失敗
**対処法**:
- インターネット接続の確認
- プロキシ設定の確認
- GitHubトークンの有効性確認

### デバッグモード

詳細なログを出力する方法：

```bash
# 環境変数でデバッグモードを有効化
export DEBUG=true
export LOG_LEVEL=0

# ビルド実行
npm run build

# ログファイル出力
export LOG_FILE="build.log"
npm run build
```

### エラーレポートの確認

エラー発生時に自動生成されるレポートには以下が含まれます：

1. **エラー一覧**: 発生したすべてのエラーの詳細
2. **タイムスタンプ**: エラー発生時刻
3. **コンテキスト情報**: ファイルパス、設定値等
4. **自動診断**: よくあるエラーパターンの特定と解決策

## まとめ

この強化されたエラーハンドリングシステムにより：

- エラーの原因特定が容易になりました
- 一時的な問題に対する自動復旧が可能になりました
- 障害発生時の影響を最小限に抑えられます
- 運用時のトラブルシューティングが効率化されます

問題が発生した場合は、生成されたエラーレポートを確認し、自動診断の内容に従って対処してください。