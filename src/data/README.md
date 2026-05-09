# Nitto Color RGB Master

Replace `nittoColorMaster.csv` with the approved full RGB master.
RGB values are display or approximate color data only, not paint formulation data.

## Required CSV Columns

```csv
code,name,r,g,b,source
N-90,JPMA P N-90,230,230,226,JPMA Paint Colors Search Engine https://s1.toryo.or.jp/cgi-bin/SPCSS-m/search/main.cgi
05-90A,JPMA P 05-90A,239,222,215,QTCColor https://www.qtccolor.com/secaiku/color/120602
22-75B,JPMA P 22-75B,195,181,158,QTCColor https://www.qtccolor.com/secaiku/color/120429
```

## Required Fields

- `code`: Nitto color code. Examples: `N-90`, `05-90A`, `22-75B`
- `r`: RGB red channel, 0-255
- `g`: RGB green channel, 0-255
- `b`: RGB blue channel, 0-255

## JPMA Paint Colors Search Workflow

Use the official JPMA Paint Colors Search Engine for one color at a time.
The official help states that the RGB column is the RGB value used to display the digital color sample.

1. Open `https://s1.toryo.or.jp/cgi-bin/SPCSS-m/search/main.cgi`.
2. Search one color code.
3. Confirm the result includes an RGB value.
4. Append only reviewed rows to `nittoColorMaster.csv`.

## Full Master Workflow

```bash
npm run validate:master
npm run test
npm run export:five
```

The current CSV contains the first reviewed candidate rows. Do not treat it as the final production master until the source and row set are approved.
