---
layout: book
order: 4
title: "第3章：基本的なコンテナ操作"
---

# 第3章：基本的なコンテナ操作

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

### Ubuntu

```bash
# Ubuntu 22.04/24.04 の場合（Kubicリポジトリから最新版）
$ sudo apt update
$ sudo apt install -y ca-certificates curl gpg

$ . /etc/os-release
$ sudo install -m 0755 -d /etc/apt/keyrings

$ curl -fsSL "https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_${VERSION_ID}/Release.key" | \
  sudo gpg --dearmor --yes --batch -o /etc/apt/keyrings/libcontainers.gpg
$ sudo chmod a+r /etc/apt/keyrings/libcontainers.gpg

$ echo "deb [signed-by=/etc/apt/keyrings/libcontainers.gpg] https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_${VERSION_ID}/ /" | \
  sudo tee /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list > /dev/null

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
# rootless状態、kernel、storage driver、driver optionを同時に確認
$ podman info --format json | jq '{
    rootless: .host.security.rootless,
    kernel: .host.kernel,
    graphDriver: .store.graphDriverName,
    graphRoot: .store.graphRoot,
    graphOptions: .store.graphOptions
  }'

# 期待するdriver名はDockerのoverlay2ではなくoverlay
{
  "rootless": true,
  "kernel": "<running-kernel>",
  "graphDriver": "overlay",
  "graphRoot": "/home/user/.local/share/containers/storage",
  "graphOptions": {}
}
```

`graphDriver`が`overlay`で、`graphOptions`に`overlay.mount_program`がなければnative overlayを使用しています。`overlay.mount_program`に`fuse-overlayfs`が記録されていればFUSE経由です。native rootless OverlayFSはLinux 5.12.9以降が前提ですが、kernel番号だけで決めず、backing filesystemとディストリビューションのsupport policyも確認します。

`fuse-overlayfs`を導入しても、既存の`$HOME/.config/containers/storage.conf`があると自動選択されない場合があります。設定変更前に既存container/imageを退避し、変更後は`podman info`で実際に選択されたdriverとoptionを再確認してください。

### network backendと設定の確認

```bash
# 現在のbackendを確認。現行Podmanの通常buildではNetavark
$ podman info --format '\{\{.Host.NetworkBackend\}\}'
netavark

# 公開CLIでnetworkを作成
$ podman network create \
  --subnet 172.20.0.0/16 \
  --gateway 172.20.0.1 \
  custom-net

# generated fileを直接読むのではなく、公開CLIで結果を確認
$ podman network inspect custom-net | jq '.[0] | {
    name, driver, network_interface, subnets, dns_enabled
  }'
```

Netavarkのnetwork config directoryは、rootfulでは`/etc/containers/networks`、rootlessでは`$graphroot/networks`です。`graphroot`の既定値は`$HOME/.local/share/containers/storage`ですが、固定pathを仮定せず`podman info`で確認します。generated JSONは内部実装として扱い、作成・変更・確認には`podman network` commandを使用します。

Podman 4以前のCNI環境から移行する場合、CNIの`.conflist`をNetavark directoryへcopyしません。旧networkの接続containerと設定を記録し、現行Podman上でnetworkを再作成してから切り替えます。Podman 5.0ではCNI supportが通常buildで無効化され、Podman 6.0で削除されました。現行Podmanの新規設定でCNI backendを選択する手順は対象外です。

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

native rootless OverlayFSを利用できる環境では、`mount_program`を設定しません。

```toml
# ~/.config/containers/storage.conf（native overlay）
[storage]
driver = "overlay"
runroot = "/run/user/1000/containers"
graphroot = "/home/user/.local/share/containers/storage"

[storage.options.overlay]
mountopt = "nodev"
```

kernelまたはbacking filesystemの制約でnative overlayを利用できない場合だけ、fallbackとして次を追加します。

```toml
# ~/.config/containers/storage.conf（fuse-overlayfs fallback）
[storage.options.overlay]
mount_program = "/usr/bin/fuse-overlayfs"
mountopt = "nodev"
```

```bash
# 選択結果とストレージ使用状況の確認
$ podman info --format json | jq '{
    graphDriver: .store.graphDriverName,
    graphOptions: .store.graphOptions
  }'
$ podman system df
TYPE           TOTAL   ACTIVE  SIZE    RECLAIMABLE
Images         15      5       2.45GB  1.23GB (50%)
Containers     8       3       123MB   89MB (72%)
Local Volumes  3       2       456MB   123MB (27%)

# ガベージコレクション
$ podman system prune
# 影響が大きい操作（未使用イメージ/ボリュームも削除される可能性があるため注意）
# $ podman system prune --all --volumes
```

**なぜストレージドライバーの選択が重要か**

ストレージドライバーは、コンテナのパフォーマンスと機能に直接影響します。

**各ドライバーの特性と用途**

```toml
# ~/.config/containers/storage.conf
[storage]
driver = "overlay"  # Podman / containers-storageでのdriver名
graphroot = "/home/user/.local/share/containers/storage"
runroot = "/run/user/1000/containers"

# overlay: copy-on-writeによるlayer管理
# - Copy-on-Write により効率的なレイヤー管理
# - ハードリンクによる容量節約
# - 高速な起動とビルド

[storage.options.overlay]
mountopt = "nodev"
```

上記はnative overlayの例です。fallbackが必要な環境だけ、別途`mount_program = "/usr/bin/fuse-overlayfs"`を`[storage.options.overlay]`へ追加します。native overlayの設定例へ`mount_program`をcopyしないでください。

**storage quotaの適用境界**

`size = "10G"`を`[storage.options.vfs]`へ置く方法は現行schemaにありません。quota optionはdriverごとに異なり、backing filesystem側のproject quotaなど追加要件もあります。設定前に[containers-storage.conf](https://github.com/podman-container-tools/container-libs/blob/main/storage/docs/containers-storage.conf.5.md)の対象driver節を確認し、`podman info`と実際の書き込み上限で検証します。

#### 3.2.3 レジストリ設定

**なぜレジストリ設定をカスタマイズするのか**

デフォルトのレジストリ設定では、以下の問題が発生する可能性があります。

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

#### 3.3.1 Netavarkとaardvark-dns

Netavarkは現行Podmanのnetwork backendです。DNSが有効なnetworkではaardvark-dnsがcontainer名とnetwork aliasを登録します。rootless containerをdefault network modeで実行するときはpastaが使われます。

```bash
# backendとrootless network toolを確認
$ podman info --format json | jq '{
    backend: .host.networkBackend,
    backendInfo: .host.networkBackendInfo,
    rootless: .host.security.rootless,
    pasta: .host.pasta
  }'

# bridge networkを作成し、driver / subnet / DNSを確認
$ podman network create --subnet 10.89.10.0/24 app-net
$ podman network inspect app-net | jq '.[0] | {
    name, driver, network_interface, subnets, dns_enabled
  }'

# container名とaliasによるname解決を確認
$ podman run -d --name web --network app-net docker.io/library/nginx:1.28.0-alpine
$ podman run --rm --network app-net docker.io/library/busybox:1.37.0 \
    nslookup web

# 演習後のcleanup
$ podman rm -f web
$ podman network rm app-net
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
3. `podman network create`でNetavarkのcustom networkを作成し、`podman network inspect`でsubnetとDNS設定を確認してください

### 参考資料

エンタープライズ環境での詳細な要件については、[エンタープライズ要件詳細ガイド](../../additional/enterprise-requirements/)を参照してください。

- [Podman rootless mode / storage](https://docs.podman.io/en/stable/markdown/podman.1.html#rootless-mode)
- [podman network](https://docs.podman.io/en/stable/markdown/podman-network.1.html)
- [podman info](https://docs.podman.io/en/stable/markdown/podman-info.1.html)
- [Podman v5.0.0 release notes（CNI supportの通常build無効化）](https://github.com/podman-container-tools/podman/releases/tag/v5.0.0)
- [Podman v6.0.0 release notes（CNI networkingの削除）](https://github.com/podman-container-tools/podman/releases/tag/v6.0.0)
- [containers-storage.conf](https://github.com/podman-container-tools/container-libs/blob/main/storage/docs/containers-storage.conf.5.md)

## まとめ

- Rootless運用に必要なカーネルパラメータと、パフォーマンスに影響する設定の観点を整理しました。
- 環境（RHEL系/Ubuntu系/バイナリ配布）ごとのインストール方法と、導入時に確認すべきポイントを確認しました。
- UID/GIDマッピングなど、Rootlessコンテナの前提となる詳細設定の考え方を扱いました。

## 次に読む

- [第4章：イメージの管理と作成](../chapter04/)
- [目次に戻る](../../)

---
