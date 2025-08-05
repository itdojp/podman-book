---
layout: book
order: 13
title: "第14章 パフォーマンスチューニング"
---

# 第14章 パフォーマンスチューニング

### 本章の意義と学習目標

**なぜパフォーマンスチューニングが重要なのか**

コンテナ技術の採用により、アプリケーションの展開は簡単になりましたが、最適なパフォーマンスを得るには適切なチューニングが不可欠です：

1. **リソース効率の最大化**: 限られたハードウェアで最大の価値を提供
2. **レスポンス時間の短縮**: ユーザー体験の向上
3. **コスト削減**: クラウド環境でのリソース使用量削減
4. **スケーラビリティ確保**: 負荷増大への対応力向上

本章では、Podmanコンテナのパフォーマンスを最大限に引き出す技術を習得します。

### 12.1 パフォーマンス分析の基礎

#### 12.1.1 メトリクス収集と監視

**なぜメトリクス収集が重要か**

「測定できないものは改善できない」という原則に基づき、適切なメトリクス収集は最適化の第一歩です。

**基本的なメトリクス収集**
```bash
# リアルタイムモニタリング
podman stats

# 特定コンテナの詳細統計
podman stats --format "table \{\{.Container\}\}\t\{\{.CPUPerc\}\}\t\{\{.MemUsage\}\}\t\{\{.NetIO\}\}\t\{\{.BlockIO\}\}"

# JSON形式での出力（自動化用）
podman stats --no-stream --format json > metrics.json
```

**高度なメトリクス収集スクリプト**
```bash
#!/bin/bash
# performance-monitor.sh

CONTAINER=$1
DURATION=${2:-300}  # デフォルト5分
INTERVAL=1

echo "Monitoring container: $CONTAINER for $DURATION seconds"
echo "Timestamp,CPU%,Memory(MB),NetRx(KB),NetTx(KB),BlockRead(KB),BlockWrite(KB)" > metrics.csv

end=$((SECONDS+DURATION))
while [ $SECONDS -lt $end ]; do
    STATS=$(podman stats --no-stream --format json $CONTAINER | jq -r '.[0]')
    
    TIMESTAMP=$(date +%s)
    CPU=$(echo $STATS | jq -r '.CPUPerc' | sed 's/%//')
    MEM=$(echo $STATS | jq -r '.MemUsage' | awk '{print $1}' | sed 's/MiB//')
    NET_RX=$(echo $STATS | jq -r '.NetIO' | awk '{print $1}' | sed 's/kB//')
    NET_TX=$(echo $STATS | jq -r '.NetIO' | awk '{print $3}' | sed 's/kB//')
    BLOCK_READ=$(echo $STATS | jq -r '.BlockIO' | awk '{print $1}' | sed 's/kB//')
    BLOCK_WRITE=$(echo $STATS | jq -r '.BlockIO' | awk '{print $3}' | sed 's/kB//')
    
    echo "$TIMESTAMP,$CPU,$MEM,$NET_RX,$NET_TX,$BLOCK_READ,$BLOCK_WRITE" >> metrics.csv
    sleep $INTERVAL
done

echo "Metrics saved to metrics.csv"
```

#### 12.1.2 プロファイリング技術

**システムコールレベルの分析**
```bash
# straceによるシステムコール追跡
podman run --cap-add SYS_PTRACE \
  --security-opt seccomp=unconfined \
  alpine strace -c -f /bin/ls

# 特定のシステムコールのみ追跡
podman run --cap-add SYS_PTRACE \
  alpine strace -e trace=open,read,write /app/myapp
```

**メモリプロファイリング**
```bash
# メモリマップの確認
podman exec mycontainer cat /proc/1/maps

# メモリ使用詳細
podman exec mycontainer cat /proc/1/status | grep -E "Vm|Rss"
```

### 12.2 起動時間の最適化

#### 12.2.1 イメージサイズの削減

**なぜイメージサイズが起動時間に影響するか**

- イメージのダウンロード時間
- ディスクI/O
- レイヤーの展開時間

**最適化前後の比較**
```dockerfile
# 最適化前 (1.2GB)
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    git
RUN pip install flask numpy pandas scikit-learn
COPY . /app
CMD ["python3", "/app/main.py"]

# 最適化後 (150MB)
FROM python:3.11-alpine AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-alpine
RUN apk add --no-cache libstdc++
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["python", "main.py"]
```

#### 12.2.2 起動プロセスの最適化

```bash
# 起動時間の測定
time podman run --rm myapp echo "Started"

# 起動最適化の技術
# 1. 事前プル
podman pull myapp:latest &

# 2. コンテナの事前作成
podman create --name myapp-standby myapp:latest

# 3. systemdソケットアクティベーション
systemctl --user enable podman.socket
```

### 12.3 CPU最適化

#### 12.3.1 CPU制限とスケジューリング

**CPUリソースの適切な割り当て**
```bash
# CPU制限の設定
podman run -d \
  --name cpu-limited \
  --cpus="2.5" \              # 2.5CPU相当
  --cpu-shares=2048 \         # 相対的優先度（デフォルト1024）
  --cpu-period=100000 \       # スケジューリング周期（μs）
  --cpu-quota=250000 \        # 周期内の使用時間（μs）
  myapp

# CPU親和性の設定
podman run -d \
  --cpuset-cpus="0-3" \       # CPU 0-3のみ使用
  --cpuset-mems="0" \         # NUMAノード0のメモリ使用
  myapp
```

#### 12.3.2 マルチスレッドアプリケーションの最適化

```python
# cpu_optimization.py
import os
import multiprocessing

def optimize_cpu_usage():
    # コンテナ内のCPU数を取得
    cpu_count = len(os.sched_getaffinity(0))
    
    # ワーカー数の最適化
    optimal_workers = min(cpu_count, multiprocessing.cpu_count())
    
    # スレッドプールの設定
    os.environ['OMP_NUM_THREADS'] = str(optimal_workers)
    os.environ['OPENBLAS_NUM_THREADS'] = str(optimal_workers)
    os.environ['MKL_NUM_THREADS'] = str(optimal_workers)
    
    return optimal_workers
```

### 12.4 メモリ最適化

#### 12.4.1 メモリ制限と管理

```bash
# メモリ制限の設定
podman run -d \
  --name memory-optimized \
  --memory=2g \               # ハードリミット
  --memory-reservation=1g \   # ソフトリミット
  --memory-swap=3g \          # スワップを含む総メモリ
  --oom-kill-disable=false \  # OOMキラー有効
  myapp

# メモリ使用状況の確認
podman exec memory-optimized cat /sys/fs/cgroup/memory/memory.usage_in_bytes
podman exec memory-optimized cat /sys/fs/cgroup/memory/memory.limit_in_bytes
```

#### 12.4.2 メモリリークの検出と対策

```bash
# valgrindによるメモリリーク検出
podman run --cap-add SYS_PTRACE \
  -v $(pwd):/app \
  alpine sh -c "
    apk add --no-cache valgrind
    valgrind --leak-check=full --show-leak-kinds=all /app/myapp
  "

# jemalloc使用による最適化
FROM alpine
RUN apk add --no-cache jemalloc
ENV LD_PRELOAD=/usr/lib/libjemalloc.so.2
ENV MALLOC_CONF=stats_print:true
```

### 12.5 ネットワーク最適化

#### 12.5.1 ネットワークドライバーの選択

**パフォーマンス特性の比較**
```bash
#!/bin/bash
# network-benchmark.sh

echo "Testing network performance..."

# Bridge network
podman network create test-bridge
podman run -d --name iperf-server --network test-bridge \
  networkstatic/iperf3 -s

podman run --rm --network test-bridge \
  networkstatic/iperf3 -c iperf-server -t 10

podman stop iperf-server && podman rm iperf-server
podman network rm test-bridge

# Host network
podman run -d --name iperf-server --network host \
  networkstatic/iperf3 -s -p 5201

podman run --rm --network host \
  networkstatic/iperf3 -c localhost -p 5201 -t 10

podman stop iperf-server && podman rm iperf-server
```

#### 12.5.2 TCP/IPチューニング

```bash
# TCP最適化パラメータ
podman run -d \
  --sysctl net.core.somaxconn=65535 \
  --sysctl net.ipv4.tcp_max_syn_backlog=65535 \
  --sysctl net.ipv4.tcp_tw_reuse=1 \
  --sysctl net.ipv4.tcp_fin_timeout=15 \
  --sysctl net.core.netdev_max_backlog=16384 \
  high-performance-app
```

### 12.6 ストレージ最適化

#### 12.6.1 ストレージドライバーの最適化

```bash
# ストレージドライバーのパフォーマンステスト
#!/bin/bash

# overlayファイルシステムの最適化
cat >> ~/.config/containers/storage.conf << EOF
[storage.options.overlay]
mount_program = "/usr/bin/fuse-overlayfs"
mountopt = "nodev,metacopy=on,volatile"
EOF

# Direct I/Oの使用
podman run -v /fast-storage:/data:O myapp
```

#### 12.6.2 I/Oパフォーマンスの向上

```bash
# I/Oベンチマーク
podman run --rm -v test-vol:/data \
  alpine dd if=/dev/zero of=/data/test bs=1M count=1000

# I/O制限の設定
podman run -d \
  --device-read-bps /dev/sda:100mb \
  --device-write-bps /dev/sda:100mb \
  --device-read-iops /dev/sda:1000 \
  --device-write-iops /dev/sda:1000 \
  myapp
```

### 12.7 総合的な最適化戦略

#### 12.7.1 パフォーマンステストフレームワーク

```python
#!/usr/bin/env python3
# performance_test_framework.py

import subprocess
import json
import time
import statistics
from datetime import datetime

class PerformanceTestFramework:
    def __init__(self, image_name):
        self.image_name = image_name
        self.results = {}
    
    def test_startup_time(self, iterations=10):
        """起動時間のベンチマーク"""
        times = []
        for _ in range(iterations):
            start = time.time()
            container = subprocess.run(
                ['podman', 'run', '-d', '--rm', self.image_name, 'sleep', '10'],
                capture_output=True, text=True
            ).stdout.strip()
            
            # 起動完了を待つ
            while True:
                result = subprocess.run(
                    ['podman', 'inspect', container, '--format', '\{\{.State.Status\}\}'],
                    capture_output=True, text=True
                )
                if result.stdout.strip() == 'running':
                    break
                time.sleep(0.01)
            
            elapsed = time.time() - start
            times.append(elapsed)
            
            subprocess.run(['podman', 'stop', container], capture_output=True)
        
        self.results['startup_time'] = {
            'mean': statistics.mean(times),
            'stdev': statistics.stdev(times) if len(times) > 1 else 0,
            'min': min(times),
            'max': max(times)
        }
    
    def test_throughput(self):
        """スループットテスト"""
        # アプリケーション固有のスループットテストを実装
        pass
    
    def test_resource_efficiency(self):
        """リソース効率のテスト"""
        container = subprocess.run(
            ['podman', 'run', '-d', '--name', 'perf-test', self.image_name],
            capture_output=True, text=True
        ).stdout.strip()
        
        time.sleep(5)  # 安定化を待つ
        
        # リソース使用量を収集
        stats = subprocess.run(
            ['podman', 'stats', '--no-stream', '--format', 'json', 'perf-test'],
            capture_output=True, text=True
        )
        
        stats_data = json.loads(stats.stdout)[0]
        
        self.results['resource_efficiency'] = {
            'cpu_percent': float(stats_data['CPUPerc'].rstrip('%')),
            'memory_usage': stats_data['MemUsage'],
            'memory_percent': float(stats_data['MemPerc'].rstrip('%'))
        }
        
        subprocess.run(['podman', 'rm', '-f', 'perf-test'])
    
    def generate_report(self):
        """パフォーマンスレポート生成"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'image': self.image_name,
            'results': self.results
        }
        
        with open('performance_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        print("Performance Test Report")
        print("=" * 50)
        print(f"Image: {self.image_name}")
        for test, results in self.results.items():
            print(f"\n{test}:")
            for metric, value in results.items():
                print(f"  {metric}: {value}")
```

#### 12.7.2 継続的パフォーマンス改善

```yaml
# .gitlab-ci.yml での自動パフォーマンステスト
performance_test:
  stage: test
  script:
    - podman build -t $CI_PROJECT_NAME:$CI_COMMIT_SHA .
    - python3 performance_test_framework.py $CI_PROJECT_NAME:$CI_COMMIT_SHA
    - |
      # パフォーマンス基準値との比較
      STARTUP_TIME=$(jq -r '.results.startup_time.mean' performance_report.json)
      if (( $(echo "$STARTUP_TIME > 2.0" | bc -l) )); then
        echo "起動時間が基準値を超えています: ${STARTUP_TIME}秒"
        exit 1
      fi
  artifacts:
    reports:
      performance: performance_report.json
```

### 12.8 実践演習

#### 演習1: アプリケーションのパフォーマンスプロファイル作成

**目標**: 実際のアプリケーションのパフォーマンス特性を把握し、最適化ポイントを特定する

**手順**:
1. ベースラインメトリクスの収集
2. ボトルネックの特定
3. 最適化の実施
4. 結果の検証

#### 演習2: 負荷テストと最適化

**目標**: 高負荷環境でのパフォーマンス改善

**手順**:
1. 負荷生成ツール（Apache Bench、JMeter）の準備
2. 段階的な負荷増加テスト
3. リソース制限の調整
4. スケーリング戦略の検証

---