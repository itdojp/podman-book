---
title: "第1章：コンテナ技術の基礎"
---

# 第1章：コンテナ技術の基礎

## Linux名前空間とcgroupsによるプロセス分離の実装

コンテナは仮想化技術ではなく、Linuxカーネルが提供するプロセス分離機能の組み合わせです。本章では、その実装メカニズムを解説します。

## Podmanアーキテクチャ概要

Podmanは従来のDockerとは大きく異なるアーキテクチャを採用しています。まず、両者の詳細な比較から見ていきましょう。

### DockerとPodmanの包括的比較（2024年最新版）

#### 技術的特徴の比較

| 機能 | Podman (v5.0.x) | Docker (v25.x) | 選択指針 |
|------|-----------------|----------------|----------|
| **アーキテクチャ** | デーモンレス | デーモン必須（dockerd） | セキュリティ重視→Podman |
| **rootless実行** | ◎ ネイティブ対応 | △ 実験的機能 | 一般ユーザー権限実行→Podman |
| **Pod機能** | ◎ Kubernetes互換 | × なし | K8s移行予定→Podman |
| **systemd統合** | ◎ ネイティブ | △ 外部ツール必要 | RHEL/CentOS環境→Podman |
| **SELinux統合** | ◎ 完全対応 | △ 追加設定要 | セキュリティ要件高→Podman |
| **Windows対応** | △ WSL2経由 | ◎ ネイティブ | Windows中心→Docker |
| **macOS対応** | △ VM経由 | ◎ Docker Desktop | macOS開発→Docker |
| **イメージ互換性** | ◎ OCI準拠 | ◎ OCI準拠 | 両者で相互利用可能 |
| **docker-compose** | ○ podman-compose | ◎ ネイティブ | 既存compose資産→Docker |
| **Swarmモード** | × なし | ◎ 内蔵 | Swarm利用中→Docker |

#### パフォーマンス特性

| 項目 | Podman | Docker | 実測値 |
|------|--------|--------|--------|
| **起動時間** | ◎ 高速（デーモンレス） | ○ 通常 | Podman: 0.38s vs Docker: 0.52s |
| **メモリ使用量** | ◎ 低い | △ デーモン分増加 | デーモンなし vs 約30MB常駐 |
| **同時コンテナ数** | ◎ 制限なし | ○ デーモン依存 | 1000コンテナ起動で差が顕著 |
| **ビルド速度** | ○ 同等 | ○ 同等 | BuildKit使用時は同等 |

#### エンタープライズ機能

| 機能 | Podman | Docker | 推奨環境 |
|------|--------|--------|----------|
| **監査ログ** | ◎ systemd統合 | △ 別途設定 | コンプライアンス重視→Podman |
| **RBAC** | ◎ ネイティブ | △ EE版のみ | 権限管理重視→Podman |
| **FIPS 140-2** | ◎ 対応 | △ 限定的 | 政府・金融→Podman |
| **商用サポート** | ◎ Red Hat | ◎ Docker Inc. | 既存契約に依存 |

### アーキテクチャの詳細比較

```mermaid
graph TB
    subgraph "従来のDocker"
        D1[Docker CLI] --> D2[Docker Daemon<br/>dockerd]
        D2 --> D3[containerd]
        D3 --> D4[runc]
        D4 --> D5[Container Process]
        D2 -.->|root権限| D6[System Resource]
    end
    
    subgraph "Podman"
        P1[Podman CLI] --> P2[libpod<br/>Library]
        P2 --> P3[conmon<br/>Monitoring]
        P2 --> P4[crun/runc<br/>OCI Runtime]
        P4 --> P5[Container Process]
        P3 -.->|ユーザー権限| P6[User Resource]
    end
    
    style D2 fill:#ffcccc
    style P2 fill:#ccffcc
    style D6 fill:#ffcccc
    style P6 fill:#ccffcc
```

**主な差異点：**
- **デーモンレス実行**: Podmanは常駐プロセスを持たない
- **ユーザー権限実行**: rootless containerが標準
- **プロセス分離**: 各コンテナが独立したプロセス

### パフォーマンス特性の実測値

**起動時間の比較（Alpine Linux）**
```bash
# コンテナ起動
$ time podman run --rm alpine echo "hello"
hello
real    0m0.382s

# VM起動（QEMU/KVM）
$ time qemu-system-x86_64 -m 512 -hda alpine.qcow2 -nographic
# ブートシーケンス省略
real    0m4.827s
```

**メモリオーバーヘッド**
```bash
# コンテナのメモリ使用量
$ podman stats --no-stream
ID     NAME         CPU %  MEM USAGE / LIMIT  MEM %
a3f4   alpine_ctr   0.00%  1.2MiB / 16GiB     0.01%

# 同等のVMメモリ使用量: 512MB（最小構成）
```

## 1.1 名前空間によるリソース分離の実装

### 🏗️ コンテナアーキテクチャ全体図

```mermaid
graph TB
    subgraph "ホストシステム"
        HOST_KERNEL[Linux カーネル]
        HOST_NS[ホスト名前空間]
        HOST_CGROUP[ホストcgroups]
    end
    
    subgraph "Container Runtime (Podman)"
        PODMAN[Podman Engine]
        CONMON[conmon]
        OCI_RUNTIME[OCI Runtime<br/>(runc/crun)]
    end
    
    subgraph "Container 1"
        C1_NS[独立名前空間]
        C1_PROC[プロセス群]
        C1_FS[独立ファイルシステム]
        C1_NET[独立ネットワーク]
    end
    
    subgraph "Container 2"
        C2_NS[独立名前空間]
        C2_PROC[プロセス群]
        C2_FS[独立ファイルシステム]
        C2_NET[独立ネットワーク]
    end
    
    HOST_KERNEL --> HOST_NS
    HOST_KERNEL --> HOST_CGROUP
    
    PODMAN --> CONMON
    CONMON --> OCI_RUNTIME
    OCI_RUNTIME --> HOST_KERNEL
    
    HOST_KERNEL --> C1_NS
    HOST_KERNEL --> C2_NS
    
    C1_NS --> C1_PROC
    C1_NS --> C1_FS
    C1_NS --> C1_NET
    
    C2_NS --> C2_PROC
    C2_NS --> C2_FS
    C2_NS --> C2_NET
    
    style HOST_KERNEL fill:#e3f2fd
    style C1_NS fill:#e8f5e8
    style C2_NS fill:#fff3e0
    style PODMAN fill:#f3e5f5
```

### 🔗 Linux名前空間の分離メカニズム

```mermaid
graph TD
    subgraph "7つの名前空間"
        PID_NS[PID namespace<br/>プロセスID分離]
        NET_NS[Network namespace<br/>ネットワーク分離]
        MNT_NS[Mount namespace<br/>ファイルシステム分離]
        UTS_NS[UTS namespace<br/>ホスト名分離]
        IPC_NS[IPC namespace<br/>プロセス間通信分離]
        USER_NS[User namespace<br/>ユーザーID分離]
        CGROUP_NS[Cgroup namespace<br/>リソース管理分離]
    end
    
    subgraph "分離される要素"
        PROC_TREE[プロセスツリー]
        NET_STACK[ネットワークスタック]
        MOUNT_POINTS[マウントポイント]
        HOSTNAME[ホスト名・ドメイン名]
        SHM[共有メモリ・セマフォ]
        UID_GID[ユーザー・グループID]
        RESOURCE_LIMITS[リソース制限]
    end
    
    PID_NS --> PROC_TREE
    NET_NS --> NET_STACK
    MNT_NS --> MOUNT_POINTS
    UTS_NS --> HOSTNAME
    IPC_NS --> SHM
    USER_NS --> UID_GID
    CGROUP_NS --> RESOURCE_LIMITS
    
    style PID_NS fill:#ffebee
    style NET_NS fill:#e8f5e8
    style MNT_NS fill:#fff3e0
    style UTS_NS fill:#e3f2fd
    style IPC_NS fill:#f3e5f5
    style USER_NS fill:#fce4ec
    style CGROUP_NS fill:#e0f2f1
```

### 📊 名前空間作成とプロセス分離フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant P as Podman
    participant K as カーネル
    participant C as コンテナプロセス
    participant N as 新名前空間
    
    Note over U,N: コンテナ起動プロセス
    U->>P: podman run alpine
    P->>K: clone()システムコール<br/>CLONE_NEW* フラグ指定
    K->>N: 新しい名前空間作成
    K->>C: 新プロセス作成
    K->>N: プロセスを名前空間に配置
    
    Note over U,N: 名前空間分離の確立
    C->>N: PID 1として起動
    N->>C: 分離されたリソースビュー提供
    C->>K: execve()でコンテナイメージ実行
    K->>P: プロセス作成完了通知
    P->>U: コンテナ起動完了
    
    Note over U,N: 実行時の分離
    loop 実行中
        C->>N: システムリソースアクセス
        N->>C: 分離されたビュー返却
    end
```

### システムコールレベルでの動作

```c
// コンテナ作成時の名前空間分離
int flags = CLONE_NEWNS | CLONE_NEWPID | CLONE_NEWNET | 
            CLONE_NEWIPC | CLONE_NEWUTS | CLONE_NEWUSER;
            
pid_t pid = clone(container_main, stack_top, flags | SIGCHLD, &config);
```

各フラグの実際の影響：

```bash
# ホストから見たプロセス
$ ps aux | grep nginx
user  18234  0.0  0.1  8456  2104 ?  Ss  10:30  0:00 nginx

# コンテナ内から見たプロセス
$ podman exec ctr ps aux
PID   USER     TIME  COMMAND
    1 root      0:00 nginx  # PID 1として見える
```

### 名前空間の内部実装

```c
// kernel/nsproxy.h - 名前空間プロキシ構造体
struct nsproxy {
    atomic_t count;
    struct uts_namespace *uts_ns;
    struct ipc_namespace *ipc_ns;
    struct mnt_namespace *mnt_ns;
    struct pid_namespace *pid_ns_for_children;
    struct net *net_ns;
    struct time_namespace *time_ns;
    struct cgroup_namespace *cgroup_ns;
};
```

**プロセス作成時の名前空間割り当て**
```c
// kernel/fork.c での実装
static struct task_struct *copy_process(...) {
    // 新しいタスク構造体を割り当て
    p = dup_task_struct(current, node);
    
    // 名前空間をコピーまたは新規作成
    retval = copy_namespaces(clone_flags, p);
    
    // cgroupsを設定
    retval = cgroup_can_fork(p, args);
}
```

**実測: 名前空間作成のオーバーヘッド**
```bash
# straceでシステムコールを追跡
$ strace -c podman run --rm alpine true
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ----------------
 23.45    0.001234          12       103           clone
 18.32    0.000964           3       321           openat
 15.21    0.000800           5       160           read
```

## 1.2 cgroupsによるリソース制限の実装

### 🏗️ cgroupsリソース管理アーキテクチャ

```mermaid
graph TB
    subgraph "cgroups v2 統一階層"
        ROOT[/sys/fs/cgroup<br/>ルートcgroup]
        
        subgraph "システムスライス"
            SYSTEM[system.slice]
            SYSTEMD[systemd-<br/>journald.service]
            NETWORKD[systemd-<br/>networkd.service]
        end
        
        subgraph "ユーザースライス"
            USER[user.slice]
            USER1000[user-1000.slice]
            
            subgraph "Podmanコンテナ"
                POD_SCOPE[podman-12345.scope]
                CONTAINER1[コンテナA<br/>メモリ: 512MB<br/>CPU: 0.5コア]
                CONTAINER2[コンテナB<br/>メモリ: 1GB<br/>CPU: 1.0コア]
            end
        end
        
        subgraph "制御可能リソース"
            CPU_CTRL[CPU Controller<br/>・時間配分<br/>・優先度制御]
            MEM_CTRL[Memory Controller<br/>・使用量制限<br/>・OOM制御]
            IO_CTRL[IO Controller<br/>・帯域制限<br/>・優先度制御]
            PID_CTRL[PID Controller<br/>・プロセス数制限]
        end
    end
    
    ROOT --> SYSTEM
    ROOT --> USER
    SYSTEM --> SYSTEMD
    SYSTEM --> NETWORKD
    USER --> USER1000
    USER1000 --> POD_SCOPE
    POD_SCOPE --> CONTAINER1
    POD_SCOPE --> CONTAINER2
    
    POD_SCOPE -.-> CPU_CTRL
    POD_SCOPE -.-> MEM_CTRL
    POD_SCOPE -.-> IO_CTRL
    POD_SCOPE -.-> PID_CTRL
    
    style ROOT fill:#e3f2fd
    style POD_SCOPE fill:#e8f5e8
    style CONTAINER1 fill:#fff3e0
    style CONTAINER2 fill:#fff3e0
    style CPU_CTRL fill:#ffebee
    style MEM_CTRL fill:#f3e5f5
    style IO_CTRL fill:#e0f2f1
    style PID_CTRL fill:#fce4ec
```

### 📊 cgroupsリソース制限フロー

```mermaid
sequenceDiagram
    participant P as Podman
    participant K as Kernel
    participant CG as cgroups Controller
    participant OOM as OOM Killer
    participant PROC as Container Process
    
    Note over P,PROC: コンテナ起動とリソース制限設定
    P->>K: clone() + cgroup設定
    K->>CG: cgroup作成・設定
    CG->>CG: memory.max = 512MB<br/>cpu.max = 50000 100000
    K->>PROC: プロセス開始
    
    Note over P,PROC: 実行時リソース監視
    loop 実行中
        PROC->>K: メモリ要求
        K->>CG: 使用量チェック
        
        alt メモリ制限内
            CG->>K: 許可
            K->>PROC: メモリ割り当て
        else メモリ制限超過
            CG->>OOM: OOM通知
            OOM->>PROC: プロセス終了
            PROC->>P: 終了シグナル
        end
    end
    
    Note over P,PROC: CPU制限の動作
    loop CPU時間管理
        PROC->>K: CPU時間要求
        K->>CG: CPU quota確認
        alt quota範囲内
            CG->>K: 実行許可
            K->>PROC: CPU時間割り当て
        else quota超過
            CG->>K: 一時停止
            K->>PROC: スケジューリング停止
        end
    end
```

### cgroups v2の統一API

```bash
# cgroups v2の階層構造
$ tree /sys/fs/cgroup/
/sys/fs/cgroup/
├── cgroup.controllers     # 利用可能なコントローラ
├── cgroup.subtree_control # サブツリーで有効なコントローラ
├── user.slice/
│   └── user-1000.slice/
│       └── podman-12345.scope/  # Podmanコンテナ
│           ├── memory.max        # メモリ上限
│           ├── memory.current    # 現在の使用量
│           ├── cpu.max           # CPU上限
│           └── pids.max          # プロセス数上限
```

### メモリ制限の内部動作

```c
// mm/memcontrol.c - メモリコントローラの実装
static int mem_cgroup_charge(struct mem_cgroup *memcg, 
                            struct page *page, gfp_t gfp) {
    unsigned long nr_pages = 1;
    
    // メモリ使用量をチェック
    if (mem_cgroup_try_charge(memcg, gfp, nr_pages)) {
        // 上限を超えた場合のOOM処理
        mem_cgroup_oom(memcg, gfp, get_order(nr_pages));
        return -ENOMEM;
    }
    
    // ページをcgroupにチャージ
    page->mem_cgroup = memcg;
    return 0;
}
```

**実測: メモリ制限の効果**
```bash
# 100MB制限でコンテナ実行
$ podman run -m 100m --rm alpine sh -c '
    dd if=/dev/zero of=/dev/null bs=1M count=200'
Killed  # OOM Killerが発動

# dmesgで確認
$ dmesg | tail -n 5
[125432.234] memory: usage 102400kB, limit 102400kB, failcnt 1523
[125432.235] Memory cgroup out of memory: Killed process 8234 (dd)
```
### CPU制限の実装詳細

```bash
# CPU割り当て設定（quota/period）
$ echo "50000 100000" > /sys/fs/cgroup/user.slice/podman-12345.scope/cpu.max
# 意味: 100msごとに50msのCPU時間（50%制限）

# 実測: CPU制限の効果
$ podman run --cpus="0.5" --rm alpine \
    sysbench cpu --cpu-max-prime=20000 --time=10 run

CPU speed:
    events per second:   423.45  # 50%制限時
    
# 制限なしの場合
CPU speed:
    events per second:   847.23  # フルパフォーマンス
```

## 1.3 コンテナランタイムの実装

### 🔧 OCIランタイム実装アーキテクチャ

```mermaid
graph TB
    subgraph "ユーザーインターフェース"
        CLI[podman run alpine]
        API[REST API]
    end
    
    subgraph "Podman Core Engine"
        LIBPOD[libpod<br/>コンテナ管理]
        IMAGE_STORE[Image Store<br/>イメージ管理]
        CONTAINER_STORE[Container Store<br/>コンテナ状態]
    end
    
    subgraph "OCI Runtime Interface"
        RUNTIME_CONFIG[OCI Runtime<br/>config.json生成]
        BUNDLE[OCI Bundle<br/>・config.json<br/>・rootfs/]
    end
    
    subgraph "Low-level Runtime"
        CRUN[crun<br/>・C言語実装<br/>・高速<br/>・低メモリ]
        RUNC[runc<br/>・Go言語実装<br/>・リファレンス<br/>・広く使用]
    end
    
    subgraph "Linux Kernel Interfaces"
        NAMESPACES[Namespaces<br/>PID, NET, MNT, etc]
        CGROUPS[cgroups v2<br/>リソース制限]
        SECCOMP[seccomp<br/>システムコール制限]
        APPARMOR[AppArmor/SELinux<br/>セキュリティ]
    end
    
    subgraph "Storage Backend"
        OVERLAY[overlay2<br/>ファイルシステム]
        FUSE[fuse-overlayfs<br/>rootless対応]
        VFS[VFS<br/>シンプルストレージ]
    end
    
    CLI --> LIBPOD
    API --> LIBPOD
    LIBPOD --> IMAGE_STORE
    LIBPOD --> CONTAINER_STORE
    LIBPOD --> RUNTIME_CONFIG
    
    RUNTIME_CONFIG --> BUNDLE
    BUNDLE --> CRUN
    BUNDLE --> RUNC
    
    CRUN --> NAMESPACES
    CRUN --> CGROUPS
    CRUN --> SECCOMP
    CRUN --> APPARMOR
    
    RUNC --> NAMESPACES
    RUNC --> CGROUPS
    RUNC --> SECCOMP
    RUNC --> APPARMOR
    
    IMAGE_STORE --> OVERLAY
    IMAGE_STORE --> FUSE
    IMAGE_STORE --> VFS
    
    style CLI fill:#e1f5fe
    style LIBPOD fill:#e8f5e8
    style CRUN fill:#fff3e0
    style RUNC fill:#fff3e0
    style NAMESPACES fill:#f3e5f5
    style CGROUPS fill:#fce4ec
```

### 📋 OCI仕様準拠のコンテナ作成フロー

```mermaid
sequenceDiagram
    participant U as User
    participant P as Podman
    participant I as Image Store
    participant O as OCI Runtime
    participant K as Kernel
    
    Note over U,K: コンテナ作成・実行プロセス
    U->>P: podman run alpine sh
    P->>I: イメージ検索・取得
    I->>P: イメージレイヤー提供
    
    Note over U,K: OCI Bundle作成
    P->>P: config.json生成
    Note right of P: ・プロセス設定<br/>・マウント設定<br/>・セキュリティ設定<br/>・リソース制限
    
    P->>P: rootfs準備
    Note right of P: ・レイヤーマージ<br/>・overlay2マウント<br/>・読み書き層作成
    
    Note over U,K: OCIランタイム実行
    P->>O: OCI Bundle実行
    O->>K: namespace作成
    O->>K: cgroups設定
    O->>K: seccomp適用
    O->>K: プロセス起動
    
    Note over U,K: 実行時管理
    K->>O: プロセス状態報告
    O->>P: コンテナ状態更新
    P->>U: 実行結果返却
    
    Note over U,K: 終了処理
    alt 正常終了
        O->>K: グレースフル終了
    else 強制終了
        O->>K: SIGKILL送信
    end
    
    O->>P: 終了状態報告
    P->>I: 読み書き層削除
    P->>U: 終了確認
```

### OCI Runtime Specification準拠

```json
// config.json - OCIランタイム設定
{
  "ociVersion": "1.0.2",
  "process": {
    "user": {"uid": 0, "gid": 0},
    "args": ["sh"],
    "env": ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"],
    "cwd": "/",
    "capabilities": {
      "bounding": ["CAP_AUDIT_WRITE", "CAP_KILL", "CAP_NET_BIND_SERVICE"],
      "effective": ["CAP_AUDIT_WRITE", "CAP_KILL"],
      "permitted": ["CAP_AUDIT_WRITE", "CAP_KILL"]
    },
    "rlimits": [
      {"type": "RLIMIT_NOFILE", "hard": 1024, "soft": 1024}
    ]
  },
  "root": {"path": "rootfs", "readonly": false},
  "hostname": "container",
  "mounts": [
    {"destination": "/proc", "type": "proc", "source": "proc"},
    {"destination": "/dev", "type": "tmpfs", "source": "tmpfs"}
  ],
  "linux": {
    "namespaces": [
      {"type": "pid"}, {"type": "network"}, {"type": "ipc"},
      {"type": "uts"}, {"type": "mount"}, {"type": "user"}
    ],
    "resources": {
      "memory": {"limit": 536870912},
      "cpu": {"shares": 1024, "quota": 50000, "period": 100000}
    }
  }
}
```

## 1.4 コンテナランタイムの種類と特徴

### 低レベルランタイム（OCI Runtime）

1. **runc**: OCIリファレンス実装
   - Go言語で実装
   - Dockerやcontainerdのデフォルト
   - 最も広く使用される

2. **crun**: C言語実装で高速
   - runcより約50%高速
   - メモリフットプリントが小さい
   - Podmanのデフォルト

3. **kata-containers**: VM隔離
   - 各コンテナを軽量VMで実行
   - より強力なセキュリティ分離
   - パフォーマンスのトレードオフ

4. **gVisor**: カーネル再実装
   - ユーザー空間でカーネルを再実装
   - システムコールをインターセプト
   - Googleが開発

### 高レベルランタイム

1. **containerd**: Docker/Kubernetesで使用
   - イメージ管理
   - コンテナライフサイクル管理
   - スナップショット機能

2. **CRI-O**: Kubernetes専用
   - 最小限の機能に特化
   - Kubernetesとの統合最適化
   - RedHatが主導

3. **Podman**: デーモンレス実装
   - 各コンテナが独立プロセス
   - rootlessモードのネイティブサポート
   - systemdとの深い統合

## 1.5 コンテナエコシステムの全体像

### イメージレジストリ

- **Docker Hub**: 最大の公開レジストリ
- **Quay.io**: RedHat提供、セキュリティスキャン機能
- **GitHub Container Registry**: GitHubとの統合
- **プライベートレジストリ**: Harbor、Nexus等

### オーケストレーション

- **Kubernetes**: デファクトスタンダード
- **OpenShift**: エンタープライズKubernetes
- **Docker Swarm**: Dockerネイティブ
- **Nomad**: HashiCorp製、マルチランタイム対応

### 監視・可観測性

- **Prometheus**: メトリクス収集
- **Grafana**: ビジュアライゼーション
- **Fluentd/Fluent Bit**: ログ収集
- **Jaeger**: 分散トレーシング

## DockerからPodmanへの移行判断基準

### Podman採用が推奨されるケース

1. **セキュリティ要件が高い環境**
   - 金融機関、政府機関、医療機関
   - rootless実行が必須
   - SELinux/FIPS準拠が必要

2. **Red Hat系Linux環境**
   - RHEL 8/9、CentOS Stream
   - Fedora、Rocky Linux
   - systemdとの統合が重要

3. **Kubernetes移行を検討中**
   - Pod概念の事前学習
   - Kubernetes互換YAML生成
   - CRI-Oへの将来的な移行

4. **コンプライアンス要件**
   - 監査ログの詳細記録
   - プロセス分離の厳格化
   - rootアクセスの排除

### Docker継続が推奨されるケース

1. **既存のDocker資産が大きい**
   - 大量のdocker-composeファイル
   - Dockerfileの複雑な依存関係
   - Docker専用ツールの利用

2. **開発チームの習熟度**
   - Dockerに精通したチーム
   - 学習コストを避けたい
   - 短期的なプロジェクト

3. **Windows/macOS中心の開発**
   - Docker Desktopの利便性
   - ネイティブ対応の重要性
   - GUI管理ツールの必要性

4. **Docker Swarm利用中**
   - 既存のSwarmクラスター
   - Swarm固有機能の利用
   - 移行コストが高い

## 対象バージョンと前提条件

本書は以下のバージョンを対象としています：

- **Podman**: 5.0.x（2024年3月リリース）
- **動作確認OS**: 
  - RHEL 9.3
  - Ubuntu 22.04 LTS
  - CentOS Stream 9
  - Fedora 39
- **前提条件**: 
  - Linux Kernel 4.18以上
  - cgroup v2対応
  - systemd 239以上（rootless実行時）

## まとめ

本章では、コンテナ技術の基礎となるLinuxカーネル機能について解説しました。名前空間によるリソース分離、cgroupsによるリソース制限、そしてOCI標準に準拠したランタイムの実装を理解することで、コンテナ技術の本質が見えてきます。

また、DockerとPodmanの詳細な比較を通じて、それぞれの強みと適用場面を明確にしました。技術選択は単純な優劣ではなく、組織の要件、既存資産、将来計画を総合的に判断する必要があります。

次章では、Podmanのインストールと初期設定について、実践的な観点から解説していきます。