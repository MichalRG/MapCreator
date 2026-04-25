import test from "node:test";
import assert from "node:assert/strict";

import { isBuiltinDoorAsset, isBuiltinStructuralAsset, isBuiltinWallAsset, listBuiltinAssetsByCategory } from "../src/cave-assets.js";

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
