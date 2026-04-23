const SQRT3 = Math.sqrt(3);

export function cellKey(col, row) {
  return `${col},${row}`;
}

function getLayout(project) {
  return project?.metadata?.gridLayout || "hex-pointy";
}

export function buildEmptyCells(width, height, defaultTerrain = "plains") {
  const cells = [];

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      cells.push({
        col,
        row,
        terrain: defaultTerrain,
        overlays: [],
        customPlacementIds: []
      });
    }
  }

  return cells;
}

export function cellIndex(width, col, row) {
  return row * width + col;
}

export function getCell(project, col, row) {
  if (!project) {
    return null;
  }

  if (col < 0 || row < 0 || col >= project.metadata.width || row >= project.metadata.height) {
    return null;
  }

  return project.cells[cellIndex(project.metadata.width, col, row)] || null;
}

export function offsetToAxial(col, row) {
  return {
    q: col - Math.floor((row - (row & 1)) / 2),
    r: row
  };
}

export function axialToOffset(q, r) {
  return {
    col: q + Math.floor((r - (r & 1)) / 2),
    row: r
  };
}

export function areAdjacent(project, a, b) {
  if (getLayout(project) === "square") {
    return Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;
  }

  const axialA = offsetToAxial(a.col, a.row);
  const axialB = offsetToAxial(b.col, b.row);
  const dq = Math.abs(axialA.q - axialB.q);
  const dr = Math.abs(axialA.r - axialB.r);
  const ds = Math.abs((-axialA.q - axialA.r) - (-axialB.q - axialB.r));
  return Math.max(dq, dr, ds) === 1;
}

export function normalizeEdgeEndpoints(a, b) {
  const left = cellKey(a.col, a.row);
  const right = cellKey(b.col, b.row);
  return left < right ? [a, b] : [b, a];
}

export function edgeKey(type, a, b) {
  const [first, second] = normalizeEdgeEndpoints(a, b);
  return `${type}:${cellKey(first.col, first.row)}:${cellKey(second.col, second.row)}`;
}

function getHexCenter(col, row, size) {
  return {
    x: size * SQRT3 * (col + 0.5 * (row & 1)),
    y: size * 1.5 * row
  };
}

function getHexPoints(col, row, size) {
  const center = getHexCenter(col, row, size);
  const points = [];

  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 180) * (60 * index - 30);
    points.push({
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle)
    });
  }

  return points;
}

function getSquareCenter(col, row, size) {
  return {
    x: col * size + size / 2,
    y: row * size + size / 2
  };
}

function getSquarePoints(col, row, size) {
  const x = col * size;
  const y = row * size;

  return [
    { x, y },
    { x: x + size, y },
    { x: x + size, y: y + size },
    { x, y: y + size }
  ];
}

export function getCellCenter(project, col, row, size) {
  return getLayout(project) === "square" ? getSquareCenter(col, row, size) : getHexCenter(col, row, size);
}

export function getCellPoints(project, col, row, size) {
  return getLayout(project) === "square" ? getSquarePoints(col, row, size) : getHexPoints(col, row, size);
}

function cubeRound(q, r) {
  let x = q;
  let z = r;
  let y = -x - z;

  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);

  const xDiff = Math.abs(rx - x);
  const yDiff = Math.abs(ry - y);
  const zDiff = Math.abs(rz - z);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { q: rx, r: rz };
}

function worldToHexCell(worldX, worldY, size) {
  const q = ((SQRT3 / 3) * worldX - worldY / 3) / size;
  const r = ((2 / 3) * worldY) / size;
  const rounded = cubeRound(q, r);
  return axialToOffset(rounded.q, rounded.r);
}

export function worldToCell(project, worldX, worldY, size) {
  if (getLayout(project) === "square") {
    return {
      col: Math.floor(worldX / size),
      row: Math.floor(worldY / size)
    };
  }

  return worldToHexCell(worldX, worldY, size);
}

export function getMapBounds(project, size) {
  if (getLayout(project) === "square") {
    return {
      minX: 0,
      minY: 0,
      maxX: project.metadata.width * size,
      maxY: project.metadata.height * size,
      width: project.metadata.width * size,
      height: project.metadata.height * size
    };
  }

  const width = project.metadata.width;
  const height = project.metadata.height;

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const center = getHexCenter(col, row, size);
      const halfWidth = (SQRT3 * size) / 2;
      minX = Math.min(minX, center.x - halfWidth);
      maxX = Math.max(maxX, center.x + halfWidth);
      minY = Math.min(minY, center.y - size);
      maxY = Math.max(maxY, center.y + size);
    }
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}
