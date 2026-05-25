---
layout: book
title: "Podman完全ガイド"
description: "コンテナ技術の理論と実践 - エンタープライズ環境でのPodman活用法"
author: "株式会社アイティードゥ"
version: "1.0.0"
permalink: /
order: 0
---

# Podman完全ガイド

コンテナ技術の理論と実践 - エンタープライズ環境での Podman 活用法

## 概要

本書は、コンテナ技術の基礎から実践的な活用方法まで、Podmanを中心に体系的に解説する技術書です。初心者から上級者まで、段階的に学習できる構成となっています。

## 想定読者

- コンテナ技術を基礎から学びたいエンジニア
- DockerからPodmanへの移行を検討している方
- エンタープライズ環境でコンテナを活用したい方
- セキュアなコンテナ環境を構築したい方

## 学習成果

- コンテナ技術の基本概念と Podman の特徴を理解し、Docker との違いを説明したうえで適切に使い分けられるようになる。
- 単一コンテナの操作から Pod 機能を用いた複数コンテナの管理、イメージのビルド・配布まで、一通りの運用フローをコマンドレベルで実践できるようになる。
- ネットワーキング、ストレージ、ログ、セキュリティ設定など、エンタープライズ環境で Podman を運用する際に必要な観点を押さえた構成設計ができるようになる。
- Kubernetes や CI/CD、ガバナンスといった上位レイヤーとの連携を見据えたアーキテクチャのイメージを持ち、自組織のコンテナ戦略を検討するための材料を得られるようになる。

## 読み方ガイド

- コンテナ技術そのものが初めての読者は、第1部（第1〜5章）を順に読み、基礎概念と Podman の基本操作、イメージ管理・ストレージ周りまでを一通り体験することを推奨する。
- 既に Docker の利用経験があり Podman への移行や併用を検討している読者は、第1章での基礎整理を踏まえつつ、第2部（第6〜10章）のネットワーク・Pod・レジストリ・CI/CDに重点を置き、障害対応時は [付録B：トラブルシューティングガイド](appendices/appendix-b/) を併用する読み方が有効である。
- エンタープライズ環境や Kubernetes との統合を視野に入れている読者は、第3部（第11〜15章）を中心に読みつつ、必要に応じて基礎編・実践編の該当箇所を参照する形で活用することを想定している。
- すべての章を一度に読む必要はなく、まず自分のプロジェクト・業務で直面している課題に近い章から入り、後から不足している基礎を補っていく読み方を推奨する。

## 目的別の入口

- **初学者向けの最短ルート**: [はじめに]({{ '/introduction/' | relative_url }}) → [第1章：コンテナ技術の基礎]({{ '/chapters/chapter01/' | relative_url }}) → [第3章：基本的なコンテナ操作]({{ '/chapters/chapter03/' | relative_url }}) → [付録A：コマンドリファレンス]({{ '/appendices/appendix-a/' | relative_url }})
- **Docker からの移行を先に確認したい場合**: [Docker→Podman包括的移行ガイドライン]({{ '/additional/migration-guide/' | relative_url }}) → [第7章：Pod機能と複数コンテナ管理]({{ '/chapters/chapter07/' | relative_url }}) → [第10章：CI/CDパイプラインの実践]({{ '/chapters/chapter10/' | relative_url }})
- **障害対応を優先したい場合**: [付録B：トラブルシューティングガイド]({{ '/appendices/appendix-b/' | relative_url }}) → [Podman実践的トラブルシューティングガイド]({{ '/additional/troubleshooting-guide/' | relative_url }}) → [第15章：トラブルシューティング完全ガイド]({{ '/chapters/chapter15/' | relative_url }})
- **企業導入の論点を先に確認したい場合**: [エンタープライズ環境でのPodman要件詳細]({{ '/additional/enterprise-requirements/' | relative_url }}) → [第14章：エンタープライズ環境での活用]({{ '/chapters/chapter14/' | relative_url }}) → [付録C：リソース集]({{ '/appendices/appendix-c/' | relative_url }})

## 安全に使うための注意

- rootless と rootful では扱える機能、必要権限、ホストへの影響範囲が異なります。本文のコマンドを実行する前に、自分の検証環境がどちらの前提かを確認してください。
- ネットワーク設定、ストレージ設定、systemd 連携、レジストリ設定はホスト側の状態を変える場合があります。共有環境や本番環境ではなく、まずは使い捨て可能な検証環境で試すことを推奨します。
- `sudo` や `--tls-verify=false` を含む例は、恒久設定ではなく切り分けや限定的な検証を想定しています。実運用では信頼済みレジストリ、証明書検証、監査可能な設定を優先してください。
- `podman system prune` やストレージ削除系のコマンドは、未使用リソースだけでなく必要なイメージやキャッシュも失う可能性があります。実行前にバックアップ、影響範囲、ロールバック手順を確認してください。

## 実務適用前の Podman 運用レビューゲート

Podman の検証結果を本番運用へ移す前に、少なくとも以下の判断根拠を PR、ADR、Runbook、
または変更管理チケットへ残します。

- 実行モード: rootless / rootful の選択理由、`/etc/subuid`・`/etc/subgid`、SELinux、cgroup v2、linger の要否。
- ネットワーク: rootless ネットワークの実装差、公開ポート、DNS、host network 利用、コンテナ間通信、ファイアウォール影響。
- ストレージ: named volume / bind mount の所有権、SELinux ラベル、バックアップ、復旧手順、廃棄時のデータ削除範囲。
- イメージとレジストリ: digest 固定、署名/検証、認証情報、`--tls-verify=false` の禁止または例外承認。
- systemd 連携: 新規運用は Quadlet を優先し、既存の `podman generate systemd` 由来ユニットは移行計画を用意する。
- 変更と復旧: `podman info`、`podman inspect`、Quadlet定義、unit状態、ロールバック対象イメージ、ログ取得先を保存する。

2026年5月23日時点では、rootless の前提は
[Podman rootless tutorial](https://github.com/containers/podman/blob/main/docs/tutorials/rootless_tutorial.md)、
systemd 連携は
[podman-systemd.unit / Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
を一次情報として確認します。`podman generate systemd` は
[公式リファレンス](https://docs.podman.io/en/latest/markdown/podman-generate-systemd.1.html)
で deprecated と明記されているため、新規設計では互換・既存調査用途に限定して扱います。

## 本書の構成

### 第1部: 基礎編（第1章〜第5章）
コンテナ技術の基本概念からPodmanの基本操作まで

### 第2部: 実践編（第6章〜第10章）
実際の開発・運用で必要となる実践的な技術

### 第3部: 応用編（第11章〜第15章）
エンタープライズ環境での高度な活用方法

## 前提知識
- Linux の基本操作（ターミナル、権限、ファイル操作）
- コンテナの基本概念（イメージ/コンテナ、ネットワーク/ボリュームの概要）
- （推奨）Docker の利用経験（Docker と Podman の差分理解が進みやすい）

## 所要時間
- 通読: 約1.5〜2時間（本文量ベース概算。コードブロック除外、400〜600文字/分換算）
- コマンドを実行しながら進める場合は、環境と演習範囲により変動します。

## 目次

- [はじめに](introduction/)

### 第1部: 基礎編

- [第1章：コンテナ技術の基礎](chapters/chapter01/)
- [第2章：Podmanのインストールと初期設定](chapters/chapter02/)
- [第3章：基本的なコンテナ操作](chapters/chapter03/)
- [第4章：イメージの管理と作成](chapters/chapter04/)
- [第5章：ストレージとボリューム管理](chapters/chapter05/)

### 第2部: 実践編

- [第6章：ネットワーキングとポート管理](chapters/chapter06/)
- [第7章：Pod機能と複数コンテナ管理](chapters/chapter07/)
- [第8章：Dockerfileの作成と最適化](chapters/chapter08/)
- [第9章：レジストリとイメージ配布](chapters/chapter09/)
- [第10章：CI/CDパイプラインの実践](chapters/chapter10/)

### 第3部: 応用編

- [第11章：Kubernetesとの統合](chapters/chapter11/)
- [第12章：パフォーマンスチューニング](chapters/chapter12/)
- [第13章：マイクロサービスアーキテクチャ](chapters/chapter13/)
- [第14章：エンタープライズ環境での活用](chapters/chapter14/)
- [第15章：トラブルシューティング完全ガイド](chapters/chapter15/)

### 付録

- [付録A：コマンドリファレンス](appendices/appendix-a/)
- [付録B：トラブルシューティングガイド](appendices/appendix-b/)
- [付録C：リソース集](appendices/appendix-c/)

- [あとがき](afterword/)

## 著者について

**太田和彦（株式会社アイティードゥ）**

- Email: [knowledge@itdo.jp](mailto:knowledge@itdo.jp)
- GitHub: [@itdojp](https://github.com/itdojp)
- Website: [https://www.itdo.jp](https://www.itdo.jp)

## ライセンス

本書は **Creative Commons BY-NC-SA 4.0** ライセンスで公開されています。
教育・研究・個人学習での利用は自由ですが、商用利用には事前許諾が必要です。

[詳細なライセンス条件](https://github.com/itdojp/podman-book/blob/main/LICENSE.md)

## 利用と更新情報

- 公開版: [GitHub Pages](https://itdojp.github.io/podman-book/)
- リポジトリ: [GitHub Repository](https://github.com/itdojp/podman-book)
- 版情報と同期状況は [book-config.json](https://github.com/itdojp/podman-book/blob/main/book-config.json) と GitHub の最新履歴を正としてください。
- 版差確認: [コミット履歴](https://github.com/itdojp/podman-book/commits/main/) / [PR 一覧](https://github.com/itdojp/podman-book/pulls)
- 参考資料: [付録C：リソース集]({{ '/appendices/appendix-c/' | relative_url }})

Podman、OCI ランタイム、Linux ディストリビューションのパッケージ、Kubernetes 連携周辺の仕様は更新されます。実務で適用するときは、本書の説明だけで完結させず、利用中の OS / Podman バージョンと公式ドキュメント、リポジトリの最新差分を確認してください。

**お問い合わせ**
株式会社アイティードゥ（ITDO Inc.）
Email: [knowledge@itdo.jp](mailto:knowledge@itdo.jp)

---

Built with [book-formatter](https://github.com/itdojp/book-formatter)
{% include page-navigation.html %}
