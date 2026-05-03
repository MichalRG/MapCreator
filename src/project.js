import { normalizeWallEdges } from "./cave-grid-walls.js";
import { getMapTypeDef } from "./constants.js";
import { buildEmptyCells } from "./hex.js";

export function cloneProject(project) {
  return JSON.parse(JSON.stringify(project));
}

export function createProject({ width, height, name, mapType = "hex-world" }) {
  const now = new Date().toISOString();
  const config = getMapTypeDef(mapType);
  return {
    version: 2,
    metadata: {
      name: name || "Untitled Map",
      createdAt: now,
      updatedAt: now,
      width,
      height,
      mapType: config.id,
      gridLayout: config.layout
    },
    cells: buildEmptyCells(width, height, config.defaultTerrain),
    edgeFeatures: [],
    customSymbols: [],
    customPlacements: []
  };
}

export function touchProject(project) {
  project.metadata.updatedAt = new Date().toISOString();
}

function normalizeCells(cells) {
  const normalizeLabel = (value) => (typeof value === "string" ? value.trim() : "");
  const normalizeOverlayLabels = (value) => {
    if (!value || typeof value !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(value)
        .map(([overlayId, label]) => [overlayId, normalizeLabel(label)])
        .filter(([, label]) => label)
    );
  };

  return cells.map((cell) => ({
    col: cell.col,
    row: cell.row,
    terrain: cell.terrain,
    terrainLabel: normalizeLabel(cell.terrainLabel),
    overlays: Array.isArray(cell.overlays) ? [...cell.overlays] : [],
    overlayLabels: normalizeOverlayLabels(cell.overlayLabels),
    wallEdges: normalizeWallEdges(cell.wallEdges),
    customPlacementIds: Array.isArray(cell.customPlacementIds) ? [...cell.customPlacementIds] : []
  }));
}

function migrateVersionOneProject(project) {
  const config = getMapTypeDef("hex-world");
  return {
    version: 2,
    metadata: {
      name: project.metadata?.name || "Untitled Map",
      createdAt: project.metadata?.createdAt || new Date().toISOString(),
      updatedAt: project.metadata?.updatedAt || new Date().toISOString(),
      width: project.metadata?.width,
      height: project.metadata?.height,
      mapType: config.id,
      gridLayout: config.layout
    },
    cells: normalizeCells(Array.isArray(project.cells) ? project.cells : []),
    edgeFeatures: Array.isArray(project.edgeFeatures) ? [...project.edgeFeatures] : [],
    customSymbols: Array.isArray(project.customSymbols) ? [...project.customSymbols] : [],
    customPlacements: Array.isArray(project.customPlacements) ? [...project.customPlacements] : []
  };
}

export function normalizeProject(project) {
  if (!project || typeof project !== "object") {
    throw new Error("Project is missing.");
  }

  if (project.version === 1) {
    return migrateVersionOneProject(project);
  }

  if (project.version !== 2) {
    throw new Error("Unsupported project version.");
  }

  return {
    ...project,
    metadata: { ...project.metadata },
    cells: normalizeCells(project.cells || []),
    edgeFeatures: Array.isArray(project.edgeFeatures) ? [...project.edgeFeatures] : [],
    customSymbols: Array.isArray(project.customSymbols) ? [...project.customSymbols] : [],
    customPlacements: Array.isArray(project.customPlacements) ? [...project.customPlacements] : []
  };
}

export function validateProjectShape(project) {
  if (!project || typeof project !== "object") {
    throw new Error("Project is missing.");
  }

  if (project.version !== 2) {
    throw new Error("Unsupported project version.");
  }

  if (!project.metadata) {
    throw new Error("Project metadata is missing.");
  }

  if (!Number.isInteger(project.metadata.width) || !Number.isInteger(project.metadata.height)) {
    throw new Error("Project dimensions are invalid.");
  }

  const config = getMapTypeDef(project.metadata.mapType);

  if (project.metadata.mapType !== config.id) {
    throw new Error("Unknown map type.");
  }

  if (project.metadata.gridLayout !== config.layout) {
    throw new Error("Project layout does not match the selected map type.");
  }

  if (!Array.isArray(project.cells) || !Array.isArray(project.edgeFeatures)) {
    throw new Error("Project data is incomplete.");
  }

  if (!Array.isArray(project.customSymbols) || !Array.isArray(project.customPlacements)) {
    throw new Error("Custom symbol data is incomplete.");
  }

  const expectedCellCount = project.metadata.width * project.metadata.height;
  if (project.cells.length !== expectedCellCount) {
    throw new Error("Project cell count does not match the declared dimensions.");
  }

  return true;
}

export function getSuggestedProjectName(project) {
  const rawName = project?.metadata?.name || "map-project";
  const config = getMapTypeDef(project?.metadata?.mapType);
  const slug = rawName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "map-project"}${config.fileExtension}`;
}

export function getSuggestedPngName(project) {
  return getSuggestedProjectName(project).replace(/\.json$/i, ".png");
}

export function listCustomPlacementsForCell(project, col, row) {
  const cell = project.cells[row * project.metadata.width + col];
  if (!cell) {
    return [];
  }

  return cell.customPlacementIds
    .map((placementId) => project.customPlacements.find((placement) => placement.id === placementId))
    .filter(Boolean);
}
