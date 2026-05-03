import test from "node:test";
import assert from "node:assert/strict";

import { createProject } from "../src/project.js";
import { applyCaveWallClearMode, normalizeWallEdges, syncCaveWallEdgesForTerrainChange } from "../src/cave-grid-walls.js";

test("normalizeWallEdges keeps supported directions once", () => {
  assert.deepEqual(normalizeWallEdges(["north", "west", "north", "bad", "", null]), ["north", "west"]);
});

test("applyCaveWallClearMode can cut a void gap without leaving wall borders", () => {
  const project = createProject({ width: 3, height: 1, name: "Gap", mapType: "cave" });
  project.cells[0].terrain = "chamber";
  project.cells[1].terrain = "chamber";
  project.cells[2].terrain = "chamber";
  project.cells[0].wallEdges = ["east"];
  project.cells[2].wallEdges = ["west"];

  applyCaveWallClearMode(project, 1, 0, {
    defaultTerrain: "rock",
    addWallBorders: false
  });

  assert.deepEqual(project.cells[0].wallEdges, []);
  assert.deepEqual(project.cells[1].wallEdges, []);
  assert.deepEqual(project.cells[2].wallEdges, []);
});

test("applyCaveWallClearMode can leave wall borders on neighboring open cave tiles", () => {
  const project = createProject({ width: 3, height: 1, name: "Wall", mapType: "cave" });
  project.cells[0].terrain = "chamber";
  project.cells[1].terrain = "chamber";
  project.cells[2].terrain = "crystal_field";

  applyCaveWallClearMode(project, 1, 0, {
    defaultTerrain: "rock",
    addWallBorders: true
  });

  assert.deepEqual(project.cells[0].wallEdges, ["east"]);
  assert.deepEqual(project.cells[1].wallEdges, []);
  assert.deepEqual(project.cells[2].wallEdges, ["west"]);
});

test("syncCaveWallEdgesForTerrainChange removes borders when a passage is reopened", () => {
  const project = createProject({ width: 3, height: 1, name: "Reopen", mapType: "cave" });
  project.cells[0].terrain = "chamber";
  project.cells[1].terrain = "rock";
  project.cells[2].terrain = "chamber";
  project.cells[0].wallEdges = ["east"];
  project.cells[2].wallEdges = ["west"];

  project.cells[1].terrain = "chamber";
  syncCaveWallEdgesForTerrainChange(project, 1, 0, "rock");

  assert.deepEqual(project.cells[0].wallEdges, []);
  assert.deepEqual(project.cells[1].wallEdges, []);
  assert.deepEqual(project.cells[2].wallEdges, []);
});

test("syncCaveWallEdgesForTerrainChange preserves walls that still face rock", () => {
  const project = createProject({ width: 2, height: 1, name: "Preserve", mapType: "cave" });
  project.cells[0].terrain = "chamber";
  project.cells[0].wallEdges = ["west"];
  project.cells[1].terrain = "rock";

  project.cells[0].terrain = "crystal_field";
  syncCaveWallEdgesForTerrainChange(project, 0, 0, "rock");

  assert.deepEqual(project.cells[0].wallEdges, ["west"]);
});
