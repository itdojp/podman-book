# docs/assets/images/screenshots/

本ディレクトリには、本文で参照するスクリーンショット（ターミナル/GUI/Web UI 等）を配置します。

Issue:
- 図表強化の候補一覧: Issue #180

## 方針（要点）

- スクリーンショットは「実行すると何が表示されるか」「どこを見るか」を補助する目的で追加する（一次情報は code block を維持）。
- UI は変更に弱いので、**キャプションに前提（OS/Podman/関連ツールのバージョン）**を短く併記する。
- **秘匿情報は必ずマスク**する（トークン/認証情報/実ホスト名/IP/社内URL/メール等）。

## 配置と命名（推奨）

- 配置: `docs/assets/images/screenshots/chapterXX/`（章ごと）
  - 例: `docs/assets/images/screenshots/chapter03/`
- 形式: PNG
- 命名: `NN-<slug>.png`
  - `NN`: 2桁（章内の並び順）
  - `slug`: 英小文字の kebab-case
  - 例: `01-podman-version.png`

## 本文からの参照例

```md
![podman のバージョン確認（例: Podman 5.x）]({{ '/assets/images/screenshots/chapter02/01-podman-version.png' | relative_url }})
```

