# nittoukou

日塗工番号またはRGBから、白・黒・赤・黄・青の5原色比率を出す塗装職人向けの調色スタート補助アプリです。

このアプリは完全一致の調色配合を出すものではありません。現場で微調整する前提の初期比率を作るためのものです。

## Features

- 日塗工番号検索
- RGBから5原色比率へ変換
- 白・黒・赤・黄・青の合計100%出力
- Nitto Color RGB Master CSVの検証
- 全件CSV出力
- スマホ向けReact UI

## Commands

```bash
npm install
npm run dev
npm run validate:master
npm run test
npm run export:five
```

## Data

マスターCSVは `src/data/nittoColorMaster.csv` です。

```csv
code,name,r,g,b,source
N-90,JPMA P N-90,230,230,226,source URL
```

RGBは画面表示用または近似色データとして扱います。調色配合そのものではありません。
