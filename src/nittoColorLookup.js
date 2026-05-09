export function normalizeNittoCode(code) {
  return String(code ?? "")
    .trim()
    .replace(/[－ー―]/g, "-")
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];
    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

export function parseNittoColorCsv(csvText) {
  const lines = String(csvText ?? "").replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const [headerLine, ...rows] = lines;
  if (!headerLine) return [];
  const headers = parseCsvLine(headerLine);
  return rows.map((line) => {
    const cells = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    return {
      code: normalizeNittoCode(row.code),
      name: row.name || "",
      r: Number(row.r),
      g: Number(row.g),
      b: Number(row.b),
      source: row.source || "",
    };
  });
}

export function createNittoColorMap(colors) {
  const map = new Map();
  colors.forEach((color) => map.set(normalizeNittoCode(color.code), color));
  return map;
}

export function findNittoColor(code, colorMap) {
  return colorMap.get(normalizeNittoCode(code)) || null;
}

export function resolveColorInput(input, colorMap) {
  const trimmed = String(input ?? "").trim();
  if (/^#?[0-9a-f]{6}$/i.test(trimmed) || /^rgb/i.test(trimmed) || /^\d{1,3}[, ]/.test(trimmed)) {
    return { type: "rgb", value: trimmed };
  }
  const color = findNittoColor(trimmed, colorMap);
  if (!color) {
    throw new Error("日塗工番号がRGBマスタにありません。");
  }
  return { type: "code", value: color };
}
