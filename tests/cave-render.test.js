import test from "node:test";
import assert from "node:assert/strict";

import { orderPaintStrokesForRendering } from "../src/cave-render.js";

test("orderPaintStrokesForRendering paints parent rock before other surfaces and erase last", () => {
  const ordered = orderPaintStrokesForRendering([
    { id: "floor-1", tool: "floor" },
    { id: "erase-1", tool: "erase" },
    { id: "wall-1", tool: "wall" },
    { id: "water-1", tool: "water" },
    { id: "wall-2", tool: "wall" }
  ]);

  assert.deepEqual(
    ordered.map((stroke) => stroke.id),
    ["wall-1", "wall-2", "floor-1", "water-1", "erase-1"]
  );
});
