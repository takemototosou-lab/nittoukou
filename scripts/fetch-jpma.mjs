import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { request } from "node:https";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildJpmaSearch2Url, parseJpmaColorResult, toCsvRow } from "../jpma-color-parser.mjs";

const HEADER = "code,name,r,g,b,source";
const ERROR_HEADER = "code,error,source";
const SAFE_LIMIT = getLimit();
const REQUEST_DELAY_MS = Math.max(1000, Number(process.env.JPMA_FETCH_DELAY_MS || 1000));
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const targetPath = join(root, "data", "jpma-target-codes.txt");
const outputPath = join(root, "src", "data", "nittoColorMaster.csv");
const errorPath = join(root, "data", "jpma-fetch-errors.csv");

async function main() {
  const targetCodes = await readTargetCodes(targetPath);
  const existingRows = await readCsvRows(outputPath);
  const existingByCode = new Map(existingRows.map((row) => [normalizeCode(row.code), row]));
  const existingCodeSet = new Set(existingByCode.keys());
  const codesToFetch = unique(targetCodes)
    .filter((code) => !existingCodeSet.has(normalizeCode(code)))
    .slice(0, SAFE_LIMIT);

  const fetchedRows = [];
  const errorRows = [];

  console.log(`Targets: ${targetCodes.length}`);
  console.log(`Existing unique rows: ${existingByCode.size}`);
  console.log(`Fetching: ${codesToFetch.length} code(s), limit ${SAFE_LIMIT}, delay ${REQUEST_DELAY_MS}ms`);

  for (const [index, code] of codesToFetch.entries()) {
    const source = buildJpmaSearch2Url(code);

    try {
      const html = await fetchText(source, {
        Referer: "https://s1.toryo.or.jp/cgi-bin/SPCSS-m/search/query2.cgi",
        "User-Agent": "Mozilla/5.0 JPMA color master fetch",
      });
      const color = parseJpmaColorResult(html, source);

      if (!color) {
        throw new Error("RGB was not found in JPMA result HTML");
      }

      fetchedRows.push(color);
      existingByCode.set(normalizeCode(color.code), color);
      console.log(`OK ${color.code} ${color.r},${color.g},${color.b}`);
    } catch (error) {
      errorRows.push({
        code,
        error: error instanceof Error ? error.message : String(error),
        source,
      });
      console.log(`NG ${code}`);
    }

    if (index < codesToFetch.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  await writeColorMaster([...existingByCode.values()]);
  await writeFetchErrors(errorRows);

  console.log(`Wrote master: ${outputPath}`);
  console.log(`Added rows: ${fetchedRows.length}`);
  console.log(`Errors: ${errorRows.length}`);
}

async function readTargetCodes(filePath) {
  const text = await readFile(filePath, "utf8");
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean);
}

async function readCsvRows(filePath) {
  if (!existsSync(filePath)) return [];

  const text = await readFile(filePath, "utf8");
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  return lines.slice(1).map(parseColorCsvLine).filter(Boolean);
}

function parseColorCsvLine(line) {
  const [code = "", name = "", r = "", g = "", b = "", source = ""] = parseCsvLine(line);
  if (!code) return null;

  return {
    code,
    name,
    r: Number(r),
    g: Number(g),
    b: Number(b),
    source,
  };
}

async function writeColorMaster(rows) {
  await mkdir(dirname(outputPath), { recursive: true });
  const sortedRows = rows.slice().sort((a, b) => a.code.localeCompare(b.code, "en"));
  await writeFile(outputPath, `${HEADER}\n${sortedRows.map(toCsvRow).join("\n")}\n`, "utf8");
}

async function writeFetchErrors(rows) {
  await mkdir(dirname(errorPath), { recursive: true });
  const lines = rows.map((row) => [row.code, row.error, row.source].map(csvField).join(","));
  await writeFile(errorPath, `${ERROR_HEADER}\n${lines.join("\n")}${lines.length ? "\n" : ""}`, "utf8");
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
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        resolve(body);
      });
    });

    req.on("error", reject);
    req.end();
  });
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }

  values.push(value);
  return values;
}

function csvField(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function unique(values) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const key = normalizeCode(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

function normalizeCode(code) {
  return String(code).trim().toUpperCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLimit() {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const value = limitArg ? limitArg.slice("--limit=".length) : process.env.JPMA_FETCH_LIMIT || 30;
  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`Invalid JPMA fetch limit: ${value}`);
  }

  return limit;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
