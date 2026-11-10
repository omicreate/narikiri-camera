# 使っている部品と ライセンス

| 部品 | 置き場所 | ライセンス | 出どころ |
|---|---|---|---|
| MediaPipe Tasks Vision 1.1.1(顔認識ライブラリ) | `vendor/mediapipe/` | Apache License 2.0(`vendor/mediapipe/LICENSE`) | https://www.npmjs.com/package/@mediapipe/tasks-vision |
| Face Landmarker モデル | `models/face_landmarker.task` | Apache License 2.0(`models/LICENSE`) | https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker |
| Selfie Segmenter モデル | `models/selfie_segmenter.tflite` | Apache License 2.0(`models/LICENSE`) | https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter |
| Zen Maru Gothic(文字) | Google Fonts から読み込み | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Zen+Maru+Gothic |

## 確かめたこと(2026-11-10)

- ライブラリ: npm の表記は `Apache-2.0`。同梱の5ファイル(`vision_bundle.js` は npm の `vision_bundle.mjs` の名前を変えただけ)は、npm の配布物 `@mediapipe/tasks-vision@1.1.1` と中身が同じ(sha256 が一致)。
- モデル2つ: Google の公式の配布場所(`storage.googleapis.com/mediapipe-models/...` の `float16/latest`)のファイルと、大きさと md5 が一致。
- モデルのライセンス: 公式のモデルカード4枚(BlazeFace Short Range / Face Mesh V2 / Blendshape V2 / Selfie Segmentation)に「LICENSED UNDER: Apache License, Version 2.0」と書かれている。モデルカードは上の公式ページの「Models」からたどれる。
- `vendor/mediapipe/LICENSE` と `models/LICENSE` は、MediaPipe 公式リポジトリ(github.com/google-ai-edge/mediapipe)の `LICENSE` をそのまま置いたもの。
- 文字: Zen Maru Gothic の公式リポジトリ(github.com/googlefonts/zen-marugothic)の `OFL.txt` に「SIL Open Font License, Version 1.1」と書かれている。このアプリは文字のファイルを同梱せず、Google Fonts から読み込むだけ。
- まだ確かめていないこと: アプリの名前「なりきりカメラ」の商標(J-PlatPat を見ていない)。正式に出す前に確かめる。

## そのほか

- 絵・効果音・背景は すべて このアプリのために コードで描いた/合成したもので、外部の素材は使っていない。
- 文字(フォント)は Google のサーバーから読み込む。カメラの映像は 外へ出ない。
- 部品を新しくするとき: `vendor/mediapipe/` の5ファイルを npm の同じ名前のファイルで置きかえ、この表の版番号を直す。外すとき: `vendor/` と `models/` を消し、`src/tracker.js` を書きかえる。
