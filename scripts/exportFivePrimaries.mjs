import fs from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createFivePrimariesExcelCsv, loadNittoColorMasterFromCsv } from "../src/nittoColorCore.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultInputPath = resolve(__dirname, "../src/data/nittoColorMaster.csv");
const defaultOutputPath = resolve(__dirname, "../exports/fivePrimaries.csv");
const inputPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : defaultInputPath;
const outputPath = process.argv[3] ? resolve(process.cwd(), process.argv[3]) : defaultOutputPath;

const csvText = fs.readFileSync(inputPath, "utf8");
const master = loadNittoColorMasterFromCsv(csvText);
const outputCsv = createFivePrimariesExcelCsv(master);

fs.mkdirSync(dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, outputCsv, "utf8");

console.log(`Input: ${inputPath}`);
console.log(`Rows exported: ${master.colors.length}`);
console.log(`Output: ${outputPath}`);
