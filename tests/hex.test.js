import test from "node:test";
import assert from "node:assert/strict";

import {
  areAdjacent,
  buildEmptyCells,
  edgeKey,
  getCell,
  getCellCenter,
  getMapBounds,
  worldToCell
} from "../src/hex.js";
import { createProject } from "../src/project.js";

function assertClose(actual, expected, delta = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= delta, `expected ${actual} to be within ${delta} of ${expected}`);
}

test("buildEmptyCells creates a complete rectangular grid", () => {
  const cells = buildEmptyCells(2, 3, "rock");

  assert.equal(cells.length, 6);
  assert.deepEqual(cells[5], {
    col: 1,
    row: 2,
    terrain: "rock",
    terrainLabel: "",
    overlays: [],
    overlayLabels: {},
    wallEdges: [],
    customPlacementIds: []
  });
});

test("getCell handles in-bounds and out-of-bounds coordinates", () => {
  const project = createProject({ width: 2, height: 2, name: "Cells" });

  assert.equal(getCell(project, 1, 1)?.col, 1);
  assert.equal(getCell(project, -1, 0), null);
  assert.equal(getCell(project, 2, 0), null);
});

test("areAdjacent respects hex and square layouts", () => {
  const hexProject = createProject({ width: 4, height: 4, name: "Hex" });
  const squareProject = createProject({ width: 4, height: 4, name: "Square", mapType: "cave" });

  assert.equal(areAdjacent(hexProject, { col: 0, row: 0 }, { col: 1, row: 0 }), true);
  assert.equal(areAdjacent(hexProject, { col: 0, row: 0 }, { col: 1, row: 1 }), false);
  assert.equal(areAdjacent(squareProject, { col: 1, row: 1 }, { col: 1, row: 2 }), true);
  assert.equal(areAdjacent(squareProject, { col: 1, row: 1 }, { col: 2, row: 2 }), false);
});

test("edgeKey is stable regardless of endpoint order", () => {
  const forward = edgeKey("river", { col: 0, row: 0 }, { col: 1, row: 0 });
  const reversed = edgeKey("river", { col: 1, row: 0 }, { col: 0, row: 0 });

  assert.equal(forward, "river:0,0:1,0");
  assert.equal(forward, reversed);
});

test("worldToCell maps square coordinates by flooring to the tile grid", () => {
  const project = createProject({ width: 5, height: 5, name: "Square", mapType: "cave" });

  assert.deepEqual(worldToCell(project, 0, 0, 42), { col: 0, row: 0 });
  assert.deepEqual(worldToCell(project, 83.9, 84.1, 42), { col: 1, row: 2 });
});

test("worldToCell maps hex cell centers back to the original coordinates", () => {
  const project = createProject({ width: 5, height: 5, name: "Hex" });
  const size = 34;
  const targets = [
    { col: 0, row: 0 },
    { col: 2, row: 1 },
    { col: 3, row: 4 }
  ];

  for (const target of targets) {
    const center = getCellCenter(project, target.col, target.row, size);
    assert.deepEqual(worldToCell(project, center.x, center.y, size), target);
  }
});

test("getMapBounds returns exact square bounds and expected single-hex bounds", () => {
  const squareProject = createProject({ width: 3, height: 2, name: "Square", mapType: "cave" });
  const squareBounds = getMapBounds(squareProject, 42);

  assert.deepEqual(squareBounds, {
    minX: 0,
    minY: 0,
    maxX: 126,
    maxY: 84,
    width: 126,
    height: 84
  });

  const hexProject = createProject({ width: 1, height: 1, name: "Hex" });
  const hexBounds = getMapBounds(hexProject, 10);
  const sqrt3 = Math.sqrt(3);

  assertClose(hexBounds.minX, -(sqrt3 * 10) / 2);
  assertClose(hexBounds.maxX, (sqrt3 * 10) / 2);
  assertClose(hexBounds.minY, -10);
  assertClose(hexBounds.maxY, 10);
  assertClose(hexBounds.width, sqrt3 * 10);
  assertClose(hexBounds.height, 20);
});
