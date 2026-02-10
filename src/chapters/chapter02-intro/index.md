---
title: "第2章：基本操作と内部理解"
---

# 第2章：基本操作と内部理解

## 学習目標
この章を読み終える頃には、以下のことができるようになります：
- イメージ操作の内部処理を理解している
- コンテナ実行時の詳細プロセスを把握している
- Pod概念の実装を理解し活用できる
- 基本的なトラブルシューティングを実行できる

---

## 2.1 イメージ管理の内部処理

### pull操作の詳細フロー

`podman pull` コマンドの裏側で何が起こっているかを詳しく見てみましょう：

```bash
podman pull nginx:alpine
```

#### 内部処理の段階的解説

![Pull操作内部処理図]({{ '/assets/images/diagrams/chapter02-pull-operation-internal.svg' | relative_url }})

### ストレージドライバーとレイヤー管理

#### Overlay2ファイルシステム

Podmanは効率的なストレージのために**Overlay2**を使用：

```
Overlay2 Storage Structure
/var/lib/containers/storage/overlay/
├── imagedb.json                 # イメージメタデータ
├── images/                      # イメージ定義
│   └── sha256:abc123.../
├── overlay/                     # レイヤーデータ
│   ├── layer1/
│   │   ├── diff/               # 実際のファイル
│   │   ├── work/               # ワーキングディレクトリ
│   │   └── link               # シンボリックリンク
│   ├── layer2/
│   └── layer3/
└── overlay-layers/             # レイヤーメタデータ
    └── layers.json
```

#### レイヤーキャッシュ最適化

```bash
# 効率的なDockerfile例（レイヤーキャッシュ活用）
FROM alpine:3.18

# 依存関係は変更頻度が低いため先にインストール
RUN apk add --no-cache \
    nginx \
    curl \
    bash

# 設定ファイルをコピー（アプリより変更頻度が低い）  
COPY nginx.conf /etc/nginx/

# アプリケーションファイルは最後（変更頻度が高い）
COPY app/ /var/www/html/

# 実行設定
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**キャッシュ効率の比較**:
```
非効率な順序（毎回全再ビルド）:
COPY app/ → RUN apk install → COPY config

効率的な順序（差分のみビルド）:
RUN apk install → COPY config → COPY app/
```

---

## 2.2 コン테ナ実行の詳細プロセス

### run操作の内部処理

```bash
podman run -d -p 8080:80 --name webserver nginx:alpine
```

#### 段階的実行プロセス

![コンテナ作成・実行プロセス詳細]({{ '/assets/images/diagrams/chapter02-container-execution-process.svg' | relative_url }})

### Rootless実行の仕組み

#### UID/GIDマッピング

![Rootless UID/GIDマッピング図]({{ '/assets/images/diagrams/chapter02-rootless-uid-gid-mapping.svg' | relative_url }})

**マッピング設定の確認**:
```bash
# 現在のマッピング確認
cat /etc/subuid
cat /etc/subgid

# コンテナ内でのUID確認
podman run --rm alpine id
# 出力例: uid=0(root) gid=0(root) groups=0(root)

# ホストから見たプロセスUID
ps aux | grep nginx
# 出力例: john  12345  0.0  0.1  ...  nginx
```

---

## 2.3 Pod概念の実装と活用

### Podアーキテクチャの詳細

#### Infrastructure Container（Pause Container）

![Pod内部アーキテクチャ]({{ '/assets/images/diagrams/chapter02-pod-internal-architecture.svg' | relative_url }})

### Podライフサイクル管理

![Pod ライフサイクル管理図]({{ '/assets/images/diagrams/chapter02-pod-lifecycle-management.svg' | relative_url }})

### 実践的なPod活用例

#### マイクロサービス開発環境

```bash
# 1. 開発用Podの作成
podman pod create --name microservices \
  -p 3000:3000 \  # API Gateway
  -p 5432:5432 \  # PostgreSQL
  -p 6379:6379    # Redis

# 2. データベース層
podman run -d --pod microservices \
  --name postgres \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=microservices \
  -v postgres_data:/var/lib/postgresql/data:Z \
  postgres:13

# 3. キャッシュ層
podman run -d --pod microservices \
  --name redis \
  -v redis_data:/data:Z \
  redis:alpine

# 4. API Gateway
podman run -d --pod microservices \
  --name api-gateway \
  -v $(pwd)/gateway:/app:Z \
  -w /app \
  -e DATABASE_URL=postgresql://postgres:devpass@localhost:5432/microservices \
  -e REDIS_URL=redis://localhost:6379 \
  node:22 \
  npm start

# 5. サイドカーコンテナ（ログ収集）
podman run -d --pod microservices \
  --name log-collector \
  -v /var/log/containers:/var/log/containers:Z,ro \
  fluent/fluent-bit
```

#### ネットワーク設定オプション

![ネットワーク設定オプション図]({{ '/assets/images/diagrams/chapter02-network-configuration-options.svg' | relative_url }})

#### サービス間通信の確認

```bash
# Pod内ネットワークの確認
podman exec api-gateway netstat -tlnp

# localhost通信テスト
podman exec api-gateway curl localhost:6379/ping
podman exec api-gateway pg_isready -h localhost -p 5432

# Pod全体のリソース使用状況
podman pod stats microservices
```

### Kubernetes Podとの互換性

```yaml
# Kubernetes Pod定義 → Podman Pod変換例
apiVersion: v1
kind: Pod
metadata:
  name: webapp
spec:
  containers:
  - name: nginx
    image: nginx:alpine
    ports:
    - containerPort: 80
  - name: redis
    image: redis:alpine
    ports:
    - containerPort: 6379
```

**Podman Podでの実装**:
```bash
# Kubernetes Podと同等の構成をPodmanで作成
podman pod create --name webapp -p 8080:80

podman run -d --pod webapp --name nginx nginx:alpine
podman run -d --pod webapp --name redis redis:alpine

# Kubernetes YAMLからの自動変換（podman v4.0+）
podman play kube pod-definition.yaml
```

---

## 2.4 トラブルシューティング実践

### 診断フローチャート

![トラブルシューティング フローチャート]({{ '/assets/images/diagrams/chapter02-troubleshooting-flowchart.svg' | relative_url }})

### 具体的な問題と解決法

#### 1. **ポートバインディング問題**

**症状**:
```bash
Error: cannot listen on the TCP port: listen tcp :8080: bind: address already in use
```

**診断と解決**:
```bash
# 1. ポート使用状況確認
ss -tlnp | grep 8080
# または
netstat -tlnp | grep 8080

# 2. Podmanコンテナでの使用確認
podman ps --format "table {{.Names}}\t{{.Ports}}"

# 3. 代替ポート使用
podman run -p 8081:80 nginx  # 8081を使用

# 4. 既存コンテナ停止
podman stop $(podman ps -q --filter "publish=8080")
```

#### ボリュームマウント種別

![ボリュームマウント種別図]({{ '/assets/images/diagrams/chapter02-volume-mount-types.svg' | relative_url }})

#### 2. **ボリュームマウント問題**

**症状**:
```bash
Error: statfs /host/path: permission denied
```

#### セキュリティコンテキストフロー

![セキュリティコンテキストフロー図]({{ '/assets/images/diagrams/chapter02-security-context-flow.svg' | relative_url }})

#### コンテナセキュリティ多層防御

![コンテナセキュリティ多層防御図]({{ '/assets/images/diagrams/chapter02-container-security-layers.svg' | relative_url }})

**SELinux関連の解決**:
```bash
# 1. SELinuxコンテキスト確認
ls -laZ /host/path

# 2. 適切なSELinux設定
# :Z → プライベートラベル（単一コンテナ用）
# :z → 共有ラベル（複数コンテナ共用）
podman run -v /host/path:/container/path:Z nginx

# 3. SELinux無効化（非推奨）
sudo setenforce 0  # 一時的
```

#### 3. **イメージ関連問題**

**症状**:
```bash
Error: image not known
```

**診断と解決**:
```bash
# 1. イメージ存在確認
podman images | grep imagename

# 2. レジストリ設定確認
podman info --format json | jq .registries

# 3. 明示的なレジストリ指定
podman pull docker.io/library/nginx:alpine

# 4. プライベートレジストリ認証
podman login registry.example.com
```

### パフォーマンス監視とプロファイリング

#### リアルタイム監視

```bash
# リソース使用量のリアルタイム監視
podman stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

# 出力例:
CONTAINER   CPU %   MEM USAGE / LIMIT   MEM %   NET I/O           BLOCK I/O
nginx       0.01%   3.2MB / 8GB         0.04%   1.26kB / 648B     0B / 0B
redis       0.05%   7.8MB / 8GB         0.10%   648B / 1.26kB     0B / 0B
```

#### 詳細プロファイリング

```bash
# システムリソース使用量詳細
podman system df

# 出力例:
TYPE           TOTAL   ACTIVE  SIZE        RECLAIMABLE
Images         15      5       2.1GB       1.2GB (57%)
Containers     8       3       45MB        32MB (71%)
Local Volumes  3       2       150MB       50MB (33%)

# コンテナごとの詳細情報
podman inspect --format '{{.State.Pid}}' nginx
# PIDを使ってシステムレベルで監視
htop -p $(podman inspect --format '{{.State.Pid}}' nginx)
```

#### ログ分析

```bash
# 構造化ログ出力
podman logs --timestamps --follow nginx 2>&1 | jq '.'

# ログローテーション設定
podman run --log-driver journald \
  --log-opt tag="{{.ImageName}}/{{.Name}}" \
  nginx

# システムジャーナルでの確認
journalctl -f CONTAINER_TAG=nginx
```

---

## まとめ

この章では、Podmanの内部動作と実践的な操作について深く学習しました：

### 📚 学習した内容
- **イメージ管理**: pull処理、レイヤーキャッシュ、ストレージドライバー
- **コンテナ実行**: namespace作成、cgroup設定、rootless実行
- **Pod概念**: インフラストラクチャコンテナ、サービス間通信
- **トラブルシューティング**: 診断方法、一般的な問題の解決

### 🎯 実践への準備
これで入門編（第0部）は完了です。次は「Podman完全ガイド」第1部で、より詳細な技術仕様と高度な機能について学習することで、本格的なPodman活用が可能になります。

### 🚀 推奨学習パス
1. **第1部（基礎編）**: 詳細な技術仕様と操作方法
2. **実際のプロジェクト**: 小規模アプリケーションでの実践
3. **第2部（実践編）**: ネットワーク、ストレージ等の実践技術
4. **第3部（応用編）**: エンタープライズ環境での運用

---

**理解度確認**
□ イメージのレイヤー構造を理解している  
□ コンテナ実行時のnamespace設定を把握している  
□ Pod概念の実装と活用方法を理解している  
□ 基本的なトラブルシューティングを実行できる  
□ パフォーマンス監視の方法を理解している
