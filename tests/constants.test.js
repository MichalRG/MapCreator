import test from "node:test";
import assert from "node:assert/strict";

import { getMapTypeDef, getToolDef, listBuiltinAssetDefs, MAP_TYPE_DEFS, TOOL_DEFS } from "../src/constants.js";
import { BUILTIN_ICON_URLS } from "../src/icons.js";

test("getMapTypeDef falls back to the world hex config", () => {
  assert.equal(getMapTypeDef("hex-world"), MAP_TYPE_DEFS["hex-world"]);
  assert.equal(getMapTypeDef("missing"), MAP_TYPE_DEFS["hex-world"]);
});

test("getToolDef falls back to the first tool definition", () => {
  assert.equal(getToolDef("edge"), TOOL_DEFS.find((tool) => tool.id === "edge"));
  assert.equal(getToolDef("missing"), TOOL_DEFS[0]);
});

test("listBuiltinAssetDefs combines terrain, overlay, and edge assets for a map type", () => {
  const caveAssets = listBuiltinAssetDefs("cave");
  const cave = MAP_TYPE_DEFS.cave;
  const worldAssets = listBuiltinAssetDefs("hex-world");
  const world = MAP_TYPE_DEFS["hex-world"];

  assert.equal(
    caveAssets.length,
    Object.keys(cave.terrainDefs).length + Object.keys(cave.overlayDefs).length + Object.keys(cave.edgeDefs).length
  );
  assert.equal(
    worldAssets.length,
    Object.keys(world.terrainDefs).length + Object.keys(world.overlayDefs).length + Object.keys(world.edgeDefs).length
  );
  assert.ok(caveAssets.some((asset) => asset.label === "Treasure"));
  assert.ok(caveAssets.some((asset) => asset.label === "Tunnel"));
  assert.ok(worldAssets.some((asset) => asset.label === "Quarry"));
  assert.ok(worldAssets.some((asset) => asset.label === "Lumberjack's Camp"));
  assert.ok(worldAssets.some((asset) => asset.label === "Well"));
});

test("builtin icon urls are embedded svg data urls", () => {
  assert.match(BUILTIN_ICON_URLS.terrain.plains, /^data:image\/svg\+xml;charset=utf-8,/);
  assert.match(BUILTIN_ICON_URLS.overlay.city, /^data:image\/svg\+xml;charset=utf-8,/);
  assert.match(BUILTIN_ICON_URLS.edge.river, /^data:image\/svg\+xml;charset=utf-8,/);
});
