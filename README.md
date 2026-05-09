# 日塗工 RGB → 5原色 AI

塗装職人向けの調色スタート比率AI。

## 目的

完全一致調色ではなく、
調色開始時の方向性を出す。

## 入力

- 日塗工番号
- RGB

## 出力

- 白
- 黒
- 赤
- 黄
- 青

合計100%

## フロー

```text
日塗工番号
↓
nittoColorMaster.csv
↓
RGB取得
↓
rgbToFivePrimaries()
↓
React UI表示
```

## コマンド

```bash
npm run validate:master
npm run test
npm run export:five
npm run dev
```

## 重要

RGBは画面表示用近似値。
実塗料配合ではない。
