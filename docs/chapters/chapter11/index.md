---
layout: book
order: 12
title: "第11章：Kubernetesとの統合"
---

# 第11章：Kubernetesとの統合

> **注意（この章のスコープ）**
>
> - 本章は **Podman と Kubernetes の相互運用**（Kubernetes YAML の生成／簡易実行）を扱います。
> - **Kubernetes の設計・運用（クラスタ構成、Service/Ingress、スケジューリング、RBAC、ローリング更新等）の学習は対象外** です。
> - `podman kube play` は Kubernetes を完全再現しません（`podman play kube` は同義のエイリアスです）。特に **Service/Ingress、複数レプリカ、readiness/startup probe 等** は差分があるため、**本番相当の挙動確認は実クラスタで実施** してください（差分は後述）。

補足: Podman 4.3 以降、Kubernetes 連携コマンドは `podman kube ...` 配下に整理されています。本章では `podman kube play / podman kube generate / podman kube down` 表記に統一し、旧コマンド（`podman play kube` / `podman generate kube` など）はエイリアスとして扱います。

## 本章の意義と学習目標

**なぜPodmanのKubernetes連携を学ぶ必要があるのか**

「開発環境と本番環境の乖離」は、多くの組織が抱える根本的な課題です。PodmanのKubernetes連携機能は、この課題に対する有効なアプローチの1つです。

1. **開発サイクルの劇的な短縮**: ローカルで（対応範囲の）Kubernetes YAMLを簡易実行し、即座にフィードバック
2. **学習コストの削減**: Kubernetes YAML（主にPod/Deployment等）の形を保ったままローカルで簡易検証
3. **デプロイリスクの最小化**: YAML/イメージ/設定の差分を早期に減らし、本番移行時の手戻りを削減
4. **段階的移行の実現**: 単一ホストからクラスターへ、無理のない移行パス

本章では、PodmanをKubernetes YAMLへの「橋渡し」として活用し、移行に向けた差分を早期に洗い出す観点を扱います。

### 11.1 PodmanとKubernetesの関係

#### なぜPodmanがKubernetesと深い関係を持つのか

PodmanはKubernetes YAMLとの相互運用（`podman kube generate` / `podman kube play`）を提供し、ローカルでの簡易検証や移行の橋渡しに利用できます。これは偶然ではなく、以下の戦略的理由があります。

- **同じ概念モデル**: Pod、Container、Volumeなど、Kubernetesの中核概念を共有
- **開発者体験の統一**: ローカル検証から実クラスタへの移行を意識したワークフロー
- **Red Hatのビジョン**: OpenShiftを通じたエンタープライズKubernetesの推進

#### 11.1.1 共通点と相違点

**共通点が生む価値**
- **OCI標準準拠**: 同じコンテナイメージを前提にでき、移行時の差分を減らす
- **Pod概念のサポート**: 複雑なマルチコンテナアプリケーションの開発が容易
- **YAML形式での定義**: Infrastructure as Codeの実践、GitOpsワークフローの実現
- **共有コンポーネント**: OCI準拠と共通コンポーネント（images/storage/runtime 等）により、イメージ資産や運用ノウハウを流用しやすい

補足: Kubernetes のコンテナランタイムは CRI-O / containerd 等の CRI 実装であり、Podman 自体は CRI ではありません（CRI-O との関係は 11.5 を参照）。

**相違点とその理由**

| 特徴 | Podman | Kubernetes | なぜ違いが必要か |
|---|---|---|---|
| スケール | 単一ホスト | クラスター | 開発環境のシンプルさと本番のスケーラビリティの両立 |
| オーケストレーション | なし | あり | ローカルでは不要な複雑性を排除 |
| サービスディスカバリ | 基本的 | 高度 | 開発時は簡潔さを優先 |
| 永続化 | ローカル | 分散ストレージ | 開発環境のセットアップ簡素化 |

これらの違いは欠点ではなく、各環境の目的に最適化された設計の結果です。

## 実際のエンタープライズ運用事例

※本節の事例・数値は理解を助けるためのモデルケース（例示）です。

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
podman kube generate banking-app-pod > banking-app-k8s.yaml

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

※ `podman generate systemd` は非推奨（deprecated）です。今後の systemd 連携は Quadlet（例: `.container` ユニット）による管理を前提にしてください。

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
# Kubernetes YAML（Pod/Deployment等）の簡易検証（完全再現ではない）
podman kube play production-deployment.yaml

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

この違いが意味することは次のとおりです。
- Podman: 単一プロセスでシンプル、リソース効率的
- Kubernetes: 分散システムで高可用性、複雑だが強力

### 11.2 Kubernetes YAMLの実行

#### 11.2.1 podman kube playによるYAML実行

Podmanは（対応範囲の）Kubernetes YAMLをローカルで簡易実行できます。これにより、開発環境での検証が簡単になります。
対応する kind/フィールドは Podman の man page（`podman-kube-play(1)`）の supported kinds / fields を参照してください。

**基本的な使用方法**
```bash
# Kubernetes YAMLの実行
podman kube play deployment.yaml

# 実行中のPodの確認
podman pod ps

# Podの停止と削除
podman kube down deployment.yaml
```

※ `podman kube down` 実行後も、`podman kube play` が作成した volume は残ります。不要な場合は `--force` を使用するか、手動で volume を削除してください。

**サポートされるリソースタイプ**
- Pod
- Deployment（Podとして実行）
- DaemonSet
- Job
- PersistentVolumeClaim
- ConfigMap
- Secret

※ Service/Ingress を前提にした疎通（ClusterIP/LoadBalancer/Ingress）やルーティングは `podman kube play` では再現しないため、実クラスタで確認してください。

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
podman kube play webapp.yaml

# 動作確認
curl http://localhost:8080
```

#### 11.2.2 制限事項と回避策

**主な制限事項**
1. **Service/Ingress未サポート**: ClusterIP/LoadBalancer/Ingressは機能しない
   - 回避策: hostPortを使用、またはpodman-composeで代替

2. **複数レプリカの再現不可**: Deploymentの `spec.replicas` は指定しても無視され、実行は1レプリカ相当になる
   - 回避策: ローカルでは単一インスタンスで起動確認し、スケール動作は実クラスタで検証

3. **probeの一部未対応**: `readinessProbe` / `startupProbe` は未対応（`livenessProbe` は対応）
   - 回避策: ローカルは起動/ヘルスエンドポイントの確認に留め、プローブ前提の制御は実クラスタで検証

4. **ネームスペース制限**: 完全な分離は提供されない
   - 回避策: Pod名でのプレフィックス使用

**いつ `podman kube play` で良いか / いつ実クラスタが必要か**
- `podman kube play`: YAMLの構文・主要フィールド、イメージ/環境変数/ボリューム/コマンド等の差分を早期に確認したい場合
- 実クラスタ: Service/Ingress を前提にした疎通、複数レプリカ、readiness/startup probe に依存する制御、運用要件（RBAC/NetworkPolicy等）を確認したい場合

**実用的な対処法**
```bash
# 開発用と本番用でYAMLを分ける
podman kube play dev-pod.yaml     # 開発用（hostPort含む）
kubectl apply -f prod-deploy.yaml  # 本番用（Service使用）
```

### 11.3 Kubernetes YAMLの生成

#### 11.3.1 podman kube generateコマンド

既存のPodmanコンテナからKubernetes YAMLを生成できます。これにより、ローカルで確認した構成をベースに、実クラスタ向けの差分を調整しやすくなります。

**基本的な使用方法**
```bash
# 単一コンテナから生成
podman kube generate mycontainer > pod.yaml

# Podから生成
podman kube generate mypod > pod.yaml

# Serviceも含めて生成
podman kube generate -s mypod > deployment.yaml
```

※ `-s/--service` で Service 定義も生成できますが、`podman kube play` は Service を再現しません。生成した Service は実クラスタ適用用の雛形として扱ってください。

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
- podman kube playでの動作確認
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

CRI-Oは、KubernetesのCRI実装の1つで、Podmanとコンテナ技術スタックの一部を共有します。PodmanはCLI/管理ツールであり、KubernetesのCRIランタイムではありません。

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
# 注記: `minikube --driver=podman` は experimental 扱いです。再現性重視の演習やチームでの手順共有は kind を推奨します。
# Podmanドライバーでminikube起動
minikube start --driver=podman --container-runtime=cri-o

# Podmanコンテキスト設定
eval $(minikube podman-env)

# ローカルイメージの使用
podman build -t myapp:dev .
kubectl run myapp --image=myapp:dev --image-pull-policy=Never
```

#### 11.6.2 Kindとの統合

```bash
# クラスター作成（rootless Podman provider; 公式推奨）
KIND_EXPERIMENTAL_PROVIDER=podman kind create cluster

# 一部環境では systemd-run が必要（公式docsの記載）
systemd-run --scope --user env KIND_EXPERIMENTAL_PROVIDER=podman kind create cluster
# まだエラーが出る場合
systemd-run --scope --user -p "Delegate=yes" env KIND_EXPERIMENTAL_PROVIDER=podman kind create cluster

# ローカルレジストリ設定
podman run -d -p 5000:5000 --name registry registry:2
```

※ `podman.sock` を `docker.sock` としてマウントする構成例は特殊環境向けのため、本章では標準手順として扱いません。

### 11.7 実践演習

#### 演習1: マイクロサービスアプリケーションの移行

**シナリオ**: 3つのマイクロサービスからなるアプリケーションをPodmanからKubernetesに移行する

**手順**:
1. Podmanでマイクロサービスを構築
2. podman kube generateでYAML生成
3. 生成されたYAMLをカスタマイズ
4. kind（推奨）またはMinikubeでテスト
5. 本番相当の設定を追加

**期待される成果**:
- 移行プロセスの理解
- YAML編集スキルの向上
- トラブルシューティング能力の獲得

## まとめ

- PodmanとKubernetesの関係を整理し、ローカル開発〜本番移行のギャップを埋める位置づけを確認しました。
- `podman kube play` / `podman kube generate` を中心に、YAMLの実行・生成・カスタマイズの流れを扱いました。
- 制限事項や運用上の落とし穴を踏まえ、段階的な移行の進め方の観点を示しました。

## 次に読む

- [第12章：パフォーマンスチューニング](../chapter12/)
- [目次に戻る](../../)

---
