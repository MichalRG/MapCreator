import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPaintMaskPlan,
  getRejoinedStrokeMaskLineWidth,
  getStrokeMaskLineWidth,
  getVisibleOverlayMaskLineWidth,
  orderPaintStrokesForRendering
} from "../src/cave-render.js";

test("erase mask width matches the visible rubber stroke while paint masks stay expanded", () => {
  assert.equal(getStrokeMaskLineWidth({ tool: "erase", size: 50 }), 51);
  assert.equal(getStrokeMaskLineWidth({ tool: "floor", size: 50 }), 80);
  assert.equal(getRejoinedStrokeMaskLineWidth({ tool: "floor", size: 50 }), 45);
  assert.equal(getVisibleOverlayMaskLineWidth({ tool: "water", size: 50 }), 50);
});

test("orderPaintStrokesForRendering keeps erase in timeline order while painting parent rock first within each segment", () => {
  const ordered = orderPaintStrokesForRendering([
    { id: "floor-1", tool: "floor" },
    { id: "erase-1", tool: "erase" },
    { id: "wall-1", tool: "wall" },
    { id: "water-1", tool: "water" },
    { id: "wall-2", tool: "wall" },
    { id: "floor-2", tool: "floor" },
    { id: "erase-2", tool: "erase" },
    { id: "water-2", tool: "water" }
  ]);

  assert.deepEqual(
    ordered.map((stroke) => stroke.id),
    ["floor-1", "erase-1", "wall-1", "wall-2", "water-1", "floor-2", "erase-2", "water-2"]
  );
});

test("buildPaintMaskPlan starts a new floor merge group after erase on the same layer", () => {
  const plan = buildPaintMaskPlan([
    {
      id: "floor-1",
      tool: "floor",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 80,
      opacity: 1,
      mergeTouches: true,
      points: [
        { x: 0, y: 40 },
        { x: 200, y: 40 }
      ]
    },
    {
      id: "erase-1",
      tool: "erase",
      brushShape: "circle",
      size: 120,
      opacity: 1,
      mergeTouches: false,
      points: [{ x: 100, y: 40 }]
    },
    {
      id: "floor-2",
      tool: "floor",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 60,
      opacity: 1,
      mergeTouches: true,
      points: [{ x: 100, y: 40 }]
    }
  ]);

  assert.equal(plan.length, 2);
  assert.deepEqual(
    plan[0].strokes.map((stroke) => stroke.id),
    ["floor-1"]
  );
  assert.deepEqual(
    plan[0].maskSteps.map((step) => `${step.type}:${step.stroke.id}`),
    ["paint:floor-1", "erase:erase-1"]
  );
  assert.deepEqual(
    plan[1].strokes.map((stroke) => stroke.id),
    ["floor-2"]
  );
  assert.deepEqual(
    plan[1].maskSteps.map((step) => `${step.type}:${step.stroke.id}`),
    ["paint:floor-2"]
  );
});

test("buildPaintMaskPlan rejoins floor paint after erase when it touches visible same-layer floor", () => {
  const plan = buildPaintMaskPlan([
    {
      id: "floor-1",
      tool: "floor",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 80,
      opacity: 1,
      mergeTouches: true,
      points: [{ x: 40, y: 40 }]
    },
    {
      id: "erase-1",
      tool: "erase",
      brushShape: "circle",
      size: 32,
      opacity: 1,
      mergeTouches: false,
      points: [{ x: 92, y: 40 }]
    },
    {
      id: "floor-2",
      tool: "floor",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 80,
      opacity: 1,
      mergeTouches: true,
      points: [{ x: 54, y: 40 }]
    }
  ]);

  assert.equal(plan.length, 1);
  assert.deepEqual(
    plan[0].strokes.map((stroke) => stroke.id),
    ["floor-1", "floor-2"]
  );
  assert.deepEqual(
    plan[0].maskSteps.map((step) => `${step.type}:${step.stroke.id}`),
    ["paint:floor-1", "erase:erase-1", "paint:floor-2"]
  );
  assert.equal(plan[0].maskSteps[0].maskLineWidth, undefined);
  assert.equal(plan[0].maskSteps[2].maskLineWidth, 72);
});

test("buildPaintMaskPlan keeps later strokes in a rejoined floor group clipped to brush width", () => {
  const plan = buildPaintMaskPlan([
    {
      id: "floor-1",
      tool: "floor",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 80,
      opacity: 1,
      mergeTouches: true,
      points: [{ x: 40, y: 40 }]
    },
    {
      id: "erase-1",
      tool: "erase",
      brushShape: "circle",
      size: 32,
      opacity: 1,
      mergeTouches: false,
      points: [{ x: 92, y: 40 }]
    },
    {
      id: "floor-2",
      tool: "floor",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 80,
      opacity: 1,
      mergeTouches: true,
      points: [{ x: 54, y: 40 }]
    },
    {
      id: "floor-3",
      tool: "floor",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 80,
      opacity: 1,
      mergeTouches: true,
      points: [{ x: 68, y: 40 }]
    }
  ]);

  assert.equal(plan.length, 1);
  assert.deepEqual(
    plan[0].maskSteps.map((step) => step.maskLineWidth),
    [undefined, undefined, 72, 72]
  );
});

test("buildPaintMaskPlan starts a new floor detail merge group after erase on the same layer", () => {
  const plan = buildPaintMaskPlan([
    {
      id: "detail-1",
      tool: "floor-detail",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 64,
      opacity: 0.8,
      mergeTouches: true,
      points: [
        { x: 0, y: 40 },
        { x: 140, y: 40 }
      ]
    },
    {
      id: "erase-1",
      tool: "erase",
      brushShape: "circle",
      size: 100,
      opacity: 1,
      mergeTouches: false,
      points: [{ x: 70, y: 40 }]
    },
    {
      id: "detail-2",
      tool: "floor-detail",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 40,
      opacity: 0.8,
      mergeTouches: true,
      points: [{ x: 70, y: 40 }]
    }
  ]);

  assert.equal(plan.length, 2);
  assert.deepEqual(
    plan[0].strokes.map((stroke) => stroke.id),
    ["detail-1"]
  );
  assert.deepEqual(
    plan[0].maskSteps.map((step) => `${step.type}:${step.stroke.id}`),
    ["paint:detail-1", "erase:erase-1"]
  );
  assert.deepEqual(
    plan[1].strokes.map((stroke) => stroke.id),
    ["detail-2"]
  );
  assert.deepEqual(
    plan[1].maskSteps.map((step) => `${step.type}:${step.stroke.id}`),
    ["paint:detail-2"]
  );
});

test("buildPaintMaskPlan still applies later erase strokes to both earlier and later merge groups", () => {
  const plan = buildPaintMaskPlan([
    {
      id: "floor-1",
      tool: "floor",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 80,
      opacity: 1,
      mergeTouches: true,
      points: [
        { x: 0, y: 40 },
        { x: 200, y: 40 }
      ]
    },
    {
      id: "erase-1",
      tool: "erase",
      brushShape: "circle",
      size: 120,
      opacity: 1,
      mergeTouches: false,
      points: [{ x: 100, y: 40 }]
    },
    {
      id: "floor-2",
      tool: "floor",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 60,
      opacity: 1,
      mergeTouches: true,
      points: [{ x: 100, y: 40 }]
    },
    {
      id: "erase-2",
      tool: "erase",
      brushShape: "circle",
      size: 36,
      opacity: 1,
      mergeTouches: false,
      points: [{ x: 90, y: 40 }]
    }
  ]);

  assert.equal(plan.length, 2);
  assert.deepEqual(
    plan[0].maskSteps.map((step) => `${step.type}:${step.stroke.id}`),
    ["paint:floor-1", "erase:erase-1", "erase:erase-2"]
  );
  assert.deepEqual(
    plan[1].maskSteps.map((step) => `${step.type}:${step.stroke.id}`),
    ["paint:floor-2", "erase:erase-2"]
  );
});
