---
layout: book
title: "Podman完全ガイド"
order: 0
---

# Podman完全ガイド

コンテナ技術の理論と実践 - エンタープライズ環境でのPodman活用法

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
- 既に Docker の利用経験があり Podman への移行や併用を検討している読者は、第1章での基礎整理を踏まえつつ、第2部（第6〜10章）のネットワーク・Pod・レジストリ・トラブルシューティングに重点を置く読み方も有効である。
- エンタープライズ環境や Kubernetes との統合を視野に入れている読者は、第3部（第11〜15章）を中心に読みつつ、必要に応じて基礎編・実践編の該当箇所を参照する形で活用することを想定している。
- すべての章を一度に読む必要はなく、まず自分のプロジェクト・業務で直面している課題に近い章から入り、後から不足している基礎を補っていく読み方を推奨する。

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
- [第10章：ログ管理とトラブルシューティング](chapters/chapter10/)

### 第3部: 応用編

- [第11章：Kubernetesとの統合](chapters/chapter11/)
- [第12章：CI/CDパイプラインの構築](chapters/chapter12/)
- [第13章：セキュリティとコンプライアンス](chapters/chapter13/)
- [第14章：パフォーマンスチューニング](chapters/chapter14/)
- [第15章：エンタープライズ環境での運用](chapters/chapter15/)

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
**🔓 教育・研究・個人学習での利用は自由** ですが、**💼 商用利用には事前許諾** が必要です。

📋 [詳細なライセンス条件](https://github.com/itdojp/it-engineer-knowledge-architecture/blob/main/LICENSE.md)

**お問い合わせ**  
株式会社アイティードゥ（ITDO Inc.）  
Email: [knowledge@itdo.jp](mailto:knowledge@itdo.jp)

---

Built with [book-formatter](https://github.com/itdojp/book-formatter)
{% include page-navigation.html %}
