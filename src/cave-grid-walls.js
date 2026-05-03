import { getCell } from "./hex.js";

export const WALL_EDGE_DIRECTIONS = Object.freeze(["north", "east", "south", "west"]);

const WALL_EDGE_OFFSETS = Object.freeze({
  north: Object.freeze({ col: 0, row: -1, opposite: "south" }),
  east: Object.freeze({ col: 1, row: 0, opposite: "west" }),
  south: Object.freeze({ col: 0, row: 1, opposite: "north" }),
  west: Object.freeze({ col: -1, row: 0, opposite: "east" })
});

export function normalizeWallEdges(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const result = [];
  value.forEach((entry) => {
    const direction = String(entry || "");
    if (WALL_EDGE_DIRECTIONS.includes(direction) && !result.includes(direction)) {
      result.push(direction);
    }
  });
  return result;
}

export function getOppositeWallEdge(direction) {
  return WALL_EDGE_OFFSETS[direction]?.opposite || null;
}

export function getWallEdgeNeighbor(col, row, direction) {
  const offset = WALL_EDGE_OFFSETS[direction];
  if (!offset) {
    return null;
  }

  return {
    col: col + offset.col,
    row: row + offset.row
  };
}

function setWallEdge(cell, direction, enabled) {
  if (!cell || !WALL_EDGE_DIRECTIONS.includes(direction)) {
    return;
  }

  const nextEdges = normalizeWallEdges(cell.wallEdges);
  const existingIndex = nextEdges.indexOf(direction);

  if (enabled && existingIndex === -1) {
    nextEdges.push(direction);
  } else if (!enabled && existingIndex >= 0) {
    nextEdges.splice(existingIndex, 1);
  }

  cell.wallEdges = nextEdges;
}

export function applyCaveWallClearMode(project, col, row, { defaultTerrain, addWallBorders = false }) {
  const targetCell = getCell(project, col, row);
  if (!targetCell) {
    return;
  }

  targetCell.wallEdges = [];

  WALL_EDGE_DIRECTIONS.forEach((direction) => {
    const neighborPoint = getWallEdgeNeighbor(col, row, direction);
    const neighbor = neighborPoint ? getCell(project, neighborPoint.col, neighborPoint.row) : null;
    if (!neighbor) {
      return;
    }

    const opposite = getOppositeWallEdge(direction);
    setWallEdge(neighbor, opposite, false);
    if (addWallBorders && neighbor.terrain !== defaultTerrain) {
      setWallEdge(neighbor, opposite, true);
    }
  });
}

export function syncCaveWallEdgesForTerrainChange(project, col, row, defaultTerrain) {
  const targetCell = getCell(project, col, row);
  if (!targetCell) {
    return;
  }

  targetCell.wallEdges = normalizeWallEdges(targetCell.wallEdges);

  WALL_EDGE_DIRECTIONS.forEach((direction) => {
    const neighborPoint = getWallEdgeNeighbor(col, row, direction);
    const neighbor = neighborPoint ? getCell(project, neighborPoint.col, neighborPoint.row) : null;
    if (!neighbor) {
      if (targetCell.terrain === defaultTerrain) {
        setWallEdge(targetCell, direction, false);
      }
      return;
    }

    const opposite = getOppositeWallEdge(direction);
    if (targetCell.terrain === defaultTerrain) {
      setWallEdge(targetCell, direction, false);
      setWallEdge(neighbor, opposite, false);
      return;
    }

    if (neighbor.terrain !== defaultTerrain) {
      setWallEdge(targetCell, direction, false);
      setWallEdge(neighbor, opposite, false);
    }
  });
}
