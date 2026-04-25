import { drawBuiltinAsset } from "./cave-assets.js";
import { getPaintLayers } from "./cave-project.js";

function clampAlpha(value) {
  return Math.max(0, Math.min(1, value));
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

function drawFloorBaseStroke(ctx, stroke) {
  ctx.save();
  ctx.globalAlpha = clampAlpha(stroke.opacity);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = stroke.size * 0.18;
  ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
  ctx.strokeStyle = "#7c6550";
  ctx.lineWidth = stroke.size;
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(214, 187, 146, 0.3)";
  ctx.lineWidth = stroke.size * 0.7;
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }
  ctx.restore();
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
  if (stroke.floorVariant !== "up" && stroke.floorVariant !== "down") {
    return;
  }

  const direction = stroke.floorVariant;
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

function drawFloorStroke(ctx, stroke) {
  drawFloorBaseStroke(ctx, stroke);
}

function drawWallStroke(ctx, stroke) {
  ctx.save();
  ctx.globalAlpha = clampAlpha(stroke.opacity);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = stroke.size * 0.12;
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.strokeStyle = "#1c1714";
  ctx.lineWidth = stroke.size;
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(88, 76, 68, 0.4)";
  ctx.lineWidth = stroke.size * 0.78;
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }
  ctx.restore();
}

function drawWaterStroke(ctx, stroke) {
  ctx.save();
  ctx.globalAlpha = clampAlpha(stroke.opacity);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = stroke.size * 0.2;
  ctx.shadowColor = "rgba(57, 122, 168, 0.3)";
  ctx.strokeStyle = "#274f66";
  ctx.lineWidth = stroke.size * 0.82;
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(122, 188, 226, 0.44)";
  ctx.lineWidth = stroke.size * 0.34;
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }
  ctx.restore();
}

function drawLavaStroke(ctx, stroke) {
  ctx.save();
  ctx.globalAlpha = clampAlpha(stroke.opacity);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = stroke.size * 0.26;
  ctx.shadowColor = "rgba(255, 126, 48, 0.52)";
  ctx.strokeStyle = "#9f3f1f";
  ctx.lineWidth = stroke.size * 0.8;
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255, 185, 87, 0.62)";
  ctx.lineWidth = stroke.size * 0.28;
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }
  ctx.restore();
}

function drawChasmStroke(ctx, stroke) {
  ctx.save();
  ctx.globalAlpha = clampAlpha(stroke.opacity);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#050505";
  ctx.lineWidth = stroke.size * 0.74;
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(116, 101, 86, 0.35)";
  ctx.lineWidth = stroke.size * 0.92;
  ctx.setLineDash([10, 14]);
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }
  ctx.restore();
}

function drawEraseStroke(ctx, stroke) {
  // Darken the existing painted surface at the cut line so erased areas read like carved edges.
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.globalAlpha = 0.72;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#2f2722";
  ctx.lineWidth = stroke.size * 1.18;
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.globalAlpha = 0.28;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#8a7763";
  ctx.lineWidth = stroke.size * 0.46;
  if (buildStrokePath(ctx, stroke.points, stroke.size)) {
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.globalAlpha = 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(0, 0, 0, 1)";
  ctx.lineWidth = stroke.size * 1.02;
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
    const key = `${floorFamilyTool(stroke.tool) ? "floor-family" : stroke.tool}|${stroke.size}|${stroke.opacity}`;
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
  ctx.save();
  ctx.globalAlpha = clampAlpha(sample.opacity);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = sample.size * 0.18;
  ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
  ctx.strokeStyle = "#7c6550";
  ctx.lineWidth = sample.size;
  if (buildGroupedPath(ctx, strokes)) {
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(214, 187, 146, 0.3)";
  ctx.lineWidth = sample.size * 0.7;
  if (buildGroupedPath(ctx, strokes, 0.7)) {
    ctx.stroke();
  }
  ctx.restore();

  strokes.forEach((stroke) => {
    drawFloorVariantMarkers(ctx, stroke);
  });
}

function drawGroupedWall(ctx, strokes) {
  const sample = strokes[0];
  ctx.save();
  ctx.globalAlpha = clampAlpha(sample.opacity);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = sample.size * 0.12;
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.strokeStyle = "#1c1714";
  ctx.lineWidth = sample.size;
  if (buildGroupedPath(ctx, strokes)) {
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(88, 76, 68, 0.4)";
  ctx.lineWidth = sample.size * 0.78;
  if (buildGroupedPath(ctx, strokes, 0.78)) {
    ctx.stroke();
  }
  ctx.restore();
}

function drawGroupedWater(ctx, strokes) {
  const sample = strokes[0];
  ctx.save();
  ctx.globalAlpha = clampAlpha(sample.opacity);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = sample.size * 0.2;
  ctx.shadowColor = "rgba(57, 122, 168, 0.3)";
  ctx.strokeStyle = "#274f66";
  ctx.lineWidth = sample.size * 0.82;
  if (buildGroupedPath(ctx, strokes, 0.82)) {
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(122, 188, 226, 0.44)";
  ctx.lineWidth = sample.size * 0.34;
  if (buildGroupedPath(ctx, strokes, 0.34)) {
    ctx.stroke();
  }
  ctx.restore();
}

function drawGroupedLava(ctx, strokes) {
  const sample = strokes[0];
  ctx.save();
  ctx.globalAlpha = clampAlpha(sample.opacity);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = sample.size * 0.26;
  ctx.shadowColor = "rgba(255, 126, 48, 0.52)";
  ctx.strokeStyle = "#9f3f1f";
  ctx.lineWidth = sample.size * 0.8;
  if (buildGroupedPath(ctx, strokes, 0.8)) {
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255, 185, 87, 0.62)";
  ctx.lineWidth = sample.size * 0.28;
  if (buildGroupedPath(ctx, strokes, 0.28)) {
    ctx.stroke();
  }
  ctx.restore();
}

function drawGroupedChasm(ctx, strokes) {
  const sample = strokes[0];
  ctx.save();
  ctx.globalAlpha = clampAlpha(sample.opacity);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#050505";
  ctx.lineWidth = sample.size * 0.74;
  if (buildGroupedPath(ctx, strokes, 0.74)) {
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(116, 101, 86, 0.35)";
  ctx.lineWidth = sample.size * 0.92;
  ctx.setLineDash([10, 14]);
  if (buildGroupedPath(ctx, strokes, 0.92)) {
    ctx.stroke();
  }
  ctx.restore();
}

function drawMergedPaint(ctx, strokes) {
  groupPaintStrokes(strokes).forEach((group, key) => {
    const [tool] = key.split("|");
    switch (tool) {
      case "floor-family":
        drawGroupedFloor(ctx, group);
        break;
      case "wall":
        drawGroupedWall(ctx, group);
        break;
      case "water":
        drawGroupedWater(ctx, group);
        break;
      case "lava":
        drawGroupedLava(ctx, group);
        break;
      case "chasm":
        drawGroupedChasm(ctx, group);
        break;
      default:
        break;
    }
  });
}

function strokeGroupKey(stroke) {
  return `${floorFamilyTool(stroke.tool) ? "floor-family" : stroke.tool}|${stroke.size}|${stroke.opacity}`;
}

function renderPaintSequence(ctx, strokes) {
  let mergeBatch = [];
  let activeGroupKey = null;

  function flushMergeBatch() {
    if (!mergeBatch.length) {
      return;
    }
    drawMergedPaint(ctx, mergeBatch);
    mergeBatch = [];
    activeGroupKey = null;
  }

  strokes.forEach((stroke) => {
    if (stroke.tool === "erase") {
      flushMergeBatch();
      drawEraseStroke(ctx, stroke);
      return;
    }

    if (!stroke.mergeTouches) {
      flushMergeBatch();
      drawStroke(ctx, stroke);
      return;
    }

    const nextGroupKey = strokeGroupKey(stroke);
    if (mergeBatch.length && nextGroupKey !== activeGroupKey) {
      flushMergeBatch();
    }

    mergeBatch.push(stroke);
    activeGroupKey = nextGroupKey;
  });

  flushMergeBatch();
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

function drawLayerStack(ctx, project, imageCache, selectedStampId, layerSurface = null) {
  const resolvedLayerSurface = resolveLayerSurface(project, layerSurface);
  if (!resolvedLayerSurface) {
    return;
  }

  const { canvas: layerCanvas, ctx: layerCtx } = resolvedLayerSurface;
  const stampsByLayer = groupStampsByLayer(project);

  getPaintLayers(project).forEach((layer) => {
    if (layer.visible && Array.isArray(layer.strokes) && layer.strokes.length) {
      // Reset the offscreen surface per paint layer so erase strokes only cut into that layer.
      layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
      renderPaintSequence(layerCtx, layer.strokes);
      ctx.drawImage(layerCanvas, 0, 0);
    }

    drawStamps(ctx, stampsByLayer.get(layer.id) || [], imageCache, selectedStampId);
  });
}

function drawPaintPreview(ctx, hoverPoint, brushSize, tool) {
  if (!hoverPoint) {
    return;
  }

  const palette = {
    floor: "rgba(219, 191, 147, 0.62)",
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
  ctx.beginPath();
  ctx.arc(hoverPoint.x, hoverPoint.y, brushSize / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawDetailPreview(ctx, hoverPoint, selectedAsset) {
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
  ctx.lineCap = "round";
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.moveTo(preview.start.x, preview.start.y);
  ctx.lineTo(preview.end.x, preview.end.y);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(preview.start.x, preview.start.y, Math.max(4, preview.size * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(preview.end.x, preview.end.y, Math.max(5, preview.size * 0.1), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function pointInPage(project, point) {
  return point && point.x >= 0 && point.y >= 0 && point.x <= project.metadata.width && point.y <= project.metadata.height;
}

function drawProject(ctx, options) {
  const { project, imageCache, selectedStampId, hoverPoint, selectedTool, floorVariant, brushSize, detailPreview, linePreview, layerSurface } =
    options;

  drawPage(ctx, project);

  if (project.metadata.showGrid) {
    drawGrid(ctx, project.metadata.width, project.metadata.height, project.metadata.gridSize);
  }

  drawLayerStack(ctx, project, imageCache, selectedStampId, layerSurface);

  if (pointInPage(project, hoverPoint)) {
    if (["floor", "wall", "water", "lava", "chasm", "erase"].includes(selectedTool)) {
      drawPaintPreview(ctx, hoverPoint, brushSize, selectedTool);
      if (selectedTool === "floor" && (floorVariant === "up" || floorVariant === "down")) {
        drawFloorVariantMarkers(
          ctx,
          {
            points: [hoverPoint],
            size: brushSize,
            opacity: 0.9,
            floorVariant
          }
        );
      }
    } else if (selectedTool === "detail") {
      drawDetailPreview(ctx, hoverPoint, detailPreview);
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
