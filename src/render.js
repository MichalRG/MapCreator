import { EDGE_FEATURE_DEFS, OVERLAY_DEFS, TERRAIN_DEFS } from "./constants.js";
import { getHexCenter, getHexPoints, getMapBounds } from "./hex.js";

function pathHex(ctx, points) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.closePath();
}

function drawTerrain(ctx, cell, size) {
  const points = getHexPoints(cell.col, cell.row, size);
  const terrain = TERRAIN_DEFS[cell.terrain] || TERRAIN_DEFS.plains;
  pathHex(ctx, points);
  ctx.fillStyle = terrain.color;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = terrain.stroke;
  ctx.stroke();
}

function drawTerrainTexture(ctx, cell, size, builtinIconCache) {
  const terrain = TERRAIN_DEFS[cell.terrain] || TERRAIN_DEFS.plains;
  const image = builtinIconCache?.get(terrain.icon);
  if (!image?.complete) {
    return;
  }

  const points = getHexPoints(cell.col, cell.row, size);
  const center = getHexCenter(cell.col, cell.row, size);
  const stampSize = size * 0.68;
  const offsets = [
    { x: -stampSize * 0.36, y: stampSize * 0.12 },
    { x: stampSize * 0.34, y: stampSize * 0.02 }
  ];

  ctx.save();
  pathHex(ctx, points);
  ctx.clip();
  ctx.globalAlpha = cell.terrain === "plains" ? 0.26 : 0.24;
  offsets.forEach((offset) => {
    ctx.drawImage(image, center.x + offset.x - stampSize / 2, center.y + offset.y - stampSize / 2, stampSize, stampSize);
  });
  ctx.restore();
}

function drawGrid(ctx, cell, size) {
  const points = getHexPoints(cell.col, cell.row, size);
  pathHex(ctx, points);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(42, 33, 25, 0.22)";
  ctx.stroke();
}

function drawOverlayMarker(ctx, overlayId, center, size, builtinIconCache) {
  const overlay = OVERLAY_DEFS[overlayId];
  if (!overlay) {
    return;
  }

  const radius = size * 0.34;
  ctx.fillStyle = "rgba(255, 248, 232, 0.92)";
  ctx.strokeStyle = overlay.fill;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const image = builtinIconCache?.get(overlay.icon);
  if (image?.complete) {
    const iconSize = radius * 1.55;
    ctx.drawImage(image, center.x - iconSize / 2, center.y - iconSize / 2, iconSize, iconSize);
    return;
  }

  ctx.fillStyle = overlay.fill;
  ctx.font = `${overlayId === "cave" ? "bold 13px" : "bold 15px"} "Trebuchet MS", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(overlay.marker, center.x, center.y + 1);
}

function drawCustomPlacements(ctx, project, cell, size, imageCache) {
  if (!cell.customPlacementIds.length) {
    return;
  }

  const center = getHexCenter(cell.col, cell.row, size);
  const visibleSize = size * 0.95;

  cell.customPlacementIds.forEach((placementId, index) => {
    const placement = project.customPlacements.find((entry) => entry.id === placementId);
    const symbol = placement
      ? project.customSymbols.find((entry) => entry.id === placement.symbolId)
      : null;

    if (!placement || !symbol) {
      return;
    }

    const image = imageCache.get(symbol.id);
    const offsetY = index * 7 - ((cell.customPlacementIds.length - 1) * 3.5);

    if (image?.complete) {
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.drawImage(image, center.x - visibleSize / 2, center.y - visibleSize / 2 + offsetY, visibleSize, visibleSize);
      ctx.restore();
      return;
    }

    ctx.fillStyle = "rgba(72, 62, 51, 0.75)";
    ctx.fillRect(center.x - 16, center.y - 16 + offsetY, 32, 32);
  });
}

function drawEdgeFeatures(ctx, project, size) {
  project.edgeFeatures.forEach((feature) => {
    const def = EDGE_FEATURE_DEFS[feature.type];
    if (!def) {
      return;
    }

    const a = getHexCenter(feature.from.col, feature.from.row, size);
    const b = getHexCenter(feature.to.col, feature.to.row, size);
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const bend = feature.type === "river" ? 10 : 4;

    ctx.save();
    ctx.strokeStyle = def.stroke;
    ctx.lineWidth = def.lineWidth;
    ctx.setLineDash(def.dash);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(midX + (a.y - b.y) * 0.08, midY + bend, b.x, b.y);
    ctx.stroke();
    ctx.restore();
  });
}

function drawHighlight(ctx, cell, size, fillStyle, strokeStyle) {
  const points = getHexPoints(cell.col, cell.row, size);
  pathHex(ctx, points);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
}

export function drawScene(ctx, options) {
  const {
    project,
    canvasWidth,
    canvasHeight,
    viewport,
    size,
    hoverCell,
    selectedCell,
    pendingEdgeCell,
    imageCache,
    builtinIconCache
  } = options;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.save();
  ctx.setTransform(viewport.scale, 0, 0, viewport.scale, viewport.offsetX, viewport.offsetY);

  project.cells.forEach((cell) => {
    drawTerrain(ctx, cell, size);
    drawTerrainTexture(ctx, cell, size, builtinIconCache);
  });

  drawEdgeFeatures(ctx, project, size);

  project.cells.forEach((cell) => {
    drawGrid(ctx, cell, size);
    const center = getHexCenter(cell.col, cell.row, size);
    cell.overlays.forEach((overlayId, index) => {
      drawOverlayMarker(ctx, overlayId, { x: center.x, y: center.y - index * 10 }, size, builtinIconCache);
    });
    drawCustomPlacements(ctx, project, cell, size, imageCache);
  });

  if (hoverCell) {
    drawHighlight(ctx, hoverCell, size, "rgba(255, 255, 255, 0.16)", "rgba(255, 255, 255, 0.42)");
  }

  if (selectedCell) {
    drawHighlight(ctx, selectedCell, size, "rgba(196, 114, 53, 0.14)", "rgba(143, 93, 43, 0.8)");
  }

  if (pendingEdgeCell) {
    drawHighlight(ctx, pendingEdgeCell, size, "rgba(47, 111, 158, 0.14)", "rgba(47, 111, 158, 0.8)");
  }

  ctx.restore();
}

export function drawExportCanvas(canvas, { project, size, imageCache, builtinIconCache, scale = 2 }) {
  const bounds = getMapBounds(project, size);
  const padding = size * 2;
  canvas.width = Math.ceil((bounds.width + padding * 2) * scale);
  canvas.height = Math.ceil((bounds.height + padding * 2) * scale);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f5ebd6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(padding - bounds.minX, padding - bounds.minY);

  project.cells.forEach((cell) => {
    drawTerrain(ctx, cell, size);
    drawTerrainTexture(ctx, cell, size, builtinIconCache);
  });

  drawEdgeFeatures(ctx, project, size);

  project.cells.forEach((cell) => {
    drawGrid(ctx, cell, size);
    const center = getHexCenter(cell.col, cell.row, size);
    cell.overlays.forEach((overlayId, index) => {
      drawOverlayMarker(
        ctx,
        overlayId,
        { x: center.x, y: center.y - index * 10 },
        size,
        builtinIconCache
      );
    });
    drawCustomPlacements(ctx, project, cell, size, imageCache);
  });

  ctx.restore();
}
