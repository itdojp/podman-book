# ホットリロード機能

このテンプレートには開発効率を向上させるホットリロード機能が含まれています。

## 機能概要

- **ファイル変更の自動検出**: `src/`, `_layouts/`, `assets/` などのファイル変更を監視
- **自動ビルド**: 変更されたファイルのみを増分ビルド
- **ブラウザ自動更新**: WebSocket経由でブラウザに更新を通知
- **エラー通知**: ビルドエラーをブラウザに表示
- **マルチデバイス対応**: 同一ネットワーク内の複数デバイスで同期

## 使用方法

### 開発サーバーの起動

```bash
npm run dev
```

これにより以下が起動します：
- HTTPサーバー (http://localhost:8080)
- WebSocketサーバー (ws://localhost:8081)
- ファイル監視システム

### アクセス方法

- **ローカル**: http://localhost:8080
- **同一ネットワーク**: http://[あなたのIP]:8080 (モバイル/タブレット用)

### 監視対象ファイル

デフォルトで以下のファイル・ディレクトリを監視します：

- `src/` - ソースコンテンツ
- `_layouts/` - Jekyllレイアウト
- `_config.yml` - Jekyll設定
- `index.md` - トップページ
- `README.md` - READMEファイル  
- `assets/` - 静的アセット

## 設定

`book-config.json` の `hotReload` セクションで設定をカスタマイズできます：

```json
{
  "hotReload": {
    "enabled": true,
    "port": 8080,
    "wsPort": 8081,
    "debounceDelay": 100,
    "watchPaths": [
      "src",
      "_layouts",
      "_config.yml",
      "index.md",
      "README.md",
      "assets"
    ],
    "ignorePatterns": [
      "**/node_modules/**",
      "**/public/**",
      "**/.git/**",
      "**/.build-meta.json"
    ]
  }
}
```

### 設定項目

- `enabled`: ホットリロード機能の有効/無効
- `port`: HTTPサーバーのポート番号
- `wsPort`: WebSocketサーバーのポート番号
- `debounceDelay`: ファイル変更検出の遅延時間（ミリ秒）
- `watchPaths`: 監視対象パス
- `ignorePatterns`: 監視から除外するパターン

## クライアント機能

ブラウザ側では以下の機能が提供されます：

### 自動更新通知

- 🔨 **ビルド開始**: ファイル変更時に表示
- ✅ **ビルド完了**: ビルド成功時に表示  
- ❌ **エラー表示**: ビルドエラー時に詳細を表示
- 🔄 **ページリロード**: 成功時に自動更新

### WebSocket再接続

- 接続断時の自動再接続
- 接続状態のコンソール表示
- エラー時の詳細ログ

## 開発ワークフロー

1. `npm run dev` でサーバーを起動
2. ブラウザで http://localhost:8080 にアクセス
3. ソースファイルを編集・保存
4. ブラウザが自動的に更新される

## トラブルシューティング

### ポート競合

別のアプリケーションがポートを使用している場合：

```json
{
  "hotReload": {
    "port": 3000,
    "wsPort": 3001
  }
}
```

### ファイル監視エラー

大量のファイルを扱う場合、システムのファイル監視制限に達する可能性があります：

```bash
# Linux/macOS
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### ビルドエラーが続く場合

手動でクリーンビルドを実行：

```bash
npm run clean
npm run build
npm run dev
```

## 本番環境での無効化

本番環境では自動的にホットリロード機能は無効になります。明示的に無効にする場合：

```json
{
  "hotReload": {
    "enabled": false
  }
}
```