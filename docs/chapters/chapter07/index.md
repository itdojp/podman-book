---
title: "第9章 Podとマルチコンテナ管理"
layout: book
---

# 第9章 Podとマルチコンテナ管理

### 本章の意義と学習目標

**なぜPod概念を理解することが重要なのか**

Podは単なる「複数コンテナのグループ」ではなく、クラウドネイティブアーキテクチャの基本単位です：

1. **Kubernetes準備**: 開発環境でKubernetesと同じ概念を体験
2. **設計パターンの実践**: サイドカー、アンバサダーなどのパターン実装
3. **リソース共有の理解**: 効率的なマルチコンテナアーキテクチャ
4. **移行の容易さ**: ローカル開発から本番Kubernetesへのスムーズな移行

本章では、Pod概念を通じて、モダンなコンテナアーキテクチャ設計を学びます。

### 7.1 Pod概念の理解

#### 7.1.1 Podとは

**なぜPodという概念が生まれたのか**

従来のコンテナ管理では、以下の課題がありました：
- 密結合なコンテナ間の複雑な設定
- 共有リソース（ネットワーク、ストレージ）の管理困難
- コンテナ間の協調動作の実装複雑性

Podはこれらを解決する、より高次の抽象化です。

**Podの特徴とその価値**

1. **共有ネットワークnamespace**
   - 効果: localhostで全コンテナが通信可能
   - 用途: マイクロサービス内の内部通信

2. **共有IPCnamespace**
   - 効果: 共有メモリやセマフォでの高速通信
   - 用途: 高性能な並列処理

3. **共有UTSnamespace（ホスト名）**
   - 効果: 同一ホスト名での統一的な識別
   - 用途: レガシーアプリケーションの移行

4. **共有PIDnamespace（オプション）**
   - 効果: プロセス監視やシグナル送信
   - 用途: プロセスマネージャーパターン

5. **ボリュームの共有**
   - 効果: ファイルベースの通信・データ共有
   - 用途: ログ収集、設定共有

```bash
# Pod作成 - なぜ単純なコンテナより優れているか
podman pod create --name mypod

# Pod情報確認
podman pod inspect mypod

# Pod内でコンテナ実行 - 自動的にリソース共有
podman run -d --pod mypod nginx:alpine
podman run -d --pod mypod redis:alpine

# この2つのコンテナは：
# - 同じIPアドレスを共有
# - localhostで通信可能
# - 同じホスト名を持つ
```

#### 7.1.2 Pod設計パターン

**実務で使われる主要パターンとその価値**

**1. サイドカーパターン - なぜ有用か**

問題: メインアプリケーションに機能追加すると複雑化
解決: 補助機能を別コンテナに分離

```bash
# ログ収集サイドカーの実装
podman pod create --name app-pod -p 8080:80

# メインアプリケーション
podman run -d --pod app-pod \
  --name main-app \
  -v logs:/var/log/app \  # ログを共有ボリュームに出力
  myapp:latest

# ログ転送サイドカー
podman run -d --pod app-pod \
  --name log-forwarder \
  -v logs:/logs:ro \      # 読み取り専用でマウント
  fluent/fluent-bit

# 効果：
# - アプリケーションはログ転送を意識しない
# - ログ転送方法の変更が容易
# - 責任の分離による保守性向上
```

**2. アンバサダーパターン - ネットワークの抽象化**

問題: 外部サービスの接続情報がハードコード
解決: プロキシコンテナで接続を抽象化

```bash
# データベースプロキシPod
podman pod create --name db-proxy-pod

# データベースプロキシ（接続プール、フェイルオーバー）
podman run -d --pod db-proxy-pod \
  --name pgbouncer \
  -e DATABASES_HOST=db.example.com \
  -e DATABASES_PORT=5432 \
  pgbouncer/pgbouncer

# アプリケーション（localhostのDBに接続）
podman run -d --pod db-proxy-pod \
  --name app \
  -e DB_HOST=localhost \  # 外部DBの場所を知らない
  myapp:latest

# 効果：
# - データベースの場所変更が容易
# - 接続プール機能の透過的な追加
# - 障害時の自動フェイルオーバー
```

**3. アダプターパターン - インターフェースの統一**

問題: 異なる形式のメトリクスを統一的に扱いたい
解決: 変換アダプターを追加

```bash
# メトリクス変換Pod
podman pod create --name metrics-pod

# レガシーアプリケーション（独自形式のメトリクス）
podman run -d --pod metrics-pod \
  --name legacy-app \
  legacy-app:latest

# メトリクス変換アダプター
podman run -d --pod metrics-pod \
  --name metrics-adapter \
  -e LEGACY_METRICS_URL=http://localhost:8080/stats \
  -e PROMETHEUS_PORT=9090 \
  metrics-adapter:latest

# 効果：
# - レガシーアプリを変更せずにPrometheus対応
# - 監視システムの統一
# - 段階的なモダナイゼーション
```

### 7.2 Pod管理

#### 7.2.1 Podライフサイクル

**なぜPod単位の管理が効率的なのか**

複数の関連コンテナを個別に管理すると、起動順序や依存関係の管理が複雑になります。Pod単位の管理により、これらを簡素化できます。

```bash
# Pod作成オプションの実務的価値
podman pod create \
  --name advanced-pod \
  --hostname mypod \          # アプリケーション内での自己識別
  --add-host db:10.0.0.100 \  # レガシーアプリのハードコード対策
  --dns 8.8.8.8 \            # 企業DNSの問題回避
  --network bridge \          # ネットワーク分離
  --publish 8080:80 \        # ポート公開（全コンテナ共有）
  --publish 8443:443 \
  --label app=myapp \        # 運用での識別
  --label tier=frontend

# Pod操作が全コンテナに影響 - 運用の簡素化
podman pod start advanced-pod   # 全コンテナ起動
podman pod stop advanced-pod    # 全コンテナ停止
podman pod restart advanced-pod # 全コンテナ再起動

# なぜこれが重要か：
# - 関連サービスの一括管理
# - 起動順序の問題を回避
# - 運用ミスの削減
```

#### 7.2.2 リソース管理

```bash
# CPU/メモリ制限
podman pod create \
  --name resource-limited \
  --cpus 2 \
  --memory 1g

# cgroups統計
podman pod stats resource-limited

# リソース更新
podman pod update \
  --cpus 4 \
  --memory 2g \
  resource-limited
```

### 7.3 Kubernetes YAML互換性

#### 7.3.1 Pod YAMLの生成と適用

```bash
# 既存PodからYAML生成
podman generate kube mypod > mypod.yaml

# YAML例
cat > webapp-pod.yaml << EOF
apiVersion: v1
kind: Pod
metadata:
  name: webapp
  labels:
    app: webapp
spec:
  containers:
  - name: frontend
    image: nginx:alpine
    ports:
    - containerPort: 80
    volumeMounts:
    - name: html
      mountPath: /usr/share/nginx/html
  - name: backend
    image: node:alpine
    command: ["node", "server.js"]
    ports:
    - containerPort: 3000
    env:
    - name: NODE_ENV
      value: production
  volumes:
  - name: html
    hostPath:
      path: /data/html
EOF

# YAML適用
podman play kube webapp-pod.yaml

# 削除
podman play kube --down webapp-pod.yaml
```

#### 7.3.2 複雑な設定の移植

```yaml
# advanced-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: complex-app
  labels:
    app: myapp
    version: v1
spec:
  hostname: myapp
  subdomain: apps
  initContainers:
  - name: init-db
    image: busybox
    command: ['sh', '-c', 'until nc -z db 5432; do sleep 1; done']
  containers:
  - name: app
    image: myapp:latest
    ports:
    - containerPort: 8080
      protocol: TCP
    env:
    - name: DB_HOST
      value: db
    - name: REDIS_HOST
      value: localhost
    resources:
      requests:
        memory: "256Mi"
        cpu: "250m"
      limits:
        memory: "512Mi"
        cpu: "500m"
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
  - name: redis
    image: redis:alpine
    ports:
    - containerPort: 6379
  restartPolicy: Always
  dnsPolicy: ClusterFirst
```

### 7.4 マルチコンテナアプリケーション

#### 7.4.1 docker-compose互換

```yaml
# docker-compose.yml
version: '3'

services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html:ro
    depends_on:
      - app
    networks:
      - frontend

  app:
    build: ./app
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis
    networks:
      - frontend
      - backend

  db:
    image: postgres:13
    environment:
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=myapp
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - backend

  redis:
    image: redis:alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - backend

volumes:
  pgdata:
  redis-data:

networks:
  frontend:
  backend:
    internal: true
```

**podman-composeでの実行**
```bash
# インストール
pip install podman-compose

# 実行
podman-compose up -d

# スケーリング
podman-compose up -d --scale app=3

# ログ確認
podman-compose logs -f app

# 停止・削除
podman-compose down -v
```

#### 7.4.2 システムサービスとしてのPod

```bash
# systemdユニット生成
podman generate systemd \
  --new \
  --files \
  --name mypod

# ユニットファイル配置
sudo cp pod-mypod.service /etc/systemd/system/
sudo cp container-*.service /etc/systemd/system/

# サービス有効化
sudo systemctl daemon-reload
sudo systemctl enable pod-mypod.service
sudo systemctl start pod-mypod.service

# 状態確認
sudo systemctl status pod-mypod.service
```

### 7.5 高度なPod管理

#### 7.5.1 Pod間通信

```bash
# 共有ネットワークNamespace
podman pod create --name shared-net-pod

# TCP通信例
podman run -d --pod shared-net-pod \
  --name server \
  alpine nc -l -p 8080 -k

podman run --pod shared-net-pod \
  --name client \
  alpine nc localhost 8080

# Unix socket共有
podman run -d --pod shared-net-pod \
  --name socket-server \
  -v socket-vol:/var/run \
  myserver:latest

podman run -d --pod shared-net-pod \
  --name socket-client \
  -v socket-vol:/var/run \
  myclient:latest
```

#### 7.5.2 Podのモニタリング

```bash
# Pod全体の統計
podman pod stats --all

# Pod内プロセス確認
podman pod top mypod

# イベント監視
podman events --filter pod=mypod

# ヘルスチェック
cat > healthcheck.sh << 'EOF'
#!/bin/bash
# Pod内の全コンテナヘルスチェック
POD_NAME=$1
CONTAINERS=$(podman pod inspect $POD_NAME | jq -r '.Containers[].Name')

for container in $CONTAINERS; do
    STATUS=$(podman healthcheck run $container 2>&1)
    if [ $? -ne 0 ]; then
        echo "Container $container is unhealthy: $STATUS"
        exit 1
    fi
done
echo "All containers in pod $POD_NAME are healthy"
EOF

chmod +x healthcheck.sh
```

### 演習問題

1. マイクロサービスアプリケーションをPodで構成し、サービス間通信を実装してください
2. Kubernetes YAMLからPodmanへの移行を実践してください
3. Podをsystemdサービスとして登録し、自動起動を設定してください

---