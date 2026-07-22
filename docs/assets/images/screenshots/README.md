# docs/assets/images/screenshots/

本ディレクトリには、本文で参照するスクリーンショット（ターミナル/GUI/Web UI 等）を配置します。

Issue:
- 図表強化の候補一覧: Issue #180
- 章別チェックリスト（実装状況と追加候補）: [CHECKLIST.md](./CHECKLIST.md)

公開中の画像、撮影日、環境、version、mask項目、SHA-256は[manifest.json](./manifest.json)を正本とします。`npm run check:screenshots`は、15章のPNG、hash、重複、本文参照、alt/caption、provenance、既知の機微情報markerをfail-closedで検証します。

## 方針（要点）

- スクリーンショットは「実行すると何が表示されるか」「どこを見るか」を補助する目的で追加する（一次情報は code block を維持）。
- UI は変更に弱いので、**キャプションに前提（OS/Podman/関連ツールのバージョン）**を短く併記する。
- **秘匿情報は必ずマスク**する（トークン/認証情報/実ホスト名/IP/社内URL/メール等）。
- 実commandまたは公開Web UIの出力だけを使用し、実行できない環境のstatusを合成しない。環境制約はcaptionへ明記する。
- 一般的な画像/スクリーンショットのガイドライン（圧縮目標・sRGB カラープロファイル・アクセシビリティ/alt テキスト など）は `docs/assets/images/README-IMAGES.md` を**正として**従う（本 README はスクリーンショット固有の追加ルールのみを記載）。

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
![podman のバージョン確認（例: Podman 5.x）](../../assets/images/screenshots/chapter02/01-podman-version.png)
```
