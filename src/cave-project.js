const PROJECT_VERSION = 3;
const PROJECT_KIND = "cave-draft";
const PROJECT_EXTENSION = ".caveforge.json";

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
    strokes: [],
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
  const floorVariant =
    stroke.floorVariant ||
    (legacyTool === "floor-up" ? "up" : legacyTool === "floor-down" ? "down" : "normal");

  return {
    id: String(stroke.id),
    tool: normalizedTool,
    floorVariant: floorVariant === "up" || floorVariant === "down" ? floorVariant : "normal",
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

function normalizeStamp(stamp) {
  return {
    id: String(stamp.id),
    assetKind: stamp.assetKind === "custom" ? "custom" : "builtin",
    assetId: String(stamp.assetId),
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

export function normalizeProject(project) {
  if (!project || typeof project !== "object") {
    throw new Error("Project is missing.");
  }

  if (project.version === 2 && project.metadata?.mapType === "cave") {
    throw new Error("Grid cave projects from the older editor are not supported by the freeform cave draft tool.");
  }

  if (project.version !== PROJECT_VERSION || project.kind !== PROJECT_KIND) {
    throw new Error("Unsupported project version.");
  }

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
    strokes: Array.isArray(project.strokes) ? project.strokes.map(normalizeStroke) : [],
    stamps: Array.isArray(project.stamps) ? project.stamps.map(normalizeStamp) : [],
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

  if (!Array.isArray(project.strokes) || !Array.isArray(project.stamps) || !Array.isArray(project.customAssets)) {
    throw new Error("Project data is incomplete.");
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
