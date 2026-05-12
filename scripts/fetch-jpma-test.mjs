import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { request } from "node:https";
import { buildJpmaSearch2Url, parseJpmaColorResult, toCsvRow } from "../jpma-color-parser.mjs";

const TEST_CODES = [
  "N-95",
  "N-90",
  "N-80",
  "22-90A",
  "22-90B",
  "22-85A",
  "22-80A",
  "22-75B",
  "65-90D",
  "69-50H",
];

const MAX_TEST_FETCHES = 10;
const REQUEST_DELAY_MS = 800;
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputPath = join(root, "data", "jpma-colors-test.csv");

async function main() {
  const codes = TEST_CODES.slice(0, MAX_TEST_FETCHES);
  const rows = ["code,name,r,g,b,source"];

  for (const [index, code] of codes.entries()) {
    const source = buildJpmaSearch2Url(code);
    const html = await fetchText(source, {
      Referer: "https://s1.toryo.or.jp/cgi-bin/SPCSS-m/search/query2.cgi",
      "User-Agent": "Mozilla/5.0 JPMA color CSV test",
    });
    const color = parseJpmaColorResult(html, source);

    if (!color) {
      throw new Error(`RGB was not found in JPMA result HTML: ${code}`);
    }

    rows.push(toCsvRow(color));

    if (index < codes.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${rows.join("\n")}\n`, "utf8");

  console.log(rows.join("\n"));
  console.log(`\nWrote ${codes.length} rows to ${outputPath}`);
}

function fetchText(url, headers) {
  return new Promise((resolve, reject) => {
    const req = request(url, { headers, rejectUnauthorized: false }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${url}`));
          return;
        }
        resolve(body);
      });
    });

    req.on("error", reject);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
