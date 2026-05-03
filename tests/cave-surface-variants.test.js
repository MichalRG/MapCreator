import test from "node:test";
import assert from "node:assert/strict";

import { getSurfaceVariantOptions, resolveSurfaceBrushSelection } from "../src/cave-surface-variants.js";

test("floor variants include wall border choices in the shared palette", () => {
  assert.deepEqual(
    getSurfaceVariantOptions("floor").map((entry) => entry.id),
    ["normal", "up", "down", "cracked", "wall", "wall-jagged"]
  );
});

test("erase variants expose both void cut and wall border modes", () => {
  assert.deepEqual(
    getSurfaceVariantOptions("erase").map((entry) => entry.id),
    ["void", "wall"]
  );
});

test("resolveSurfaceBrushSelection maps floor wall variants back to wall strokes", () => {
  assert.deepEqual(resolveSurfaceBrushSelection("floor", "wall"), {
    tool: "wall",
    surfaceVariant: "normal",
    paletteVariant: "wall"
  });

  assert.deepEqual(resolveSurfaceBrushSelection("floor", "wall-jagged"), {
    tool: "wall",
    surfaceVariant: "jagged",
    paletteVariant: "wall-jagged"
  });

  assert.deepEqual(resolveSurfaceBrushSelection("floor", "cracked"), {
    tool: "floor",
    surfaceVariant: "cracked",
    paletteVariant: "cracked"
  });
});
