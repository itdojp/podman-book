---
title: "第3章 Podman環境構築の最適化"
---

# 第3章 Podman環境構築の最適化

## カーネルパラメータとシステム設定の最適化

### 必須カーネルパラメータ

```bash
# 現在のカーネルパラメータを確認
$ sysctl -a | grep -E 'user.max_user_namespaces|kernel.unprivileged_userns_clone'
user.max_user_namespaces = 0      # デフォルトで無効の場合が多い
kernel.unprivileged_userns_clone = 0  # Debian/Ubuntuのデフォルト

# Rootlessコンテナに必要な設定
$ cat > /etc/sysctl.d/99-rootless.conf << EOF
# ユーザー名前空間の最大数
# 各ユーザーが作成できる名前空間数を制限
user.max_user_namespaces = 15000

# 非特権ユーザーの名前空間作成を許可
kernel.unprivileged_userns_clone = 1

# PIDの最大数（大量コンテナ実行時に必要）
kernel.pid_max = 4194304

# inotify監視の上限（ファイル監視に必要）
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 512
EOF

$ sysctl -p /etc/sysctl.d/99-rootless.conf
```

### パフォーマンスを左右する設定

```bash
# I/Oスケジューラの選択（コンテナワークロード向け）
$ echo 'mq-deadline' > /sys/block/nvme0n1/queue/scheduler

# TCPパラメータの最適化（コンテナ間通信向け）  
$ cat > /etc/sysctl.d/99-container-network.conf << EOF
# TIME_WAITソケットの再利用を有効化
net.ipv4.tcp_tw_reuse = 1

# コネクション追跡テーブルのサイズ
net.netfilter.nf_conntrack_max = 131072

# ARPキャッシュの拡大
net.ipv4.neigh.default.gc_thresh1 = 4096
net.ipv4.neigh.default.gc_thresh2 = 8192
net.ipv4.neigh.default.gc_thresh3 = 16384
EOF
```

## 3.1 プラットフォーム別最適インストール

### RHEL/CentOS/Fedora

```bash
# システムパッケージ（最新版、SELinux統合済み）
$ sudo dnf install -y podman podman-docker buildah skopeo

# crunのインストール（runcより高速）
$ sudo dnf install -y crun
$ podman --runtime /usr/bin/crun run alpine echo "test"

# SELinuxコンテキストの確認
$ ps -eZ | grep podman
system_u:system_r:container_runtime_t:s0 12345 ? 00:00:01 podman
```

### Ubuntu/Debian

```bash
# Ubuntu 22.04以降の場合（Kubicリポジトリから最新版）
$ echo "deb https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_$(lsb_release -rs)/ /" | \
  sudo tee /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list

$ curl -L "https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_$(lsb_release -rs)/Release.key" | \
  sudo apt-key add -

$ sudo apt update
$ sudo apt install -y podman buildah skopeo

# AppArmorプロファイルの確認
$ sudo aa-status | grep podman
   /usr/bin/podman (enforce)
```

### バイナリ直接インストール（最新機能利用時）

```bash
# 最新バイナリのダウンロード
$ curl -L https://github.com/containers/podman/releases/download/v4.8.0/podman-remote-static-linux_amd64.tar.gz | \
  tar xz -C /tmp

$ sudo install -m 755 /tmp/bin/podman /usr/local/bin/podman

# 依存関係のインストール
$ sudo dnf install -y \
  conmon \
  containers-common \
  crun \
  fuse-overlayfs \
  slirp4netns \
  iptables
```

## 3.2 Rootlessコンテナの詳細設定

### UID/GIDマッピングの設計

```bash
# ユーザーIDマッピングの確認
$ id
uid=1000(user) gid=1000(user) groups=1000(user)

$ cat /etc/subuid
user:100000:65536
# 意味: userは100000から65536個のUIDを使用可能

# マッピングの実際の動作
$ podman run --rm alpine cat /proc/self/uid_map
         0       1000          1  # コンテナ内UID 0 = ホストUID 1000
         1     100000      65536  # コンテナ内UID 1-65536 = ホストUID 100000-165535

# 実際のファイル所有者確認
$ podman run -v /tmp/test:/data alpine touch /data/file
$ ls -ln /tmp/test/file
-rw-r--r-- 1 100000 100000 0 Jan 15 10:00 /tmp/test/file
```

### ストレージドライバーの選択

```bash
# 現在のストレージドライバー確認
$ podman info --format '\{\{.Store.GraphDriverName\}\}'
overlay

$ podman info --format '\{\{.Store.GraphOptions\}\}'
overlay.mount_program=/usr/bin/fuse-overlayfs

# パフォーマンス測定
$ time podman pull docker.io/library/ubuntu:22.04

# native overlay (カーネル5.11以降)
real    0m8.234s

# fuse-overlayfs
real    0m12.456s

# vfs (互換性重視)
real    0m25.789s
```

### ネットワーク設定の最適化

```bash
# Rootless CNIの設定
$ cat ~/.config/containers/containers.conf
[network]
# CNIプラグインディレクトリ
network_config_dir = "/home/user/.config/cni/net.d"
cni_plugin_dirs = ["/usr/libexec/cni", "/usr/lib/cni"]

# デフォルトネットワーク
default_network = "podman"

# ネットワークバックエンド
network_backend = "cni"  # または "netavark" (Podman 4.0+)

# カスタムネットワークの作成
$ podman network create \
  --subnet 172.20.0.0/16 \
  --gateway 172.20.0.1 \
  --ip-range 172.20.1.0/24 \
  custom-net

# ネットワーク設定の確認
$ cat ~/.config/cni/net.d/custom-net.conflist | jq .
{
  "cniVersion": "0.4.0",
  "name": "custom-net",
  "plugins": [
    {
      "type": "bridge",
      "bridge": "cni-podman1",
      "isGateway": true,
      "ipMasq": true,
      "hairpinMode": true,
      "ipam": {
        "type": "host-local",
        "routes": [{"dst": "0.0.0.0/0"}],
        "ranges": [[
          {
            "subnet": "172.20.0.0/16",
            "gateway": "172.20.0.1",
            "rangeStart": "172.20.1.1",
            "rangeEnd": "172.20.1.254"
          }
        ]]
      }
    },
    {
      "type": "portmap",
      "capabilities": {
        "portMappings": true
      }
    },
    {
      "type": "firewall"
    },
    {
      "type": "tuning"
    }
  ]
}
```

### cgroups v2の詳細設定

```bash
# cgroups v2の有効化確認
$ mount | grep cgroup
cgroup2 on /sys/fs/cgroup type cgroup2 (rw,nosuid,nodev,noexec,relatime)

# Rootlessでのリソース制限設定
$ podman run --memory 512m --cpus 0.5 alpine sh -c '
  echo "Memory limit: $(cat /sys/fs/cgroup/memory.max)";
  echo "CPU quota: $(cat /sys/fs/cgroup/cpu.max)"'
  
Memory limit: 536870912
CPU quota: 50000 100000

# systemdスライスでのcgroup管理
$ systemctl --user status
● user@1000.service - User Manager for UID 1000
     Loaded: loaded
     Active: active (running)
   Main PID: 1234 (systemd)
     Status: "Ready"
      CGroup: /user.slice/user-1000.slice/user@1000.service
              ├─session.slice
              │ └─podman-12345.scope  # Podmanコンテナ
              │   ├─12345 /usr/bin/conmon
              │   └─12367 /usr/bin/crun

# ユーザー単位でのリソース制限
$ systemctl --user set-property user@1000.service \
  MemoryMax=8G CPUQuota=200%
```

### ストレージ最適化設定

```bash
# ストレージ設定ファイル
$ cat ~/.config/containers/storage.conf
[storage]
driver = "overlay"
runroot = "/run/user/1000/containers"
graphroot = "/home/user/.local/share/containers/storage"

[storage.options]
# マウントオプション
mount_program = "/usr/bin/fuse-overlayfs"
mountopt = "nodev,metacopy=on"

# イメージストアのサイズ制限
size = "10G"

# パフォーマンスオプション
# skip_mount_home = "true"  # ホームディレクトリマウントをスキップ

# ストレージ使用状況の確認
$ podman system df
TYPE           TOTAL   ACTIVE  SIZE    RECLAIMABLE
Images         15      5       2.45GB  1.23GB (50%)
Containers     8       3       123MB   89MB (72%)
Local Volumes  3       2       456MB   123MB (27%)

# ガベージコレクション
$ podman system prune -a --volumes
```

**なぜストレージドライバーの選択が重要か**

ストレージドライバーは、コンテナのパフォーマンスと機能に直接影響します：

**各ドライバーの特性と用途**

```bash
# ~/.config/containers/storage.conf
[storage]
driver = "overlay"  # なぜoverlayを選ぶのか

# overlay: 最高のパフォーマンス、本番環境推奨
# - Copy-on-Write により効率的なレイヤー管理
# - ハードリンクによる容量節約
# - 高速な起動とビルド

[storage.options.overlay]
# Rootlessの場合はfuse-overlayfsが必要（なぜか）
mount_program = "/usr/bin/fuse-overlayfs"
# → カーネルのoverlayfsはroot権限が必要
# → fuseにより、ユーザー空間で同等機能を実現

# ストレージパスの意味
graphroot = "$HOME/.local/share/containers/storage"  # イメージとレイヤー保存先
runroot = "$XDG_RUNTIME_DIR/containers"  # 実行時の一時データ（高速なtmpfs推奨）
```

**ストレージクォータ設定の必要性**

```bash
# なぜクォータが必要か
# - ディスク容量の枯渇を防ぐ
# - マルチユーザー環境での公平性確保
# - 暴走したビルドプロセスからの保護

[storage.options.vfs]
size = "10G"  # ユーザーごとの上限設定
```

#### 3.2.3 レジストリ設定

**なぜレジストリ設定をカスタマイズするのか**

デフォルトのレジストリ設定では、以下の問題が発生する可能性があります：

- セキュリティ: 信頼できないレジストリからの意図しないプル
- パフォーマンス: 地理的に遠いレジストリへのアクセス
- コンプライアンス: 承認されていないイメージの使用

```bash
# /etc/containers/registries.conf
unqualified-search-registries = ["docker.io", "quay.io"]
# → "nginx" のような短縮名で、どのレジストリを検索するか
# → セキュリティのため、信頼できるレジストリのみに限定すべき

[[registry]]
location = "docker.io"
insecure = false  # HTTPSを強制（なぜ重要か: 中間者攻撃を防ぐ）

[[registry]]
location = "localhost:5000"
insecure = true  # 開発環境のみ許可（本番では絶対に使用しない）

# ミラー設定の効果
[[registry]]
location = "docker.io"
[[registry.mirror]]
location = "mirror.gcr.io"  # 地理的に近いミラーで高速化
# → グローバル企業では、各地域にミラーを配置してレイテンシを削減
```

### 3.3 ネットワーク設定

#### 3.3.1 CNIプラグイン

**基本的なCNI設定**
```json
{
  "cniVersion": "0.4.0",
  "name": "podman",
  "plugins": [
    {
      "type": "bridge",
      "bridge": "cni-podman0",
      "isGateway": true,
      "ipMasq": true,
      "hairpinMode": true,
      "ipam": {
        "type": "host-local",
        "routes": [{ "dst": "0.0.0.0/0" }],
        "ranges": [
          [
            {
              "subnet": "10.88.0.0/16",
              "gateway": "10.88.0.1"
            }
          ]
        ]
      }
    },
    {
      "type": "portmap",
      "capabilities": {
        "portMappings": true
      }
    },
    {
      "type": "firewall"
    }
  ]
}
```

#### 3.3.2 ファイアウォール統合

**firewalldとの連携**
```bash
# Podman用ゾーン作成
sudo firewall-cmd --permanent --new-zone=containers
sudo firewall-cmd --permanent --zone=containers --add-source=10.88.0.0/16
sudo firewall-cmd --permanent --zone=containers --add-port=80/tcp
sudo firewall-cmd --reload
```

### 3.4 セキュリティ設定

#### 3.4.1 SELinux統合

**SELinuxコンテキスト**
```bash
# コンテナ用SELinuxコンテキスト
ls -Z /var/lib/containers
system_u:object_r:container_var_lib_t:s0 /var/lib/containers

# ボリュームマウント時のラベル
podman run -v /host/path:/container/path:Z ...  # プライベートラベル
podman run -v /host/path:/container/path:z ...  # 共有ラベル
```

#### 3.4.2 seccomp/AppArmor

**seccompプロファイル**
```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": [
    "SCMP_ARCH_X86_64",
    "SCMP_ARCH_X86",
    "SCMP_ARCH_X32"
  ],
  "syscalls": [
    {
      "names": [
        "accept",
        "accept4",
        "access",
        "alarm",
        "bind",
        "brk"
      ],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

### 3.5 パフォーマンスチューニング

#### 3.5.1 システムパラメータ

```bash
# /etc/sysctl.d/podman.conf
# ネットワークパフォーマンス
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1

# ファイルディスクリプタ
fs.file-max = 1048576
fs.nr_open = 1048576

# メモリ設定
vm.max_map_count = 262144
```

#### 3.5.2 ストレージ最適化

```bash
# オーバーレイファイルシステムの最適化
[storage.options.overlay]
# メタデータの非同期化
skip_sync = true

# レイヤー数の制限
force_mask = "0700"
```

### 演習問題

1. Rootless Podmanをセットアップし、動作確認してください
2. プライベートレジストリを設定し、イメージをプッシュしてください
3. カスタムCNI設定を作成し、特定のIPレンジを使用してください

---