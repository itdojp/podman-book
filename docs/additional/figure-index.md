---
layout: book
title: "図表索引"
---

# 図表索引

本索引は、公開本文で実際に参照される図表を横断して確認するための入口です。未参照の素材、資産管理用のファイル、および今後追加予定のスクリーンショットは掲載しません。

## [図1：コンテナ技術の構成概念]({{ '/chapters/chapter01/#figure-container-technology-concepts' | relative_url }})

- **掲載箇所**: 第1章
- **種別**: Mermaid
- **目的**: Docker と Podman の構成を比較する
- **見るべき点**: Podman がデーモンレスで、各コンテナをユーザー権限で管理する構成

## [図2：切り分けフロー]({{ '/additional/troubleshooting-guide/#figure-troubleshooting-flow' | relative_url }})

- **掲載箇所**: 実践的トラブルシューティングガイド
- **種別**: Mermaid
- **目的**: 障害発生時の初期切り分けを整理する
- **見るべき点**: 起動、ネットワーク、性能の順に確認し、原因領域を絞り込む流れ

## [図3：Podman確認画面]({{ '/chapters/chapter02/#figure-podman-verification-screen' | relative_url }})

- **掲載箇所**: 第2章
- **種別**: PNG
- **目的**: インストール後の基本動作確認の出力例を示す
- **見るべき点**: `podman --version`、`podman info`、`hello-world` の結果は環境により変わる点

## [図4：コンテナライフサイクル]({{ '/chapters/chapter04/#figure-container-lifecycle' | relative_url }})

- **掲載箇所**: 第4章
- **種別**: SVG
- **目的**: コンテナ状態と状態遷移を理解する
- **見るべき点**: Created、Running、Paused など各状態で可能な操作と復旧判断

## [図5：Podmanネットワーク]({{ '/chapters/chapter06/#figure-podman-network' | relative_url }})

- **掲載箇所**: 第6章
- **種別**: SVG
- **目的**: ネットワークドライバーの構成を把握する
- **見るべき点**: Bridge、Host、None、Macvlan の分離性と適用場面

## [図6：セキュリティ層]({{ '/chapters/chapter08/#figure-security-layers' | relative_url }})

- **掲載箇所**: 第8章
- **種別**: SVG
- **目的**: 多層防御を構成するセキュリティ機能を整理する
- **見るべき点**: Namespace、Capabilities、Seccomp、SELinux/AppArmor、ユーザー名前空間の役割

図表は本文の説明と併せて参照してください。図表単体は構成や判断の要点を示すものであり、設定値や操作手順の完全な代替ではありません。
