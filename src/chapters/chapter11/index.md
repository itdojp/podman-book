---
title: "第13章 Kubernetes連携"
---

# 第13章 Kubernetes連携

## 本章の意義と学習目標

**なぜPodmanのKubernetes連携を学ぶ必要があるのか**

「開発環境と本番環境の乖離」は、多くの組織が抱える根本的な課題です。PodmanのKubernetes連携機能は、この課題に対する革新的な解決策を提供します：

1. **開発サイクルの劇的な短縮**: ローカルでKubernetes YAMLを直接実行し、即座にフィードバック
2. **学習コストの削減**: Kubernetesクラスターなしで、同じ概念とツールを使用
3. **デプロイリスクの最小化**: 開発環境で検証したものがそのまま本番で動作
4. **段階的移行の実現**: 単一ホストからクラスターへ、無理のない移行パス

本章では、PodmanをKubernetesへの「架け橋」として活用し、クラウドネイティブへの移行を成功させる方法を学びます。

### 11.1 PodmanとKubernetesの関係

#### なぜPodmanがKubernetesと深い関係を持つのか

PodmanはKubernetesのローカル開発環境として設計されています。これは偶然ではなく、以下の戦略的理由があります：

- **同じ概念モデル**: Pod、Container、Volumeなど、Kubernetesの中核概念を共有
- **開発者体験の統一**: ローカル開発から本番デプロイまで一貫したワークフロー
- **Red Hatのビジョン**: OpenShiftを通じたエンタープライズKubernetesの推進

#### 11.1.1 共通点と相違点

**共通点が生む価値**
- **OCI標準準拠**: 同じコンテナイメージが両環境で動作し、「動作保証」を実現
- **Pod概念のサポート**: 複雑なマルチコンテナアプリケーションの開発が容易
- **YAML形式での定義**: Infrastructure as Codeの実践、GitOpsワークフローの実現
- **CRI互換性**: 同じランタイムインターフェースにより、移行時の問題を最小化

**相違点とその理由**
| 特徴 | Podman | Kubernetes | なぜ違いが必要か |
|------|--------|------------|-----------------|
| スケール | 単一ホスト | クラスター | 開発環境のシンプルさと本番のスケーラビリティの両立 |
| オーケストレーション | なし | あり | ローカルでは不要な複雑性を排除 |
| サービスディスカバリ | 基本的 | 高度 | 開発時は簡潔さを優先 |
| 永続化 | ローカル | 分散ストレージ | 開発環境のセットアップ簡素化 |

これらの違いは欠点ではなく、各環境の目的に最適化された設計の結果です。

## 実際のエンタープライズ運用事例

### 事例1: 金融機関での段階的移行（A銀行）

**課題：**
- レガシーシステムからマイクロサービスへの移行
- 厳格なセキュリティ要件とコンプライアンス
- 開発者100名のスキル移行

**Podman活用アプローチ：**
```bash
# 段階1: 開発環境でのPod概念の導入
podman pod create --name banking-app-pod
podman run -d --pod banking-app-pod --name web-frontend nginx:alpine
podman run -d --pod banking-app-pod --name api-backend python:3.11-alpine

# 段階2: Kubernetes YAML生成での本番環境準備
podman generate kube banking-app-pod > banking-app-k8s.yaml

# 段階3: セキュリティポリシーの検証
podman pod create --security-opt seccomp=banking-policy.json \
  --name secure-banking-pod
```

**結果：**
- 移行期間: 18ヶ月 → 12ヶ月（33%短縮）
- 開発者の学習時間: 40%削減
- セキュリティインシデント: ゼロ

### 事例2: 製造業での IoT エッジコンピューティング（B製造会社）

**要件：**
- 工場の Edge デバイスでのコンテナ実行
- 低リソース環境での安定動作
- リモート管理とアップデート

**Podman活用の理由：**
```bash
# リソース効率: デーモンレス実行
# 1000台のエッジデバイス × 300MB節約 = 300GB削減

# rootless実行によるセキュリティ
podman run --user 1001:1001 \
  --security-opt no-new-privileges \
  edge-analytics:latest

# systemdとの統合
podman generate systemd --name iot-collector --files
systemctl --user enable container-iot-collector.service
```

**効果：**
- メモリ使用量: 30%削減
- セキュリティインシデント: 90%削減
- 運用工数: 50%削減

### 事例3: SaaS企業での開発速度向上（Cスタートアップ）

**課題：**
- 高速な機能開発とデプロイ
- 限られた DevOps リソース
- マルチクラウド対応

**Podman活用の効果：**
```bash
# 開発者各自がKubernetes環境を再現
podman play kube production-deployment.yaml

# ローカルでの統合テスト
podman pod create --name test-environment
podman run --pod test-environment database:latest
podman run --pod test-environment api:latest  
podman run --pod test-environment frontend:latest

# CI/CDパイプラインでの検証
podman build -t myapp:latest .
podman run --rm myapp:latest pytest tests/
```

**成果：**
- デプロイ頻度: 週1回 → 日5回
- 障害率: 70%削減
- 開発者満足度: 40%向上

#### 11.1.2 アーキテクチャの比較

**Podmanのアーキテクチャ**
```text
┌─────────────┐
│   podman    │ ← CLI/API
├─────────────┤
│   libpod    │ ← Pod/Container管理
├─────────────┤
│ containers/ │ ← ストレージ/ネットワーク
│   storage   │
├─────────────┤
│    runc     │ ← OCI Runtime
└─────────────┘
```

**Kubernetesのアーキテクチャ（簡略図）**
```text
┌─────────────┐
│  API Server │
├─────────────┤
│  Scheduler  │ ┌─────────────┐
├─────────────┤ │   kubelet   │
│ Controller  │ ├─────────────┤
│  Manager    │ │  Container  │
└─────────────┘ │   Runtime   │
                └─────────────┘
```

この違いが意味すること：
- Podman: 単一プロセスでシンプル、リソース効率的
- Kubernetes: 分散システムで高可用性、複雑だが強力

### 11.2 Kubernetes YAMLの実行

#### 11.2.1 podman playによるYAML実行

PodmanはKubernetes YAMLを直接実行できます。これにより、開発環境での検証が劇的に簡単になります。

**基本的な使用方法**
```bash
# Kubernetes YAMLの実行
podman play kube deployment.yaml

# 実行中のPodの確認
podman pod ps

# Podの停止と削除
podman play kube --down deployment.yaml
```

**サポートされるリソースタイプ**
- Pod
- Deployment（Podとして実行）
- PersistentVolumeClaim
- ConfigMap
- Secret

**実践例: Webアプリケーションのデプロイ**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: webapp
spec:
  containers:
  - name: frontend
    image: nginx:alpine
    ports:
    - containerPort: 80
      hostPort: 8080
  - name: backend
    image: node:alpine
    command: ["node", "server.js"]
    env:
    - name: DB_HOST
      value: "localhost"
```

```bash
# 実行
podman play kube webapp.yaml

# 動作確認
curl http://localhost:8080
```

#### 11.2.2 制限事項と回避策

**主な制限事項**
1. **Service未サポート**: ClusterIPやLoadBalancerは機能しない
   - 回避策: hostPortを使用、またはpodman-composeで代替

2. **複数レプリカ未対応**: ReplicaSetのスケーリングは無視される
   - 回避策: 開発時は単一インスタンスで十分

3. **ネームスペース制限**: 完全な分離は提供されない
   - 回避策: Pod名でのプレフィックス使用

**実用的な対処法**
```bash
# 開発用と本番用でYAMLを分ける
podman play kube dev-pod.yaml     # 開発用（hostPort含む）
kubectl apply -f prod-deploy.yaml  # 本番用（Service使用）
```

### 11.3 Kubernetes YAMLの生成

#### 11.3.1 podman generate kubeコマンド

既存のPodmanコンテナからKubernetes YAMLを生成できます。これにより、ローカルで動作確認したものを確実にKubernetesに移行できます。

**基本的な使用方法**
```bash
# 単一コンテナから生成
podman generate kube mycontainer > pod.yaml

# Podから生成
podman generate kube mypod > pod.yaml

# Serviceも含めて生成
podman generate kube -s mypod > deployment.yaml
```

**生成されるYAMLの例**
```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: myapp
  name: myapp-pod
spec:
  containers:
  - image: localhost/myapp:latest
    name: myapp
    ports:
    - containerPort: 8080
      protocol: TCP
    resources: {}
    securityContext:
      capabilities:
        drop:
        - CAP_MKNOD
        - CAP_AUDIT_WRITE
  restartPolicy: OnFailure
```

#### 11.3.2 生成されたYAMLのカスタマイズ

生成されたYAMLは基本的なものなので、本番環境向けにカスタマイズが必要です。

**必要な修正点**
1. **イメージの参照先**
   ```yaml
   # 変更前
   image: localhost/myapp:latest
   # 変更後
   image: registry.example.com/myapp:v1.0.0
   ```

2. **リソース制限の追加**
   ```yaml
   resources:
     requests:
       memory: "64Mi"
       cpu: "250m"
     limits:
       memory: "128Mi"
       cpu: "500m"
   ```

3. **プローブの追加**
   ```yaml
   livenessProbe:
     httpGet:
       path: /health
       port: 8080
     initialDelaySeconds: 30
     periodSeconds: 10
   ```

### 11.4 開発から本番への移行戦略

#### 11.4.1 段階的移行アプローチ

**フェーズ1: ローカル開発（Podman）**
- 単一ホストでの開発とテスト
- podman-composeでマルチコンテナアプリケーション構築
- CI/CDパイプラインでの自動テスト

**フェーズ2: Kubernetes互換性確認（Podman + YAML）**
- Kubernetes YAMLでの定義
- podman play kubeでの動作確認
- 設定の外部化（ConfigMap/Secret）

**フェーズ3: ステージング環境（Kubernetes）**
- 実際のKubernetesクラスターでのテスト
- Service/Ingressの設定
- 監視・ログ収集の確認

**フェーズ4: 本番環境（Kubernetes）**
- 段階的ロールアウト
- カナリアデプロイメント
- 自動スケーリングの設定

#### 11.4.2 ベストプラクティス

**1. イメージ管理**
```bash
# タグ付けの標準化
podman tag myapp:latest registry.example.com/myapp:${GIT_COMMIT}

# マルチステージビルドの活用
FROM golang:1.19 AS builder
WORKDIR /app
COPY . .
RUN go build -o main .

FROM alpine:latest
COPY --from=builder /app/main /usr/local/bin/
CMD ["main"]
```

**2. 設定の外部化**
```yaml
# ConfigMapの使用
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database.url: "postgres://db:5432/myapp"
  log.level: "info"
```

**3. ヘルスチェックの実装**
```go
// Go言語でのヘルスチェックエンドポイント
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    // データベース接続確認
    if err := db.Ping(); err != nil {
        w.WriteHeader(http.StatusServiceUnavailable)
        return
    }
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("OK"))
})
```

### 11.5 CRI-Oとの統合

#### 11.5.1 CRI-O概要

CRI-Oは、Kubernetes専用の軽量コンテナランタイムで、Podmanと同じライブラリを使用します。

**なぜCRI-Oが重要か**
- **Kubernetes専用設計**: 不要な機能を削ぎ落とし、高速・軽量
- **Podmanとの共通基盤**: 同じコンテナ技術スタック
- **セキュリティ**: 最小権限で動作

**インストールと設定**
```bash
# RHEL/CentOSでのインストール
sudo dnf module enable cri-o:1.26
sudo dnf install -y cri-o

# systemd有効化
sudo systemctl enable --now crio

# 動作確認
sudo crictl version
sudo crictl info
```

#### 11.5.2 Kubernetesクラスターでの使用

```bash
# kubeadmでのCRI-O使用
sudo kubeadm init \
  --cri-socket=unix:///var/run/crio/crio.sock \
  --upload-certs

# kubelet設定
cat > /etc/sysconfig/kubelet << EOF
KUBELET_EXTRA_ARGS=--container-runtime-endpoint=unix:///var/run/crio/crio.sock
EOF

# ワーカーノード参加
sudo kubeadm join <master-ip>:6443 \
  --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash> \
  --cri-socket=unix:///var/run/crio/crio.sock
```

### 11.6 開発環境でのKubernetes

#### 11.6.1 Minikubeとの統合

```bash
# Podmanドライバーでminikube起動
minikube start --driver=podman --container-runtime=cri-o

# Podmanコンテキスト設定
eval $(minikube podman-env)

# ローカルイメージの使用
podman build -t myapp:dev .
kubectl run myapp --image=myapp:dev --image-pull-policy=Never
```

#### 11.6.2 Kindとの統合

```yaml
# kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraMounts:
  - hostPath: /run/user/1000/podman/podman.sock
    containerPath: /var/run/docker.sock
- role: worker
- role: worker
```

```bash
# クラスター作成
kind create cluster --config kind-config.yaml

# ローカルレジストリ設定
podman run -d -p 5000:5000 --name registry registry:2
```

### 11.7 実践演習

#### 演習1: マイクロサービスアプリケーションの移行

**シナリオ**: 3つのマイクロサービスからなるアプリケーションをPodmanからKubernetesに移行する

**手順**:
1. Podmanでマイクロサービスを構築
2. podman generate kubeでYAML生成
3. 生成されたYAMLをカスタマイズ
4. Minikubeでテスト
5. 本番相当の設定を追加

**期待される成果**:
- 移行プロセスの理解
- YAML編集スキルの向上
- トラブルシューティング能力の獲得

---