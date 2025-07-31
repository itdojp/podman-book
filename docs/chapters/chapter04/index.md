---
title: "第7章 コンテナの基本操作"
---

# 第7章 コンテナの基本操作

### 本章の意義と学習目標

**なぜ基本操作を体系的に学ぶ必要があるのか**

「動かすだけなら簡単」というコンテナですが、本番環境で安定運用するには、各操作の意味と影響を深く理解する必要があります：

1. **トラブルシューティング能力**: 問題発生時に適切な調査・対処ができる
2. **パフォーマンス最適化**: リソース使用を最小限に抑えた効率的な運用
3. **セキュリティ確保**: 各操作のセキュリティ影響を理解し、適切に制御
4. **自動化の基礎**: スクリプト化やCI/CD統合のための知識獲得

本章では、単なる操作手順ではなく、「なぜその操作が必要か」「どのような場面で使うか」を理解します。

### 4.1 コンテナライフサイクル

#### なぜライフサイクルを理解することが重要か

コンテナの状態遷移を理解することで：
- **リソース管理**: 各状態でのリソース消費を把握し、最適化できる
- **障害対応**: 異常状態を正確に判断し、適切な復旧手順を選択できる
- **自動化設計**: 状態に応じた適切な制御フローを実装できる

#### 4.1.1 基本的なライフサイクル

```
Created → Running → Paused → Stopped → Removed
         ↓         ↑
         └─────────┘
```

**各状態の意味と実務での使い分け**

**Created（作成済み）**
- リソースは割り当て済みだが、プロセスは未起動
- 用途：事前準備、設定確認、デバッグ

**Running（実行中）**
- アプリケーションが動作中
- リソースを消費し、ネットワーク通信可能

**Paused（一時停止）**
- プロセスは凍結、メモリは保持
- 用途：一時的なメンテナンス、スナップショット取得

**Stopped（停止）**
- プロセス終了、ディスクデータは保持
- 用途：設定変更、トラブルシューティング

**状態遷移コマンドとその効果**
```bash
# 作成（実行はしない）- なぜ必要か
podman create --name mycontainer nginx:alpine
# → 設定を事前確認、複数コンテナの同時起動準備

# 開始 - 適切なタイミング
podman start mycontainer
# → 依存サービス起動後、ヘルスチェック後など

# 一時停止 - どんな時に使うか
podman pause mycontainer
# → バックアップ取得時、一時的な負荷軽減

# 再開
podman unpause mycontainer

# 停止 - graceful shutdownの重要性
podman stop mycontainer
# → SIGTERMを送信し、アプリケーションの正常終了を待つ
# → データベースなどでは必須（強制終了はデータ破損の原因）

# 削除 - リソースの完全解放
podman rm mycontainer
# → ディスク容量の解放、名前の再利用
```

#### 4.1.2 実行オプション詳解

**なぜ多様なオプションが必要なのか**

コンテナは様々な用途で使用され、それぞれに最適な設定が異なります：

**基本的な実行パターンとその用途**

```bash
# フォアグラウンド実行 - デバッグ時
podman run nginx:alpine
# → ログがリアルタイムで確認でき、Ctrl+Cで停止可能

# バックグラウンド実行 - 本番サービス
podman run -d nginx:alpine
# → デーモンとして動作、ログは別途確認

# インタラクティブ実行 - 開発・調査
podman run -it alpine /bin/sh
# → コンテナ内で直接作業、設定確認やデバッグ

# 実行後自動削除 - 一時的なタスク
podman run --rm alpine echo "Hello"
# → ビルドツール、テスト実行など、実行後のクリーンアップ不要
```

**高度な実行オプションの実務的価値**

```bash
# リソース制限 - なぜ必要か
podman run -d \
  --name limited-container \
  --memory="512m" \         # メモリ暴走によるOOMキラー発動を防ぐ
  --memory-reservation="256m" \  # 最低保証メモリ（QoS確保）
  --memory-swap="1g" \      # スワップ使用量も制限（パフォーマンス劣化防止）
  --cpus="1.5" \           # CPU使用率を1.5コア相当に制限
  --cpu-shares="512" \     # 相対的な優先度（デフォルト1024の半分）
  nginx:alpine

# なぜこれらの制限が重要か：
# 1. 予測可能な動作: リソース不足時の挙動が予測可能
# 2. 公平性: マルチテナント環境での公平なリソース配分
# 3. コスト管理: クラウド環境でのリソース使用量制御

# 環境変数とラベル - 設定管理のベストプラクティス
podman run -d \
  --name labeled-container \
  --env NODE_ENV=production \     # アプリケーション設定
  --env-file .env \              # 機密情報は別ファイルで管理
  --label version=1.0 \          # メタデータ付与
  --label environment=prod \     # 運用での分類・フィルタリング
  nginx:alpine

# ラベルの活用例：
# - 自動バックアップ対象の識別
# - 監視対象の自動検出
# - コスト配賦のためのタグ付け

# ネットワーク設定 - 本番環境での考慮事項
podman run -d \
  --name networked-container \
  --hostname myapp \           # アプリケーション内での自己識別
  --dns 8.8.8.8 \             # 企業DNSサーバーの指定
  --dns-search example.com \   # 短縮名での名前解決
  --add-host db:10.0.0.100 \  # /etc/hostsへの静的エントリ追加
  nginx:alpine

# これらの設定が解決する問題：
# - 内部DNSサーバーへの依存
# - レガシーアプリケーションのハードコードされたホスト名
# - 開発/本番環境の切り替え
```

### 4.2 イメージ管理

#### 4.2.1 イメージの取得と管理

**イメージ検索**
```bash
# Docker Hubから検索
podman search nginx --limit 5

# 特定レジストリから検索
podman search quay.io/nginx

# フィルタリング
podman search nginx --filter stars=10 --filter is-official=true
```

**イメージの取得**
```bash
# 最新版取得
podman pull nginx

# 特定タグ取得
podman pull nginx:1.21-alpine

# 別レジストリから取得
podman pull quay.io/podman/stable

# 全タグ取得
podman pull --all-tags alpine
```

**イメージ管理**
```bash
# イメージ一覧
podman images

# 詳細情報
podman inspect nginx:alpine

# イメージ履歴
podman history nginx:alpine

# 未使用イメージ削除
podman image prune

# 全イメージ削除
podman rmi -a
```

#### 4.2.2 イメージのエクスポート/インポート

```bash
# イメージをtarファイルに保存
podman save -o nginx.tar nginx:alpine

# 圧縮保存
podman save nginx:alpine | gzip > nginx.tar.gz

# tarファイルからロード
podman load -i nginx.tar

# 標準入力からロード
gunzip -c nginx.tar.gz | podman load

# コンテナからイメージ作成
podman commit mycontainer mynewimage:latest
```

### 4.3 コンテナ内での作業

#### 4.3.1 実行中コンテナへのアクセス

```bash
# bashシェルに接続
podman exec -it mycontainer /bin/bash

# 特定ユーザーとして実行
podman exec -it --user nginx mycontainer /bin/sh

# 作業ディレクトリ指定
podman exec -it --workdir /app mycontainer pwd

# 環境変数を設定して実行
podman exec -it --env DEBUG=true mycontainer env
```

#### 4.3.2 ファイルのコピー

```bash
# ホストからコンテナへ
podman cp ./config.yaml mycontainer:/etc/app/

# コンテナからホストへ
podman cp mycontainer:/var/log/app.log ./

# ディレクトリのコピー
podman cp ./webapp mycontainer:/var/www/html

# アーカイブとして抽出
podman export mycontainer > container-backup.tar
```

### 4.4 ログとモニタリング

#### 4.4.1 ログ管理

```bash
# ログ表示
podman logs mycontainer

# リアルタイムログ
podman logs -f mycontainer

# タイムスタンプ付き
podman logs -t mycontainer

# 最新N行
podman logs --tail 50 mycontainer

# 特定時刻以降
podman logs --since 2024-01-01T00:00:00 mycontainer

# ログドライバー設定
podman run -d \
  --name logged-container \
  --log-driver journald \
  --log-opt tag="\{\{.Name\}\}" \
  nginx:alpine
```

#### 4.4.2 リソースモニタリング

```bash
# リアルタイム統計
podman stats

# 特定コンテナ
podman stats mycontainer

# 一回のみ表示
podman stats --no-stream

# フォーマット指定
podman stats --format "table \{\{.Container\}\}\t\{\{.CPUPerc\}\}\t\{\{.MemUsage\}\}"

# プロセス一覧
podman top mycontainer

# カスタムフォーマット
podman top mycontainer pid,user,args
```

### 4.5 トラブルシューティング

#### 4.5.1 デバッグ技術

**コンテナの調査**
```bash
# 詳細情報
podman inspect mycontainer | jq '.[0].State'

# マウント情報
podman inspect mycontainer | jq '.[0].Mounts'

# ネットワーク設定
podman inspect mycontainer | jq '.[0].NetworkSettings'

# イベント監視
podman events --filter container=mycontainer

# システムコール追跡
podman run --cap-add SYS_PTRACE alpine strace ls
```

#### 4.5.2 一般的な問題と解決

**問題1: コンテナが起動しない**
```bash
# エラー確認
podman logs mycontainer

# 起動コマンドをデバッグ
podman run -it --entrypoint /bin/sh nginx:alpine

# 設定ファイル確認
podman run --rm nginx:alpine nginx -t
```

**問題2: ネットワーク接続できない**
```bash
# ネットワーク確認
podman network ls
podman port mycontainer

# DNSテスト
podman exec mycontainer nslookup google.com

# 接続テスト
podman exec mycontainer ping -c 3 8.8.8.8
```

**問題3: 権限エラー**
```bash
# ユーザー確認
podman exec mycontainer id

# 権限確認
podman exec mycontainer ls -la /var/log

# SELinuxコンテキスト確認
ls -Z /host/path
```

### 演習問題

1. Nginxコンテナを起動し、カスタムHTMLページを表示させてください
2. コンテナのリソース使用量を監視し、制限を超えた場合の動作を確認してください
3. 問題のあるコンテナをデバッグし、原因を特定してください

---