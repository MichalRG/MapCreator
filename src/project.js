import { buildEmptyCells } from "./hex.js";

export function cloneProject(project) {
  return JSON.parse(JSON.stringify(project));
}

export function createProject({ width, height, name }) {
  const now = new Date().toISOString();
  return {
    version: 1,
    metadata: {
      name: name || "Untitled Map",
      createdAt: now,
      updatedAt: now,
      width,
      height,
      hexOrientation: "pointy-top"
    },
    cells: buildEmptyCells(width, height),
    edgeFeatures: [],
    customSymbols: [],
    customPlacements: []
  };
}

export function touchProject(project) {
  project.metadata.updatedAt = new Date().toISOString();
}

export function validateProjectShape(project) {
  if (!project || typeof project !== "object") {
    throw new Error("Project is missing.");
  }

  if (project.version !== 1) {
    throw new Error("Unsupported project version.");
  }

  if (!project.metadata || project.metadata.hexOrientation !== "pointy-top") {
    throw new Error("Only pointy-top projects are supported.");
  }

  if (!Number.isInteger(project.metadata.width) || !Number.isInteger(project.metadata.height)) {
    throw new Error("Project dimensions are invalid.");
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
  const slug = rawName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "map-project"}.hexmap.json`;
}

export function getSuggestedPngName(project) {
  return getSuggestedProjectName(project).replace(/\.hexmap\.json$/i, ".png");
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
