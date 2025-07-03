---
title: "付録A：コマンドリファレンス"
---

# 付録A：コマンドリファレンス

## 基本コマンド

### コンテナ管理

```bash
# コンテナの実行
podman run [OPTIONS] IMAGE [COMMAND]

# コンテナの一覧表示
podman ps [OPTIONS]

# コンテナの停止
podman stop [OPTIONS] CONTAINER

# コンテナの削除
podman rm [OPTIONS] CONTAINER

# コンテナへの接続
podman exec [OPTIONS] CONTAINER COMMAND

# コンテナのログ確認
podman logs [OPTIONS] CONTAINER
```

### イメージ管理

```bash
# イメージの取得
podman pull [OPTIONS] IMAGE

# イメージの一覧表示
podman images [OPTIONS]

# イメージのビルド
podman build [OPTIONS] PATH

# イメージのタグ付け
podman tag SOURCE_IMAGE TARGET_IMAGE

# イメージの削除
podman rmi [OPTIONS] IMAGE

# イメージのプッシュ
podman push [OPTIONS] IMAGE
```

### ボリューム管理

```bash
# ボリュームの作成
podman volume create [OPTIONS] [VOLUME]

# ボリュームの一覧表示
podman volume ls [OPTIONS]

# ボリュームの詳細表示
podman volume inspect [OPTIONS] VOLUME

# ボリュームの削除
podman volume rm [OPTIONS] VOLUME

# ボリュームのプルーニング
podman volume prune [OPTIONS]
```

### ネットワーク管理

```bash
# ネットワークの作成
podman network create [OPTIONS] NETWORK

# ネットワークの一覧表示
podman network ls [OPTIONS]

# ネットワークの詳細表示
podman network inspect [OPTIONS] NETWORK

# ネットワークの削除
podman network rm [OPTIONS] NETWORK

# ネットワークへの接続
podman network connect [OPTIONS] NETWORK CONTAINER

# ネットワークからの切断
podman network disconnect [OPTIONS] NETWORK CONTAINER
```

## よく使うオプション

### podman run オプション

| オプション | 説明 | 例 |
|-----------|――――|――――|
| `-d, --detach` | バックグラウンドで実行 | `podman run -d nginx` |
| `-i, --interactive` | 標準入力を開く | `podman run -i alpine` |
| `-t, --tty` | 擬似TTYを割り当て | `podman run -it alpine sh` |
| `--rm` | 終了時に自動削除 | `podman run --rm alpine` |
| `-p, --publish` | ポートマッピング | `podman run -p 8080:80 nginx` |
| `-v, --volume` | ボリュームマウント | `podman run -v /host:/container alpine` |
| `-e, --env` | 環境変数設定 | `podman run -e VAR=value alpine` |
| `--name` | コンテナ名設定 | `podman run --name myapp nginx` |
| `-m, --memory` | メモリ制限 | `podman run -m 512m alpine` |
| `--cpus` | CPU制限 | `podman run --cpus 0.5 alpine` |

### podman build オプション

| オプション | 説明 | 例 |
|-----------|――――|――――|
| `-t, --tag` | イメージタグ | `podman build -t myapp:latest .` |
| `-f, --file` | Dockerfile指定 | `podman build -f custom.dockerfile .` |
| `--no-cache` | キャッシュ無効化 | `podman build --no-cache .` |
| `--pull` | 最新ベースイメージ取得 | `podman build --pull .` |
| `--build-arg` | ビルド引数 | `podman build --build-arg VERSION=1.0 .` |

## systemd統合

### ユニットファイルの生成

```bash
# 既存コンテナからユニットファイル生成
podman generate systemd --name CONTAINER > container.service

# 新規コンテナ用ユニットファイル生成
podman generate systemd --new --name CONTAINER > container.service

# ファイルオプション付き
podman generate systemd --files --name CONTAINER
```

### systemdサービス管理

```bash
# ユーザーサービスとして登録
systemctl --user daemon-reload
systemctl --user enable container.service
systemctl --user start container.service

# システムサービスとして登録（root）
sudo systemctl daemon-reload
sudo systemctl enable container.service
sudo systemctl start container.service
```

## Pod管理

```bash
# Podの作成
podman pod create --name mypod

# Pod内でコンテナ実行
podman run --pod mypod -d nginx
podman run --pod mypod -d redis

# Podの状態確認
podman pod ps
podman pod inspect mypod

# Podの停止・削除
podman pod stop mypod
podman pod rm mypod
```

## トラブルシューティング用コマンド

```bash
# システム情報表示
podman info

# バージョン確認
podman version

# イベント監視
podman events

# システムプルーニング
podman system prune -a

# リセット（全削除）
podman system reset

# デバッグログ有効化
podman --log-level=debug run alpine
```