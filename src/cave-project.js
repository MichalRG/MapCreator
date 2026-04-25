import { getStrokeSurfaceVariant } from "./cave-surface-variants.js";

const PROJECT_VERSION = 5;
const PROJECT_KIND = "cave-draft";
const PROJECT_EXTENSION = ".caveforge.json";
const PAINT_LAYER_COUNT = 5;

function defaultLayerId(index) {
  return `layer-${index + 1}`;
}

function defaultLayerName(index) {
  return `Layer ${index + 1}`;
}

function createPaintLayer(index) {
  return {
    id: defaultLayerId(index),
    name: defaultLayerName(index),
    visible: true,
    strokes: []
  };
}

export function createPaintLayers() {
  return Array.from({ length: PAINT_LAYER_COUNT }, (_, index) => createPaintLayer(index));
}

export function getPaintLayers(project) {
  return Array.isArray(project?.paintLayers) ? project.paintLayers : [];
}

export function getPaintLayer(project, layerId) {
  const layers = getPaintLayers(project);
  return layers.find((layer) => layer.id === layerId) || layers[0] || null;
}

export function getAllPaintStrokes(project) {
  return getPaintLayers(project).flatMap((layer) => layer.strokes || []);
}

export function cloneProject(project) {
  return JSON.parse(JSON.stringify(project));
}

export function createProject({ width = 2400, height = 1600, name = "Untitled Cavern" } = {}) {
  const now = new Date().toISOString();

  return {
    version: PROJECT_VERSION,
    kind: PROJECT_KIND,
    metadata: {
      name,
      createdAt: now,
      updatedAt: now,
      width,
      height,
      gridSize: 64,
      showGrid: true,
      snapToGrid: false
    },
    paintLayers: createPaintLayers(),
    stamps: [],
    customAssets: []
  };
}

export function touchProject(project) {
  project.metadata.updatedAt = new Date().toISOString();
}

function normalizeStroke(stroke) {
  const legacyTool = String(stroke.tool);
  const normalizedTool = legacyTool === "floor-up" || legacyTool === "floor-down" ? "floor" : legacyTool;
  const legacyFloorVariant = legacyTool === "floor-up" ? "up" : legacyTool === "floor-down" ? "down" : undefined;
  const surfaceVariant = getStrokeSurfaceVariant({
    ...stroke,
    tool: normalizedTool,
    floorVariant: stroke.floorVariant || legacyFloorVariant
  });

  return {
    id: String(stroke.id),
    tool: normalizedTool,
    surfaceVariant,
    floorVariant: normalizedTool === "floor" ? surfaceVariant : "normal",
    size: Number(stroke.size),
    opacity: Number(stroke.opacity),
    mergeTouches: stroke.mergeTouches !== undefined ? Boolean(stroke.mergeTouches) : true,
    points: Array.isArray(stroke.points)
      ? stroke.points.map((point) => ({
          x: Number(point.x),
          y: Number(point.y)
        }))
      : []
  };
}

function normalizeStamp(stamp, index, defaultLayerIdValue = defaultLayerId(0)) {
  return {
    id: String(stamp.id),
    assetKind: stamp.assetKind === "custom" ? "custom" : "builtin",
    assetId: String(stamp.assetId),
    layerId: String(stamp.layerId || defaultLayerIdValue),
    x: Number(stamp.x),
    y: Number(stamp.y),
    size: Number(stamp.size),
    rotation: Number(stamp.rotation)
  };
}

function normalizeCustomAsset(asset) {
  return {
    id: String(asset.id),
    name: String(asset.name || "Imported Detail"),
    assetData: String(asset.assetData || ""),
    assetType: asset.assetType === "svg" ? "svg" : "png"
  };
}

function normalizePaintLayer(layer, index) {
  return {
    id: String(layer?.id || defaultLayerId(index)),
    name: String(layer?.name || defaultLayerName(index)),
    visible: layer?.visible !== undefined ? Boolean(layer.visible) : true,
    strokes: Array.isArray(layer?.strokes) ? layer.strokes.map(normalizeStroke) : []
  };
}

function normalizePaintLayers(project) {
  const normalizedLayers = createPaintLayers();

  if (project.version === 3) {
    normalizedLayers[0].strokes = Array.isArray(project.strokes) ? project.strokes.map(normalizeStroke) : [];
    return normalizedLayers;
  }

  const sourceLayers = Array.isArray(project.paintLayers) ? project.paintLayers : [];
  return normalizedLayers.map((layer, index) => normalizePaintLayer(sourceLayers[index] || layer, index));
}

export function normalizeProject(project) {
  if (!project || typeof project !== "object") {
    throw new Error("Project is missing.");
  }

  if (project.version === 2 && project.metadata?.mapType === "cave") {
    throw new Error("Grid cave projects from the older editor are not supported by the freeform cave draft tool.");
  }

  if ((project.version !== 3 && project.version !== 4 && project.version !== PROJECT_VERSION) || project.kind !== PROJECT_KIND) {
    throw new Error("Unsupported project version.");
  }

  const paintLayers = normalizePaintLayers(project);
  const fallbackLayerId = paintLayers[0]?.id || defaultLayerId(0);

  return {
    version: PROJECT_VERSION,
    kind: PROJECT_KIND,
    metadata: {
      name: String(project.metadata?.name || "Untitled Cavern"),
      createdAt: String(project.metadata?.createdAt || new Date().toISOString()),
      updatedAt: String(project.metadata?.updatedAt || new Date().toISOString()),
      width: Number(project.metadata?.width),
      height: Number(project.metadata?.height),
      gridSize: Number(project.metadata?.gridSize || 64),
      showGrid: Boolean(project.metadata?.showGrid),
      snapToGrid: Boolean(project.metadata?.snapToGrid)
    },
    paintLayers,
    stamps: Array.isArray(project.stamps) ? project.stamps.map((stamp, index) => normalizeStamp(stamp, index, fallbackLayerId)) : [],
    customAssets: Array.isArray(project.customAssets) ? project.customAssets.map(normalizeCustomAsset) : []
  };
}

export function validateProjectShape(project) {
  if (!project || typeof project !== "object") {
    throw new Error("Project is missing.");
  }

  if (project.version !== PROJECT_VERSION || project.kind !== PROJECT_KIND) {
    throw new Error("Unsupported project version.");
  }

  if (!project.metadata) {
    throw new Error("Project metadata is missing.");
  }

  if (!Number.isFinite(project.metadata.width) || !Number.isFinite(project.metadata.height)) {
    throw new Error("Project dimensions are invalid.");
  }

  if (project.metadata.width < 800 || project.metadata.height < 600) {
    throw new Error("Project dimensions are too small.");
  }

  if (!Array.isArray(project.paintLayers) || !Array.isArray(project.stamps) || !Array.isArray(project.customAssets)) {
    throw new Error("Project data is incomplete.");
  }

  if (project.paintLayers.length !== PAINT_LAYER_COUNT) {
    throw new Error("Project paint layers are invalid.");
  }

  const validLayerIds = new Set(project.paintLayers.map((layer) => layer.id));
  if (project.stamps.some((stamp) => !validLayerIds.has(stamp.layerId))) {
    throw new Error("Project detail layers are invalid.");
  }

  return true;
}

export function getSuggestedProjectName(project) {
  const rawName = project?.metadata?.name || "cave-project";
  const slug = rawName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "cave-project"}${PROJECT_EXTENSION}`;
}

export function getSuggestedPngName(project) {
  return getSuggestedProjectName(project).replace(/\.json$/i, ".png");
}
