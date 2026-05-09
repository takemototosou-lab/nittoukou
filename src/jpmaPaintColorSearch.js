const JPMA_SEARCH_SOURCE = "JPMA Paint Colors Search Engine https://s1.toryo.or.jp/cgi-bin/SPCSS-m/search/main.cgi";

function normalizeText(value) {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/gi, "&")
    .replace(/[ＲR]\s*[ＧG]\s*[ＢB]/g, "RGB")
    .replace(/[，、]/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCode(code) {
  return String(code ?? "")
    .trim()
    .replace(/[－ー―]/g, "-")
    .replace(/\s+/g, "")
    .toUpperCase();
}

function extractRgb(text) {
  const afterRgbLabel = text.match(/RGB\s*[:：]?\s*(.+)$/i)?.[1] ?? "";
  const rgbLabelMatch = afterRgbLabel
    .replace(/[A-Z]?\d{0,2}-\d{2}[A-Z]?/gi, " ")
    .match(/\b(\d{1,3})[\s,/]+(\d{1,3})[\s,/]+(\d{1,3})\b/);
  if (rgbLabelMatch) {
    return rgbLabelMatch.slice(1, 4).map(Number);
  }
  const hexMatch = text.match(/#?([0-9a-f]{6})\b/i);
  if (!hexMatch) return null;
  const hex = hexMatch[1];
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function assertRgb(rgb) {
  if (!rgb || rgb.length !== 3 || rgb.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
    throw new Error("JPMA検索結果HTMLから有効なRGB/HEXを取得できません。");
  }
}

export function parseJpmaSearchResultToColor(html, code, options = {}) {
  const normalizedCode = normalizeCode(code);
  const text = normalizeText(html);
  const rgb = extractRgb(text);
  assertRgb(rgb);
  if (normalizedCode && !text.toUpperCase().includes(normalizedCode)) {
    throw new Error(`JPMA検索結果HTML内に指定codeが見つかりません: ${normalizedCode}`);
  }
  const [r, g, b] = rgb;
  return {
    code: normalizedCode,
    name: options.name ?? `JPMA ${normalizedCode}`,
    r,
    g,
    b,
    source: options.source ?? JPMA_SEARCH_SOURCE,
  };
}

export function colorToNittoMasterCsvRow(color) {
  return [color.code, color.name, color.r, color.g, color.b, color.source].join(",");
}

export { JPMA_SEARCH_SOURCE };
