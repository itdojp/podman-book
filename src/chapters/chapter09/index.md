---
title: "第12章 systemd統合と本番運用"
---

# 第12章 systemd統合と本番運用

### 本章の意義と学習目標

**なぜsystemd統合が本番運用の鍵となるのか**

「コンテナを動かす」と「コンテナを運用する」には大きな違いがあります。systemd統合により以下が実現します：

1. **信頼性の向上**: 自動起動、自動再起動、依存関係管理
2. **運用の標準化**: 既存のLinux運用知識をそのまま活用
3. **監視の統合**: journaldによる統一的なログ管理
4. **ライフサイクル管理**: 適切な起動・停止シーケンス

本章では、「開発環境のコンテナ」を「本番環境のサービス」に昇華させる技術を学びます。

### 9.1 systemdとPodmanの統合

#### なぜPodmanはsystemdと相性が良いのか

Dockerとは異なり、Podmanは最初からsystemdとの統合を前提に設計されています：

- **デーモンレス**: systemdが直接プロセスを管理（中間層なし）
- **標準出力**: journaldに直接ログ出力
- **cgroups統合**: systemdのリソース管理機能をフル活用
- **通知機能**: サービス起動完了を正確に通知

#### 9.1.1 systemdユニットの生成

**なぜ手動でユニットファイルを書かないのか**

Podmanの自動生成機能は、ベストプラクティスを含んだ最適なユニットファイルを生成します：

```bash
# コンテナ用ユニット生成
podman generate systemd \
  --new \              # コンテナ再作成（常にクリーンな状態）
  --name myapp \       # コンテナ名指定
  --files \           # ファイルに出力
  --restart-policy=always  # 自動再起動ポリシー

# --newオプションの重要性：
# - 起動のたびに新しいコンテナを作成
# - 前回の状態に依存しない（冪等性）
# - コンテナの「使い捨て」原則を実現
```

**生成されるユニットファイルの解説**

```ini
# container-myapp.service
[Unit]
Description=Podman container-myapp.service
Documentation=man:podman-generate-systemd(1)
Wants=network-online.target    # ネットワーク起動後に開始
After=network-online.target
RequiresMountsFor=%t/containers  # 一時ディレクトリの準備を待つ

[Service]
Environment=PODMAN_SYSTEMD_UNIT=%n  # systemd統合の有効化
Restart=always                      # 常に再起動
TimeoutStopSec=70                  # 停止タイムアウト（graceful shutdown）

# コンテナIDファイルの削除（クリーンスタート）
ExecStartPre=/bin/rm -f %t/%n.ctr-id

# メインのコンテナ実行コマンド
ExecStart=/usr/bin/podman run \
    --cidfile=%t/%n.ctr-id \      # コンテナID保存
    --cgroups=no-conmon \         # systemdでcgroups管理
    --rm \                        # 停止時に自動削除
    --sdnotify=conmon \           # systemdへの通知
    --replace \                   # 既存コンテナを置換
    --detach \
    --name=myapp \
    --label io.containers.autoupdate=registry \  # 自動更新有効化
    myapp:latest

# 停止コマンド（graceful shutdown）
ExecStop=/usr/bin/podman stop --ignore --cidfile=%t/%n.ctr-id
ExecStopPost=/usr/bin/podman rm -f --ignore --cidfile=%t/%n.ctr-id

Type=notify          # 起動完了を通知で判断
NotifyAccess=all     # 全プロセスからの通知を許可

[Install]
WantedBy=default.target  # デフォルトターゲットで起動
```

#### 9.1.2 高度なsystemd設定

**本番環境で必要となる詳細設定**

```ini
# advanced-container.service
[Unit]
Description=Production Application Container
Documentation=https://docs.example.com/app
Wants=network-online.target
After=network-online.target postgresql.service  # DB起動後
Requires=postgresql.service   # DB必須

[Service]
Type=notify
NotifyAccess=all
Environment=PODMAN_SYSTEMD_UNIT=%n
Environment=REGISTRY_AUTH_FILE=/etc/containers/auth.json

# リソース制限 - なぜ重要か
CPUQuota=200%        # CPU使用率を2コア相当に制限
MemoryLimit=2G       # メモリ上限（OOM防止）
TasksMax=1000        # プロセス数制限（fork bomb防止）

# セキュリティ設定 - 多層防御
NoNewPrivileges=true    # 権限昇格を防止
ProtectSystem=strict    # ファイルシステム保護
ProtectHome=true       # ホームディレクトリ保護
ReadWritePaths=/var/lib/myapp  # 書き込み可能パス限定

# 起動前処理 - なぜ必要か
ExecStartPre=-/usr/bin/podman pull myapp:latest  # 最新イメージ取得
ExecStartPre=/usr/bin/podman volume create appdata  # ボリューム準備

# メインプロセス
ExecStart=/usr/bin/podman run \
    --conmon-pidfile %t/%n.pid \
    --cidfile %t/%n.ctr-id \
    --cgroups=no-conmon \
    --replace \
    --detach \
    --name=%n \
    --health-cmd="/usr/bin/curl -f http://localhost/health || exit 1" \
    --health-interval=30s \
    --health-retries=3 \
    --health-start-period=60s \  # アプリ起動時間を考慮
    --health-timeout=10s \
    --volume appdata:/data \
    --env-file /etc/myapp/environment \
    --secret db-password \        # 機密情報の安全な受け渡し
    --publish 8080:8080 \
    myapp:latest

# 停止処理 - データ整合性の確保
ExecStop=/usr/bin/podman stop --time 30 --cidfile %t/%n.ctr-id
ExecStopPost=/usr/bin/podman rm --force --cidfile %t/%n.ctr-id

# 再起動設定 - 可用性の確保
Restart=always
RestartSec=30            # 再起動前の待機時間
StartLimitBurst=3        # 短時間での再起動回数制限
StartLimitInterval=300s  # 制限のリセット間隔

[Install]
WantedBy=multi-user.target  # マルチユーザーモードで起動
```

### 9.2 本番運用のベストプラクティス

#### 9.2.1 ヘルスチェックとモニタリング

**なぜヘルスチェックが本番運用で必須なのか**

「プロセスが動いている」≠「サービスが正常」です。適切なヘルスチェックにより：
- 早期の問題検出
- 自動復旧の実現
- SLAの維持

```bash
# 包括的なヘルスチェック実装
cat > healthcheck.sh << 'EOF'
#!/bin/bash
set -e

# なぜ複数の観点でチェックするのか

# 1. アプリケーションの応答性
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
if [ $response -ne 200 ]; then
    echo "HTTP health check failed: $response"
    exit 1
fi

# 2. 依存サービスの接続性
pg_isready -h localhost -p 5432 || {
    echo "Database connection failed"
    exit 1
}

# 3. リソース状況の確認
usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $usage -gt 90 ]; then
    echo "Disk usage critical: ${usage}%"
    exit 1
fi

echo "All health checks passed"
exit 0
EOF

# Containerfileへの組み込み
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD ["/healthcheck.sh"]

# この設定の効果：
# - systemdが異常を検知して自動再起動
# - ロードバランサーが異常ノードを除外
# - 監視システムがアラート発報
```

#### 9.2.2 ログ管理

**なぜ適切なログ管理が重要か**

インシデント対応、パフォーマンス分析、コンプライアンス対応のすべてがログに依存します：

```bash
# journaldログドライバー設定 - なぜjournaldか
podman run -d \
  --name app \
  --log-driver=journald \
  --log-opt tag="\{\{.Name\}\}/\{\{.ID\}\}" \  # 識別しやすいタグ
  myapp:latest

# journaldの利点：
# - 構造化ログ（メタデータ付き）
# - 自動ローテーション
# - 既存の運用ツールとの統合
# - systemdサービスとの一元管理

# ログ確認方法
journalctl -u container-app.service -f     # リアルタイム
journalctl CONTAINER_NAME=app -f          # コンテナ名で絞り込み
journalctl -u container-app.service --since "1 hour ago"  # 時間指定

# ログローテーション設定
cat > /etc/systemd/journald.conf.d/container.conf << EOF
[Journal]
SystemMaxUse=1G          # 最大使用量
SystemKeepFree=1G        # 最低空き容量
MaxRetentionSec=7day     # 保持期間
EOF

# 外部システムへの転送
podman run -d \
  --name log-forwarder \
  --volume /var/log/journal:/var/log/journal:ro \
  --volume /run/systemd/journal:/run/systemd/journal:ro \
  fluent/fluentd:edge
```

### 9.3 自動アップデート

#### 9.3.1 Podman Auto Update

```bash
# ラベル設定
podman run -d \
  --name auto-app \
  --label io.containers.autoupdate=registry \
  myregistry.com/myapp:latest

# systemdタイマー有効化
systemctl enable --now podman-auto-update.timer

# 手動実行
podman auto-update

# ポリシー設定
cat > /etc/containers/auto-update.conf << EOF
[engine]
# アップデート戦略
policy = "registry"

# ローリングアップデート
rolling = true

# 同時更新数
max_parallel_updates = 2

# 失敗時の動作
rollback = true
EOF
```

#### 9.3.2 カスタム更新戦略

```bash
# update-strategy.sh
#!/bin/bash

SERVICE_NAME="container-myapp.service"
NEW_IMAGE="myapp:new"
OLD_IMAGE=$(podman inspect myapp --format '\{\{.ImageName\}\}')

# ヘルスチェック関数
health_check() {
    local attempts=0
    while [ $attempts -lt 30 ]; do
        if curl -f http://localhost:8080/health > /dev/null 2>&1; then
            return 0
        fi
        attempts=$((attempts + 1))
        sleep 2
    done
    return 1
}

# 新しいイメージをプル
podman pull $NEW_IMAGE || exit 1

# 現在のコンテナを停止
systemctl stop $SERVICE_NAME

# 新しいイメージでコンテナを開始
podman rm -f myapp
podman run -d --name myapp $NEW_IMAGE

# ヘルスチェック
if health_check; then
    echo "Update successful"
    systemctl start $SERVICE_NAME
else
    echo "Update failed, rolling back"
    podman rm -f myapp
    podman run -d --name myapp $OLD_IMAGE
    systemctl start $SERVICE_NAME
    exit 1
fi
```

### 9.4 バックアップとリストア

#### 9.4.1 データバックアップ戦略

```bash
# ボリュームバックアップスクリプト
cat > backup-volumes.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# 全ボリュームのバックアップ
for volume in $(podman volume ls -q); do
    echo "Backing up volume: $volume"
    
    # 一時コンテナでボリュームをマウントしてバックアップ
    podman run --rm \
        -v $volume:/data:ro \
        -v $BACKUP_DIR:/backup \
        alpine tar czf /backup/$volume.tar.gz -C /data .
done

# メタデータ保存
podman volume ls --format json > $BACKUP_DIR/volumes-metadata.json

# 古いバックアップの削除（7日以上）
find /backup -type d -mtime +7 -exec rm -rf {} \;
EOF

chmod +x backup-volumes.sh
```

#### 9.4.2 ディザスタリカバリ

```bash
# リストアスクリプト
cat > restore-volumes.sh << 'EOF'
#!/bin/bash

BACKUP_DIR=$1
if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: $0 <backup_directory>"
    exit 1
fi

# メタデータ読み込み
VOLUMES=$(jq -r '.[].Name' $BACKUP_DIR/volumes-metadata.json)

for volume in $VOLUMES; do
    echo "Restoring volume: $volume"
    
    # ボリューム作成
    podman volume create $volume
    
    # データリストア
    podman run --rm \
        -v $volume:/data \
        -v $BACKUP_DIR:/backup:ro \
        alpine tar xzf /backup/$volume.tar.gz -C /data
done
EOF

chmod +x restore-volumes.sh
```

### 9.5 監視とアラート

#### 9.5.1 Prometheusメトリクス

```yaml
# prometheus-podman.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'podman'
    static_configs:
      - targets: ['localhost:9882']
    
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['localhost:9880']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
```

```bash
# Podman exporter
podman run -d \
  --name podman-exporter \
  --publish 9882:9882 \
  --volume /run/podman/podman.sock:/run/podman/podman.sock:ro \
  --security-opt label=disable \
  quay.io/containers/prometheus-podman-exporter:latest

# cAdvisor for Podman
podman run -d \
  --name cadvisor \
  --publish 9880:8080 \
  --volume /:/rootfs:ro \
  --volume /var/run:/var/run:ro \
  --volume /sys:/sys:ro \
  --volume /var/lib/containers:/var/lib/containers:ro \
  --privileged \
  gcr.io/cadvisor/cadvisor:latest
```

#### 9.5.2 アラート設定

```yaml
# alerting-rules.yml
groups:
  - name: container_alerts
    interval: 30s
    rules:
      - alert: ContainerDown
        expr: up{job="podman"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Container \{\{ $labels.name \}\} is down"
          
      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Container \{\{ $labels.name \}\} memory usage is above 90%"
          
      - alert: HighCPUUsage
        expr: rate(container_cpu_usage_seconds_total[5m]) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Container \{\{ $labels.name \}\} CPU usage is above 90%"
```

### 9.6 パフォーマンスチューニング

#### 9.6.1 システムレベルの最適化

```bash
# カーネルパラメータ調整
cat > /etc/sysctl.d/99-containers.conf << EOF
# ネットワーク最適化
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15

# メモリ最適化
vm.max_map_count = 262144
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# ファイルディスクリプタ
fs.file-max = 2097152
fs.nr_open = 2097152
EOF

sysctl -p /etc/sysctl.d/99-containers.conf
```

#### 9.6.2 コンテナレベルの最適化

```bash
# CPU affinity設定
podman run -d \
  --name optimized-app \
  --cpuset-cpus="0-3" \
  --cpu-shares=2048 \
  --memory=4g \
  --memory-reservation=2g \
  --pids-limit=1000 \
  myapp:latest

# ストレージ最適化
podman run -d \
  --name fast-io-app \
  --volume fast-data:/data:O \
  --storage-opt size=50G \
  --device /dev/nvme0n1:/dev/xvdf \
  myapp:latest
```

### 演習問題

1. 本番環境向けのsystemdユニットを作成し、自動起動・自動更新を設定してください
2. コンテナの監視システムを構築し、アラート通知を実装してください
3. ゼロダウンタイムデプロイメントの仕組みを実装してください

---