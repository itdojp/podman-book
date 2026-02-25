---
title: "Docker→Podman包括的移行ガイドライン"
---

# Docker→Podman包括的移行ガイドライン

このガイドは、既存のDocker環境からPodmanへの段階的な移行を支援します。実践的なチェックリストとツールを提供し、リスクを最小化しながら確実な移行を実現します。

## 対象バージョン
- **移行元**: Docker 20.x以降
- **移行先**: Podman 5.0.x
- **検証済みOS**: RHEL 9.3、Ubuntu 22.04 LTS、CentOS Stream 9

## 表記について
- 本ガイドでは Compose の定義ファイル名として `docker-compose.yml` 等の表記を用います（ファイル名/パターンを示すため）。
- コマンドは Compose v2 の `docker compose` を基本とし、`docker-compose` は Compose v1（legacy）の残存チェックや互換目的のエイリアス/ラッパー例など、限定的な文脈でのみ登場します。

## 📋 移行前評価チェックリスト

### Phase 0: 現状分析（1週間）

#### インベントリ作成
```bash
#!/bin/bash
# docker-inventory.sh - Docker環境の棚卸しスクリプト

echo "=== Docker環境インベントリ ==="
echo ""

echo "1. Dockerバージョン:"
docker --version

echo ""
echo "2. 実行中のコンテナ:"
docker ps --format "table \{\{.Names\}\}\t\{\{.Image\}\}\t\{\{.Status\}\}\t\{\{.Ports\}\}"

echo ""
echo "3. イメージ一覧:"
docker images --format "table \{\{.Repository\}\}:\{\{.Tag\}\}\t\{\{.Size\}\}"

echo ""
echo "4. ボリューム一覧:"
docker volume ls

echo ""
echo "5. ネットワーク一覧:"
docker network ls

echo ""
echo "6. Composeプロジェクト（Compose 定義ファイル: docker-compose*.yml）:"
find . -name "docker-compose*.yml" -type f 2>/dev/null | head -20

echo ""
echo "7. Dockerfile一覧:"
find . -name "Dockerfile*" -type f 2>/dev/null | head -20
```

#### 互換性評価
```bash
#!/bin/bash
# compatibility-check.sh - Podman互換性チェック

echo "=== Podman互換性チェック ==="

# Docker特有機能の使用確認
echo "チェック項目:"
echo -n "[ ] Docker Swarmの使用: "
docker node ls 2>&1 | grep -q "This node is not a swarm manager" && echo "未使用 ✓" || echo "使用中 ⚠️"

echo -n "[ ] Docker Compose v2（docker compose）の利用可/インストール状況: "
docker compose version >/dev/null 2>&1 && echo "利用可 ✓" || echo "未検出 ⚠️"

echo -n "[ ] Docker Compose v1（docker-compose）の残存: "
command -v docker-compose >/dev/null 2>&1 && echo "検出 ⚠️（legacy）" || echo "未検出 ✓"

echo -n "[ ] 特権コンテナの使用: "
docker ps --format '\{\{.Names\}\}' | xargs -I {} docker inspect {} | grep -q '"Privileged": true' && echo "使用中 ⚠️" || echo "未使用 ✓"

echo -n "[ ] カスタムDockerネットワーク: "
docker network ls --format '\{\{.Name\}\}' | grep -v -E 'bridge|host|none' | wc -l | xargs -I {} test {} -gt 0 && echo "使用中 (要確認)" || echo "標準のみ ✓"
```

## 🔄 Phase 1: 互換性確認と準備（1〜2週間）

### Docker Compose互換性の確保

#### docker-compose.ymlの変換
```yaml
# 変換前（Docker Compose）
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:80"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:13
    volumes:
      - db-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: secret

volumes:
  db-data:
```

```yaml
# 変換後（Podman Compose対応）
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:80"
    volumes:
      - ./data:/app/data:Z  # SELinuxラベル追加
    environment:
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped
    # Podman固有の設定
    userns_mode: keep-id  # ユーザー名前空間の保持

  db:
    image: postgres:13
    volumes:
      - db-data:/var/lib/postgresql/data:Z
    environment:
      POSTGRES_PASSWORD: secret
    # セキュリティ強化
    security_opt:
      - label=disable  # 必要に応じて

volumes:
  db-data:
```

### イメージ移行スクリプト
```bash
#!/bin/bash
# migrate-images.sh - DockerイメージのPodmanへの移行

# Dockerイメージをtarファイルにエクスポート
migrate_image() {
    local image=$1
    local tar_name=$(echo $image | tr '/' '_' | tr ':' '_').tar
    
    echo "エクスポート中: $image"
    docker save -o $tar_name $image
    
    echo "インポート中: $image"
    podman load -i $tar_name
    
    # 検証
    if podman images | grep -q $image; then
        echo "✓ $image の移行成功"
        rm $tar_name
    else
        echo "✗ $image の移行失敗"
    fi
}

# 全イメージの移行
docker images --format '\{\{.Repository\}\}:\{\{.Tag\}\}' | grep -v '<none>' | while read image; do
    migrate_image $image
done
```

### ボリュームデータの移行
```bash
#!/bin/bash
# migrate-volumes.sh - Dockerボリュームの移行

migrate_volume() {
    local vol_name=$1
    
    # Dockerボリュームのパスを取得
    docker_path=$(docker volume inspect $vol_name --format '\{\{.Mountpoint\}\}')
    
    # Podmanボリューム作成
    podman volume create $vol_name
    
    # Podmanボリュームのパスを取得
    podman_path=$(podman volume inspect $vol_name --format '\{\{.Mountpoint\}\}')
    
    # データコピー（root権限が必要な場合あり）
    echo "コピー中: $vol_name"
    sudo cp -rp $docker_path/* $podman_path/
    
    echo "✓ $vol_name の移行完了"
}

# 全ボリュームの移行
docker volume ls -q | while read volume; do
    migrate_volume $volume
done
```

## 🚀 Phase 2: パイロット導入（2〜4週間）

### 段階的移行戦略

#### 開発環境での検証
```bash
# 1. Podman aliasの設定（一時的）
alias docker=podman

# Composeファイル（docker-compose.yml 等）は podman-compose を使用
pip3 install podman-compose

# 1-1. 既存スクリプトに残る Compose 呼び出しの吸収（検証用途）
#   - docker-compose を呼ぶ場合（Compose v1 形式）
alias docker-compose=podman-compose
#
#   - docker compose を呼ぶ場合（Compose v2 形式）のラッパー例（bash）
#     ※ 本番運用前には、スクリプト側の呼び出しを `podman-compose` / `podman` に書き換えることを推奨
# docker() {
#   if [ "${1:-}" = "compose" ]; then
#     shift
#     podman-compose "$@"
#   else
#     command podman "$@"
#   fi
# }

# 2. 既存スクリプトのテスト
./deploy.sh  # 既存のデプロイスクリプト（上記方針で Compose 呼び出しを吸収）

# 3. 動作確認
podman ps
podman logs <container_name>
```

#### サイドバイサイド実行
```bash
# Dockerは8080ポート、Podmanは8081ポートで同じアプリを実行
docker run -d -p 8080:80 --name app-docker nginx:alpine
podman run -d -p 8081:80 --name app-podman nginx:alpine

# パフォーマンス比較
ab -n 10000 -c 100 http://localhost:8080/ > docker-perf.txt
ab -n 10000 -c 100 http://localhost:8081/ > podman-perf.txt
```

### 移行時の注意点と対処法

#### 1. ネットワーク設定の違い
```bash
# Docker: デフォルトブリッジネットワーク
docker network create mynet

# Podman: 同等の設定
podman network create mynet

# ただし、IPアドレス範囲が異なる場合があるため確認
podman network inspect mynet
```

#### 2. ビルドコンテキストの違い
```dockerfile
# Dockerfile内でのユーザー権限
# Dockerではroot、Podmanではrootlessがデフォルト

# 互換性を保つための記述
FROM alpine:latest
# 明示的にユーザーを指定
USER root
RUN apk add --no-cache nginx
# 非rootユーザーで実行
USER nginx
```

#### 3. ログドライバーの違い
```bash
# Docker: json-fileがデフォルト
docker run --log-driver json-file nginx

# Podman: journaldがデフォルト（systemd環境）
podman run --log-driver json-file nginx  # Dockerと同じ動作
```

## 📊 Phase 3: 本番環境移行（1〜3ヶ月）

### カットオーバー計画

#### ブルーグリーンデプロイメント
```bash
#!/bin/bash
# blue-green-migration.sh

# 現在の本番（Docker - Blue）
BLUE_PORT=80
GREEN_PORT=8080

# 新環境（Podman - Green）の準備
podman run -d --name app-green -p $GREEN_PORT:80 myapp:latest

# ヘルスチェック
for i in {1..30}; do
    if curl -f http://localhost:$GREEN_PORT/health; then
        echo "Green環境: 正常"
        break
    fi
    sleep 2
done

# トラフィック切り替え（ロードバランサー設定変更）
# この部分は環境に応じて実装

# 旧環境の停止
docker stop app-blue
```

### ロールバック手順
```bash
#!/bin/bash
# rollback-procedure.sh

# 問題検出時の自動ロールバック
if ! podman healthcheck run app-production; then
    echo "ヘルスチェック失敗: ロールバック開始"
    
    # Podman停止
    podman stop app-production
    
    # Docker再起動
    docker start app-production-backup
    
    # アラート送信
    send_alert "Podman移行ロールバック実行"
fi
```

## 🛠️ 移行ツールとユーティリティ

### 自動変換ツール
```python
#!/usr/bin/env python3
# docker2podman.py - Docker Compose自動変換

import yaml
import sys

def convert_compose(docker_compose_file):
    with open(docker_compose_file, 'r') as f:
        compose = yaml.safe_load(f)
    
    # Podman固有の変換
    for service_name, service in compose.get('services', {}).items():
        # SELinuxコンテキスト追加
        if 'volumes' in service:
            service['volumes'] = [
                f"{vol}:Z" if ':Z' not in vol else vol 
                for vol in service['volumes']
            ]
        
        # rootless対応
        if 'user' not in service:
            service['userns_mode'] = 'keep-id'
    
    return compose

if __name__ == "__main__":
    converted = convert_compose(sys.argv[1])
    print(yaml.dump(converted, default_flow_style=False))
```

### 継続的な互換性チェック
```bash
#!/bin/bash
# continuous-compatibility-check.sh

# CI/CDパイプラインに組み込む
run_compatibility_test() {
    echo "Docker/Podman互換性テスト開始"
    
    # 同じイメージでコンテナ起動
    docker run -d --name test-docker -p 9000:80 $TEST_IMAGE
    podman run -d --name test-podman -p 9001:80 $TEST_IMAGE
    
    # 機能テスト実行
    ./run-tests.sh http://localhost:9000 > docker-results.txt
    ./run-tests.sh http://localhost:9001 > podman-results.txt
    
    # 結果比較
    if diff docker-results.txt podman-results.txt; then
        echo "✓ 互換性テスト合格"
        return 0
    else
        echo "✗ 互換性テスト失敗"
        return 1
    fi
}
```

## 📈 移行後の最適化

### パフォーマンスチューニング
```bash
# Podman固有の最適化
# 1. ストレージドライバーの最適化
podman info | grep graphDriverName
# overlay が推奨

# 2. ログサイズの制限
podman run --log-opt max-size=10m nginx

# 3. cgroup v2の活用
podman run --memory 512m --cpus 0.5 nginx
```

### 監視とメトリクス
```bash
# Prometheus対応
podman run -d \
  --name prometheus \
  -p 9090:9090 \
  -v prometheus-data:/prometheus:Z \
  prom/prometheus

# メトリクスエクスポート
podman stats --format json | jq '.'
```

## ✅ 移行完了チェックリスト

- [ ] すべてのコンテナがPodmanで実行されている
- [ ] ボリュームデータの整合性確認
- [ ] ネットワーク接続性の確認
- [ ] パフォーマンスベンチマーク完了
- [ ] 監視・ログ収集の移行
- [ ] バックアップ・リストア手順の更新
- [ ] 運用ドキュメントの更新
- [ ] チームトレーニングの完了

## トラブルシューティング

### よくある問題と解決策

1. **権限エラー**
   ```bash
   # 問題: permission denied
   # 解決: 
   podman unshare chown -R $UID:$GID /path/to/volume
   ```

2. **ネットワーク接続問題**
   ```bash
   # 問題: コンテナ間通信不可
   # 解決: 同一Podまたはネットワークで実行
   podman network create shared
   podman run --network shared ...
   ```

3. **ビルドエラー**
   ```bash
   # 問題: COPY失敗
   # 解決: SELinuxコンテキスト
   podman build --security-opt label=disable .
   ```

この移行ガイドラインに従うことで、Dockerから Podmanへの移行を計画的かつ安全に実施できます。
