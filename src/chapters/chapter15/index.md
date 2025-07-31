---
title: "第17章 トラブルシューティング完全ガイド"
---

# 第17章 トラブルシューティング完全ガイド

### 本章の意義と学習目標

**なぜ体系的なトラブルシューティングが重要なのか**

コンテナ環境での問題は、従来のシステムとは異なる特性を持ちます：

1. **一時的な性質**: コンテナは短命で、問題の再現が困難
2. **複雑な依存関係**: ネットワーク、ストレージ、セキュリティの相互作用
3. **抽象化レイヤー**: 問題の根本原因が見えにくい
4. **分散システム**: 問題が複数のコンポーネントにまたがる

本章では、これらの課題に対する体系的なアプローチを学び、迅速な問題解決能力を身につけます。

### 15.1 トラブルシューティングの基本原則

#### 15.1.1 問題解決のフレームワーク

**OSIモデルに基づくアプローチ**
```
アプリケーション層 → アプリケーションログ、設定
プレゼンテーション層 → データ形式、エンコーディング
セッション層 → 接続状態、セッション管理
トランスポート層 → TCP/UDP、ポート
ネットワーク層 → IP、ルーティング
データリンク層 → ブリッジ、VLAN
物理層 → ハードウェア、ケーブル
```

**コンテナ固有の層**
```
コンテナアプリケーション → アプリケーションの問題
コンテナランタイム → Podman/runcの問題
Linux Kernel → cgroups、namespace、セキュリティ
ハードウェア → CPU、メモリ、ディスク
```

#### 15.1.2 診断ツールの体系

```bash
#!/bin/bash
# diagnostic-toolkit.sh

# システムレベルツール
echo "=== System Level Tools ==="
echo "- dmesg: カーネルメッセージ"
echo "- journalctl: systemdログ"
echo "- systemctl: サービス状態"
echo "- ss/netstat: ネットワーク接続"
echo "- lsof: オープンファイル"
echo "- strace: システムコール追跡"
echo "- tcpdump: パケットキャプチャ"

# Podman固有ツール
echo -e "\n=== Podman Specific Tools ==="
echo "- podman logs: コンテナログ"
echo "- podman inspect: 詳細情報"
echo "- podman events: イベント監視"
echo "- podman stats: リソース使用状況"
echo "- podman healthcheck: ヘルスチェック"
echo "- podman system df: ディスク使用量"
echo "- podman unshare: namespace操作"
```

### 15.2 一般的な問題と解決策

#### 15.2.1 起動・実行時の問題

**問題パターン1: コンテナが即座に終了する**

```bash
#!/bin/bash
# diagnose-container-exit.sh

CONTAINER=$1

echo "Diagnosing container exit: $CONTAINER"

# 1. 終了コード確認
EXIT_CODE=$(podman inspect $CONTAINER --format '\{\{.State.ExitCode\}\}')
echo "Exit code: $EXIT_CODE"

case $EXIT_CODE in
    0)
        echo "→ 正常終了: CMDが完了した可能性"
        echo "  解決策: CMD/ENTRYPOINTを確認、長時間実行プロセスに変更"
        ;;
    1)
        echo "→ 一般的なエラー: アプリケーションエラー"
        echo "  解決策: podman logs $CONTAINER でエラーメッセージ確認"
        ;;
    125)
        echo "→ Podmanエラー: コンテナ実行前のエラー"
        echo "  解決策: イメージやコマンドの指定を確認"
        ;;
    126)
        echo "→ コマンド実行不可: 権限またはファイルが存在しない"
        echo "  解決策: ENTRYPOINTの実行権限確認"
        ;;
    127)
        echo "→ コマンドが見つからない"
        echo "  解決策: パスの設定、コマンドの存在確認"
        ;;
    137)
        echo "→ SIGKILL受信: OOMキラーまたは強制終了"
        echo "  解決策: メモリ制限の確認と調整"
        ;;
    139)
        echo "→ セグメンテーション違反"
        echo "  解決策: アプリケーションのデバッグが必要"
        ;;
    143)
        echo "→ SIGTERM受信: 正常な停止シグナル"
        echo "  解決策: シャットダウンハンドラーの実装"
        ;;
esac

# 2. 最後のログ確認
echo -e "\n最後のログ (20行):"
podman logs --tail 20 $CONTAINER

# 3. リソース制限確認
echo -e "\nリソース制限:"
podman inspect $CONTAINER --format '
Memory Limit: \{\{.HostConfig.Memory\}\}
CPU Limit: \{\{.HostConfig.CpuQuota\}\}
'

# 4. ヘルスチェック結果
if podman inspect $CONTAINER --format '\{\{.Config.Healthcheck\}\}' | grep -q "map"; then
    echo -e "\nヘルスチェック結果:"
    podman inspect $CONTAINER --format '\{\{.State.Health.Status\}\}'
    podman inspect $CONTAINER --format '\{\{range .State.Health.Log\}\}\{\{.Output\}\}\{\{end\}\}'
fi
```

**問題パターン2: Permission Denied エラー**

```bash
# fix-permission-issues.sh

echo "=== Permission Issue Diagnosis ==="

# 1. SELinuxコンテキスト確認
if command -v getenforce >/dev/null 2>&1; then
    SELINUX_STATUS=$(getenforce)
    echo "SELinux status: $SELINUX_STATUS"
    
    if [ "$SELINUX_STATUS" = "Enforcing" ]; then
        echo "SELinux is enforcing. Checking denials..."
        sudo ausearch -m avc -ts recent | grep podman || echo "No recent denials"
        
        echo -e "\n解決策:"
        echo "1. ボリュームマウント時に :Z または :z オプションを使用"
        echo "   podman run -v /host/path:/container/path:Z ..."
        echo "2. 一時的な無効化（非推奨）"
        echo "   sudo setenforce 0"
    fi
fi

# 2. ユーザー名前空間確認
echo -e "\n=== User Namespace Check ==="
if podman info --format '\{\{.Host.Security.Rootless\}\}' | grep -q true; then
    echo "Running in rootless mode"
    
    # UID/GIDマッピング確認
    echo "UID mapping:"
    cat /proc/self/uid_map
    
    echo -e "\nGID mapping:"
    cat /proc/self/gid_map
    
    echo -e "\n解決策:"
    echo "1. podman unshare でファイル所有者を変更"
    echo "   podman unshare chown -R 0:0 /path/to/files"
    echo "2. --userns=keep-id オプションを使用"
    echo "   podman run --userns=keep-id ..."
fi

# 3. ファイルシステム権限確認
echo -e "\n=== File System Permissions ==="
echo "マウントポイントの権限確認方法:"
echo "ls -la /host/path"
echo "podman exec <container> ls -la /container/path"
```

#### 15.2.2 ネットワーク関連の問題

**診断スクリプト**
```bash
#!/bin/bash
# network-diagnostics.sh

CONTAINER=$1

echo "=== Network Diagnostics for $CONTAINER ==="

# 1. ネットワーク設定確認
echo "Network configuration:"
podman inspect $CONTAINER --format '
Network Mode: \{\{.HostConfig.NetworkMode\}\}
IP Address: \{\{.NetworkSettings.IPAddress\}\}
Gateway: \{\{.NetworkSettings.Gateway\}\}
DNS: \{\{.HostConfig.Dns\}\}
'

# 2. ポートマッピング確認
echo -e "\nPort mappings:"
podman port $CONTAINER

# 3. ネットワーク接続性テスト
echo -e "\nTesting connectivity:"

# DNS解決テスト
echo -n "DNS resolution: "
if podman exec $CONTAINER nslookup google.com >/dev/null 2>&1; then
    echo "OK"
else
    echo "FAILED"
    echo "  → DNSサーバー設定を確認: --dns オプション"
fi

# 外部接続テスト
echo -n "External connectivity: "
if podman exec $CONTAINER ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    echo "OK"
else
    echo "FAILED"
    echo "  → ファイアウォール設定を確認"
    echo "  → NAT/マスカレード設定を確認"
fi

# 4. iptables/nftables確認
echo -e "\nFirewall rules:"
if command -v iptables >/dev/null 2>&1; then
    sudo iptables -t nat -L POSTROUTING -n | grep -E "MASQUERADE|podman"
fi

# 5. CNIプラグイン確認
echo -e "\nCNI configuration:"
if [ -d /etc/cni/net.d ]; then
    ls -la /etc/cni/net.d/
    cat /etc/cni/net.d/87-podman*.conflist 2>/dev/null | jq '.plugins[].type' | sort | uniq
fi
```

**一般的なネットワーク問題の解決**

```bash
# ケース1: コンテナ間通信できない
podman network create mynet
podman run -d --name app1 --network mynet alpine sleep 3600
podman run -d --name app2 --network mynet alpine sleep 3600
podman exec app1 ping app2  # 名前解決で通信可能

# ケース2: ホストからコンテナにアクセスできない
# 解決策: ポートフォワーディング
podman run -d -p 8080:80 nginx

# ケース3: コンテナから外部にアクセスできない
# 解決策: IP転送有効化
echo 'net.ipv4.ip_forward = 1' | sudo tee /etc/sysctl.d/99-ipforward.conf
sudo sysctl -p /etc/sysctl.d/99-ipforward.conf
```

#### 15.2.3 ストレージ関連の問題

**ストレージ診断スクリプト**
```bash
#!/bin/bash
# storage-diagnostics.sh

echo "=== Storage Diagnostics ==="

# 1. 全体的なディスク使用量
echo "Overall disk usage:"
podman system df

# 2. 詳細な使用量分析
echo -e "\nDetailed usage:"
echo "Images:"
podman images --format "table \{\{.Repository\}\}:\{\{.Tag\}\}\t\{\{.Size\}\}" | sort -k2 -hr | head -10

echo -e "\nVolumes:"
for vol in $(podman volume ls -q); do
    size=$(podman volume inspect $vol --format '\{\{.Mountpoint\}\}' | xargs du -sh 2>/dev/null | cut -f1)
    echo "$vol: $size"
done

# 3. 孤立したリソース確認
echo -e "\nOrphaned resources:"
echo "Dangling images: $(podman images -f dangling=true -q | wc -l)"
echo "Stopped containers: $(podman ps -a -f status=exited -q | wc -l)"
echo "Unused volumes: $(podman volume ls -f dangling=true -q | wc -l)"

# 4. ストレージドライバー情報
echo -e "\nStorage driver info:"
podman info --format '
Storage Driver: \{\{.Store.GraphDriverName\}\}
Graph Root: \{\{.Store.GraphRoot\}\}
Run Root: \{\{.Store.RunRoot\}\}
Volume Path: \{\{.Store.VolumePath\}\}
'

# 5. クリーンアップ推奨事項
echo -e "\nCleanup recommendations:"
RECLAIMABLE=$(podman system df --format json | jq '.Summary.Reclaimable')
echo "Reclaimable space: $RECLAIMABLE"

echo -e "\nTo free up space, run:"
echo "podman system prune -a --volumes"
```

### 15.3 高度なデバッグ技術

#### 15.3.1 システムコールトレース

```bash
#!/bin/bash
# advanced-strace.sh

CONTAINER=$1
PROCESS=${2:-1}

echo "=== System Call Tracing ==="

# straceコンテナ作成
cat > Dockerfile.strace << EOF
FROM alpine:latest
RUN apk add --no-cache strace
ENTRYPOINT ["strace"]
EOF

podman build -f Dockerfile.strace -t strace-tool .

# 対象コンテナのPIDネームスペースで実行
podman run --rm -it \
    --pid=container:$CONTAINER \
    --cap-add SYS_PTRACE \
    strace-tool \
    -p $PROCESS -f -e trace=network,file
```

#### 15.3.2 パフォーマンスプロファイリング

```python
#!/usr/bin/env python3
# performance_profiler.py

import subprocess
import json
import time
import matplotlib.pyplot as plt
from collections import defaultdict
import numpy as np

class ContainerProfiler:
    def __init__(self, container_name):
        self.container = container_name
        self.metrics = defaultdict(list)
        self.timestamps = []
    
    def collect_metrics(self, duration=60, interval=1):
        """メトリクス収集"""
        print(f"Collecting metrics for {duration} seconds...")
        
        start_time = time.time()
        while time.time() - start_time < duration:
            # CPU使用率取得
            cpu = self._get_cpu_usage()
            
            # メモリ使用量取得
            memory = self._get_memory_usage()
            
            # I/O統計取得
            io_stats = self._get_io_stats()
            
            # ネットワーク統計取得
            net_stats = self._get_network_stats()
            
            # 記録
            self.timestamps.append(time.time() - start_time)
            self.metrics['cpu'].append(cpu)
            self.metrics['memory'].append(memory)
            self.metrics['io_read'].append(io_stats['read'])
            self.metrics['io_write'].append(io_stats['write'])
            self.metrics['net_rx'].append(net_stats['rx'])
            self.metrics['net_tx'].append(net_stats['tx'])
            
            time.sleep(interval)
    
    def _get_cpu_usage(self):
        """CPU使用率取得"""
        try:
            result = subprocess.run(
                ['podman', 'stats', '--no-stream', '--format', 'json', self.container],
                capture_output=True, text=True
            )
            stats = json.loads(result.stdout)[0]
            return float(stats['CPUPerc'].rstrip('%'))
        except:
            return 0.0
    
    def _get_memory_usage(self):
        """メモリ使用量取得（MB）"""
        try:
            result = subprocess.run(
                ['podman', 'stats', '--no-stream', '--format', 'json', self.container],
                capture_output=True, text=True
            )
            stats = json.loads(result.stdout)[0]
            mem_str = stats['MemUsage'].split('/')[0]
            
            # 単位変換
            if 'GiB' in mem_str:
                return float(mem_str.replace('GiB', '')) * 1024
            elif 'MiB' in mem_str:
                return float(mem_str.replace('MiB', ''))
            else:
                return 0.0
        except:
            return 0.0
    
    def _get_io_stats(self):
        """I/O統計取得"""
        # 実装はプラットフォーム依存
        return {'read': 0, 'write': 0}
    
    def _get_network_stats(self):
        """ネットワーク統計取得"""
        # 実装はプラットフォーム依存
        return {'rx': 0, 'tx': 0}
    
    def analyze(self):
        """分析結果生成"""
        print("\n=== Performance Analysis ===")
        
        # CPU分析
        cpu_data = self.metrics['cpu']
        print(f"CPU Usage:")
        print(f"  Average: {np.mean(cpu_data):.2f}%")
        print(f"  Max: {np.max(cpu_data):.2f}%")
        print(f"  Std Dev: {np.std(cpu_data):.2f}%")
        
        # メモリ分析
        mem_data = self.metrics['memory']
        print(f"\nMemory Usage:")
        print(f"  Average: {np.mean(mem_data):.2f} MB")
        print(f"  Max: {np.max(mem_data):.2f} MB")
        
        # 異常検出
        self._detect_anomalies()
    
    def _detect_anomalies(self):
        """異常検出"""
        print("\n=== Anomaly Detection ===")
        
        # CPU スパイク検出
        cpu_data = np.array(self.metrics['cpu'])
        cpu_mean = np.mean(cpu_data)
        cpu_std = np.std(cpu_data)
        spikes = np.where(cpu_data > cpu_mean + 2 * cpu_std)[0]
        
        if len(spikes) > 0:
            print(f"CPU spikes detected at timestamps: {[self.timestamps[i] for i in spikes]}")
        
        # メモリリーク検出（単純な線形回帰）
        mem_data = np.array(self.metrics['memory'])
        if len(mem_data) > 10:
            slope = np.polyfit(self.timestamps, mem_data, 1)[0]
            if slope > 0.1:  # MB/秒
                print(f"Possible memory leak detected: {slope:.2f} MB/sec increase")
    
    def plot_results(self):
        """結果のプロット"""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 8))
        
        # CPU使用率
        ax1.plot(self.timestamps, self.metrics['cpu'])
        ax1.set_title('CPU Usage')
        ax1.set_ylabel('CPU %')
        ax1.grid(True)
        
        # メモリ使用量
        ax2.plot(self.timestamps, self.metrics['memory'])
        ax2.set_title('Memory Usage')
        ax2.set_ylabel('Memory (MB)')
        ax2.grid(True)
        
        # その他のメトリクス
        # ...
        
        plt.tight_layout()
        plt.savefig('performance_profile.png')
        print(f"\nPerformance graph saved to performance_profile.png")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python performance_profiler.py <container_name> [duration]")
        sys.exit(1)
    
    container = sys.argv[1]
    duration = int(sys.argv[2]) if len(sys.argv) > 2 else 60
    
    profiler = ContainerProfiler(container)
    profiler.collect_metrics(duration)
    profiler.analyze()
    profiler.plot_results()
```

### 15.4 セキュリティ関連の問題

#### 15.4.1 権限昇格の防止

```bash
#!/bin/bash
# security-hardening.sh

echo "=== Security Hardening Check ==="

# 1. 特権コンテナの検出
echo "Checking for privileged containers:"
for container in $(podman ps -q); do
    name=$(podman inspect $container --format '\{\{.Name\}\}')
    privileged=$(podman inspect $container --format '\{\{.HostConfig.Privileged\}\}')
    
    if [ "$privileged" = "true" ]; then
        echo "⚠️  WARNING: $name is running in privileged mode"
        
        # 代替案の提案
        echo "   Alternative: Use specific capabilities instead"
        echo "   Example: --cap-add NET_ADMIN --cap-add SYS_TIME"
    fi
done

# 2. 過剰なケーパビリティの検出
echo -e "\nChecking capabilities:"
for container in $(podman ps -q); do
    name=$(podman inspect $container --format '\{\{.Name\}\}')
    caps=$(podman inspect $container --format '\{\{.EffectiveCaps\}\}')
    
    if [ "$caps" != "[]" ] && [ "$caps" != "null" ]; then
        echo "Container: $name"
        echo "  Capabilities: $caps"
        
        # 危険なケーパビリティの警告
        if echo "$caps" | grep -q "SYS_ADMIN"; then
            echo "  ⚠️  WARNING: SYS_ADMIN capability is very powerful"
        fi
        if echo "$caps" | grep -q "SYS_PTRACE"; then
            echo "  ⚠️  WARNING: SYS_PTRACE can be used for container escape"
        fi
    fi
done

# 3. ユーザー権限の確認
echo -e "\nChecking user permissions:"
for container in $(podman ps -q); do
    name=$(podman inspect $container --format '\{\{.Name\}\}')
    user=$(podman exec $container whoami 2>/dev/null || echo "unknown")
    
    if [ "$user" = "root" ]; then
        echo "⚠️  $name is running as root user"
        echo "   Recommendation: Use USER directive in Dockerfile"
    fi
done
```

#### 15.4.2 セキュリティポリシー違反の検出

```python
#!/usr/bin/env python3
# security_policy_checker.py

import subprocess
import json
import yaml
from datetime import datetime

class SecurityPolicyChecker:
    def __init__(self, policy_file):
        with open(policy_file, 'r') as f:
            self.policy = yaml.safe_load(f)
        
        self.violations = []
    
    def check_all_containers(self):
        """全コンテナのポリシーチェック"""
        containers = self._get_running_containers()
        
        for container in containers:
            self.check_container(container)
        
        return self.violations
    
    def check_container(self, container_id):
        """個別コンテナのチェック"""
        inspect_data = self._inspect_container(container_id)
        
        if not inspect_data:
            return
        
        container_name = inspect_data['Name'].lstrip('/')
        
        # 各ポリシーチェック
        self._check_privileged_mode(container_name, inspect_data)
        self._check_capabilities(container_name, inspect_data)
        self._check_user_namespace(container_name, inspect_data)
        self._check_resource_limits(container_name, inspect_data)
        self._check_network_exposure(container_name, inspect_data)
        self._check_volume_mounts(container_name, inspect_data)
    
    def _check_privileged_mode(self, name, data):
        """特権モードチェック"""
        if data['HostConfig']['Privileged']:
            if not self.policy.get('allow_privileged', False):
                self.violations.append({
                    'container': name,
                    'type': 'privileged_mode',
                    'severity': 'critical',
                    'message': 'Container is running in privileged mode'
                })
    
    def _check_capabilities(self, name, data):
        """ケーパビリティチェック"""
        caps = data.get('EffectiveCaps', [])
        forbidden_caps = self.policy.get('forbidden_capabilities', [])
        
        for cap in caps:
            if cap in forbidden_caps:
                self.violations.append({
                    'container': name,
                    'type': 'forbidden_capability',
                    'severity': 'high',
                    'message': f'Container has forbidden capability: {cap}'
                })
    
    def _check_resource_limits(self, name, data):
        """リソース制限チェック"""
        # メモリ制限
        memory_limit = data['HostConfig'].get('Memory', 0)
        if memory_limit == 0:
            if self.policy.get('require_memory_limit', True):
                self.violations.append({
                    'container': name,
                    'type': 'no_memory_limit',
                    'severity': 'medium',
                    'message': 'Container has no memory limit'
                })
        
        # CPU制限
        cpu_quota = data['HostConfig'].get('CpuQuota', 0)
        if cpu_quota == 0:
            if self.policy.get('require_cpu_limit', True):
                self.violations.append({
                    'container': name,
                    'type': 'no_cpu_limit',
                    'severity': 'medium',
                    'message': 'Container has no CPU limit'
                })
    
    def _check_network_exposure(self, name, data):
        """ネットワーク露出チェック"""
        ports = data['NetworkSettings'].get('Ports', {})
        
        for port, bindings in ports.items():
            if bindings:
                for binding in bindings:
                    if binding['HostIp'] == '0.0.0.0':
                        self.violations.append({
                            'container': name,
                            'type': 'exposed_port',
                            'severity': 'medium',
                            'message': f'Port {port} is exposed to all interfaces'
                        })
    
    def generate_report(self):
        """セキュリティレポート生成"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_violations': len(self.violations),
            'violations_by_severity': {
                'critical': len([v for v in self.violations if v['severity'] == 'critical']),
                'high': len([v for v in self.violations if v['severity'] == 'high']),
                'medium': len([v for v in self.violations if v['severity'] == 'medium']),
                'low': len([v for v in self.violations if v['severity'] == 'low'])
            },
            'violations': self.violations
        }
        
        return report
    
    def _get_running_containers(self):
        """実行中のコンテナ一覧取得"""
        result = subprocess.run(
            ['podman', 'ps', '-q'],
            capture_output=True,
            text=True
        )
        return result.stdout.strip().split('\n') if result.stdout else []
    
    def _inspect_container(self, container_id):
        """コンテナ詳細情報取得"""
        result = subprocess.run(
            ['podman', 'inspect', container_id],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            return json.loads(result.stdout)[0]
        return None

# ポリシーファイル例
policy_example = {
    'allow_privileged': False,
    'forbidden_capabilities': ['SYS_ADMIN', 'SYS_MODULE', 'SYS_RAWIO'],
    'require_memory_limit': True,
    'require_cpu_limit': True,
    'require_user_namespace': True,
    'forbidden_mounts': ['/etc', '/sys', '/proc'],
    'max_memory': '4G',
    'max_cpu': 4
}
```

### 15.5 自動化されたトラブルシューティング

#### 15.5.1 自己診断システム

```bash
#!/bin/bash
# self-diagnostic-system.sh

# 診断結果を保存する連想配列
declare -A DIAGNOSTICS

echo "=== Podman Self-Diagnostic System ==="
echo "Starting comprehensive system check..."

# 1. 基本的なシステムチェック
check_system_requirements() {
    echo -n "Checking system requirements... "
    
    # カーネルバージョン
    KERNEL_VERSION=$(uname -r | cut -d. -f1-2)
    if (( $(echo "$KERNEL_VERSION >= 4.18" | bc -l) )); then
        DIAGNOSTICS["kernel"]="OK"
    else
        DIAGNOSTICS["kernel"]="FAIL: Kernel version $KERNEL_VERSION is too old"
    fi
    
    # cgroups v2
    if [ -f /sys/fs/cgroup/cgroup.controllers ]; then
        DIAGNOSTICS["cgroups"]="OK: v2 enabled"
    else
        DIAGNOSTICS["cgroups"]="WARN: cgroups v1 detected"
    fi
    
    # ユーザー名前空間
    if [ -f /proc/sys/user/max_user_namespaces ]; then
        MAX_NS=$(cat /proc/sys/user/max_user_namespaces)
        if [ "$MAX_NS" -gt 0 ]; then
            DIAGNOSTICS["user_ns"]="OK"
        else
            DIAGNOSTICS["user_ns"]="FAIL: User namespaces disabled"
        fi
    fi
    
    echo "Done"
}

# 2. Podman設定チェック
check_podman_config() {
    echo -n "Checking Podman configuration... "
    
    # storage.conf
    if [ -f ~/.config/containers/storage.conf ]; then
        STORAGE_DRIVER=$(grep "driver =" ~/.config/containers/storage.conf | cut -d'"' -f2)
        if [ "$STORAGE_DRIVER" = "overlay" ] || [ "$STORAGE_DRIVER" = "vfs" ]; then
            DIAGNOSTICS["storage_driver"]="OK: $STORAGE_DRIVER"
        else
            DIAGNOSTICS["storage_driver"]="WARN: Unknown driver $STORAGE_DRIVER"
        fi
    fi
    
    # registries.conf
    if [ -f /etc/containers/registries.conf ]; then
        DIAGNOSTICS["registries"]="OK"
    else
        DIAGNOSTICS["registries"]="WARN: No registries.conf found"
    fi
    
    echo "Done"
}

# 3. ネットワーク診断
check_network() {
    echo -n "Checking network configuration... "
    
    # CNIプラグイン
    if [ -d /usr/libexec/cni ] || [ -d /opt/cni/bin ]; then
        DIAGNOSTICS["cni"]="OK"
    else
        DIAGNOSTICS["cni"]="FAIL: CNI plugins not found"
    fi
    
    # ファイアウォール
    if command -v firewall-cmd >/dev/null 2>&1; then
        if firewall-cmd --get-active-zones | grep -q "trusted"; then
            DIAGNOSTICS["firewall"]="OK"
        else
            DIAGNOSTICS["firewall"]="WARN: Firewall may block container traffic"
        fi
    fi
    
    echo "Done"
}

# 4. 問題の自動修復
auto_fix() {
    echo -e "\n=== Attempting Auto-Fix ==="
    
    for key in "${!DIAGNOSTICS[@]}"; do
        if [[ "${DIAGNOSTICS[$key]}" == FAIL* ]]; then
            echo "Fixing: $key"
            
            case $key in
                "user_ns")
                    echo "Enabling user namespaces..."
                    echo "user.max_user_namespaces=28633" | sudo tee /etc/sysctl.d/userns.conf
                    sudo sysctl -p /etc/sysctl.d/userns.conf
                    ;;
                "cni")
                    echo "Installing CNI plugins..."
                    # プラットフォーム依存のインストールコマンド
                    ;;
            esac
        fi
    done
}

# 5. レポート生成
generate_report() {
    echo -e "\n=== Diagnostic Report ==="
    
    PASS_COUNT=0
    WARN_COUNT=0
    FAIL_COUNT=0
    
    for key in "${!DIAGNOSTICS[@]}"; do
        STATUS="${DIAGNOSTICS[$key]}"
        
        if [[ "$STATUS" == OK* ]]; then
            echo "✓ $key: $STATUS"
            ((PASS_COUNT++))
        elif [[ "$STATUS" == WARN* ]]; then
            echo "⚠ $key: $STATUS"
            ((WARN_COUNT++))
        else
            echo "✗ $key: $STATUS"
            ((FAIL_COUNT++))
        fi
    done
    
    echo -e "\nSummary:"
    echo "  Passed: $PASS_COUNT"
    echo "  Warnings: $WARN_COUNT"
    echo "  Failed: $FAIL_COUNT"
    
    if [ $FAIL_COUNT -gt 0 ]; then
        echo -e "\n⚠️  System has critical issues that need to be resolved"
        return 1
    elif [ $WARN_COUNT -gt 0 ]; then
        echo -e "\n⚠️  System has warnings that should be reviewed"
        return 0
    else
        echo -e "\n✅ System is properly configured"
        return 0
    fi
}

# メイン実行
check_system_requirements
check_podman_config
check_network

# レポート生成
generate_report

# 自動修復オプション
if [ "$1" = "--auto-fix" ] && [ $FAIL_COUNT -gt 0 ]; then
    auto_fix
    echo -e "\nRe-running diagnostics..."
    # 再実行
    exec $0
fi
```

#### 15.5.2 AIアシスタント統合（概念）

```python
#!/usr/bin/env python3
# ai_troubleshooter.py

import json
import subprocess
from datetime import datetime

class AITroubleshooter:
    """AI支援トラブルシューティングシステム（概念実装）"""
    
    def __init__(self):
        self.knowledge_base = self._load_knowledge_base()
        self.diagnostic_history = []
    
    def diagnose_issue(self, symptoms):
        """症状から問題を診断"""
        
        # 症状の分析
        analyzed_symptoms = self._analyze_symptoms(symptoms)
        
        # 類似の問題を検索
        similar_issues = self._search_similar_issues(analyzed_symptoms)
        
        # 診断結果の生成
        diagnosis = {
            'timestamp': datetime.now().isoformat(),
            'symptoms': symptoms,
            'probable_causes': [],
            'recommended_actions': [],
            'confidence': 0.0
        }
        
        # 原因の推定
        for issue in similar_issues:
            cause = {
                'description': issue['cause'],
                'probability': issue['similarity_score'],
                'evidence': issue['matching_symptoms']
            }
            diagnosis['probable_causes'].append(cause)
        
        # 推奨アクションの生成
        for issue in similar_issues[:3]:  # 上位3つ
            for action in issue['solutions']:
                diagnosis['recommended_actions'].append({
                    'action': action,
                    'expected_outcome': issue['outcome'],
                    'risk_level': self._assess_risk(action)
                })
        
        # 信頼度の計算
        if similar_issues:
            diagnosis['confidence'] = similar_issues[0]['similarity_score']
        
        self.diagnostic_history.append(diagnosis)
        return diagnosis
    
    def _analyze_symptoms(self, symptoms):
        """症状の分析と特徴抽出"""
        features = {
            'error_codes': [],
            'keywords': [],
            'metrics': {},
            'patterns': []
        }
        
        # エラーコード抽出
        import re
        error_pattern = r'(error|err|failed|failure):\s*(\d+|\w+)'
        matches = re.findall(error_pattern, symptoms, re.IGNORECASE)
        features['error_codes'] = [m[1] for m in matches]
        
        # キーワード抽出
        keywords = ['permission', 'network', 'memory', 'cpu', 'disk', 'timeout']
        for keyword in keywords:
            if keyword in symptoms.lower():
                features['keywords'].append(keyword)
        
        return features
    
    def _search_similar_issues(self, features):
        """類似問題の検索"""
        similar_issues = []
        
        for issue in self.knowledge_base:
            similarity = self._calculate_similarity(features, issue['features'])
            
            if similarity > 0.5:  # 閾値
                similar_issues.append({
                    'cause': issue['cause'],
                    'solutions': issue['solutions'],
                    'outcome': issue['outcome'],
                    'similarity_score': similarity,
                    'matching_symptoms': issue['symptoms']
                })
        
        # スコアでソート
        similar_issues.sort(key=lambda x: x['similarity_score'], reverse=True)
        return similar_issues
    
    def _calculate_similarity(self, features1, features2):
        """類似度計算（簡易版）"""
        score = 0.0
        
        # エラーコードの一致
        common_errors = set(features1.get('error_codes', [])) & set(features2.get('error_codes', []))
        if common_errors:
            score += 0.5
        
        # キーワードの一致
        common_keywords = set(features1.get('keywords', [])) & set(features2.get('keywords', []))
        score += len(common_keywords) * 0.1
        
        return min(score, 1.0)
    
    def _assess_risk(self, action):
        """アクションのリスク評価"""
        high_risk_keywords = ['rm', 'delete', 'prune', 'kill', 'stop']
        medium_risk_keywords = ['restart', 'reload', 'update']
        
        action_lower = action.lower()
        
        if any(keyword in action_lower for keyword in high_risk_keywords):
            return 'high'
        elif any(keyword in action_lower for keyword in medium_risk_keywords):
            return 'medium'
        else:
            return 'low'
    
    def _load_knowledge_base(self):
        """知識ベースのロード"""
        # 実際の実装では、データベースやファイルから読み込む
        return [
            {
                'id': 1,
                'symptoms': 'Container exits with code 125',
                'features': {
                    'error_codes': ['125'],
                    'keywords': ['exit', 'error']
                },
                'cause': 'Podman unable to run the container',
                'solutions': [
                    'Check if the image exists: podman images',
                    'Verify the command syntax',
                    'Check for typos in image name or tag'
                ],
                'outcome': 'Container runs successfully'
            },
            {
                'id': 2,
                'symptoms': 'Permission denied when mounting volume',
                'features': {
                    'keywords': ['permission', 'volume', 'mount'],
                    'error_codes': []
                },
                'cause': 'SELinux context mismatch',
                'solutions': [
                    'Add :Z or :z to volume mount',
                    'Check SELinux status: getenforce',
                    'Verify file ownership with ls -laZ'
                ],
                'outcome': 'Volume mounts successfully'
            }
            # ... 他の問題パターン
        ]

# 使用例
if __name__ == "__main__":
    troubleshooter = AITroubleshooter()
    
    # 症状の入力
    symptoms = """
    Container myapp exits immediately with code 125.
    Error message: Error: error creating container storage:
    """
    
    # 診断実行
    diagnosis = troubleshooter.diagnose_issue(symptoms)
    
    # 結果表示
    print(json.dumps(diagnosis, indent=2))
```

### 15.6 実践演習

#### 演習1: 総合診断ツールの作成

**目標**: 以下の機能を持つ診断ツールを作成する
- システム状態の自動チェック
- 一般的な問題の検出
- 修復提案の生成
- レポート出力

**要件**:
- 複数の診断モジュール
- 並列実行による高速化
- JSON/HTML形式でのレポート出力
- 修復スクリプトの自動生成

#### 演習2: パフォーマンス問題の調査

**シナリオ**: 
- コンテナの起動が遅い
- メモリ使用量が増加し続ける
- ネットワーク通信が断続的に失敗する

**タスク**:
1. 問題の再現環境を構築
2. 適切な診断ツールを選択・使用
3. 根本原因を特定
4. 解決策を実装・検証

### 参考資料

より実践的なトラブルシューティング例については、[実践的トラブルシューティングガイド](/troubleshooting-guide.md)を参照してください。

---