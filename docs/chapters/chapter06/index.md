---
layout: book
order: 7
title: "第6章：ネットワーキングとポート管理"
---

# 第6章：ネットワーキングとポート管理

### 本章の意義と学習目標

**なぜネットワークとストレージを深く理解する必要があるのか**

コンテナの真価は、適切なネットワークとストレージ設計によって発揮されます。

1. **マイクロサービス実現**: サービス間の安全で効率的な通信
2. **データ永続性**: ステートフルアプリケーションの信頼性確保
3. **パフォーマンス最適化**: I/O集約型アプリケーションの高速化
4. **セキュリティ強化**: ネットワーク分離によるセキュリティ境界の確立

本章では、本番環境で必要となる高度なネットワーク・ストレージ設計を習得します。

### 6.1 コンテナネットワーク詳解

#### なぜ複数のネットワークドライバーが存在するのか

アプリケーションの要件に応じて、最適なネットワーク構成は異なります。

#### 6.1.1 ネットワークドライバー

**利用可能なドライバーとその選択基準**

```bash
# ネットワーク一覧
podman network ls

# 各ドライバーの特性と用途
```

**1. Bridge（デフォルト）- なぜ最も使われるのか**
- **用途**: 単一ホスト上のコンテナ間通信
- **利点**: シンプル、NAT経由で外部接続可能
- **実装**: Linux bridgeとiptables
- **適用場面**: 開発環境、小規模なアプリケーション

**2. Host - パフォーマンスが必要な場合**
- **用途**: ネットワークパフォーマンスが最重要
- **利点**: オーバーヘッドなし、ホストと同じネットワークスタック
- **注意**: ポート競合、セキュリティ分離なし
- **適用場面**: 高頻度取引システム、ネットワーク監視ツール

**3. None - 完全な分離が必要な場合**
- **用途**: ネットワーク不要またはカスタム設定
- **利点**: 完全な分離、攻撃面ゼロ
- **適用場面**: バッチ処理、セキュリティが最重要なタスク

**4. Macvlan - 物理ネットワーク統合**
- **用途**: コンテナを物理ネットワークの一員として扱う
- **利点**: 独自のMACアドレス、VLANサポート
- **適用場面**: レガシーアプリケーション、ネットワーク機器との直接通信

## Podmanネットワーク構成図

各ネットワークドライバーの動作を視覚的に理解しましょう。

![Podman Network Architecture](../../assets/images/diagrams/chapter06-podman-network-architecture.svg)

**ネットワークドライバー比較表：**

| ドライバー | パフォーマンス | 分離性 | 設定複雑度 | 用途 |
|-----------|---------------|--------|------------|------|
| Bridge | 中 | 高 | 低 | 開発・一般用途 |
| Host | 最高 | なし | 最低 | 高性能要求 |
| None | - | 最高 | 最低 | セキュア処理 |
| Macvlan | 高 | 中 | 高 | レガシー統合 |

**Bridgeネットワーク詳細設定の実務的価値**

```bash
# デフォルトネットワークの確認
podman network inspect podman

# カスタムブリッジ作成 - なぜカスタマイズが必要か
podman network create \
  --driver bridge \
  --subnet 172.20.0.0/16 \      # 社内ネットワークとの競合回避
  --gateway 172.20.0.1 \        # 明示的なゲートウェイ設定
  --ip-range 172.20.240.0/20 \  # DHCP範囲の制限
  mybridge

# この設定が解決する問題：
# - IPアドレスの予測可能性（固定IPが必要なアプリ）
# - ネットワークセグメンテーション（セキュリティ）
# - 既存インフラとの統合

# 詳細オプション - エンタープライズ要件への対応
podman network create \
  --driver bridge \
  --opt isolate=true \          # コンテナ間通信を禁止（セキュリティ）
  --opt mtu=1450 \             # VPN/オーバーレイ環境でのMTU調整
  --label environment=production \  # 運用管理用メタデータ
  secure-network

# これらのオプションが必要な理由：
# - isolate: マルチテナント環境でのセキュリティ
# - MTU: パケットフラグメンテーション回避
# - label: 自動化ツールでの識別
```

#### 6.1.2 コンテナ間通信

**なぜ適切なネットワーク設計が重要か**

マイクロサービスアーキテクチャでは、サービス間通信が成功の鍵となります。

**同一ネットワーク内通信の実装**

```bash
# ネットワーク作成
podman network create app-network

# データベースコンテナ - なぜ分離ネットワークが必要か
podman run -d \
  --name db \
  --network app-network \
  postgres:13
# 効果：
# - 外部からの直接アクセス防止
# - サービス名での名前解決
# - ネットワークレベルでのアクセス制御

# アプリケーションコンテナ
podman run -d \
  --name app \
  --network app-network \
  --env DB_HOST=db \  # ホスト名で接続（IPアドレス不要）
  myapp:latest

# 接続確認 - DNS解決の仕組み
podman exec app ping -c 3 db
# 内部DNSサーバーが自動的に名前解決
# 利点：IPアドレスの変更に強い、設定の簡素化
```

**複数ネットワーク接続 - 実務での必要性**

```bash
# フロントエンドネットワーク（公開）
podman network create frontend

# バックエンドネットワーク（内部）
podman network create backend

# API Gatewayパターンの実装
podman run -d \
  --name api \
  --network backend \
  myapi:latest

# APIを両方のネットワークに接続
podman network connect frontend api

# この構成が実現すること：
# - フロントエンド: インターネットからアクセス可能
# - バックエンド: データベースなど、内部リソースのみ
# - API: 両方のネットワークをブリッジ（セキュリティ境界）
```

### 6.2 ストレージ管理

#### なぜコンテナにストレージ管理が必要か

「コンテナは一時的」という原則がありますが、実際のアプリケーションはデータを永続化する必要があります。

#### 6.2.1 ボリュームの詳細

**ボリュームタイプとその使い分け**

```bash
# Named Volume（推奨）- なぜ推奨されるのか
podman volume create mydata
podman run -v mydata:/data alpine
# 利点：
# - Podman管理による一貫性
# - バックアップ・リストアが容易
# - ホストパスを意識しない抽象化

# Bind Mount - いつ使うべきか
podman run -v /host/path:/container/path alpine
# 用途：
# - 開発時の即時反映（ホットリロード）
# - 既存データの移行
# 注意：
# - ホスト依存性が高い
# - 権限問題が発生しやすい

# tmpfs Mount - メモリ上のファイルシステム
podman run --tmpfs /tmp:rw,size=100m,mode=1777 alpine
# 用途：
# - 一時ファイル（セキュリティ）
# - 高速I/Oが必要な処理
# 効果：
# - ディスクに書き込まない（機密情報保護）
# - 高速（メモリ速度）

# Anonymous Volume - 避けるべき理由
podman run -v /data alpine
# 問題：
# - 管理が困難（自動生成される名前）
# - 削除忘れによるディスク圧迫
```

**ボリュームオプションの実務的活用**

```bash
# 読み取り専用マウント - セキュリティ強化
podman run -v mydata:/data:ro alpine
# 用途：設定ファイル、静的コンテンツ
# 効果：意図しない変更を防止

# SELinuxラベル - なぜ必要か
podman run -v /host/path:/data:Z alpine  # プライベート
podman run -v /host/path:/data:z alpine  # 共有
# Z: 他のコンテナからアクセス不可（機密データ）
# z: 複数コンテナで共有可能（共有設定）

# ユーザー指定 - 権限問題の解決
podman run -v mydata:/data:U alpine
# Rootlessモードでの権限マッピング自動化

# サイズ制限 - リソース管理
podman volume create --opt size=10G limited-volume
# ディスク使用量の制限と予測可能性
```

#### 6.2.2 ボリュームドライバー

**ローカルドライバーオプション**
```bash
# デバイス指定
podman volume create \
  --driver local \
  --opt type=ext4 \
  --opt device=/dev/sdb1 \
  external-volume

# NFSマウント
podman volume create \
  --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,vers=4 \
  --opt device=:/shared/data \
  nfs-volume

# CIFS/SMBマウント
podman volume create \
  --driver local \
  --opt type=cifs \
  --opt o=username=user,password=pass,domain=WORKGROUP \
  --opt device=//server/share \
  smb-volume
```

#### 6.2.3 データ永続化パターン

**データベースの永続化**
```bash
# PostgreSQL例
podman volume create pgdata

podman run -d \
  --name postgres \
  -v pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:13

# バックアップ
podman run --rm \
  -v pgdata:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/pgdata-backup.tar.gz -C /data .
```

**アプリケーションデータ管理**
```yaml
# docker-compose.yml での例
version: '3'
services:
  app:
    image: myapp:latest
    volumes:
      - app-data:/data
      - ./config:/app/config:ro
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 100m

volumes:
  app-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/storage/app
```

### 6.3 ネットワークポリシー

#### 6.3.1 ファイアウォール統合

```bash
# CNIファイアウォールプラグイン設定
cat > /etc/cni/net.d/87-podman-bridge.conflist << EOF
{
  "cniVersion": "0.4.0",
  "name": "podman",
  "plugins": [
    {
      "type": "bridge",
      "bridge": "cni-podman0",
      "isGateway": true,
      "ipMasq": true,
      "ipam": {
        "type": "host-local",
        "routes": [{"dst": "0.0.0.0/0"}],
        "ranges": [[{"subnet": "10.88.0.0/16"}]]
      }
    },
    {
      "type": "firewall",
      "backend": "iptables",
      "ingressPolicy": "same-bridge"
    }
  ]
}
EOF
```

#### 6.3.2 ネットワーク分離

```bash
# 分離されたネットワーク
podman network create --internal internal-only

# 外部通信の制御
podman run -d \
  --name isolated \
  --network internal-only \
  --dns 192.168.1.1 \
  alpine

# プロキシ経由の通信
podman run -d \
  --name proxy \
  --network internal-only \
  --network podman \
  squid:latest
```

### 6.4 パフォーマンス最適化

#### 6.4.1 ネットワークパフォーマンス

```bash
# MTU最適化
podman network create \
  --opt mtu=9000 \
  jumbo-network

# ホストネットワーク使用（最高性能）
podman run --network host nginx:alpine

# SR-IOV使用
podman run \
  --device /dev/vfio/vfio \
  --device /dev/vfio/1 \
  high-performance-app
```

#### 6.4.2 ストレージパフォーマンス

```bash
# オーバーレイ最適化
podman run \
  --storage-opt overlay.mountopt=volatile \
  --storage-opt overlay.size=10G \
  myapp:latest

# Direct I/O
podman run \
  -v /fast/storage:/data:O \
  database:latest
```

### 6.5 トラブルシューティング

#### 6.5.1 ネットワーク問題

```bash
# ネットワーク診断
podman network inspect podman | jq '.[] | .plugins'

# ポート確認
podman port mycontainer
ss -tlnp | grep podman

# iptables確認
sudo iptables -t nat -L -n -v
sudo iptables -L FORWARD -n -v

# DNS問題
podman exec mycontainer cat /etc/resolv.conf
podman exec mycontainer nslookup example.com
```

#### 6.5.2 ストレージ問題

```bash
# ディスク使用量
podman system df
podman volume ls -f dangling=true

# クリーンアップ
podman volume prune -f
podman system prune -a --volumes

# マウント問題
findmnt | grep podman
podman inspect mycontainer | jq '.[0].Mounts'
```

### 演習問題

1. 3層アーキテクチャ（Web、App、DB）のネットワークを設計・実装してください
2. NFSボリュームを使用した共有ストレージシステムを構築してください
3. ネットワークポリシーを適用し、特定の通信のみを許可する環境を作成してください

## まとめ

- ネットワークドライバーの選択基準と、用途に応じたネットワーク構成の考え方を整理しました。
- ボリュームを含むストレージ管理の基本と、運用上の設計ポイントを確認しました。
- ネットワークポリシー、パフォーマンス最適化、トラブルシューティングの観点を扱いました。

## 次に読む

- [第7章：Pod機能と複数コンテナ管理](../chapter07/)
- [目次に戻る](../../)

---
