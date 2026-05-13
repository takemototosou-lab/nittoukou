import assert from "node:assert/strict";
import test from "node:test";
import { createArtisanCorrection, normalizeFivePrimaryRatio } from "../src/artisanCorrection.js";

test("artisan correction ratios are normalized to 100", () => {
  const ratio = normalizeFivePrimaryRatio({ white: 80, black: 10, red: 10, yellow: 10, blue: 0 });
  assert.deepEqual(ratio, { white: 73, black: 9, red: 9, yellow: 9, blue: 0 });
  assert.equal(Object.values(ratio).reduce((sum, value) => sum + value, 0), 100);
});

test("artisan correction stores code, normalized ratio, memo, and updatedAt", () => {
  const correction = createArtisanCorrection(
    "22-75B",
    { white: 60, black: 5, red: 20, yellow: 20, blue: 5 },
    "赤を少し抑える",
    "2026-05-13T00:00:00.000Z",
  );

  assert.deepEqual(correction, {
    code: "22-75B",
    white: 54,
    black: 5,
    red: 18,
    yellow: 18,
    blue: 5,
    memo: "赤を少し抑える",
    updatedAt: "2026-05-13T00:00:00.000Z",
  });
});
