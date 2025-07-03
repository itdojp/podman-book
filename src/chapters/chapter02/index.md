---
title: "第2章：Podmanのインストールと初期設定"
---

# 第2章：Podmanのインストールと初期設定

## 2.1 各OSへのインストール方法

### RHEL/CentOS/Fedora

```bash
# DNFを使用したインストール
sudo dnf install -y podman

# 関連ツールのインストール
sudo dnf install -y buildah skopeo

# バージョン確認
podman --version
```

### Ubuntu/Debian

```bash
# Ubuntu 20.10以降
sudo apt update
sudo apt install -y podman

# Ubuntu 20.04の場合（Kubicリポジトリを使用）
source /etc/os-release
echo "deb https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_${VERSION_ID}/ /" | sudo tee /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list
curl -L "https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_${VERSION_ID}/Release.key" | sudo apt-key add -
sudo apt update
sudo apt -y install podman
```

### macOS

```bash
# Homebrewを使用
brew install podman

# Podman machineの初期化
podman machine init
podman machine start

# 接続確認
podman info
```

### Windows

```powershell
# WSL2が必要
# PowerShellを管理者として実行
wsl --install

# WSL2内でLinuxディストリビューションをインストール後、
# 上記のLinux用手順に従ってインストール
```

## 2.2 初期設定

### 設定ファイルの場所

```bash
# システム全体の設定
/etc/containers/

# ユーザー別の設定
~/.config/containers/

# 主要な設定ファイル
registries.conf  # レジストリ設定
storage.conf     # ストレージ設定
policy.json      # セキュリティポリシー
```

### レジストリの設定

```bash
# /etc/containers/registries.conf
[registries.search]
registries = ['docker.io', 'quay.io', 'registry.fedoraproject.org']

[registries.insecure]
registries = []

[registries.block]
registries = []

# 認証情報の設定
podman login docker.io
podman login quay.io
```

### ストレージの設定

```bash
# ~/.config/containers/storage.conf
[storage]
driver = "overlay"
runroot = "/run/user/1000/containers"
graphroot = "/home/user/.local/share/containers/storage"

[storage.options]
size = "10G"
override_kernel_check = "true"
```

## 2.3 Rootlessモードの設定

### 前提条件の確認

```bash
# ユーザー名前空間の確認
sysctl kernel.unprivileged_userns_clone

# subuid/subgidの確認
grep $USER /etc/subuid
grep $USER /etc/subgid

# 必要に応じて追加
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $USER
```

### Rootless環境の初期化

```bash
# systemdユーザーセッションの有効化
systemctl --user enable --now podman.socket

# 環境変数の設定
echo 'export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock' >> ~/.bashrc

# cgroups v2の確認
podman info | grep -i cgroup
```

## 2.4 Docker互換性の設定

### Docker CLIの置き換え

```bash
# エイリアスの設定
echo 'alias docker=podman' >> ~/.bashrc
source ~/.bashrc

# Docker Composeの互換性
pip3 install podman-compose
alias docker-compose=podman-compose
```

### Docker APIソケットの有効化

```bash
# Rootlessモード
systemctl --user enable --now podman.socket

# Rootfulモード
sudo systemctl enable --now podman.socket

# ソケットの確認
curl --unix-socket /run/user/$(id -u)/podman/podman.sock http://localhost/v1.41/info
```

## 2.5 基本動作の確認

### Hello Worldコンテナの実行

```bash
# 基本的な実行
podman run hello-world

# Alpineコンテナでコマンド実行
podman run --rm alpine echo "Hello from Podman"

# インタラクティブモード
podman run -it --rm alpine /bin/sh
```

### イメージとコンテナの管理

```bash
# イメージの一覧
podman images

# コンテナの一覧
podman ps -a

# システム情報の確認
podman info

# ディスク使用量の確認
podman system df
```

## 2.6 トラブルシューティング

### よくある問題と解決方法

**1. "permission denied"エラー**
```bash
# SELinuxの確認
getenforce

# 一時的に無効化（テスト用）
sudo setenforce 0

# コンテキストの修正
sudo restorecon -R ~/.local/share/containers
```

**2. ネットワーク接続の問題**
```bash
# DNS設定の確認
podman run --rm alpine nslookup google.com

# ネットワークの再作成
podman network rm podman
podman network create podman
```

**3. ストレージ容量不足**
```bash
# 不要なイメージの削除
podman image prune -a

# 停止中のコンテナの削除
podman container prune

# システム全体のクリーンアップ
podman system prune -a
```

## まとめ

本章では、Podmanのインストールから初期設定、基本的な動作確認までを解説しました。特にRootlessモードの設定とDocker互換性の確保は、Podmanを効果的に活用する上で重要なポイントです。

次章では、Podmanを使った基本的なコンテナ操作について詳しく解説していきます。