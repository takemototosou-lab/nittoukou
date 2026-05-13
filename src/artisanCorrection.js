export const PRIMARY_KEYS = ["white", "black", "red", "yellow", "blue"];

export function normalizeFivePrimaryRatio(values, total = 100) {
  const prepared = PRIMARY_KEYS.map((key) => {
    const number = Number(values?.[key] ?? 0);
    const value = Number.isFinite(number) ? Math.max(0, number) : 0;
    const rounded = Math.floor(value);
    return { key, value, rounded, remainder: value - rounded };
  });
  const rawTotal = prepared.reduce((sum, entry) => sum + entry.value, 0);

  if (rawTotal <= 0) {
    return { white: total, black: 0, red: 0, yellow: 0, blue: 0 };
  }

  const scaled = prepared.map((entry) => {
    const value = (entry.value / rawTotal) * total;
    return {
      key: entry.key,
      rounded: Math.floor(value),
      remainder: value - Math.floor(value),
    };
  });
  let remainder = total - scaled.reduce((sum, entry) => sum + entry.rounded, 0);
  scaled
    .slice()
    .sort((a, b) => b.remainder - a.remainder)
    .forEach((entry) => {
      if (remainder <= 0) return;
      entry.rounded += 1;
      remainder -= 1;
    });

  return scaled.reduce((result, entry) => {
    result[entry.key] = entry.rounded;
    return result;
  }, {});
}

export function createArtisanCorrection(code, values, memo = "", updatedAt = new Date().toISOString()) {
  return {
    code,
    ...normalizeFivePrimaryRatio(values),
    memo: String(memo ?? ""),
    updatedAt,
  };
}
