const JPMA_SEARCH_BASE = "https://s1.toryo.or.jp/cgi-bin/SPCSS-m/search";

export function buildJpmaSearch2Url(code) {
  const normalized = normalizeJpmaCode(code);
  const match = normalized.match(/^([A-Z]?|[0-9]{2})-([0-9]{2})([A-Z]?)$/);

  if (!match) {
    throw new Error(`Unsupported JPMA color code: ${code}`);
  }

  const [, h, v, c] = match;
  const params = new URLSearchParams({ h, v, c });
  return `${JPMA_SEARCH_BASE}/search2.cgi?${params.toString()}`;
}

export function parseJpmaColorResult(html, source = "") {
  const code = html.match(/search_n\.cgi\?[^"]*cno=([^"&]+)[^"]*"[^>]*>([^<]+)</)?.[2];
  const rgbText = extractTextAfterComment(html, "RGB");
  const rgb = rgbText
    ?.replace(/\u3000/g, " ")
    .match(/\b(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\b/);

  if (!code || !rgb) return null;

  const [r, g, b] = rgb.slice(1).map(Number);
  if (![r, g, b].every((value) => value >= 0 && value <= 255)) return null;

  return {
    code: normalizeJpmaCode(code),
    name: "",
    r,
    g,
    b,
    source,
  };
}

export function toCsvRow(color) {
  return [color.code, color.name || "", color.r, color.g, color.b, color.source].map(csvField).join(",");
}

function normalizeJpmaCode(code) {
  return String(code).trim().toUpperCase().replace(/^[A-Z](?=\d{2}-)/, "");
}

function extractTextAfterComment(html, label) {
  const index = html.indexOf(`<!-- ${label} -->`);
  if (index === -1) return null;

  return html
    .slice(index, index + 800)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function csvField(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
