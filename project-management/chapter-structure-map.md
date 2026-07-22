# 章構成の正本マップ

Issue #207で確定した、公開版15章の構成契約です。章URLは変更せず、各章の現行本文で中心となっている主題に章名と導線を合わせます。

## 正本と同期対象

- 章の順序、path、title、descriptionの正本は`book-config.json`です。
- `book-formatter-config.json`、章front matter、章H1、`docs/index.md`、`docs/_data/navigation.yml`は正本と一致させます。
- `docs/additional/learning-path.md`と章間リンクは、参照先の正本章名を使用します。
- `docs/assets/images/screenshots/CHECKLIST.md`は`chapterNN`を不変の主キーとし、見出しと候補画面を本文主題へ合わせます。
- `scripts/check-chapter-structure.js`が、これらの同期と本文主要節をfail-closedで検査します。

## 第1〜15章

| ID | 正本章名 | 本文主要節 | path | #207での決定 |
|---|---|---|---|---|
| chapter01 | 第1章：コンテナ技術の基礎 | Linux名前空間、cgroups、Podmanアーキテクチャ | `/chapters/chapter01/` | 維持 |
| chapter02 | 第2章：Podmanのインストールと初期設定 | OS別インストール、初期設定、基本動作確認 | `/chapters/chapter02/` | 維持 |
| chapter03 | 第3章：ホスト設定とRootless環境の最適化 | カーネルパラメータ、UID/GID、storage、network、cgroups v2 | `/chapters/chapter03/` | 本文主題へ改名 |
| chapter04 | 第4章：コンテナの基本操作とイメージ管理 | lifecycle、run/exec/cp、image、log、基本診断 | `/chapters/chapter04/` | 本文主題へ改名 |
| chapter05 | 第5章：Containerfileとイメージビルド・配布 | Containerfile、multi-stage build、Buildah、registry、署名 | `/chapters/chapter05/` | 本文主題へ改名 |
| chapter06 | 第6章：ネットワークとストレージ管理 | network、port、volume、永続化 | `/chapters/chapter06/` | 本文主題を包含する名称へ改名 |
| chapter07 | 第7章：Pod機能と複数コンテナ管理 | Pod、複数container、Kubernetes YAML | `/chapters/chapter07/` | 維持 |
| chapter08 | 第8章：コンテナセキュリティとRootless運用 | Rootless、capabilities、seccomp、SELinux、image security | `/chapters/chapter08/` | 本文主題へ改名 |
| chapter09 | 第9章：systemd・Quadletと本番運用 | systemd、Quadlet、自動更新、backup、monitoring | `/chapters/chapter09/` | 本文主題へ改名 |
| chapter10 | 第10章：CI/CDパイプラインの実践 | GitLab CI、GitHub Actions、Jenkins、test、deployment | `/chapters/chapter10/` | 維持 |
| chapter11 | 第11章：Kubernetesとの統合 | Kubernetes YAMLの実行・生成、移行、CRI-O | `/chapters/chapter11/` | 維持 |
| chapter12 | 第12章：パフォーマンスチューニング | CPU、memory、network、storageの計測と最適化 | `/chapters/chapter12/` | 維持 |
| chapter13 | 第13章：マイクロサービスアーキテクチャ | service分割、service mesh、trace、resilience | `/chapters/chapter13/` | 維持 |
| chapter14 | 第14章：エンタープライズ環境での活用 | security、compliance、HA/DR、既存system統合 | `/chapters/chapter14/` | 維持 |
| chapter15 | 第15章：トラブルシューティング完全ガイド | 診断原則、典型障害、debug、復旧自動化 | `/chapters/chapter15/` | 維持 |

## 変更順序

1. 本マップと章構造QAを先に確定する。
2. Issue #189では本マップのpathとscreenshot checklistを使用して画像を取得する。
3. 画像取得PRでは章名、本文構造、learning pathを再変更しない。
