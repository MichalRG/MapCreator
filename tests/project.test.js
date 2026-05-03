import test from "node:test";
import assert from "node:assert/strict";

import {
  createProject,
  getSuggestedPngName,
  getSuggestedProjectName,
  listCustomPlacementsForCell,
  normalizeProject,
  validateProjectShape
} from "../src/project.js";

test("createProject builds a grid world project with metadata and empty cells", () => {
  const project = createProject({ width: 3, height: 2, name: "Overland" });

  assert.equal(project.version, 2);
  assert.equal(project.metadata.name, "Overland");
  assert.equal(project.metadata.mapType, "hex-world");
  assert.equal(project.metadata.gridLayout, "hex-pointy");
  assert.equal(project.cells.length, 6);
  assert.deepEqual(project.cells[0], {
    col: 0,
    row: 0,
    terrain: "plains",
    terrainLabel: "",
    overlays: [],
    overlayLabels: {},
    wallEdges: [],
    customPlacementIds: []
  });
  assert.equal(project.metadata.createdAt, project.metadata.updatedAt);
});

test("createProject respects cave map defaults", () => {
  const project = createProject({ width: 2, height: 2, name: "Depths", mapType: "cave" });

  assert.equal(project.metadata.mapType, "cave");
  assert.equal(project.metadata.gridLayout, "square");
  assert.equal(project.cells[0].terrain, "rock");
});

test("normalizeProject migrates version 1 projects to version 2", () => {
  const legacyProject = {
    version: 1,
    metadata: {
      name: "Legacy Map",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      width: 1,
      height: 2
    },
    cells: [
      { col: 0, row: 0, terrain: "forest" },
      { col: 0, row: 1, terrain: "lake", overlays: ["village"], customPlacementIds: ["a"] }
    ]
  };

  const normalized = normalizeProject(legacyProject);

  assert.equal(normalized.version, 2);
  assert.equal(normalized.metadata.mapType, "hex-world");
  assert.equal(normalized.metadata.gridLayout, "hex-pointy");
  assert.equal(normalized.cells[0].terrainLabel, "");
  assert.deepEqual(normalized.cells[0].overlays, []);
  assert.deepEqual(normalized.cells[0].overlayLabels, {});
  assert.deepEqual(normalized.cells[0].wallEdges, []);
  assert.deepEqual(normalized.cells[0].customPlacementIds, []);
  assert.equal(normalized.cells[1].terrainLabel, "");
  assert.deepEqual(normalized.cells[1].overlays, ["village"]);
  assert.deepEqual(normalized.cells[1].overlayLabels, {});
  assert.deepEqual(normalized.cells[1].wallEdges, []);
  assert.deepEqual(normalized.cells[1].customPlacementIds, ["a"]);
  assert.deepEqual(normalized.edgeFeatures, []);
  assert.deepEqual(normalized.customSymbols, []);
  assert.deepEqual(normalized.customPlacements, []);
});

test("normalizeProject trims and preserves optional cell labels", () => {
  const project = createProject({ width: 1, height: 1, name: "Labels" });
  project.cells[0].terrainLabel = "  North Reach  ";
  project.cells[0].overlayLabels = {
    village: "  Riverwatch  ",
    tower: "   "
  };

  const normalized = normalizeProject(project);

  assert.equal(normalized.cells[0].terrainLabel, "North Reach");
  assert.deepEqual(normalized.cells[0].overlayLabels, {
    village: "Riverwatch"
  });
});

test("normalizeProject preserves valid cave wall edges and drops invalid entries", () => {
  const project = createProject({ width: 1, height: 1, name: "Walls", mapType: "cave" });
  project.cells[0].wallEdges = ["north", "east", "north", "bogus"];

  const normalized = normalizeProject(project);

  assert.deepEqual(normalized.cells[0].wallEdges, ["north", "east"]);
});

test("validateProjectShape accepts valid projects and rejects inconsistent cell counts", () => {
  const project = createProject({ width: 2, height: 2, name: "Shape Test" });

  assert.equal(validateProjectShape(project), true);

  const brokenProject = {
    ...project,
    cells: project.cells.slice(0, 3)
  };

  assert.throws(
    () => validateProjectShape(brokenProject),
    /Project cell count does not match the declared dimensions/
  );
});

test("project file names are slugged and use map-specific extensions", () => {
  const project = createProject({ width: 2, height: 2, name: " The Deep Roads! ", mapType: "cave" });

  assert.equal(getSuggestedProjectName(project), "the-deep-roads.cavemap.json");
  assert.equal(getSuggestedPngName(project), "the-deep-roads.cavemap.png");
});

test("listCustomPlacementsForCell resolves placement ids for a cell and ignores missing ones", () => {
  const project = createProject({ width: 2, height: 1, name: "Symbols" });
  project.cells[0].customPlacementIds = ["keep", "missing", "camp"];
  project.customPlacements = [
    { id: "keep", name: "Keep" },
    { id: "camp", name: "Camp" }
  ];

  assert.deepEqual(listCustomPlacementsForCell(project, 0, 0), [
    { id: "keep", name: "Keep" },
    { id: "camp", name: "Camp" }
  ]);
  assert.deepEqual(listCustomPlacementsForCell(project, 5, 5), []);
});
