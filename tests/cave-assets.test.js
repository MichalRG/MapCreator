import test from "node:test";
import assert from "node:assert/strict";

import {
  DETAIL_SIZE_SCALE_DEFAULT,
  DETAIL_SIZE_SCALE_MAX,
  DETAIL_SIZE_SCALE_MIN,
  isBuiltinDoorAsset,
  isBuiltinStructuralAsset,
  isBuiltinWallAsset,
  listBuiltinAssetsByCategory,
  normalizeDetailSizeScale
} from "../src/cave-assets.js";

test("listBuiltinAssetsByCategory exposes dedicated wall pieces separately from regular details", () => {
  assert.deepEqual(
    listBuiltinAssetsByCategory("wall").map((asset) => asset.id),
    ["wall_straight", "wall_corner", "wall_t", "wall_end", "wall_pillar"]
  );
  assert.deepEqual(
    listBuiltinAssetsByCategory("door").map((asset) => asset.id),
    ["door_wood", "door_stone"]
  );
  assert.deepEqual(
    listBuiltinAssetsByCategory("variant-detail").map((asset) => asset.id),
    ["bonfire_cold", "camp"]
  );

  assert.equal(listBuiltinAssetsByCategory("detail").some((asset) => asset.id === "treasure"), true);
  assert.equal(listBuiltinAssetsByCategory("detail").some((asset) => asset.id === "camp"), false);
  assert.equal(listBuiltinAssetsByCategory("detail").some((asset) => asset.id === "wall_straight"), false);
  assert.equal(isBuiltinWallAsset("wall_corner"), true);
  assert.equal(isBuiltinDoorAsset("door_wood"), true);
  assert.equal(isBuiltinStructuralAsset("door_stone"), true);
  assert.equal(isBuiltinStructuralAsset("wall_corner"), true);
  assert.equal(isBuiltinWallAsset("treasure"), false);
  assert.equal(isBuiltinDoorAsset("treasure"), false);
});

test("normalizeDetailSizeScale clamps invalid detail size controls", () => {
  assert.equal(normalizeDetailSizeScale("1.25"), 1.25);
  assert.equal(normalizeDetailSizeScale(0.1), DETAIL_SIZE_SCALE_MIN);
  assert.equal(normalizeDetailSizeScale(3), DETAIL_SIZE_SCALE_MAX);
  assert.equal(normalizeDetailSizeScale(Number.NaN), DETAIL_SIZE_SCALE_DEFAULT);
});
