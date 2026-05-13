import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { findColorByCodeInMaster, loadNittoColorMasterFromCsv } from "../src/nittoColorCore.js";
import { colorToNittoMasterCsvRow, parseJpmaSearchResultToColor } from "../src/jpmaPaintColorSearch.js";
import { rgbToFivePrimaries } from "../src/rgbToFivePrimaries.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const masterCsv = fs.readFileSync(resolve(__dirname, "../src/data/nittoColorMaster.csv"), "utf8");

test("rgbToFivePrimaries returns the expected starter ratio for SAMPLE-220205180", () => {
  assert.deepEqual(rgbToFivePrimaries(220, 205, 180), { white: 70, black: 2, red: 8, yellow: 15, blue: 5 });
});

test("rgbToFivePrimaries matches calibrated starter ratios for key color families", () => {
  const cases = [
    [[230, 230, 226], { white: 90, black: 10, red: 0, yellow: 0, blue: 0 }],
    [[128, 128, 128], { white: 50, black: 50, red: 0, yellow: 0, blue: 0 }],
    [[40, 40, 40], { white: 15, black: 85, red: 0, yellow: 0, blue: 0 }],
    [[180, 40, 35], { white: 25, black: 20, red: 50, yellow: 5, blue: 0 }],
    [[230, 200, 60], { white: 55, black: 5, red: 5, yellow: 35, blue: 0 }],
    [[30, 50, 110], { white: 20, black: 35, red: 0, yellow: 5, blue: 40 }],
    [[220, 205, 180], { white: 70, black: 2, red: 8, yellow: 15, blue: 5 }],
  ];
  for (const [rgb, expected] of cases) {
    const ratio = rgbToFivePrimaries(...rgb);
    assert.deepEqual(ratio, expected);
    assert.equal(Object.values(ratio).reduce((sum, value) => sum + value, 0), 100);
  }
});

test("N-90 resolves from nittoColorMaster.csv", () => {
  const master = loadNittoColorMasterFromCsv(masterCsv);
  const color = findColorByCodeInMaster("N-90", master);
  assert.equal(color.code, "N-90");
  assert.deepEqual(rgbToFivePrimaries(color.r, color.g, color.b), { white: 86, black: 1, red: 2, yellow: 8, blue: 3 });
});

test("JPMA search result HTML can be converted to a master CSV row when RGB is present", () => {
  const html = `<table><tr><th>色票番号</th><th>RGB</th></tr><tr><td>N-90</td><td>230 230 226</td></tr></table>`;
  const color = parseJpmaSearchResultToColor(html, "N-90");
  assert.equal(color.r, 230);
  assert.equal(color.g, 230);
  assert.equal(color.b, 226);
  assert.equal(colorToNittoMasterCsvRow(color).startsWith("N-90,JPMA N-90,230,230,226,"), true);
});
