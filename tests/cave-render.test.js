import test from "node:test";
import assert from "node:assert/strict";

import { buildPaintMaskPlan, getStrokeMaskLineWidth, orderPaintStrokesForRendering } from "../src/cave-render.js";

test("erase mask width matches the visible rubber stroke while paint masks stay expanded", () => {
  assert.equal(getStrokeMaskLineWidth({ tool: "erase", size: 50 }), 51);
  assert.equal(getStrokeMaskLineWidth({ tool: "floor", size: 50 }), 80);
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

test("buildPaintMaskPlan reconnects same floor paint across erase on the same layer", () => {
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
      size: 40,
      opacity: 1,
      mergeTouches: false,
      points: [{ x: 60, y: 40 }]
    },
    {
      id: "floor-2",
      tool: "floor",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 80,
      opacity: 1,
      mergeTouches: true,
      points: [{ x: 80, y: 40 }]
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
});

test("buildPaintMaskPlan reconnects floor detail paint across erase on the same layer", () => {
  const plan = buildPaintMaskPlan([
    {
      id: "detail-1",
      tool: "floor-detail",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 64,
      opacity: 0.8,
      mergeTouches: true,
      points: [{ x: 40, y: 40 }]
    },
    {
      id: "erase-1",
      tool: "erase",
      brushShape: "circle",
      size: 36,
      opacity: 1,
      mergeTouches: false,
      points: [{ x: 60, y: 40 }]
    },
    {
      id: "detail-2",
      tool: "floor-detail",
      brushShape: "circle",
      surfaceVariant: "normal",
      size: 64,
      opacity: 0.8,
      mergeTouches: true,
      points: [{ x: 80, y: 40 }]
    }
  ]);

  assert.equal(plan.length, 1);
  assert.deepEqual(
    plan[0].strokes.map((stroke) => stroke.id),
    ["detail-1", "detail-2"]
  );
  assert.deepEqual(
    plan[0].maskSteps.map((step) => `${step.type}:${step.stroke.id}`),
    ["paint:detail-1", "erase:erase-1", "paint:detail-2"]
  );
});
