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

## [図7：daemonless実行境界]({{ '/chapters/chapter01/#figure-daemonless-process-audit' | relative_url }})

- **掲載箇所**: 第1章
- **種別**: PNG
- **目的**: Podmanのlocal process modelとrootless実行境界を確認する
- **見るべき点**: 常駐daemonの有無、remote service、OCI runtime、Podman version

## [図8：rootless UID mapping]({{ '/chapters/chapter03/#figure-rootless-uid-mapping' | relative_url }})

- **掲載箇所**: 第3章
- **種別**: PNG
- **目的**: host UIDとcontainer内UIDの対応を確認する
- **見るべき点**: UID 0の対応先とsubuid range

## [図9：image pull inventory]({{ '/chapters/chapter04/#figure-image-pull-inventory' | relative_url }})

- **掲載箇所**: 第4章
- **種別**: PNG
- **目的**: pull結果とlocal image inventoryを対応付ける
- **見るべき点**: repository、tag、短縮ID、size

## [図10：Containerfile build]({{ '/chapters/chapter05/#figure-containerfile-build' | relative_url }})

- **掲載箇所**: 第5章
- **種別**: PNG
- **目的**: Containerfileのstageとbuild結果を対応付ける
- **見るべき点**: stage、commit、生成tag、container実行結果

## [図11：port・volume verification]({{ '/chapters/chapter06/#figure-port-volume-verification' | relative_url }})

- **掲載箇所**: 第6章
- **種別**: PNG
- **目的**: port公開とvolume永続性を確認する
- **見るべき点**: host/container port、HTTP status、volume driver、再作成後のdata

## [図12：Pod membership]({{ '/chapters/chapter07/#figure-pod-membership' | relative_url }})

- **掲載箇所**: 第7章
- **種別**: PNG
- **目的**: Podと配下containerの所属関係を確認する
- **見るべき点**: Pod名、status、container数、container側のPod名

## [図13：rootless capability boundary]({{ '/chapters/chapter08/#figure-rootless-capability-boundary' | relative_url }})

- **掲載箇所**: 第8章
- **種別**: PNG
- **目的**: rootless、seccomp、capabilityの適用境界を確認する
- **見るべき点**: host security modeと`CapEff`の値

## [図14：Quadlet generated unit]({{ '/chapters/chapter09/#figure-quadlet-generated-unit' | relative_url }})

- **掲載箇所**: 第9章
- **種別**: PNG
- **目的**: Quadlet定義から生成されるsystemd unitを確認する
- **見るべき点**: image、container name、port、restartの反映とdry-run境界

## [図15：GitHub Actions summary]({{ '/chapters/chapter10/#figure-actions-workflow-summary' | relative_url }})

- **掲載箇所**: 第10章
- **種別**: PNG
- **目的**: workflow runのcommit、job、artifactを対応付ける
- **見るべき点**: run status、対象commit、job conclusion、artifact

## [図16：Kubernetes YAML round trip]({{ '/chapters/chapter11/#figure-kube-round-trip' | relative_url }})

- **掲載箇所**: 第11章
- **種別**: PNG
- **目的**: Podman PodとKubernetes YAMLの往復を確認する
- **見るべき点**: YAML構造、down・play、最終Pod status

## [図17：performance baseline]({{ '/chapters/chapter12/#figure-performance-baseline' | relative_url }})

- **掲載箇所**: 第12章
- **種別**: PNG
- **目的**: tuning前の測定baselineを記録する
- **見るべき点**: 起動時間、image sizeと測定条件の限界

## [図18：service network health]({{ '/chapters/chapter13/#figure-service-network-health' | relative_url }})

- **掲載箇所**: 第13章
- **種別**: PNG
- **目的**: 複数serviceのnetworkとhealthを対応付ける
- **見るべき点**: service、container status、private network、health

## [図19：compliance・availability]({{ '/chapters/chapter14/#figure-compliance-availability' | relative_url }})

- **掲載箇所**: 第14章
- **種別**: PNG
- **目的**: 検証用policyと2 replicaの可用性を同時に確認する
- **見るべき点**: health、read-only、effective capability、no-new-privileges、available replica数

## [図20：failure diagnosis・recovery]({{ '/chapters/chapter15/#figure-failure-diagnosis-recovery' | relative_url }})

- **掲載箇所**: 第15章
- **種別**: PNG
- **目的**: 実際のport競合から復旧までの根拠を対応付ける
- **見るべき点**: failure、event、owner/candidate state、復旧後HTTP status

図表は本文の説明と併せて参照してください。図表単体は構成や判断の要点を示すものであり、設定値や操作手順の完全な代替ではありません。
