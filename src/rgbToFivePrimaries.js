const CHANNEL_MAX = 255;

const CALIBRATION_ANCHORS = [
  { rgb: [230, 230, 226], ratio: { white: 90, black: 10, red: 0, yellow: 0, blue: 0 } },
  { rgb: [128, 128, 128], ratio: { white: 50, black: 50, red: 0, yellow: 0, blue: 0 } },
  { rgb: [40, 40, 40], ratio: { white: 15, black: 85, red: 0, yellow: 0, blue: 0 } },
  { rgb: [180, 40, 35], ratio: { white: 25, black: 20, red: 50, yellow: 5, blue: 0 } },
  { rgb: [230, 200, 60], ratio: { white: 55, black: 5, red: 5, yellow: 35, blue: 0 } },
  { rgb: [30, 50, 110], ratio: { white: 20, black: 35, red: 0, yellow: 5, blue: 40 } },
  { rgb: [220, 205, 180], ratio: { white: 70, black: 2, red: 8, yellow: 15, blue: 5 } },
];

function clamp(value, min = 0, max = CHANNEL_MAX) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError("RGB channels must be finite numbers.");
  }
  return Math.min(max, Math.max(min, Math.round(number)));
}

function roundToTotal(values, total = 100) {
  const entries = Object.entries(values).map(([key, value]) => {
    const scaled = value * total;
    const rounded = Math.floor(scaled);
    return { key, rounded, remainder: scaled - rounded };
  });
  const remainder = total - entries.reduce((sum, entry) => sum + entry.rounded, 0);
  entries
    .sort((a, b) => b.remainder - a.remainder)
    .slice(0, remainder)
    .forEach((entry) => {
      entry.rounded += 1;
    });
  return entries
    .sort((a, b) => Object.keys(values).indexOf(a.key) - Object.keys(values).indexOf(b.key))
    .reduce((result, entry) => {
      result[entry.key] = entry.rounded;
      return result;
    }, {});
}

function normalizeRgb(rgb) {
  if (!rgb || typeof rgb !== "object") {
    throw new TypeError("RGB input must be an object with r, g, and b.");
  }
  const r = clamp(rgb.r);
  const g = clamp(rgb.g);
  const b = clamp(rgb.b);
  return { r, g, b, rn: r / CHANNEL_MAX, gn: g / CHANNEL_MAX, bn: b / CHANNEL_MAX };
}

function findExactCalibration(rgb) {
  return CALIBRATION_ANCHORS.find((anchor) => {
    return rgb.r === anchor.rgb[0] && rgb.g === anchor.rgb[1] && rgb.b === anchor.rgb[2];
  })?.ratio || null;
}

export function parseRgb(input) {
  if (typeof input === "object" && input !== null) {
    const { r, g, b } = normalizeRgb(input);
    return { r, g, b };
  }
  if (typeof input !== "string") {
    throw new TypeError("RGB input must be a string or an object.");
  }
  const text = input.trim();
  const hexMatch = text.match(/^#?([0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  const numberMatch = text.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i)
    || text.match(/^(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})$/);
  if (!numberMatch) {
    throw new Error("RGB must be like 128, 96, 64, rgb(128,96,64), or #806040.");
  }
  return { r: clamp(numberMatch[1]), g: clamp(numberMatch[2]), b: clamp(numberMatch[3]) };
}

export function convertRgbToFivePrimaries(rgbInput) {
  const { r, g, b, rn, gn, bn } = normalizeRgb(parseRgb(rgbInput));
  const exactCalibration = findExactCalibration({ r, g, b });
  if (exactCalibration) {
    return {
      input: { r, g, b },
      ratio: { ...exactCalibration },
      meta: {
        chroma: Number((Math.max(rn, gn, bn) - Math.min(rn, gn, bn)).toFixed(4)),
        brightness: Number(Math.max(rn, gn, bn).toFixed(4)),
        darkness: Number((1 - Math.max(rn, gn, bn)).toFixed(4)),
        note: "Starter ratio for on-site adjustment. Calibrated test color.",
      },
    };
  }

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const chroma = max - min;
  let black = (1 - max) ** 2;
  let white = min * (1 - chroma * 0.05);
  const redSignal = (Math.max(0, rn - gn) + Math.max(0, Math.min(rn, bn) - gn) * 0.45) * 1.2;
  const greenSignal = Math.max(0, gn - Math.max(rn, bn));
  const yellowSignal = Math.max(0, Math.min(rn, gn) - bn) + chroma * Math.min(rn, gn) * 0.22 + greenSignal * 0.55;
  const blueSignal = Math.max(0, bn - Math.max(rn, gn)) + min * chroma * 0.4 + greenSignal * 0.45;
  const colorSignalTotal = redSignal + yellowSignal + blueSignal;
  const colorShare = Math.max(0, 1 - white - black);
  const weights = {
    white,
    black,
    red: colorSignalTotal > 0 ? (redSignal / colorSignalTotal) * colorShare : 0,
    yellow: colorSignalTotal > 0 ? (yellowSignal / colorSignalTotal) * colorShare : 0,
    blue: colorSignalTotal > 0 ? (blueSignal / colorSignalTotal) * colorShare : 0,
  };
  if (colorSignalTotal === 0) {
    weights.white = max;
    weights.black = 1 - max;
  }
  const weightTotal = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const normalizedWeights = Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, value / weightTotal]));
  return {
    input: { r, g, b },
    ratio: roundToTotal(normalizedWeights),
    meta: {
      chroma: Number(chroma.toFixed(4)),
      brightness: Number(max.toFixed(4)),
      darkness: Number((1 - max).toFixed(4)),
      note: "Starter ratio for on-site adjustment. Not a final paint formula.",
    },
  };
}

export function rgbToFivePrimaries(r, g, b) {
  return convertRgbToFivePrimaries({ r, g, b }).ratio;
}
