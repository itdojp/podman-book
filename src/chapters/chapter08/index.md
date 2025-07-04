---
title: "第8章 セキュリティとRootlessコンテナ"
---

# 第8章 セキュリティとRootlessコンテナ

### 本章の意義と学習目標

**なぜコンテナセキュリティを深く理解する必要があるのか**

コンテナは「軽量な仮想マシン」ではなく、プロセス隔離技術です。この違いを理解することが、安全な運用の鍵となります：

1. **脅威の理解**: コンテナ特有の攻撃ベクトルと対策
2. **Rootlessの革新性**: 従来の常識を覆すセキュリティモデル
3. **コンプライアンス対応**: 規制要件を満たすセキュアな実装
4. **ゼロトラスト実現**: 最小権限の原則の実践

本章では、「便利だが危険」から「便利で安全」なコンテナ運用への転換を学びます。

### 8.1 コンテナセキュリティの基礎

#### 8.1.1 セキュリティレイヤー

**なぜ多層防御が必要なのか**

コンテナセキュリティは、単一の技術ではなく、複数のレイヤーで実現されます：

```
アプリケーション層  ← セキュアコーディング、依存関係管理
    ↓
コンテナランタイム層  ← Capabilities、Seccomp、SELinux
    ↓
ホストOS層  ← カーネル強化、パッチ管理
    ↓
ハードウェア層  ← セキュアブート、TPM
```

各層での防御が、全体のセキュリティを構成します。

**主要なセキュリティ機能とその役割**

1. **Namespace隔離 - 見える世界を制限**
   - 効果: コンテナは自分の世界しか見えない
   - 攻撃者の視点: システム全体の情報収集が困難

2. **Capabilities制限 - できることを制限**
   - 効果: root権限を細分化し、必要最小限のみ付与
   - 例: ネットワーク設定はできるが、カーネルモジュールはロードできない

3. **Seccomp - システムコールを制限**
   - 効果: 危険なシステムコールをブロック
   - 実例: 攻撃によく使われるptrace、mountをブロック

4. **SELinux/AppArmor - 強制アクセス制御**
   - 効果: たとえrootでも、ポリシー外の操作は不可
   - 価値: 未知の脆弱性に対する最後の防衛線

5. **ユーザー名前空間 - 権限の仮想化**
   - 効果: コンテナ内のrootが、ホストでは一般ユーザー
   - 革新性: root権限なしでフル機能のコンテナを実行

#### 8.1.2 脅威モデル

**コンテナ固有の脅威を理解する重要性**

従来のVMとは異なる脅威が存在し、対策も異なります：

**1. コンテナエスケープ**
- 脅威: コンテナからホストOSへの脱出
- 原因: カーネルの脆弱性、設定ミス
- 対策: Rootless実行、最新カーネル、適切な設定

**2. 特権昇格**
- 脅威: 一般ユーザーからroot権限獲得
- 原因: 過剰なCapabilities、脆弱な設定
- 対策: 最小権限の原則、Capabilities削除

**3. サイドチャネル攻撃**
- 脅威: 他のコンテナの情報を盗み見る
- 原因: 共有リソース（CPU、メモリ）
- 対策: リソース分離、暗号化

**4. リソース枯渇**
- 脅威: 1つのコンテナが全リソース消費
- 原因: リソース制限なし
- 対策: cgroups制限、クォータ設定

**5. イメージの改ざん**
- 脅威: 悪意のあるコードを含むイメージ
- 原因: 信頼できないソース、署名検証なし
- 対策: イメージ署名、スキャン、信頼できるレジストリ

### 8.2 Rootlessコンテナ詳解

#### 8.2.1 Rootlessの仕組み

**なぜRootlessが画期的なのか**

従来の常識：「コンテナを動かすにはroot権限が必要」
Podmanの革新：「一般ユーザーでフル機能のコンテナを実行」

この変化がもたらす価値：
1. **攻撃面の劇的な削減**: root権限デーモンという巨大な攻撃対象が消滅
2. **開発者の自由度向上**: 管理者権限なしで自由に作業
3. **マルチテナント対応**: 各ユーザーが独立してコンテナ運用
4. **コンプライアンス対応**: 最小権限の原則を技術的に実現

```bash
# ユーザー名前空間の仕組み
cat /proc/self/uid_map
         0       1000          1    # UID 0（root）が実際はUID 1000
         1     100000      65536    # UID 1-65536が100000-165535にマップ

# Rootlessモードの確認
podman info | grep rootless
# rootless: true

# これが意味すること：
# - コンテナ内でroot（UID 0）として動作
# - ホストでは一般ユーザー（UID 1000）
# - コンテナ脱出してもroot権限は得られない
```

**Rootlessの利点を実感する例**

```bash
# 従来（Docker）: rootが必要
sudo docker run -d nginx  # sudoが必須

# Podman: 一般ユーザーで実行
podman run -d nginx      # sudoは不要！

# セキュリティインシデントのシミュレーション
# もしコンテナが侵害されても...
# Docker: root権限でホストにアクセス可能 → 全システム侵害
# Podman: 一般ユーザー権限のみ → 被害は限定的
```

#### 8.2.2 Rootless設定と制限

**なぜ特別な設定が必要なのか**

Rootlessは強力ですが、従来のroot前提の機能を一般ユーザーで実現するため、システム設定の調整が必要です：

```bash
# ユーザー設定が必要な理由
echo "$USER:100000:65536" | sudo tee -a /etc/subuid
echo "$USER:100000:65536" | sudo tee -a /etc/subgid

# これにより：
# - 65536個の仮想UID/GIDが使用可能
# - コンテナ内で完全なユーザー階層を再現
# - マルチユーザーアプリケーションが動作可能

# システム設定の意味
cat > /etc/sysctl.d/userns.conf << EOF
user.max_user_namespaces = 28633     # namespace作成数の上限
net.ipv4.ip_unprivileged_port_start = 80  # 80番ポートも使用可能に
net.ipv4.ping_group_range = 0 2000000     # pingを一般ユーザーに許可
EOF

# なぜこれらが重要か：
# - Webサーバーが80/443で待ち受け可能
# - ネットワーク診断ツールが使用可能
# - 開発環境が本番環境と同じ設定で動作
```

**Rootlessの制限事項と回避策**

制限を理解することで、適切な対策を講じられます：

```bash
# 制限1: ホストネットワークモード使用不可
# 理由: ホストのネットワークスタック変更にはroot権限必要
# 回避策: ポートフォワーディングを使用
podman run -p 8080:80 nginx  # ホストの8080をコンテナの80にマップ

# 制限2: 1024未満のポートバインド（デフォルト）
# 理由: 伝統的にwell-knownポートはroot専用
# 解決策: sysctl設定で許可
sudo sysctl net.ipv4.ip_unprivileged_port_start=80

# 制限3: 一部のボリュームマウント
# 理由: ファイルシステムの権限
# 解決策: ユーザー名前空間でのマッピング
podman unshare chown -R $(id -u):$(id -g) /path/to/volume
```

### 8.3 セキュリティ機能の活用

#### 8.3.1 Capabilities管理

```bash
# デフォルトCapabilities確認
podman run --rm alpine capsh --print

# Capabilities追加
podman run --cap-add NET_ADMIN alpine ip route

# Capabilities削除
podman run --cap-drop ALL --cap-add NET_BIND_SERVICE nginx:alpine

# 推奨最小Capabilities
podman run \
  --cap-drop ALL \
  --cap-add CHOWN \
  --cap-add DAC_OVERRIDE \
  --cap-add SETGID \
  --cap-add SETUID \
  --cap-add NET_BIND_SERVICE \
  nginx:alpine
```

#### 8.3.2 Seccompプロファイル

```json
// custom-seccomp.json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": [
        "accept", "accept4", "access", "alarm",
        "bind", "brk", "capget", "capset",
        "chdir", "chmod", "chown", "clock_gettime",
        "clone", "close", "connect", "dup",
        "epoll_create", "epoll_ctl", "epoll_wait",
        "execve", "exit", "exit_group", "fcntl",
        "fstat", "futex", "getcwd", "getdents",
        "getpid", "getppid", "getsockname", "getsockopt",
        "gettimeofday", "getuid", "ioctl", "listen",
        "lseek", "madvise", "mmap", "mprotect",
        "munmap", "nanosleep", "open", "openat",
        "pipe", "poll", "pread64", "pwrite64",
        "read", "recvfrom", "recvmsg", "rt_sigaction",
        "rt_sigprocmask", "rt_sigreturn", "select",
        "sendmsg", "sendto", "set_tid_address",
        "setsockopt", "shutdown", "sigaltstack",
        "socket", "stat", "uname", "wait4", "write"
      ],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

```bash
# カスタムSeccompプロファイル適用
podman run --security-opt seccomp=custom-seccomp.json alpine
```

#### 8.3.3 SELinux統合

```bash
# SELinuxコンテキスト確認
ls -Z /var/lib/containers

# コンテナのSELinuxラベル
podman run --rm alpine cat /proc/self/attr/current

# カスタムSELinuxタイプ
podman run \
  --security-opt label=type:svirt_apache_t \
  httpd:latest

# ボリュームのラベリング
podman run -v /data:/data:Z alpine  # プライベート再ラベル
podman run -v /data:/data:z alpine  # 共有ラベル
```

### 8.4 イメージセキュリティ

#### 8.4.1 イメージスキャン

```bash
# Trivyによるスキャン
podman run --rm \
  -v /var/run/podman/podman.sock:/var/run/docker.sock \
  aquasec/trivy image myapp:latest

# Clairによるスキャン
# Clairサーバー起動
podman run -d --name clair \
  -p 6060:6060 \
  quay.io/coreos/clair:latest

# スキャン実行
clairctl analyze myapp:latest
```

#### 8.4.2 イメージ署名と検証

```bash
# GPGキー作成
gpg --gen-key

# 署名ポリシー設定
cat > /etc/containers/policy.json << EOF
{
  "default": [{"type": "reject"}],
  "transports": {
    "docker": {
      "registry.example.com": [
        {
          "type": "signedBy",
          "keyType": "GPGKeys",
          "keyPath": "/etc/pki/rpm-gpg/RPM-GPG-KEY-example"
        }
      ],
      "docker.io": [{"type": "insecureAcceptAnything"}]
    }
  }
}
EOF

# イメージ署名
podman push --sign-by security@example.com registry.example.com/myapp:latest
```

### 8.5 ランタイムセキュリティ

#### 8.5.1 読み取り専用コンテナ

```bash
# 読み取り専用ルートファイルシステム
podman run -d \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /var/run \
  nginx:alpine

# 特定ディレクトリのみ書き込み可能
podman run -d \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid \
  --volume app-data:/data:rw \
  myapp:latest
```

#### 8.5.2 セキュリティオプション

```bash
# No new privileges
podman run \
  --security-opt no-new-privileges \
  alpine

# プロセス分離
podman run \
  --pid=host \
  --security-opt label=disable \
  monitoring-agent:latest

# ユーザー名前空間の無効化（Rootfulモード）
sudo podman run \
  --userns=host \
  legacy-app:latest
```

### 8.6 コンプライアンスとポリシー

#### 8.6.1 CIS Dockerベンチマーク準拠

```bash
# 監査スクリプト
cat > audit-containers.sh << 'EOF'
#!/bin/bash

echo "=== Container Security Audit ==="

# 実行中のコンテナ確認
echo -e "\n[Running Containers]"
podman ps --format "table \{\{.Names\}\}\t\{\{.Status\}\}\t\{\{.Ports\}\}"

# 特権コンテナの確認
echo -e "\n[Privileged Containers]"
podman ps -a --format json | jq '.[] | select(.Privileged == true) | .Names'

# ルートで実行されているコンテナ
echo -e "\n[Containers running as root]"
for container in $(podman ps -q); do
    USER=$(podman exec $container whoami 2>/dev/null)
    if [ "$USER" = "root" ]; then
        echo "Container: $(podman inspect $container | jq -r '.[0].Name')"
    fi
done

# Capabilitiesの確認
echo -e "\n[Container Capabilities]"
for container in $(podman ps -q); do
    echo "Container: $(podman inspect $container | jq -r '.[0].Name')"
    podman inspect $container | jq '.[0].EffectiveCaps'
done
EOF

chmod +x audit-containers.sh
```

#### 8.6.2 セキュリティポリシーの実装

```yaml
# security-policy.yaml
apiVersion: v1
kind: SecurityPolicy
metadata:
  name: container-security-policy
spec:
  requiredLabels:
    - key: security.scan
      value: passed
  forbidden:
    - privileged: true
    - capabilities:
        add: ["SYS_ADMIN", "NET_ADMIN"]
  required:
    - readOnlyRootFilesystem: true
    - runAsNonRoot: true
    - dropCapabilities: ["ALL"]
  allowed:
    - capabilities:
        add: ["NET_BIND_SERVICE", "CHOWN"]
```

### 8.7 セキュリティベストプラクティス

#### 8.7.1 開発時のセキュリティ

1. **最小権限の原則**
```dockerfile
FROM alpine:3.18
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

2. **マルチステージビルド**
```dockerfile
# ビルドステージには開発ツールを含む
FROM golang:1.20 AS builder
# ... build process ...

# 実行ステージは最小限
FROM scratch
COPY --from=builder /app/binary /
USER 1000:1000
ENTRYPOINT ["/binary"]
```

3. **シークレット管理**
```bash
# ビルド時シークレット
podman build \
  --secret id=npmrc,src=$HOME/.npmrc \
  -t myapp:latest .

# 実行時シークレット
podman run \
  --secret source=db-password,target=db_password \
  myapp:latest
```

### 演習問題

1. Rootlessコンテナ環境を構築し、Webアプリケーションを実行してください
2. カスタムSeccompプロファイルを作成し、最小限のシステムコールのみ許可してください
3. セキュリティ監査スクリプトを作成し、ポリシー違反を検出してください

---