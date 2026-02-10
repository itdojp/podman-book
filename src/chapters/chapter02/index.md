---
title: "第4章：Podmanのインストールと初期設定"
---

# 第4章：Podmanのインストールと初期設定

## 対象バージョン
- **Podman**: 5.0.x（2024年3月リリース）
- **動作確認OS**: RHEL 9.3、Ubuntu 22.04 LTS、CentOS Stream 9、Fedora 39
- **前提条件**: Linux Kernel 4.18+、cgroup v2対応、systemd 239+（rootless時）

## 2.1 自動インストールスクリプト

手動でのインストールはエラーが発生しやすく、環境によって手順が異なります。以下の自動化スクリプトを使用することで、確実にインストールと設定を完了できます。

```bash
#!/bin/bash
# install-podman.sh - Podman自動インストール・設定スクリプト
# 使用方法: curl -L https://example.com/install-podman.sh | bash

set -e  # エラー時に終了

echo "============================================"
echo "Podman 自動インストールスクリプト v1.0"
echo "============================================"

# OS検出
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    elif [ -f /etc/redhat-release ]; then
        OS="rhel"
        VER=$(rpm -q --queryformat '%{VERSION}' redhat-release)
    else
        echo "エラー: サポートされていないOSです"
        exit 1
    fi
}

# インストール関数
install_podman() {
    case $OS in
        rhel|centos|fedora)
            echo "Red Hat系ディストリビューションを検出しました"
            sudo dnf install -y podman buildah skopeo
            ;;
        ubuntu|debian)
            echo "Debian系ディストリビューションを検出しました"
            sudo apt update
            sudo apt install -y podman buildah skopeo
            ;;
        *)
            echo "エラー: 未サポートのOS: $OS"
            exit 1
            ;;
    esac
}

# 基本設定
setup_podman() {
    echo "基本設定を適用中..."
    
    # システム設定ディレクトリ作成
    sudo mkdir -p /etc/containers
    
    # cgroup v2 最適化
    if [ ! -f /etc/default/grub.bak ]; then
        sudo cp /etc/default/grub /etc/default/grub.bak
        echo 'systemd.unified_cgroup_hierarchy=1' | sudo tee -a /etc/default/grub
        sudo grub2-mkconfig -o /boot/grub2/grub.cfg 2>/dev/null || true
    fi
    
    # システム移行
    podman system migrate || true
    
    # rootless用設定
    systemctl --user enable --now podman.socket || true
}

# 検証テスト
verify_installation() {
    echo "インストールの検証中..."
    
    # バージョン確認
    podman --version
    
    # hello-worldテスト
    podman run --rm hello-world
    
    if [ $? -eq 0 ]; then
        echo "✅ Podmanが正常にインストールされました！"
    else
        echo "❌ インストールに問題があります"
        exit 1
    fi
}

# メイン処理
detect_os
install_podman
setup_podman
verify_installation

echo ""
echo "インストールが完了しました！"
echo "次のコマンドでPodmanを使い始められます:"
echo "  podman run -it alpine sh"
```

## 2.2 各OSへのインストール方法（手動）

### RHEL/CentOS/Fedora

```bash
# DNFを使用したインストール（Podman 5.0.x）
sudo dnf install -y podman

# 関連ツールのインストール
sudo dnf install -y buildah skopeo podman-compose

# バージョン確認と動作テスト
podman --version
# 期待される出力: podman version 5.0.x

# 基本的な動作確認
podman run --rm hello-world
# コンテナが正常に実行され、メッセージが表示されることを確認
```

### Ubuntu

```bash
# Ubuntu 22.04/24.04でのインストール（公式リポジトリ）
sudo apt update
sudo apt install -y podman
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

## 2.3 初期設定

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

## 2.4 Rootlessモードの設定

### 前提条件の確認

> **注意（OS設定の変更について）**
> - `/etc/subuid`・`/etc/subgid` の設定変更は、ユーザー名前空間のマッピングに影響します。誤設定すると rootless 実行ができなくなったり、既存のコンテナ環境に影響が出る可能性があります。
> - まずは検証環境で試し、必要に応じて設定ファイルのバックアップを取得したうえで変更してください。

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

## 2.5 Docker互換性の設定

### Docker CLIの置き換え

```bash
# エイリアスの設定
echo 'alias docker=podman' >> ~/.bashrc
source ~/.bashrc

# Docker Compose（docker compose）の互換性（Composeファイル）
pip3 install podman-compose

# docker-compose.yml があるディレクトリで実行するか、-f で Compose ファイルを明示的に指定する
cd /path/to/project
podman-compose -f docker-compose.yml up -d
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

## 2.6 基本動作の確認

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

## 2.7 トラブルシューティング

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

## インストール後の検証チェックリスト

インストール完了後、以下の項目を確認してください：

```bash
#!/bin/bash
# インストール検証スクリプト

echo "✓ Podmanバージョン確認"
podman --version

echo "✓ システム情報"
podman info --format json | jq '.version, .kernel, .os'

echo "✓ cgroupバージョン"
podman info | grep -i cgroup

echo "✓ rootless動作確認"
if podman info | grep -q "rootless: true"; then
    echo "  Rootlessモードで動作中"
else
    echo "  Rootモードで動作中"
fi

echo "✓ ネットワーク接続"
podman run --rm alpine ping -c 1 google.com

echo "✓ ストレージ状態"
podman system df

echo "✓ Docker互換ソケット"
if systemctl --user is-active podman.socket >/dev/null 2>&1; then
    echo "  Podmanソケットが有効"
fi
```

## まとめ

本章では、Podman 5.0.xのインストールから初期設定、基本的な動作確認までを解説しました。特に以下のポイントが重要です：

- **自動化スクリプトの活用**: 環境構築の再現性を確保
- **Rootlessモードの設定**: セキュリティを強化
- **Docker互換性の確保**: 既存資産の活用
- **検証テストの実施**: 正常動作の確認

次章では、Podmanを使った基本的なコンテナ操作について詳しく解説していきます。
