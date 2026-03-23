---
layout: book
order: 18
title: "付録B：トラブルシューティングガイド"
---

# 付録B：トラブルシューティングガイド

本付録は、運用時の一次切り分けで頻出する確認ポイントと、詳細ガイドへの導線をまとめます。Podman で問題が起きた場合は、まず本付録から確認してください。

## 症状別の入口

- インストールや初期設定で詰まった場合: [第2章：Podmanのインストールと初期設定](../../chapters/chapter02/)
- 起動失敗、権限エラー、ネットワーク、ストレージ容量などの日常運用トラブル: [Podman実践的トラブルシューティングガイド](../../additional/troubleshooting-guide/)
- レジストリ認証やイメージ配布に起因する問題: [第9章：レジストリとイメージ配布](../../chapters/chapter09/)
- systemd 管理や本番運用時の深掘り: [第15章：トラブルシューティング完全ガイド](../../chapters/chapter15/)
- コマンドの意味や引数を確認したい場合: [付録A：コマンドリファレンス](../appendix-a/)
- Docker からの移行起因の差分確認: [Docker→Podman包括的移行ガイドライン](../../additional/migration-guide/)

## まず確認する（一次切り分け）

```bash
podman version
podman info
podman ps -a
podman logs <container>
podman inspect <container>
podman events --since 10m
```

必要に応じて、systemd 管理時は `journalctl`、rootless 実行時はユーザーセッション側のログも併せて確認します。

## よくある原因（抜粋）

- 権限/SELinux: rootless/SELinux の影響でマウントや実行が失敗することがある
- ネットワーク: rootless のネットワーク実装（slirp4netns 等）や DNS 設定が原因になることがある
- レジストリ/認証: pull 失敗はレジストリ設定や認証、プロキシが原因になりやすい
- ストレージ/容量: イメージ/レイヤ増加で容量逼迫しやすい（`podman system df` で把握）

## エラーメッセージの扱い

- `podman` の出力に加え、必要に応じて `journalctl`（systemd 管理時）やアプリケーションログも併せて確認する
- 詳細な切り分け手順とチェックリストは [Podman実践的トラブルシューティングガイド](../../additional/troubleshooting-guide/) を参照する

---
