---
title: "第9章：レジストリとイメージ配布"
chapter: chapter09
---

# 第9章：レジストリとイメージ配布


イメージレジストリの構築と管理


## 概要

この章では以下の内容について説明します：



## 内容

### systemd 連携の現行方針

2026年5月23日時点の公式ドキュメントでは、`podman generate systemd` は deprecated です。
既存ユニットの読み解きや移行調査では有用ですが、新規運用は Quadlet（`.container` / `.pod` /
`.volume` / `.network` など）を優先してください。

```ini
# ~/.config/containers/systemd/myapp.container
[Unit]
Description=My Podman application
Wants=network-online.target
After=network-online.target

[Container]
Image=registry.example.com/team/myapp:1.0.0
ContainerName=myapp
PublishPort=8080:8080
Volume=myapp-data:/var/lib/myapp:Z

[Service]
Restart=on-failure
TimeoutStartSec=900

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user start myapp.service
systemctl --user status myapp.service
```

適用前には、image digest、registry 認証、公開ポート、SELinux ラベル、volume のバックアップ、
rollback 先イメージをレビューしてください。

## まとめ

（章のまとめをここに記載してください）

---

