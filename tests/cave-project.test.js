import test from "node:test";
import assert from "node:assert/strict";

import {
  createProject,
  getAllPaintStrokes,
  getPaintLayer,
  getSuggestedPngName,
  getSuggestedProjectName,
  normalizeProject,
  validateProjectShape
} from "../src/cave-project.js";

test("createProject builds a freeform cave draft with default layers", () => {
  const project = createProject({ width: 1800, height: 1200, name: "Lower Warrens" });

  assert.equal(project.version, 5);
  assert.equal(project.kind, "cave-draft");
  assert.equal(project.metadata.gridSize, 64);
  assert.equal(project.paintLayers.length, 5);
  assert.deepEqual(project.paintLayers.map((layer) => layer.id), [
    "layer-1",
    "layer-2",
    "layer-3",
    "layer-4",
    "layer-5"
  ]);
  assert.equal(project.metadata.createdAt, project.metadata.updatedAt);
});

test("normalizeProject migrates version 3 cave drafts into paint layers", () => {
  const normalized = normalizeProject({
    version: 3,
    kind: "cave-draft",
    metadata: {
      name: "Legacy Draft",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
      width: 1600,
      height: 1000,
      gridSize: 48,
      showGrid: true,
      snapToGrid: false
    },
    strokes: [
      {
        id: 12,
        tool: "floor-up",
        size: "24",
        opacity: "0.5",
        points: [{ x: "10", y: "15" }]
      }
    ],
    stamps: [
      {
        id: 7,
        assetKind: "custom",
        assetId: "asset-1",
        x: "120",
        y: "75",
        size: "90",
        rotation: "0.5"
      }
    ],
    customAssets: [
      {
        id: 3,
        name: "Crystal Cluster",
        assetData: "data:image/png;base64,abc",
        assetType: "png"
      }
    ]
  });

  assert.equal(normalized.version, 5);
  assert.equal(normalized.paintLayers.length, 5);
  assert.deepEqual(normalized.paintLayers[0].strokes, [
    {
      id: "12",
      tool: "floor",
      surfaceVariant: "up",
      floorVariant: "up",
      brushShape: "circle",
      size: 24,
      opacity: 0.5,
      mergeTouches: true,
      points: [{ x: 10, y: 15 }]
    }
  ]);
  assert.equal(normalized.stamps[0].layerId, "layer-1");
  assert.equal(normalized.customAssets[0].id, "3");
});

test("normalizeProject preserves supported surface variants and normalizes unknown ones", () => {
  const normalized = normalizeProject({
    version: 5,
    kind: "cave-draft",
    metadata: {
      name: "Variant Test",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
      width: 1600,
      height: 1000,
      gridSize: 64,
      showGrid: true,
      snapToGrid: false
    },
    paintLayers: [
      {
        id: "layer-1",
        name: "Layer 1",
        visible: true,
        strokes: [
          {
            id: "cracked-stroke",
            tool: "floor",
            surfaceVariant: "cracked",
            floorVariant: "cracked",
            size: 36,
            opacity: 0.9,
            points: [{ x: 30, y: 45 }]
          },
          {
            id: "unknown-variant",
            tool: "floor",
            floorVariant: "unknown",
            size: 24,
            opacity: 0.6,
            points: [{ x: 90, y: 110 }]
          },
          {
            id: "wall-jagged",
            tool: "wall",
            surfaceVariant: "jagged",
            size: 40,
            opacity: 0.75,
            points: [{ x: 120, y: 140 }]
          },
          {
            id: "water-pool",
            tool: "water",
            surfaceVariant: "pool",
            size: 30,
            opacity: 0.8,
            points: [{ x: 160, y: 190 }]
          },
          {
            id: "lava-molten",
            tool: "lava",
            surfaceVariant: "molten",
            size: 34,
            opacity: 0.88,
            points: [{ x: 210, y: 250 }]
          },
          {
            id: "chasm-rift",
            tool: "chasm",
            surfaceVariant: "rift",
            size: 50,
            opacity: 0.92,
            points: [{ x: 260, y: 320 }]
          },
          {
            id: "erase-wall",
            tool: "erase",
            surfaceVariant: "wall",
            size: 42,
            opacity: 1,
            points: [{ x: 300, y: 350 }]
          }
        ]
      }
    ],
    stamps: [],
    customAssets: []
  });

  assert.equal(normalized.paintLayers[0].strokes[0].surfaceVariant, "cracked");
  assert.equal(normalized.paintLayers[0].strokes[0].floorVariant, "cracked");
  assert.equal(normalized.paintLayers[0].strokes[1].surfaceVariant, "normal");
  assert.equal(normalized.paintLayers[0].strokes[2].surfaceVariant, "jagged");
  assert.equal(normalized.paintLayers[0].strokes[2].floorVariant, "normal");
  assert.equal(normalized.paintLayers[0].strokes[3].surfaceVariant, "pool");
  assert.equal(normalized.paintLayers[0].strokes[4].surfaceVariant, "molten");
  assert.equal(normalized.paintLayers[0].strokes[5].surfaceVariant, "rift");
  assert.equal(normalized.paintLayers[0].strokes[6].surfaceVariant, "wall");
});

test("normalizeProject preserves square brush strokes and defaults invalid brush shapes to circle", () => {
  const normalized = normalizeProject({
    version: 5,
    kind: "cave-draft",
    metadata: {
      name: "Brush Shape Test",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
      width: 1600,
      height: 1000,
      gridSize: 64,
      showGrid: true,
      snapToGrid: false
    },
    paintLayers: [
      {
        id: "layer-1",
        name: "Layer 1",
        visible: true,
        strokes: [
          {
            id: "square-stroke",
            tool: "wall",
            brushShape: "square",
            size: 42,
            opacity: 0.85,
            points: [{ x: 40, y: 60 }]
          },
          {
            id: "invalid-shape",
            tool: "water",
            brushShape: "triangle",
            size: 30,
            opacity: 0.7,
            points: [{ x: 100, y: 120 }]
          }
        ]
      }
    ],
    stamps: [],
    customAssets: []
  });

  assert.equal(normalized.paintLayers[0].strokes[0].brushShape, "square");
  assert.equal(normalized.paintLayers[0].strokes[1].brushShape, "circle");
});

test("normalizeProject preserves floor detail strokes as paint-layer content", () => {
  const normalized = normalizeProject({
    version: 5,
    kind: "cave-draft",
    metadata: {
      name: "Floor Detail Test",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
      width: 1600,
      height: 1000,
      gridSize: 64,
      showGrid: true,
      snapToGrid: false
    },
    paintLayers: [
      {
        id: "layer-1",
        name: "Layer 1",
        visible: true,
        strokes: [
          {
            id: "detail-stroke",
            tool: "floor-detail",
            brushShape: "square",
            size: 52,
            opacity: 0.64,
            mergeTouches: false,
            points: [{ x: 45, y: 65 }]
          }
        ]
      }
    ],
    stamps: [],
    customAssets: []
  });

  assert.deepEqual(normalized.paintLayers[0].strokes[0], {
    id: "detail-stroke",
    tool: "floor-detail",
    surfaceVariant: "normal",
    floorVariant: "normal",
    brushShape: "square",
    size: 52,
    opacity: 0.64,
    mergeTouches: false,
    points: [{ x: 45, y: 65 }]
  });
});

test("normalizeProject rejects older grid cave files", () => {
  assert.throws(
    () =>
      normalizeProject({
        version: 2,
        metadata: { mapType: "cave" }
      }),
    /Grid cave projects from the older editor are not supported/
  );
});

test("getPaintLayer and getAllPaintStrokes expose layer-based content", () => {
  const project = createProject({ width: 1800, height: 1200, name: "Layer Test" });
  project.paintLayers[1].strokes.push({ id: "a" }, { id: "b" });
  project.paintLayers[3].strokes.push({ id: "c" });

  assert.equal(getPaintLayer(project, "layer-2"), project.paintLayers[1]);
  assert.equal(getPaintLayer(project, "missing"), project.paintLayers[0]);
  assert.deepEqual(getAllPaintStrokes(project), [{ id: "a" }, { id: "b" }, { id: "c" }]);
});

test("validateProjectShape rejects too-small canvases and invalid stamp layer references", () => {
  const smallProject = createProject({ width: 640, height: 480, name: "Tiny" });
  assert.throws(() => validateProjectShape(smallProject), /Project dimensions are too small/);

  const project = createProject({ width: 1800, height: 1200, name: "Stamp Layers" });
  project.stamps.push({
    id: "stamp-1",
    assetKind: "builtin",
    assetId: "treasure",
    layerId: "missing-layer",
    x: 0,
    y: 0,
    size: 80,
    rotation: 0
  });

  assert.throws(() => validateProjectShape(project), /Project detail layers are invalid/);
});

test("freeform cave draft file names are slugged correctly", () => {
  const project = createProject({ width: 1800, height: 1200, name: " Vault of Echoes " });

  assert.equal(getSuggestedProjectName(project), "vault-of-echoes.caveforge.json");
  assert.equal(getSuggestedPngName(project), "vault-of-echoes.caveforge.png");
});
