---
layout: book
order: 18
title: "付録B：トラブルシューティングガイド"
---

# 付録B：トラブルシューティングガイド

本付録は、運用時の一次切り分けで頻出する確認ポイントと、詳細ガイドへの導線をまとめます。

- 詳細ガイド: [Podman実践的トラブルシューティングガイド](../../additional/troubleshooting-guide/)
- 参考: [Docker→Podman包括的移行ガイドライン](../../additional/migration-guide/)

## まず確認する（一次切り分け）

```bash
podman version
podman info
podman ps -a
podman logs <container>
podman inspect <container>
podman events --since 10m
```

## よくある原因（抜粋）

- 権限/SELinux: rootless/SELinux の影響でマウントや実行が失敗することがある
- ネットワーク: rootless のネットワーク実装（slirp4netns 等）や DNS 設定が原因になることがある
- レジストリ/認証: pull 失敗はレジストリ設定や認証、プロキシが原因になりやすい
- ストレージ/容量: イメージ/レイヤ増加で容量逼迫しやすい（`podman system df` で把握）

## エラーメッセージの扱い

- `podman` の出力に加え、必要に応じて `journalctl`（systemd 管理時）やアプリケーションログも併せて確認する

---
