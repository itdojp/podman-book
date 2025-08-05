---
layout: book
order: 6
title: "第7章 イメージの作成と管理"
---

# 第7章 イメージの作成と管理

### 本章の意義と学習目標

**なぜイメージ作成を深く理解する必要があるのか**

「コンテナを使う」から「コンテナを作る」へのステップは、以下の価値をもたらします：

1. **ビルド時間の短縮**: 最適化により、デプロイサイクルを10倍高速化
2. **セキュリティ向上**: 脆弱性を最小限に抑えた安全なイメージ作成
3. **運用コスト削減**: イメージサイズ削減により、ストレージとネットワークコストを大幅削減
4. **保守性向上**: 再現可能で理解しやすいイメージ構成

本章では、「動くイメージ」から「本番環境に適したイメージ」を作成する技術を習得します。

### 5.1 Containerfile/Dockerfile詳解

#### なぜContainerfileの各命令を理解することが重要か

各命令は単なる手順ではなく、パフォーマンス、セキュリティ、保守性に直接影響します：

#### 5.1.1 基本構造と命令

**基本的なContainerfileとその最適化ポイント**

```dockerfile
# ベースイメージ - なぜ選択が重要か
FROM alpine:3.18
# Alpine選択の理由：
# - サイズ: 5MB（Ubuntu: 80MB以上）
# - セキュリティ: 最小限のパッケージ = 攻撃面の最小化
# - 起動速度: 小さいイメージ = 高速なpull/起動

# メタデータ - なぜ重要か
LABEL maintainer="admin@example.com"
LABEL version="1.0"
LABEL description="Sample application"
# 効果：
# - 運用時の問い合わせ先明確化
# - 自動化ツールでのフィルタリング
# - コンプライアンス要件の充足

# 引数とビルド時変数 - 柔軟性の確保
ARG BUILD_DATE
ARG VERSION=latest
# 活用シーン：
# - CI/CDでのバージョン自動注入
# - 環境別のビルド設定

# 環境変数 - 実行時設定の外部化
ENV APP_HOME=/app \
    NODE_ENV=production
# ベストプラクティス：
# - 機密情報は含めない（ビルド時に埋め込まれる）
# - 実行時に上書き可能な設定のみ

# 作業ディレクトリ - なぜ明示的に設定するか
WORKDIR $APP_HOME
# 効果：
# - 相対パスの基準点明確化
# - デバッグ時の作業効率向上

# パッケージインストール - 最適化の要
RUN apk add --no-cache \
    nodejs \
    npm \
    curl
# --no-cacheの重要性：
# - パッケージインデックスをイメージに含めない
# - イメージサイズを数十MB削減

# ファイルコピー - レイヤーキャッシュの活用
COPY package*.json ./
RUN npm ci --only=production
COPY . .
# この順序の理由：
# - package.jsonが変更されない限り、npm ciはキャッシュから実行
# - ソースコード変更時も依存関係インストールをスキップ
# - ビルド時間を大幅短縮（5分→30秒）

# ポート公開 - ドキュメンテーションとしての役割
EXPOSE 3000
# 注意：実際のポート開放ではなく、使用ポートの明示

# ヘルスチェック - 本番運用の必須要件
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
# 各パラメータの意味：
# - interval: チェック間隔（頻繁すぎるとオーバーヘッド）
# - timeout: 応答待ち時間（ネットワーク遅延を考慮）
# - start-period: 起動猶予時間（アプリケーション初期化を待つ）
# - retries: 失敗とみなすまでの試行回数

# 実行ユーザー - セキュリティの基本
USER node
# rootで実行しない理由：
# - コンテナ脱出時の被害限定
# - 最小権限の原則

# エントリーポイントとコマンド - 柔軟な実行制御
ENTRYPOINT ["node"]
CMD ["server.js"]
# ENTRYPOINTとCMDの使い分け：
# - ENTRYPOINT: 変更されない実行コマンド
# - CMD: デフォルト引数（上書き可能）
```

#### 5.1.2 高度な命令と最適化

**マルチステージビルドの革新的価値**

```dockerfile
# なぜマルチステージビルドが必要か
# 従来の問題：ビルドツールが本番イメージに含まれる
# - セキュリティリスク（コンパイラ、デバッグツール）
# - イメージサイズ肥大化（数GB）
# - 攻撃面の増大

# Stage 1: Dependencies - 依存関係の分離
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
# このステージの成果物：本番用node_modules

# Stage 2: Build - ビルドプロセスの分離
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci  # 開発依存関係も含めてインストール
COPY . .
RUN npm run build
# このステージの成果物：ビルド済みアプリケーション

# Stage 3: Runtime - 最小限の実行環境
FROM node:18-alpine AS runtime
RUN apk add --no-cache dumb-init  # PID 1問題の解決
WORKDIR /app

# セキュリティ: 非rootユーザー作成
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 前のステージから必要なものだけコピー
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

USER nodejs
EXPOSE 3000

# dumb-initを使う理由：
# - 適切なシグナルハンドリング
# - ゾンビプロセスの防止
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

# 結果：
# - 開発ツールなし = セキュア
# - 最小限の実行環境 = 50MB（元の1/20）
# - 高速な配布 = デプロイ時間短縮
```

**ビルドキャッシュ最適化**
```dockerfile
# 悪い例：キャッシュが効きにくい
COPY . .
RUN npm install

# 良い例：依存関係を先にコピー
COPY package*.json ./
RUN npm ci
COPY . .
```

#### 5.1.3 条件付きビルド

```dockerfile
# ビルド引数による条件分岐
ARG ENVIRONMENT=production

# 開発環境用の追加パッケージ
RUN if [ "$ENVIRONMENT" = "development" ]; then \
        apk add --no-cache \
            git \
            vim \
            curl; \
    fi

# 環境別設定ファイル
COPY config.$ENVIRONMENT.json /app/config.json
```

### 5.2 効率的なイメージ作成

#### 5.2.1 レイヤー最適化

**レイヤーの理解**
```bash
# レイヤー構造の可視化
podman history --no-trunc nginx:alpine

# レイヤーサイズの確認
podman images --tree
```

**最適化テクニック**
```dockerfile
# 悪い例：複数レイヤー
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y nginx
RUN apt-get clean

# 良い例：単一レイヤー
RUN apt-get update && \
    apt-get install -y \
        curl \
        nginx && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

#### 5.2.2 サイズ削減技術

**ベースイメージの選択**
```dockerfile
# サイズ比較
# debian:11        124MB
# ubuntu:22.04     77MB
# alpine:3.18      7MB
# distroless       2MB

# Distrolessイメージの使用
FROM gcr.io/distroless/nodejs18-debian11
COPY --from=builder /app/dist /app
WORKDIR /app
CMD ["index.js"]
```

**不要ファイルの除外**
```bash
# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
coverage/
.nyc_output/
*.test.js
```

#### 5.2.3 セキュリティベストプラクティス

**セキュアなイメージ作成**
```dockerfile
# 1. 最小権限の原則
FROM alpine:3.18
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 2. 機密情報の扱い（ビルド時シークレット）
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci --only=production

# 3. イメージスキャン用メタデータ
LABEL security.scan="required"
LABEL security.vulnerabilities="none"

# 4. 読み取り専用ファイルシステム
RUN chmod -R a-w /app

USER appuser
```

### 5.3 Buildahによる高度なイメージ作成

#### 5.3.1 Buildahの基本

```bash
# スクラッチからのイメージ作成
buildah from scratch
container=$(buildah from scratch)

# マウントとファイル操作
mountpoint=$(buildah mount $container)
cp -r ./app/* $mountpoint/
buildah umount $container

# 設定
buildah config --port 8080 $container
buildah config --entrypoint '["/app/server"]' $container

# コミット
buildah commit $container myapp:latest
```

#### 5.3.2 スクリプトによるイメージ作成

```bash
#!/bin/bash
# build-image.sh

set -e

# ベースコンテナ作成
container=$(buildah from alpine:3.18)
mountpoint=$(buildah mount $container)

# パッケージインストール
buildah run $container apk add --no-cache \
    python3 \
    py3-pip

# アプリケーションコピー
cp -r ./src $mountpoint/app

# Pythonパッケージインストール
buildah run $container pip3 install -r /app/requirements.txt

# 設定
buildah config --workingdir /app $container
buildah config --cmd "python3 server.py" $container
buildah config --port 5000 $container

# クリーンアップとコミット
buildah unmount $container
buildah commit $container myapp:$(date +%Y%m%d)
```

### 5.4 イメージレジストリ

#### 5.4.1 プライベートレジストリ構築

**基本的なレジストリ**
```bash
# レジストリコンテナ起動
podman run -d \
  --name registry \
  -p 5000:5000 \
  -v registry-data:/var/lib/registry \
  docker.io/registry:2

# HTTPS対応レジストリ
podman run -d \
  --name secure-registry \
  -p 443:443 \
  -v ./certs:/certs \
  -v registry-data:/var/lib/registry \
  -e REGISTRY_HTTP_ADDR=0.0.0.0:443 \
  -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/domain.crt \
  -e REGISTRY_HTTP_TLS_KEY=/certs/domain.key \
  registry:2
```

**認証付きレジストリ**
```bash
# htpasswd作成
htpasswd -Bbn testuser testpassword > htpasswd

# 認証付きレジストリ
podman run -d \
  --name auth-registry \
  -p 5000:5000 \
  -v ./htpasswd:/auth/htpasswd \
  -v registry-data:/var/lib/registry \
  -e REGISTRY_AUTH=htpasswd \
  -e REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd \
  -e REGISTRY_AUTH_HTPASSWD_REALM="Registry Realm" \
  registry:2
```

#### 5.4.2 レジストリ操作

**イメージのプッシュ/プル**
```bash
# タグ付け
podman tag myapp:latest localhost:5000/myapp:latest

# ログイン
podman login localhost:5000

# プッシュ
podman push localhost:5000/myapp:latest

# プル
podman pull localhost:5000/myapp:latest

# レジストリ内容確認
curl -X GET http://localhost:5000/v2/_catalog
curl -X GET http://localhost:5000/v2/myapp/tags/list
```

**レジストリミラーリング**
```bash
# Skopeoでのミラーリング
skopeo sync \
  --src docker \
  --dest docker \
  docker.io/library/nginx:latest \
  localhost:5000

# 一括同期
cat > sync.yaml << EOF
docker.io:
  images:
    library/nginx:
      - "latest"
      - "1.21"
    library/alpine:
      - "3.18"
EOF

skopeo sync --src yaml --dest docker sync.yaml localhost:5000
```

### 5.5 イメージの署名と検証

#### 5.5.1 GPG署名

```bash
# GPGキー生成
gpg --gen-key

# 署名ポリシー設定
cat > /etc/containers/policy.json << EOF
{
  "default": [{"type": "insecureAcceptAnything"}],
  "transports": {
    "docker": {
      "localhost:5000": [
        {
          "type": "signedBy",
          "keyType": "GPGKeys",
          "keyPath": "/etc/pki/rpm-gpg/mykey.pub"
        }
      ]
    }
  }
}
EOF

# イメージ署名
podman push --sign-by myemail@example.com localhost:5000/myapp:latest
```

### 演習問題

1. マルチステージビルドを使用して、Goアプリケーションの最小イメージを作成してください
2. Buildahスクリプトでカスタムイメージを作成してください
3. プライベートレジストリを構築し、署名付きイメージをプッシュしてください

---