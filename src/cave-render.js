import { drawBuiltinAsset, drawBuiltinDoorCutout, getBuiltinAsset, isBuiltinDoorAsset } from "./cave-assets.js";
import { getStrokeSurfaceVariant } from "./cave-surface-variants.js";
import { getPaintLayers } from "./cave-project.js";

const CRACKED_FLOOR_TEXTURE = typeof Image === "function" ? new Image() : null;
if (CRACKED_FLOOR_TEXTURE) {
  CRACKED_FLOOR_TEXTURE.decoding = "async";
  CRACKED_FLOOR_TEXTURE.src = new URL("../floor.png", import.meta.url).href;
}

let crackedFloorGroundTile = null;
const proceduralPatternTiles = new Map();

function clampAlpha(value) {
  return Math.max(0, Math.min(1, value));
}

function hashSeedPart(seed, value) {
  const text = String(value);
  let nextSeed = seed >>> 0;

  for (let index = 0; index < text.length; index += 1) {
    nextSeed ^= text.charCodeAt(index);
    nextSeed = Math.imul(nextSeed, 16777619);
  }

  return nextSeed >>> 0;
}

function hashStrokeSeed(stroke) {
  let seed = 2166136261;
  seed = hashSeedPart(seed, stroke.id || "");
  seed = hashSeedPart(seed, stroke.tool || "");
  seed = hashSeedPart(seed, stroke.size || 0);
  seed = hashSeedPart(seed, stroke.opacity || 0);
  seed = hashSeedPart(seed, stroke.brushShape || "circle");

  (stroke.points || []).forEach((point) => {
    seed = hashSeedPart(seed, Math.round(Number(point?.x || 0) * 10));
    seed = hashSeedPart(seed, Math.round(Number(point?.y || 0) * 10));
  });

  return seed >>> 0;
}

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function appendStrokePath(ctx, points, size) {
  if (!points.length) {
    return false;
  }

  if (points.length === 1) {
    const epsilon = Math.max(0.01, size * 0.001);
    ctx.moveTo(points[0].x - epsilon / 2, points[0].y);
    ctx.lineTo(points[0].x + epsilon / 2, points[0].y);
    return true;
  }

  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  return true;
}

function buildStrokePath(ctx, points, size) {
  ctx.beginPath();
  return appendStrokePath(ctx, points, size);
}

function floorFamilyTool(tool) {
  return tool === "floor";
}

function isCrackedFloorVariant(variant) {
  return variant === "cracked";
}

function isWallBorderEraseVariant(variant) {
  return variant === "wall";
}

function strokeRenderFamily(stroke) {
  const variant = getStrokeSurfaceVariant(stroke);

  if (stroke.tool === "floor-detail") {
    return "floor-detail";
  }

  if (floorFamilyTool(stroke.tool)) {
    return isCrackedFloorVariant(variant) ? "floor-cracked" : "floor-family";
  }

  switch (stroke.tool) {
    case "wall":
      return variant === "jagged" ? "wall-jagged" : "wall";
    case "water":
      return variant === "pool" ? "water-pool" : "water";
    case "lava":
      return variant === "molten" ? "lava-molten" : "lava";
    case "chasm":
      return variant === "rift" ? "chasm-rift" : "chasm";
    default:
      return stroke.tool;
  }
}

function getCrackedFloorGroundPattern(ctx) {
  if (!CRACKED_FLOOR_TEXTURE?.complete || !CRACKED_FLOOR_TEXTURE.naturalWidth) {
    return null;
  }

  if (!crackedFloorGroundTile) {
    const tile = document.createElement("canvas");
    tile.width = 192;
    tile.height = 192;
    const tileCtx = tile.getContext("2d");
    if (!tileCtx) {
      return null;
    }

    const sourceWidth = CRACKED_FLOOR_TEXTURE.naturalWidth;
    const sourceHeight = CRACKED_FLOOR_TEXTURE.naturalHeight;
    const cropWidth = Math.max(1, Math.round(sourceWidth * 0.28));
    const cropHeight = Math.max(1, Math.round(sourceHeight * 0.28));
    const cropX = Math.round(sourceWidth * 0.08);
    const cropY = Math.round(sourceHeight * 0.08);

    tileCtx.filter = "blur(1px) contrast(0.82) brightness(0.78)";
    tileCtx.drawImage(CRACKED_FLOOR_TEXTURE, cropX, cropY, cropWidth, cropHeight, 0, 0, tile.width, tile.height);
    tileCtx.filter = "none";
    tileCtx.fillStyle = "rgba(60, 48, 40, 0.12)";
    tileCtx.fillRect(0, 0, tile.width, tile.height);
    crackedFloorGroundTile = tile;
  }

  return ctx.createPattern(crackedFloorGroundTile, "repeat");
}

function buildTextureTile(width, height, draw) {
  const tile = document.createElement("canvas");
  tile.width = width;
  tile.height = height;
  const ctx = tile.getContext("2d");
  if (!ctx) {
    return null;
  }

  draw(ctx, width, height);
  return tile;
}

function drawPatternPolyline(ctx, points) {
  if (!points.length) {
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index][0], points[index][1]);
  }
  ctx.stroke();
}

function createProceduralPatternTile(key) {
  switch (key) {
    case "wall-jagged":
      return buildTextureTile(132, 132, (ctx, width, height) => {
        ctx.fillStyle = "#312721";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(129, 111, 96, 0.4)";
        ctx.lineWidth = 5;
        [
          [
            [8, 24],
            [34, 12],
            [66, 26],
            [98, 16],
            [124, 28]
          ],
          [
            [4, 84],
            [26, 70],
            [58, 86],
            [92, 76],
            [128, 94]
          ]
        ].forEach((line) => drawPatternPolyline(ctx, line));

        ctx.strokeStyle = "rgba(196, 180, 160, 0.16)";
        ctx.lineWidth = 2.5;
        [
          [
            [18, 44],
            [36, 58],
            [52, 38],
            [72, 50]
          ],
          [
            [84, 102],
            [104, 88],
            [120, 108]
          ],
          [
            [92, 38],
            [112, 52],
            [126, 34]
          ]
        ].forEach((line) => drawPatternPolyline(ctx, line));

        ctx.fillStyle = "rgba(208, 188, 166, 0.12)";
        [
          [24, 18, 5],
          [76, 64, 4],
          [112, 22, 3],
          [38, 104, 5],
          [94, 110, 4]
        ].forEach(([x, y, radius]) => {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        });
      });
    case "water-pool":
      return buildTextureTile(148, 148, (ctx, width, height) => {
        ctx.fillStyle = "#143645";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(92, 173, 205, 0.22)";
        ctx.lineWidth = 3;
        [
          [
            [10, 40],
            [40, 32],
            [72, 40],
            [108, 34],
            [138, 40]
          ],
          [
            [18, 88],
            [52, 78],
            [86, 88],
            [124, 82]
          ],
          [
            [16, 122],
            [46, 114],
            [78, 122],
            [112, 116]
          ]
        ].forEach((line) => drawPatternPolyline(ctx, line));

        ctx.strokeStyle = "rgba(176, 229, 248, 0.14)";
        ctx.lineWidth = 2;
        [
          [
            [32, 54],
            [50, 50],
            [70, 54]
          ],
          [
            [92, 100],
            [114, 96],
            [132, 102]
          ]
        ].forEach((line) => drawPatternPolyline(ctx, line));

        ctx.fillStyle = "rgba(8, 19, 28, 0.16)";
        [
          [44, 18, 20, 10],
          [102, 56, 24, 12],
          [26, 96, 18, 10],
          [98, 124, 26, 12]
        ].forEach(([x, y, widthValue, heightValue]) => {
          ctx.beginPath();
          ctx.ellipse(x, y, widthValue, heightValue, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      });
    case "lava-molten":
      return buildTextureTile(136, 136, (ctx, width, height) => {
        ctx.fillStyle = "#43140c";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(255, 132, 42, 0.56)";
        ctx.lineWidth = 7;
        [
          [
            [12, 24],
            [38, 36],
            [62, 20],
            [88, 34],
            [120, 18]
          ],
          [
            [8, 84],
            [34, 72],
            [56, 90],
            [80, 70],
            [114, 86]
          ]
        ].forEach((line) => drawPatternPolyline(ctx, line));

        ctx.strokeStyle = "rgba(255, 220, 118, 0.44)";
        ctx.lineWidth = 3;
        [
          [
            [24, 28],
            [40, 34],
            [56, 26]
          ],
          [
            [70, 86],
            [88, 78],
            [104, 84]
          ]
        ].forEach((line) => drawPatternPolyline(ctx, line));

        ctx.fillStyle = "rgba(255, 202, 94, 0.4)";
        [
          [24, 96, 5],
          [52, 108, 4],
          [94, 28, 4],
          [116, 96, 5]
        ].forEach(([x, y, radius]) => {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        });
      });
    case "chasm-rift":
      return buildTextureTile(136, 136, (ctx, width, height) => {
        ctx.fillStyle = "#0a0807";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(96, 84, 72, 0.26)";
        ctx.lineWidth = 4;
        [
          [
            [12, 20],
            [34, 38],
            [58, 24],
            [82, 42],
            [112, 26]
          ],
          [
            [20, 94],
            [42, 80],
            [66, 96],
            [92, 82],
            [122, 98]
          ]
        ].forEach((line) => drawPatternPolyline(ctx, line));

        ctx.strokeStyle = "rgba(156, 139, 122, 0.14)";
        ctx.lineWidth = 2;
        [
          [
            [18, 60],
            [32, 54],
            [48, 64]
          ],
          [
            [82, 112],
            [96, 102],
            [114, 116]
          ]
        ].forEach((line) => drawPatternPolyline(ctx, line));
      });
    default:
      return null;
  }
}

function getProceduralPattern(ctx, key) {
  if (!proceduralPatternTiles.has(key)) {
    proceduralPatternTiles.set(key, createProceduralPatternTile(key));
  }

  const tile = proceduralPatternTiles.get(key);
  return tile ? ctx.createPattern(tile, "repeat") : null;
}

function getBrushShape(value) {
  return value === "square" ? "square" : "circle";
}

function applyBrushShapeToContext(ctx, brushShape) {
  if (getBrushShape(brushShape) === "square") {
    ctx.lineCap = "square";
    ctx.lineJoin = "bevel";
    return;
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function drawLayeredStroke(ctx, opacity, layers, pathBuilder, brushShape = "circle") {
  ctx.save();
  applyBrushShapeToContext(ctx, brushShape);

  layers.forEach((layer) => {
    ctx.globalAlpha = clampAlpha(opacity * (layer.alpha ?? 1));
    ctx.shadowBlur = layer.shadowBlur ?? 0;
    ctx.shadowColor = layer.shadowColor || "rgba(0, 0, 0, 0)";
    ctx.strokeStyle = typeof layer.strokeStyle === "function" ? layer.strokeStyle(ctx) : layer.strokeStyle;
    ctx.lineWidth = typeof layer.lineWidth === "function" ? layer.lineWidth() : layer.lineWidth;
    ctx.setLineDash(layer.lineDash || []);
    if (pathBuilder(layer.pathScale ?? 1)) {
      ctx.stroke();
    }
  });

  ctx.restore();
}

function singleStrokePathBuilder(ctx, stroke) {
  return (pathScale = 1) => buildStrokePath(ctx, stroke.points, stroke.size * pathScale);
}

function groupedStrokePathBuilder(ctx, strokes) {
  return (pathScale = 1) => buildGroupedPath(ctx, strokes, pathScale);
}

function getFloorLayers(stroke) {
  if (isCrackedFloorVariant(getStrokeSurfaceVariant(stroke))) {
    return [
      {
        shadowBlur: stroke.size * 0.22,
        shadowColor: "rgba(0, 0, 0, 0.44)",
        strokeStyle: "#3d2f27",
        lineWidth: stroke.size * 1.06
      },
      {
        alpha: 0.9,
        strokeStyle: "rgba(124, 106, 90, 0.88)",
        lineWidth: stroke.size * 0.94,
        pathScale: 0.94
      },
      {
        alpha: 0.92,
        strokeStyle: "rgba(82, 69, 59, 0.94)",
        lineWidth: stroke.size * 0.8,
        pathScale: 0.8
      },
      {
        alpha: 0.24,
        strokeStyle: (ctx) => getCrackedFloorGroundPattern(ctx) || "rgba(128, 110, 94, 0.24)",
        lineWidth: stroke.size * 0.68,
        pathScale: 0.68
      },
      {
        alpha: 0.26,
        strokeStyle: "rgba(39, 30, 26, 0.72)",
        lineWidth: stroke.size * 0.28,
        pathScale: 0.28
      },
      {
        alpha: 0.1,
        strokeStyle: "rgba(206, 190, 168, 0.44)",
        lineWidth: stroke.size * 0.18,
        pathScale: 0.18
      }
    ];
  }

  return [
    {
      shadowBlur: stroke.size * 0.18,
      shadowColor: "rgba(0, 0, 0, 0.28)",
      strokeStyle: "#7c6550",
      lineWidth: stroke.size
    },
    {
      strokeStyle: "rgba(214, 187, 146, 0.3)",
      lineWidth: stroke.size * 0.7,
      pathScale: 0.7
    }
  ];
}

function getWallLayers(stroke) {
  if (getStrokeSurfaceVariant(stroke) === "jagged") {
    return [
      {
        shadowBlur: stroke.size * 0.16,
        shadowColor: "rgba(0, 0, 0, 0.48)",
        strokeStyle: "#181311",
        lineWidth: stroke.size * 0.98
      },
      {
        alpha: 0.88,
        strokeStyle: (ctx) => getProceduralPattern(ctx, "wall-jagged") || "rgba(91, 77, 66, 0.5)",
        lineWidth: stroke.size * 0.74,
        pathScale: 0.74
      },
      {
        alpha: 0.26,
        strokeStyle: "rgba(206, 188, 166, 0.16)",
        lineWidth: stroke.size * 0.88,
        pathScale: 0.88
      }
    ];
  }

  return [
    {
      shadowBlur: stroke.size * 0.15,
      shadowColor: "rgba(0, 0, 0, 0.45)",
      strokeStyle: "#1c1714",
      lineWidth: stroke.size * 0.94
    },
    {
      alpha: 0.76,
      strokeStyle: "rgba(88, 76, 68, 0.44)",
      lineWidth: stroke.size * 0.68,
      pathScale: 0.68
    }
  ];
}

function getWaterLayers(stroke) {
  if (getStrokeSurfaceVariant(stroke) === "pool") {
    return [
      {
        shadowBlur: stroke.size * 0.18,
        shadowColor: "rgba(43, 108, 148, 0.3)",
        strokeStyle: "#173b4a",
        lineWidth: stroke.size * 0.84,
        pathScale: 0.84
      },
      {
        alpha: 0.84,
        strokeStyle: (ctx) => getProceduralPattern(ctx, "water-pool") || "rgba(89, 162, 201, 0.48)",
        lineWidth: stroke.size * 0.7,
        pathScale: 0.7
      },
      {
        alpha: 0.7,
        strokeStyle: "rgba(180, 230, 248, 0.54)",
        lineWidth: stroke.size * 0.22,
        pathScale: 0.22
      }
    ];
  }

  return [
    {
      shadowBlur: stroke.size * 0.2,
      shadowColor: "rgba(57, 122, 168, 0.3)",
      strokeStyle: "#274f66",
      lineWidth: stroke.size * 0.82,
      pathScale: 0.82
    },
    {
      strokeStyle: "rgba(122, 188, 226, 0.44)",
      lineWidth: stroke.size * 0.34,
      pathScale: 0.34
    }
  ];
}

function getLavaLayers(stroke) {
  if (getStrokeSurfaceVariant(stroke) === "molten") {
    return [
      {
        shadowBlur: stroke.size * 0.28,
        shadowColor: "rgba(255, 110, 28, 0.54)",
        strokeStyle: "#6c2512",
        lineWidth: stroke.size * 0.84,
        pathScale: 0.84
      },
      {
        alpha: 0.92,
        strokeStyle: (ctx) => getProceduralPattern(ctx, "lava-molten") || "rgba(255, 134, 46, 0.74)",
        lineWidth: stroke.size * 0.6,
        pathScale: 0.6
      },
      {
        alpha: 0.94,
        shadowBlur: stroke.size * 0.1,
        shadowColor: "rgba(255, 216, 122, 0.36)",
        strokeStyle: "rgba(255, 224, 126, 0.88)",
        lineWidth: stroke.size * 0.22,
        pathScale: 0.22
      }
    ];
  }

  return [
    {
      shadowBlur: stroke.size * 0.26,
      shadowColor: "rgba(255, 126, 48, 0.52)",
      strokeStyle: "#9f3f1f",
      lineWidth: stroke.size * 0.8,
      pathScale: 0.8
    },
    {
      strokeStyle: "rgba(255, 185, 87, 0.62)",
      lineWidth: stroke.size * 0.28,
      pathScale: 0.28
    }
  ];
}

function getChasmLayers(stroke) {
  if (getStrokeSurfaceVariant(stroke) === "rift") {
    return [
      {
        alpha: 0.72,
        shadowBlur: stroke.size * 0.14,
        shadowColor: "rgba(0, 0, 0, 0.48)",
        strokeStyle: (ctx) => getProceduralPattern(ctx, "chasm-rift") || "rgba(94, 81, 69, 0.34)",
        lineWidth: stroke.size * 0.96,
        pathScale: 0.96
      },
      {
        strokeStyle: "#040404",
        lineWidth: stroke.size * 0.62,
        pathScale: 0.62
      },
      {
        alpha: 0.3,
        strokeStyle: "rgba(144, 128, 112, 0.28)",
        lineWidth: stroke.size * 0.82,
        pathScale: 0.82,
        lineDash: [8, 12]
      }
    ];
  }

  return [
    {
      strokeStyle: "#050505",
      lineWidth: stroke.size * 0.74,
      pathScale: 0.74
    },
    {
      strokeStyle: "rgba(116, 101, 86, 0.35)",
      lineWidth: stroke.size * 0.92,
      pathScale: 0.92,
      lineDash: [10, 14]
    }
  ];
}

function drawFloorDirectionArrow(ctx, x, y, size, direction, color) {
  const shaft = size * 0.52;
  const wing = size * 0.24;

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(32, 26, 22, 0.34)";
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.52, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.6, size * 0.1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  if (direction === "up") {
    ctx.moveTo(0, shaft * 0.38);
    ctx.lineTo(0, -shaft * 0.34);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -shaft * 0.52);
    ctx.lineTo(-wing, -shaft * 0.18);
    ctx.lineTo(-wing * 0.28, -shaft * 0.18);
    ctx.lineTo(-wing * 0.28, shaft * 0.18);
    ctx.lineTo(wing * 0.28, shaft * 0.18);
    ctx.lineTo(wing * 0.28, -shaft * 0.18);
    ctx.lineTo(wing, -shaft * 0.18);
  } else {
    ctx.moveTo(0, -shaft * 0.38);
    ctx.lineTo(0, shaft * 0.34);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, shaft * 0.52);
    ctx.lineTo(-wing, shaft * 0.18);
    ctx.lineTo(-wing * 0.28, shaft * 0.18);
    ctx.lineTo(-wing * 0.28, -shaft * 0.18);
    ctx.lineTo(wing * 0.28, -shaft * 0.18);
    ctx.lineTo(wing * 0.28, shaft * 0.18);
    ctx.lineTo(wing, shaft * 0.18);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function walkStrokeMarkers(points, spacing, callback) {
  if (!points.length) {
    return;
  }

  if (points.length === 1) {
    callback(points[0]);
    return;
  }

  let remaining = spacing;

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const segmentLength = Math.hypot(dx, dy);

    if (!segmentLength) {
      continue;
    }

    let travelled = 0;
    while (travelled + remaining <= segmentLength) {
      const t = (travelled + remaining) / segmentLength;
      callback({
        x: start.x + dx * t,
        y: start.y + dy * t
      });
      travelled += remaining;
      remaining = spacing;
    }

    remaining -= segmentLength - travelled;
  }
}

function drawFloorVariantMarkers(ctx, stroke) {
  const direction = getStrokeSurfaceVariant(stroke);
  if (direction !== "up" && direction !== "down") {
    return;
  }

  const markerColor = direction === "up" ? "rgba(244, 230, 202, 0.88)" : "rgba(220, 234, 244, 0.84)";
  const markerSize = Math.max(12, stroke.size * 0.26);
  const spacing = Math.max(markerSize * 2.6, stroke.size * 0.95);

  ctx.save();
  ctx.globalAlpha = clampAlpha(stroke.opacity);
  walkStrokeMarkers(stroke.points, spacing, (markerPoint) => {
    drawFloorDirectionArrow(ctx, markerPoint.x, markerPoint.y, markerSize, direction, markerColor);
  });
  ctx.restore();
}

function randomOffsetWithinBrush(random, brushShape, radius) {
  if (getBrushShape(brushShape) === "square") {
    return {
      x: (random() * 2 - 1) * radius,
      y: (random() * 2 - 1) * radius
    };
  }

  const angle = random() * Math.PI * 2;
  const distance = Math.sqrt(random()) * radius;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance
  };
}

function drawFloorDetailPebble(ctx, x, y, radiusX, radiusY, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = "rgba(66, 54, 45, 0.7)";
  ctx.strokeStyle = "rgba(218, 198, 168, 0.18)";
  ctx.lineWidth = Math.max(0.8, Math.min(radiusX, radiusY) * 0.28);
  ctx.shadowBlur = Math.max(radiusX, radiusY) * 1.2;
  ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawFloorDetailScratch(ctx, x, y, length, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.strokeStyle = "rgba(86, 69, 58, 0.36)";
  ctx.lineWidth = Math.max(0.9, length * 0.18);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-length / 2, 0);
  ctx.lineTo(length / 2, 0);
  ctx.stroke();
  ctx.restore();
}

function drawFloorDetailStroke(ctx, stroke) {
  const random = createSeededRandom(hashStrokeSeed(stroke));
  const clusterSpacing = Math.max(14, stroke.size * 0.24);
  const clusterRadius = stroke.size * 0.34;
  const minPebbles = Math.max(2, Math.round(stroke.size / 36));
  const maxPebbles = Math.max(minPebbles + 1, Math.round(stroke.size / 20));

  ctx.save();
  ctx.globalAlpha = clampAlpha(stroke.opacity);

  walkStrokeMarkers(stroke.points, clusterSpacing, (markerPoint) => {
    const pebbleCount = minPebbles + Math.floor(random() * (maxPebbles - minPebbles + 1));

    for (let index = 0; index < pebbleCount; index += 1) {
      const offset = randomOffsetWithinBrush(random, stroke.brushShape, clusterRadius);
      const baseRadius = Math.max(1.4, stroke.size * (0.018 + random() * 0.045));
      drawFloorDetailPebble(
        ctx,
        markerPoint.x + offset.x,
        markerPoint.y + offset.y,
        baseRadius * (0.9 + random() * 0.7),
        baseRadius * (0.6 + random() * 0.45),
        random() * Math.PI * 2
      );
    }

    if (random() < 0.65) {
      const scratchCount = 1 + Math.floor(random() * Math.max(1, stroke.size / 110));
      for (let index = 0; index < scratchCount; index += 1) {
        const offset = randomOffsetWithinBrush(random, stroke.brushShape, clusterRadius * 0.92);
        drawFloorDetailScratch(
          ctx,
          markerPoint.x + offset.x,
          markerPoint.y + offset.y,
          Math.max(4, stroke.size * (0.05 + random() * 0.08)),
          random() * Math.PI * 2
        );
      }
    }
  });

  ctx.restore();
}

function drawFloorStroke(ctx, stroke) {
  drawLayeredStroke(ctx, stroke.opacity, getFloorLayers(stroke), singleStrokePathBuilder(ctx, stroke), stroke.brushShape);
}

function drawGroupedFloorDetail(ctx, strokes) {
  strokes.forEach((stroke) => drawFloorDetailStroke(ctx, stroke));
}

function drawWallStroke(ctx, stroke) {
  drawLayeredStroke(ctx, stroke.opacity, getWallLayers(stroke), singleStrokePathBuilder(ctx, stroke), stroke.brushShape);
}

function drawWaterStroke(ctx, stroke) {
  drawLayeredStroke(ctx, stroke.opacity, getWaterLayers(stroke), singleStrokePathBuilder(ctx, stroke), stroke.brushShape);
}

function drawLavaStroke(ctx, stroke) {
  drawLayeredStroke(ctx, stroke.opacity, getLavaLayers(stroke), singleStrokePathBuilder(ctx, stroke), stroke.brushShape);
}

function drawChasmStroke(ctx, stroke) {
  drawLayeredStroke(ctx, stroke.opacity, getChasmLayers(stroke), singleStrokePathBuilder(ctx, stroke), stroke.brushShape);
}

function drawEraseStroke(ctx, stroke) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.globalAlpha = 1;
  applyBrushShapeToContext(ctx, stroke.brushShape);
  ctx.strokeStyle = "rgba(0, 0, 0, 1)";
  ctx.lineWidth = getRenderedEraseLineWidth(stroke);
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }
  ctx.restore();
}

function drawStroke(ctx, stroke) {
  switch (stroke.tool) {
    case "floor":
      drawFloorStroke(ctx, stroke);
      drawFloorVariantMarkers(ctx, stroke);
      break;
    case "floor-detail":
      drawFloorDetailStroke(ctx, stroke);
      break;
    case "wall":
      drawWallStroke(ctx, stroke);
      break;
    case "water":
      drawWaterStroke(ctx, stroke);
      break;
    case "lava":
      drawLavaStroke(ctx, stroke);
      break;
    case "chasm":
      drawChasmStroke(ctx, stroke);
      break;
    case "erase":
      drawEraseStroke(ctx, stroke);
      break;
    default:
      break;
  }
}

function groupPaintStrokes(strokes) {
  const groups = new Map();

  strokes.forEach((stroke) => {
    const key = `${strokeRenderFamily(stroke)}|${getBrushShape(stroke.brushShape)}|${stroke.size}|${stroke.opacity}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(stroke);
  });

  return groups;
}

function buildGroupedPath(ctx, strokes, sizeMultiplier = 1) {
  ctx.beginPath();
  let hasPath = false;

  strokes.forEach((stroke) => {
    hasPath = appendStrokePath(ctx, stroke.points, stroke.size * sizeMultiplier) || hasPath;
  });

  return hasPath;
}

function drawGroupedFloor(ctx, strokes) {
  const sample = strokes[0];
  drawLayeredStroke(ctx, sample.opacity, getFloorLayers(sample), groupedStrokePathBuilder(ctx, strokes), sample.brushShape);

  strokes.forEach((stroke) => {
    drawFloorVariantMarkers(ctx, stroke);
  });
}

function drawGroupedWall(ctx, strokes) {
  const sample = strokes[0];
  drawLayeredStroke(ctx, sample.opacity, getWallLayers(sample), groupedStrokePathBuilder(ctx, strokes), sample.brushShape);
}

function drawGroupedWater(ctx, strokes) {
  const sample = strokes[0];
  drawLayeredStroke(ctx, sample.opacity, getWaterLayers(sample), groupedStrokePathBuilder(ctx, strokes), sample.brushShape);
}

function drawGroupedLava(ctx, strokes) {
  const sample = strokes[0];
  drawLayeredStroke(ctx, sample.opacity, getLavaLayers(sample), groupedStrokePathBuilder(ctx, strokes), sample.brushShape);
}

function drawGroupedChasm(ctx, strokes) {
  const sample = strokes[0];
  drawLayeredStroke(ctx, sample.opacity, getChasmLayers(sample), groupedStrokePathBuilder(ctx, strokes), sample.brushShape);
}

function drawMergedPaint(ctx, strokes) {
  groupPaintStrokes(strokes).forEach((group) => {
    switch (strokeRenderFamily(group[0])) {
      case "floor-family":
      case "floor-cracked":
        drawGroupedFloor(ctx, group);
        break;
      case "floor-detail":
        drawGroupedFloorDetail(ctx, group);
        break;
      case "wall":
      case "wall-jagged":
        drawGroupedWall(ctx, group);
        break;
      case "water":
      case "water-pool":
        drawGroupedWater(ctx, group);
        break;
      case "lava":
      case "lava-molten":
        drawGroupedLava(ctx, group);
        break;
      case "chasm":
      case "chasm-rift":
        drawGroupedChasm(ctx, group);
        break;
      default:
        break;
    }
  });
}

function strokeGroupKey(stroke) {
  return `${strokeRenderFamily(stroke)}|${getBrushShape(stroke.brushShape)}|${stroke.size}|${stroke.opacity}`;
}

function createOffscreenSurface(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  return ctx ? { canvas, ctx } : null;
}

function getRenderedEraseLineWidth(stroke) {
  return stroke.size * 1.02;
}

export function getStrokeMaskLineWidth(stroke) {
  if (stroke?.tool === "erase") {
    return getRenderedEraseLineWidth(stroke);
  }

  return stroke.size * 1.6;
}

function drawMaskStrokeWithWidth(ctx, stroke, compositeOperation, lineWidth) {
  ctx.save();
  ctx.globalCompositeOperation = compositeOperation;
  ctx.globalAlpha = 1;
  applyBrushShapeToContext(ctx, stroke.brushShape);
  ctx.strokeStyle = "rgba(255, 255, 255, 1)";
  ctx.lineWidth = lineWidth;
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }
  ctx.restore();
}

function drawMaskStroke(ctx, stroke, compositeOperation) {
  drawMaskStrokeWithWidth(ctx, stroke, compositeOperation, getStrokeMaskLineWidth(stroke));
}

function getInteriorFloorMaskLineWidth(stroke) {
  return Math.max(6, stroke.size * 0.78);
}

function buildFloorMask(width, height, strokes, resolveFloorLineWidth, shouldApplyErase = () => true) {
  const floorMaskSurface = createOffscreenSurface(width, height);
  if (!floorMaskSurface) {
    return null;
  }

  orderPaintStrokesForRendering(strokes).forEach((stroke) => {
    switch (stroke.tool) {
      case "floor":
        drawMaskStrokeWithWidth(floorMaskSurface.ctx, stroke, "source-over", resolveFloorLineWidth(stroke));
        break;
      case "erase":
        if (shouldApplyErase(stroke)) {
          drawMaskStroke(floorMaskSurface.ctx, stroke, "destination-out");
        }
        break;
      case "water":
      case "lava":
      case "chasm":
        drawMaskStroke(floorMaskSurface.ctx, stroke, "destination-out");
        break;
      default:
        break;
    }
  });

  return floorMaskSurface;
}

function orderPaintSegment(strokes) {
  const background = [];
  const surfaces = [];

  strokes.forEach((stroke) => {
    if (stroke.tool === "wall") {
      background.push(stroke);
      return;
    }

    surfaces.push(stroke);
  });

  return [...background, ...surfaces];
}

export function orderPaintStrokesForRendering(strokes) {
  const ordered = [];
  let segment = [];

  function flushSegment() {
    if (!segment.length) {
      return;
    }

    ordered.push(...orderPaintSegment(segment));
    segment = [];
  }

  strokes.forEach((stroke) => {
    if (stroke.tool === "erase") {
      flushSegment();
      ordered.push(stroke);
      return;
    }

    segment.push(stroke);
  });

  flushSegment();
  return ordered;
}

function paintGroupPriority(group) {
  return group.sample.tool === "wall" ? 0 : 1;
}

function sortPaintGroups(left, right) {
  const leftPriority = paintGroupPriority(left);
  const rightPriority = paintGroupPriority(right);
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }
  return left.order - right.order;
}

export function buildPaintMaskPlan(strokes) {
  const ordered = orderPaintStrokesForRendering(strokes);
  const groups = new Map();

  ordered.forEach((stroke, index) => {
    if (stroke.tool === "erase") {
      groups.forEach((group) => {
        group.maskSteps.push({
          type: "erase",
          stroke
        });
      });
      return;
    }

    const key = stroke.mergeTouches ? strokeGroupKey(stroke) : `single|${stroke.id}`;
    let group = groups.get(key);

    if (!group) {
      group = {
        key,
        order: index,
        sample: stroke,
        strokes: [],
        maskSteps: []
      };
      groups.set(key, group);
    }

    group.strokes.push(stroke);
    group.maskSteps.push({
      type: "paint",
      stroke
    });
  });

  return Array.from(groups.values()).sort(sortPaintGroups);
}

function renderMaskedPaintGroups(ctx, groups, clipMaskSurface = null) {
  if (!groups.length) {
    return;
  }

  const paintSurface = createOffscreenSurface(ctx.canvas.width, ctx.canvas.height);
  if (!paintSurface) {
    return;
  }

  groups.forEach((group) => {
    const mask = createOffscreenSurface(ctx.canvas.width, ctx.canvas.height);
    if (!mask) {
      return;
    }

    group.maskSteps.forEach((step) => {
      drawMaskStroke(mask.ctx, step.stroke, step.type === "erase" ? "destination-out" : "source-over");
    });

    paintSurface.ctx.clearRect(0, 0, paintSurface.canvas.width, paintSurface.canvas.height);

    if (group.strokes.length === 1 && !group.sample.mergeTouches) {
      drawStroke(paintSurface.ctx, group.strokes[0]);
    } else {
      drawMergedPaint(paintSurface.ctx, group.strokes);
    }

    paintSurface.ctx.save();
    paintSurface.ctx.globalCompositeOperation = "destination-in";
    paintSurface.ctx.drawImage(mask.canvas, 0, 0);
    if (clipMaskSurface) {
      paintSurface.ctx.drawImage(clipMaskSurface.canvas, 0, 0);
    }
    paintSurface.ctx.restore();

    ctx.drawImage(paintSurface.canvas, 0, 0);
  });
}

function buildVisibleFloorMask(width, height, strokes) {
  return buildFloorMask(width, height, strokes, getInteriorFloorMaskLineWidth);
}

function buildFloorDetailMaskPlan(strokes) {
  return buildPaintMaskPlan(strokes.filter((stroke) => stroke.tool === "floor-detail" || stroke.tool === "erase"));
}

function buildWallBorderEraseAreaMask(width, height, strokes) {
  const visibleFloorWithoutWallBorderErase = buildFloorMask(
    width,
    height,
    strokes,
    getInteriorFloorMaskLineWidth,
    (stroke) => !isWallBorderEraseVariant(getStrokeSurfaceVariant(stroke))
  );
  const visibleFloorMask = buildVisibleFloorMask(width, height, strokes);
  if (!visibleFloorWithoutWallBorderErase || !visibleFloorMask) {
    return null;
  }

  const maskSurface = createOffscreenSurface(width, height);
  if (!maskSurface) {
    return null;
  }

  maskSurface.ctx.drawImage(visibleFloorWithoutWallBorderErase.canvas, 0, 0);
  maskSurface.ctx.save();
  maskSurface.ctx.globalCompositeOperation = "destination-out";
  maskSurface.ctx.drawImage(visibleFloorMask.canvas, 0, 0);
  maskSurface.ctx.restore();
  return maskSurface;
}

function expandMaskSurface(maskSurface, radius) {
  if (!maskSurface) {
    return null;
  }

  const expandedSurface = createOffscreenSurface(maskSurface.canvas.width, maskSurface.canvas.height);
  if (!expandedSurface) {
    return null;
  }

  const roundedRadius = Math.max(1, Math.round(radius));
  const step = Math.max(1, Math.round(roundedRadius / 2));

  for (let y = -roundedRadius; y <= roundedRadius; y += step) {
    for (let x = -roundedRadius; x <= roundedRadius; x += step) {
      if (x * x + y * y > roundedRadius * roundedRadius) {
        continue;
      }
      expandedSurface.ctx.drawImage(maskSurface.canvas, x, y);
    }
  }

  return expandedSurface;
}

function renderWallBorderEraseRims(ctx, strokes) {
  const wallBorderEraseStrokes = strokes.filter(
    (stroke) => stroke.tool === "erase" && isWallBorderEraseVariant(getStrokeSurfaceVariant(stroke))
  );
  if (!wallBorderEraseStrokes.length || !strokes.some((stroke) => stroke.tool === "floor")) {
    return;
  }

  const visibleFloorMask = buildVisibleFloorMask(ctx.canvas.width, ctx.canvas.height, strokes);
  const erasedAreaMaskSurface = buildWallBorderEraseAreaMask(ctx.canvas.width, ctx.canvas.height, strokes);
  const expandedErasedAreaMaskSurface = expandMaskSurface(
    erasedAreaMaskSurface,
    Math.max(8, ...wallBorderEraseStrokes.map((stroke) => stroke.size * 0.24))
  );
  if (!visibleFloorMask || !expandedErasedAreaMaskSurface) {
    return;
  }

  const rimSurface = createOffscreenSurface(ctx.canvas.width, ctx.canvas.height);
  if (!rimSurface) {
    return;
  }

  const { canvas, ctx: rimCtx } = rimSurface;
  rimCtx.fillStyle = "#8b745d";
  rimCtx.fillRect(0, 0, canvas.width, canvas.height);

  rimCtx.save();
  rimCtx.globalAlpha = 0.22;
  rimCtx.fillStyle = "#4c3a2d";
  rimCtx.fillRect(0, 0, canvas.width, canvas.height);
  rimCtx.restore();

  rimCtx.save();
  rimCtx.globalAlpha = 0.1;
  rimCtx.fillStyle = "#d9c5a2";
  rimCtx.fillRect(0, 0, canvas.width, canvas.height);
  rimCtx.restore();

  rimCtx.save();
  rimCtx.globalCompositeOperation = "destination-in";
  rimCtx.drawImage(expandedErasedAreaMaskSurface.canvas, 0, 0);
  rimCtx.drawImage(visibleFloorMask.canvas, 0, 0);
  rimCtx.restore();

  ctx.drawImage(canvas, 0, 0);
}

function renderPaintSequence(ctx, strokes) {
  const baseGroups = buildPaintMaskPlan(strokes.filter((stroke) => stroke.tool !== "floor-detail"));
  renderMaskedPaintGroups(ctx, baseGroups);

  renderWallBorderEraseRims(ctx, strokes.filter((stroke) => stroke.tool !== "floor-detail"));

  const floorDetailGroups = buildFloorDetailMaskPlan(strokes);
  if (!floorDetailGroups.length) {
    return;
  }

  const visibleFloorMask = buildVisibleFloorMask(ctx.canvas.width, ctx.canvas.height, strokes.filter((stroke) => stroke.tool !== "floor-detail"));
  if (!visibleFloorMask) {
    return;
  }

  renderMaskedPaintGroups(ctx, floorDetailGroups, visibleFloorMask);
}

function resolveLayerSurface(project, layerSurface = null) {
  const layerCanvas = layerSurface?.canvas || document.createElement("canvas");
  const layerCtx = layerSurface?.ctx || layerCanvas.getContext("2d");
  const width = Math.max(1, Math.ceil(project.metadata.width));
  const height = Math.max(1, Math.ceil(project.metadata.height));

  if (!layerCtx) {
    return null;
  }

  if (layerCanvas.width !== width) {
    layerCanvas.width = width;
  }

  if (layerCanvas.height !== height) {
    layerCanvas.height = height;
  }

  return { canvas: layerCanvas, ctx: layerCtx };
}

function drawGrid(ctx, width, height, gridSize) {
  ctx.save();
  ctx.strokeStyle = "rgba(230, 221, 200, 0.08)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }

  ctx.restore();
}

function drawRockBase(ctx, project) {
  const { width, height } = project.metadata;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#221c19");
  gradient.addColorStop(0.45, "#171311");
  gradient.addColorStop(1, "#1e1815");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = "rgba(188, 170, 142, 0.06)";
  ctx.lineWidth = 2;
  for (let row = 0; row < 12; row += 1) {
    const y = (height / 12) * row + 28;
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.bezierCurveTo(width * 0.24, y + 18, width * 0.58, y - 16, width + 20, y + 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPage(ctx, project) {
  const { width, height } = project.metadata;
  ctx.save();
  ctx.shadowBlur = 28;
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.fillStyle = "#0e0c0b";
  ctx.fillRect(-16, -16, width + 32, height + 32);
  ctx.restore();

  drawRockBase(ctx, project);

  ctx.save();
  ctx.strokeStyle = "rgba(232, 216, 184, 0.18)";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, width - 3, height - 3);
  ctx.restore();
}

function drawCustomStamp(ctx, stamp, imageCache) {
  const image = imageCache.get(stamp.assetId);
  if (!image?.complete) {
    ctx.fillStyle = "rgba(221, 209, 186, 0.3)";
    ctx.beginPath();
    ctx.arc(0, 0, stamp.size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const aspectRatio = image.width && image.height ? image.width / image.height : 1;
  const width = aspectRatio >= 1 ? stamp.size : stamp.size * aspectRatio;
  const height = aspectRatio >= 1 ? stamp.size / aspectRatio : stamp.size;
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
}

function drawStamp(ctx, stamp, imageCache, selectedStampId) {
  ctx.save();
  ctx.translate(stamp.x, stamp.y);
  ctx.rotate(stamp.rotation);

  if (stamp.assetKind === "custom") {
    drawCustomStamp(ctx, stamp, imageCache);
  } else {
    if (isBuiltinDoorAsset(stamp.assetId)) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      drawBuiltinDoorCutout(ctx, stamp.assetId, { size: stamp.size });
      ctx.restore();
    }

    drawBuiltinAsset(ctx, stamp.assetId, { size: stamp.size });
  }

  if (selectedStampId === stamp.id) {
    ctx.save();
    ctx.rotate(-stamp.rotation);
    ctx.strokeStyle = "rgba(244, 199, 108, 0.94)";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, stamp.size * 0.58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function groupStampsByLayer(project) {
  const stampsByLayer = new Map();

  project.stamps.forEach((stamp) => {
    if (!stampsByLayer.has(stamp.layerId)) {
      stampsByLayer.set(stamp.layerId, []);
    }
    stampsByLayer.get(stamp.layerId).push(stamp);
  });

  return stampsByLayer;
}

function drawStamps(ctx, stamps, imageCache, selectedStampId) {
  stamps.forEach((stamp) => drawStamp(ctx, stamp, imageCache, selectedStampId));
}

function applyStampLightingToLayer(ctx, stamps) {
  stamps.forEach((stamp) => {
    if (stamp.assetKind !== "builtin") {
      return;
    }

    const asset = getBuiltinAsset(stamp.assetId);
    const light = asset.light;
    if (!light?.radius) {
      return;
    }

    const scale = asset.defaultSize ? stamp.size / asset.defaultSize : 1;
    const radius = light.radius * scale;
    const minX = stamp.x - radius;
    const minY = stamp.y - radius;
    const size = radius * 2;

    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    const outerGlow = ctx.createRadialGradient(stamp.x, stamp.y, radius * 0.08, stamp.x, stamp.y, radius);
    outerGlow.addColorStop(0, light.innerColor || "rgba(255, 215, 126, 0.3)");
    outerGlow.addColorStop(0.42, light.outerColor || "rgba(255, 144, 68, 0.16)");
    outerGlow.addColorStop(1, "rgba(255, 144, 68, 0)");
    ctx.fillStyle = outerGlow;
    ctx.fillRect(minX, minY, size, size);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    const coreGlow = ctx.createRadialGradient(stamp.x, stamp.y, 0, stamp.x, stamp.y, radius * 0.38);
    coreGlow.addColorStop(0, "rgba(255, 238, 188, 0.24)");
    coreGlow.addColorStop(0.65, "rgba(255, 196, 104, 0.08)");
    coreGlow.addColorStop(1, "rgba(255, 196, 104, 0)");
    ctx.fillStyle = coreGlow;
    ctx.fillRect(stamp.x - radius * 0.38, stamp.y - radius * 0.38, radius * 0.76, radius * 0.76);
    ctx.restore();
  });
}

function drawLayerStack(ctx, project, imageCache, selectedStampId, layerSurface = null) {
  const resolvedLayerSurface = resolveLayerSurface(project, layerSurface);
  if (!resolvedLayerSurface) {
    return;
  }

  const { canvas: layerCanvas, ctx: layerCtx } = resolvedLayerSurface;
  const stampsByLayer = groupStampsByLayer(project);

  getPaintLayers(project).forEach((layer) => {
    const layerStamps = stampsByLayer.get(layer.id) || [];

    if (layer.visible && Array.isArray(layer.strokes) && layer.strokes.length) {
      // Reset the offscreen surface per paint layer so erase strokes only cut into that layer.
      layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
      renderPaintSequence(layerCtx, layer.strokes);
      applyStampLightingToLayer(layerCtx, layerStamps);
      ctx.drawImage(layerCanvas, 0, 0);
    }

    drawStamps(ctx, layerStamps, imageCache, selectedStampId);
  });
}

function drawPaintPreview(ctx, hoverPoint, brushSize, tool, surfaceVariant = "normal", brushShape = "circle") {
  if (!hoverPoint) {
    return;
  }

  const palette = {
    floor: "rgba(219, 191, 147, 0.62)",
    "floor-detail": "rgba(214, 181, 132, 0.7)",
    wall: "rgba(149, 131, 111, 0.5)",
    water: "rgba(113, 192, 238, 0.58)",
    lava: "rgba(255, 148, 72, 0.6)",
    chasm: "rgba(240, 225, 194, 0.45)",
    erase: "rgba(255, 126, 126, 0.62)"
  };

  ctx.save();
  ctx.strokeStyle = palette[tool] || "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  if (getBrushShape(brushShape) === "square") {
    ctx.strokeRect(hoverPoint.x - brushSize / 2, hoverPoint.y - brushSize / 2, brushSize, brushSize);
  } else {
    ctx.beginPath();
    ctx.arc(hoverPoint.x, hoverPoint.y, brushSize / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (tool === "floor-detail") {
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(92, 72, 58, 0.72)";
    [
      [-0.18, -0.06, 0.055],
      [0.02, 0.09, 0.04],
      [0.16, -0.11, 0.048],
      [0.09, 0.18, 0.034]
    ].forEach(([xScale, yScale, radiusScale]) => {
      ctx.beginPath();
      ctx.arc(hoverPoint.x + brushSize * xScale, hoverPoint.y + brushSize * yScale, Math.max(1.5, brushSize * radiusScale), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (surfaceVariant !== "normal" && surfaceVariant !== "up" && surfaceVariant !== "down") {
    ctx.setLineDash([]);
    switch (tool) {
      case "floor":
        ctx.strokeStyle = "rgba(92, 72, 60, 0.78)";
        ctx.lineWidth = Math.max(2, brushSize * 0.11);
        ctx.beginPath();
        ctx.moveTo(hoverPoint.x - brushSize * 0.18, hoverPoint.y + brushSize * 0.04);
        ctx.lineTo(hoverPoint.x - brushSize * 0.02, hoverPoint.y - brushSize * 0.03);
        ctx.lineTo(hoverPoint.x + brushSize * 0.1, hoverPoint.y + brushSize * 0.02);
        ctx.lineTo(hoverPoint.x + brushSize * 0.2, hoverPoint.y - brushSize * 0.05);
        ctx.stroke();
        break;
      case "wall":
        ctx.strokeStyle = "rgba(205, 188, 170, 0.4)";
        ctx.lineWidth = Math.max(2, brushSize * 0.08);
        ctx.beginPath();
        ctx.moveTo(hoverPoint.x - brushSize * 0.14, hoverPoint.y - brushSize * 0.08);
        ctx.lineTo(hoverPoint.x - brushSize * 0.02, hoverPoint.y + brushSize * 0.08);
        ctx.moveTo(hoverPoint.x + brushSize * 0.02, hoverPoint.y - brushSize * 0.1);
        ctx.lineTo(hoverPoint.x + brushSize * 0.14, hoverPoint.y + brushSize * 0.06);
        ctx.stroke();
        break;
      case "water":
        ctx.strokeStyle = "rgba(182, 231, 248, 0.5)";
        ctx.lineWidth = Math.max(2, brushSize * 0.06);
        ctx.beginPath();
        ctx.arc(hoverPoint.x, hoverPoint.y, brushSize * 0.12, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        break;
      case "lava":
        ctx.strokeStyle = "rgba(255, 222, 128, 0.72)";
        ctx.lineWidth = Math.max(2, brushSize * 0.09);
        ctx.beginPath();
        ctx.moveTo(hoverPoint.x - brushSize * 0.12, hoverPoint.y);
        ctx.lineTo(hoverPoint.x + brushSize * 0.12, hoverPoint.y);
        ctx.stroke();
        break;
      case "chasm":
        ctx.strokeStyle = "rgba(126, 112, 98, 0.56)";
        ctx.lineWidth = Math.max(2, brushSize * 0.08);
        ctx.beginPath();
        ctx.moveTo(hoverPoint.x, hoverPoint.y - brushSize * 0.13);
        ctx.lineTo(hoverPoint.x, hoverPoint.y + brushSize * 0.13);
        ctx.stroke();
        break;
      case "erase":
        if (surfaceVariant === "wall") {
          ctx.strokeStyle = "rgba(214, 194, 166, 0.72)";
          ctx.lineWidth = Math.max(2, brushSize * 0.08);
          ctx.beginPath();
          ctx.moveTo(hoverPoint.x - brushSize * 0.14, hoverPoint.y);
          ctx.lineTo(hoverPoint.x + brushSize * 0.14, hoverPoint.y);
          ctx.stroke();
        }
        break;
      default:
        break;
    }
  }
  ctx.restore();
}

function drawDetailPreview(ctx, hoverPoint, selectedAsset, rotation = 0) {
  if (!hoverPoint || !selectedAsset) {
    return;
  }

  ctx.save();
  ctx.translate(hoverPoint.x, hoverPoint.y);

  if (selectedAsset.assetKind === "custom") {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "rgba(228, 216, 188, 0.3)";
    ctx.beginPath();
    ctx.arc(0, 0, selectedAsset.size * 0.34, 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawBuiltinAsset(ctx, selectedAsset.assetId, {
      size: selectedAsset.size,
      rotation,
      alpha: 0.42
    });
  }

  ctx.restore();
}

function drawLinePreview(ctx, preview) {
  if (!preview?.start || !preview?.end) {
    return;
  }

  const palette = {
    floor: "rgba(244, 211, 162, 0.78)",
    "floor-detail": "rgba(224, 196, 150, 0.82)",
    wall: "rgba(170, 152, 133, 0.74)",
    water: "rgba(132, 210, 255, 0.78)",
    lava: "rgba(255, 161, 98, 0.82)",
    chasm: "rgba(244, 235, 210, 0.72)",
    erase: "rgba(255, 146, 146, 0.82)"
  };

  const color = palette[preview.tool] || "rgba(255, 255, 255, 0.68)";

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, preview.size * 0.16);
  applyBrushShapeToContext(ctx, preview.brushShape);
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.moveTo(preview.start.x, preview.start.y);
  ctx.lineTo(preview.end.x, preview.end.y);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.globalAlpha = 0.85;
  if (getBrushShape(preview.brushShape) === "square") {
    const startSize = Math.max(8, preview.size * 0.16);
    ctx.fillRect(preview.start.x - startSize / 2, preview.start.y - startSize / 2, startSize, startSize);
  } else {
    ctx.beginPath();
    ctx.arc(preview.start.x, preview.start.y, Math.max(4, preview.size * 0.08), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (getBrushShape(preview.brushShape) === "square") {
    const endSize = Math.max(10, preview.size * 0.2);
    ctx.strokeRect(preview.end.x - endSize / 2, preview.end.y - endSize / 2, endSize, endSize);
  } else {
    ctx.beginPath();
    ctx.arc(preview.end.x, preview.end.y, Math.max(5, preview.size * 0.1), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function pointInPage(project, point) {
  return point && point.x >= 0 && point.y >= 0 && point.x <= project.metadata.width && point.y <= project.metadata.height;
}

function drawProject(ctx, options) {
  const {
    project,
    imageCache,
    selectedStampId,
    hoverPoint,
    selectedTool,
    surfaceVariant = "normal",
    brushSize,
    brushShape = "circle",
    detailPreview,
    detailRotation = 0,
    linePreview,
    layerSurface
  } = options;

  drawPage(ctx, project);

  if (project.metadata.showGrid) {
    drawGrid(ctx, project.metadata.width, project.metadata.height, project.metadata.gridSize);
  }

  drawLayerStack(ctx, project, imageCache, selectedStampId, layerSurface);

  if (pointInPage(project, hoverPoint)) {
    if (["floor", "floor-detail", "wall", "water", "lava", "chasm", "erase"].includes(selectedTool)) {
      drawPaintPreview(ctx, hoverPoint, brushSize, selectedTool, surfaceVariant, brushShape);
      if (selectedTool === "floor" && (surfaceVariant === "up" || surfaceVariant === "down")) {
        drawFloorVariantMarkers(
          ctx,
          {
            points: [hoverPoint],
            size: brushSize,
            opacity: 0.9,
            surfaceVariant,
            floorVariant: surfaceVariant,
            tool: "floor"
          }
        );
      }
    } else if (selectedTool === "detail") {
      drawDetailPreview(ctx, hoverPoint, detailPreview, detailRotation);
    }
  }

  if (linePreview) {
    drawLinePreview(ctx, linePreview);
  }
}

export function drawScene(ctx, options) {
  const { canvasWidth, canvasHeight, viewport } = options;

  const background = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  background.addColorStop(0, "#0f0c0b");
  background.addColorStop(1, "#1b1512");
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.setTransform(viewport.scale, 0, 0, viewport.scale, viewport.offsetX, viewport.offsetY);
  drawProject(ctx, options);
  ctx.restore();
}

export function drawExportCanvas(canvas, { project, imageCache, scale = 1.25 }) {
  const padding = 42;
  canvas.width = Math.ceil((project.metadata.width + padding * 2) * scale);
  canvas.height = Math.ceil((project.metadata.height + padding * 2) * scale);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#100d0c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(padding, padding);
  drawProject(ctx, {
    project,
    imageCache,
    selectedStampId: null,
    hoverPoint: null,
    selectedTool: "none",
    brushSize: 0,
    detailPreview: null,
    linePreview: null
  });
  ctx.restore();
}
