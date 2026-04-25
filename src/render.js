import { getCellCenter, getCellPoints, getMapBounds } from "./hex.js";

function pathCell(ctx, points) {
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

function drawTerrain(ctx, project, cell, size, mapConfig) {
  const points = getCellPoints(project, cell.col, cell.row, size);
  const terrain = mapConfig.terrainDefs[cell.terrain] || mapConfig.terrainDefs[mapConfig.defaultTerrain];
  pathCell(ctx, points);
  ctx.fillStyle = terrain.color;
  ctx.fill();
  ctx.lineWidth = mapConfig.layout === "square" ? 1.2 : 1.5;
  ctx.strokeStyle = terrain.stroke;
  ctx.stroke();
}

function drawTerrainTexture(ctx, project, cell, size, mapConfig, builtinIconCache) {
  const terrain = mapConfig.terrainDefs[cell.terrain] || mapConfig.terrainDefs[mapConfig.defaultTerrain];
  const image = builtinIconCache?.get(terrain.icon);
  if (!image?.complete) {
    return;
  }

  const points = getCellPoints(project, cell.col, cell.row, size);
  const center = getCellCenter(project, cell.col, cell.row, size);
  const stampSize = mapConfig.layout === "square" ? size * 0.6 : size * 0.68;
  const offsets =
    mapConfig.layout === "square"
      ? [
          { x: -stampSize * 0.24, y: -stampSize * 0.1 },
          { x: stampSize * 0.22, y: stampSize * 0.14 }
        ]
      : [
          { x: -stampSize * 0.36, y: stampSize * 0.12 },
          { x: stampSize * 0.34, y: stampSize * 0.02 }
        ];

  ctx.save();
  pathCell(ctx, points);
  ctx.clip();
  ctx.globalAlpha = mapConfig.layout === "square" ? 0.18 : cell.terrain === "plains" ? 0.26 : 0.24;
  offsets.forEach((offset) => {
    ctx.drawImage(image, center.x + offset.x - stampSize / 2, center.y + offset.y - stampSize / 2, stampSize, stampSize);
  });
  ctx.restore();
}

function drawGrid(ctx, project, cell, size, mapConfig) {
  const points = getCellPoints(project, cell.col, cell.row, size);
  pathCell(ctx, points);
  ctx.lineWidth = 1;
  ctx.strokeStyle = mapConfig.layout === "square" ? "rgba(242, 233, 223, 0.12)" : "rgba(42, 33, 25, 0.22)";
  ctx.stroke();
}

function drawOverlayMarker(ctx, overlayId, center, size, mapConfig, builtinIconCache) {
  const overlay = mapConfig.overlayDefs[overlayId];
  if (!overlay) {
    return;
  }

  const radius = mapConfig.layout === "square" ? size * 0.26 : size * 0.34;
  ctx.fillStyle = mapConfig.layout === "square" ? "rgba(24, 20, 18, 0.84)" : "rgba(255, 248, 232, 0.92)";
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
  ctx.font = `bold ${mapConfig.layout === "square" ? "10px" : "13px"} "Trebuchet MS", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(overlay.marker, center.x, center.y + 1);
}

export function createCustomPlacementLookup(project) {
  return {
    placementsById: new Map(project.customPlacements.map((placement) => [placement.id, placement])),
    symbolsById: new Map(project.customSymbols.map((symbol) => [symbol.id, symbol]))
  };
}

function drawCustomPlacements(ctx, cell, size, imageCache, placementLookup, center) {
  if (!cell.customPlacementIds.length) {
    return;
  }

  const visibleSize = size * 0.82;

  cell.customPlacementIds.forEach((placementId, index) => {
    const placement = placementLookup.placementsById.get(placementId);
    const symbol = placement ? placementLookup.symbolsById.get(placement.symbolId) : null;

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

function drawEdgeFeatures(ctx, project, size, mapConfig) {
  project.edgeFeatures.forEach((feature) => {
    const def = mapConfig.edgeDefs[feature.type];
    if (!def) {
      return;
    }

    const a = getCellCenter(project, feature.from.col, feature.from.row, size);
    const b = getCellCenter(project, feature.to.col, feature.to.row, size);
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const bend = mapConfig.layout === "square" ? 0 : feature.type === "river" ? 10 : 4;

    ctx.save();
    ctx.strokeStyle = def.stroke;
    ctx.lineWidth = def.lineWidth;
    ctx.setLineDash(def.dash);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);

    if (mapConfig.layout === "square") {
      ctx.lineTo(b.x, b.y);
    } else {
      ctx.quadraticCurveTo(midX + (a.y - b.y) * 0.08, midY + bend, b.x, b.y);
    }

    ctx.stroke();
    ctx.restore();
  });
}

function drawHighlight(ctx, project, cell, size, fillStyle, strokeStyle) {
  const points = getCellPoints(project, cell.col, cell.row, size);
  pathCell(ctx, points);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
}

function drawMap(ctx, options) {
  const { project, size, hoverCell, selectedCell, pendingEdgeCell, imageCache, builtinIconCache, mapConfig } = options;
  const placementLookup = createCustomPlacementLookup(project);

  project.cells.forEach((cell) => {
    drawTerrain(ctx, project, cell, size, mapConfig);
    drawTerrainTexture(ctx, project, cell, size, mapConfig, builtinIconCache);
  });

  drawEdgeFeatures(ctx, project, size, mapConfig);

  project.cells.forEach((cell) => {
    drawGrid(ctx, project, cell, size, mapConfig);
    const center = getCellCenter(project, cell.col, cell.row, size);
    cell.overlays.forEach((overlayId, index) => {
      const verticalOffset = mapConfig.layout === "square" ? index * 12 : index * 10;
      drawOverlayMarker(
        ctx,
        overlayId,
        { x: center.x, y: center.y - verticalOffset },
        size,
        mapConfig,
        builtinIconCache
      );
    });
    drawCustomPlacements(ctx, cell, size, imageCache, placementLookup, center);
  });

  if (hoverCell) {
    drawHighlight(ctx, project, hoverCell, size, "rgba(255, 255, 255, 0.16)", "rgba(255, 255, 255, 0.42)");
  }

  if (selectedCell) {
    drawHighlight(ctx, project, selectedCell, size, "rgba(196, 114, 53, 0.14)", "rgba(143, 93, 43, 0.8)");
  }

  if (pendingEdgeCell) {
    drawHighlight(ctx, project, pendingEdgeCell, size, "rgba(47, 111, 158, 0.14)", "rgba(47, 111, 158, 0.8)");
  }
}

export function drawScene(ctx, options) {
  const { canvasWidth, canvasHeight, viewport, mapConfig } = options;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = mapConfig.canvasBackground;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.save();
  ctx.setTransform(viewport.scale, 0, 0, viewport.scale, viewport.offsetX, viewport.offsetY);
  drawMap(ctx, options);
  ctx.restore();
}

export function drawExportCanvas(canvas, { project, size, imageCache, builtinIconCache, scale = 2, mapConfig }) {
  const bounds = getMapBounds(project, size);
  const padding = size * 2;
  canvas.width = Math.ceil((bounds.width + padding * 2) * scale);
  canvas.height = Math.ceil((bounds.height + padding * 2) * scale);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = mapConfig.exportBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(padding - bounds.minX, padding - bounds.minY);
  drawMap(ctx, {
    project,
    size,
    imageCache,
    builtinIconCache,
    hoverCell: null,
    selectedCell: null,
    pendingEdgeCell: null,
    mapConfig
  });
  ctx.restore();
}
