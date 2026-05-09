import fs from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeNittoCode, parseCsvLine } from "../src/nittoColorLookup.js";

const EXPECTED_HEADERS = ["code", "name", "r", "g", "b", "source"];

function isValidRgbChannel(value) {
  if (!/^\d+$/.test(value)) return false;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number <= 255;
}

function printErrorList(title, errors) {
  if (errors.length === 0) return;
  console.log("");
  console.log(title);
  errors.forEach((error) => console.log(`- ${error}`));
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultCsvPath = resolve(__dirname, "../src/data/nittoColorMaster.csv");
const csvPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : defaultCsvPath;
const csvText = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
const nonEmptyLines = csvText
  .split(/\r?\n/)
  .map((line, index) => ({ lineNumber: index + 1, text: line.trim() }))
  .filter((line) => line.text.length > 0);

const errors = [];
const missingCodeRows = [];
const invalidRgbRows = [];
const codeRows = new Map();
const duplicateCodes = new Map();

if (nonEmptyLines.length === 0) {
  errors.push("CSV is empty.");
} else {
  const headers = parseCsvLine(nonEmptyLines[0].text);
  const headerMatches = headers.length === EXPECTED_HEADERS.length
    && headers.every((header, index) => header === EXPECTED_HEADERS[index]);
  if (!headerMatches) {
    errors.push(`Header must be exactly: ${EXPECTED_HEADERS.join(",")}`);
    errors.push(`Actual header: ${headers.join(",")}`);
  }

  nonEmptyLines.slice(1).forEach(({ lineNumber, text }) => {
    const cells = parseCsvLine(text);
    const [code = "", , r = "", g = "", b = ""] = cells;
    const normalizedCode = normalizeNittoCode(code);
    if (!normalizedCode) {
      missingCodeRows.push(lineNumber);
    } else if (codeRows.has(normalizedCode)) {
      const rows = duplicateCodes.get(normalizedCode) || [codeRows.get(normalizedCode)];
      rows.push(lineNumber);
      duplicateCodes.set(normalizedCode, rows);
    } else {
      codeRows.set(normalizedCode, lineNumber);
    }
    if (![r, g, b].every(isValidRgbChannel)) {
      invalidRgbRows.push({ lineNumber, code: code || "(missing code)", r, g, b });
    }
  });
}

const totalRows = Math.max(0, nonEmptyLines.length - 1);
const duplicateCodeEntries = [...duplicateCodes.entries()];
console.log(`CSV: ${csvPath}`);
console.log(`total rows: ${totalRows}`);
console.log(`duplicate codes: ${duplicateCodeEntries.length}`);
console.log(`invalid RGB rows: ${invalidRgbRows.length}`);
console.log(`missing code rows: ${missingCodeRows.length}`);

printErrorList("Header errors", errors);
printErrorList("Duplicate code errors", duplicateCodeEntries.map(([code, rows]) => `${code}: rows ${rows.join(", ")}`));
printErrorList("Invalid RGB row errors", invalidRgbRows.map((row) => `row ${row.lineNumber}: code=${row.code}, r=${row.r}, g=${row.g}, b=${row.b}`));
printErrorList("Missing code row errors", missingCodeRows.map((lineNumber) => `row ${lineNumber}`));

if (errors.length > 0 || duplicateCodeEntries.length > 0 || invalidRgbRows.length > 0 || missingCodeRows.length > 0) {
  process.exitCode = 1;
} else {
  console.log("Master CSV validation passed");
}
