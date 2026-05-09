import { rgbToFivePrimaries } from "./rgbToFivePrimaries.js";
import { createNittoColorMap, findNittoColor, parseNittoColorCsv } from "./nittoColorLookup.js";

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function loadNittoColorMasterFromCsv(masterCsvText) {
  const colors = parseNittoColorCsv(masterCsvText);
  return {
    colors,
    colorMap: createNittoColorMap(colors),
  };
}

export function findColorByCodeInMaster(code, master) {
  return findNittoColor(code, master.colorMap);
}

export function buildFivePrimariesExcelRows(master) {
  return master.colors.map((color) => {
    const ratio = rgbToFivePrimaries(color.r, color.g, color.b);
    return {
      code: color.code,
      name: color.name,
      r: color.r,
      g: color.g,
      b: color.b,
      white: ratio.white,
      black: ratio.black,
      red: ratio.red,
      yellow: ratio.yellow,
      blue: ratio.blue,
      source: color.source,
    };
  });
}

export function createFivePrimariesExcelCsv(master) {
  const headers = ["code", "name", "r", "g", "b", "白", "黒", "赤", "黄", "青", "source"];
  const rows = buildFivePrimariesExcelRows(master).map((row) => [
    row.code,
    row.name,
    row.r,
    row.g,
    row.b,
    row.white,
    row.black,
    row.red,
    row.yellow,
    row.blue,
    row.source,
  ]);
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n")}`;
}

export { rgbToFivePrimaries };
