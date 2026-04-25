import test from "node:test";
import assert from "node:assert/strict";

import { createCustomPlacementLookup } from "../src/render.js";

test("createCustomPlacementLookup indexes placements and symbols by id", () => {
  const project = {
    customPlacements: [
      { id: "placement-1", symbolId: "symbol-2", col: 3, row: 4 },
      { id: "placement-2", symbolId: "symbol-1", col: 1, row: 2 }
    ],
    customSymbols: [
      { id: "symbol-1", name: "Watchtower" },
      { id: "symbol-2", name: "Bridge" }
    ]
  };

  const lookup = createCustomPlacementLookup(project);

  assert.deepEqual(lookup.placementsById.get("placement-1"), project.customPlacements[0]);
  assert.deepEqual(lookup.placementsById.get("placement-2"), project.customPlacements[1]);
  assert.deepEqual(lookup.symbolsById.get("symbol-1"), project.customSymbols[0]);
  assert.deepEqual(lookup.symbolsById.get("symbol-2"), project.customSymbols[1]);
  assert.equal(lookup.placementsById.has("missing-placement"), false);
  assert.equal(lookup.symbolsById.has("missing-symbol"), false);
});
