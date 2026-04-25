export const BUILTIN_ASSETS = [
  {
    id: "wall_straight",
    label: "Stone Wall",
    description: "Straight stone wall run for rooms and corridors.",
    accent: "#d0b08b",
    defaultSize: 64,
    category: "wall"
  },
  {
    id: "wall_corner",
    label: "Wall Corner",
    description: "Right-angle wall turn for chamber corners.",
    accent: "#ccb08b",
    defaultSize: 64,
    category: "wall"
  },
  {
    id: "wall_t",
    label: "Wall T-Junction",
    description: "Three-way wall join for branching spaces.",
    accent: "#d1b390",
    defaultSize: 64,
    category: "wall"
  },
  {
    id: "wall_end",
    label: "Wall End",
    description: "Short wall ending cleanly at a doorway or break.",
    accent: "#c7aa84",
    defaultSize: 64,
    category: "wall"
  },
  {
    id: "wall_pillar",
    label: "Wall Pillar",
    description: "Chunky support block for corners and intersections.",
    accent: "#c2a783",
    defaultSize: 48,
    category: "wall"
  },
  {
    id: "door_wood",
    label: "Wooden Door",
    description: "Top-down timber door that cuts neatly into a wall run.",
    accent: "#9b6a45",
    defaultSize: 48,
    category: "door"
  },
  {
    id: "door_stone",
    label: "Stone Door",
    description: "Top-down carved stone door for sealed chambers and tombs.",
    accent: "#a9a095",
    defaultSize: 48,
    category: "door"
  },
  {
    id: "stalagmites",
    label: "Stalagmites",
    description: "Sharp stone teeth for chamber edges.",
    accent: "#8b817a",
    defaultSize: 92,
    category: "detail"
  },
  {
    id: "crystals",
    label: "Crystals",
    description: "Blue mineral clusters and shard gardens.",
    accent: "#79b4ff",
    defaultSize: 84,
    category: "detail"
  },
  {
    id: "mushrooms",
    label: "Mushrooms",
    description: "Bioluminescent fungal patches.",
    accent: "#9bc879",
    defaultSize: 80,
    category: "detail"
  },
  {
    id: "small_rocks",
    label: "Small Rocks",
    description: "Loose stone scatter and rubble patches.",
    accent: "#8f857d",
    defaultSize: 76,
    category: "detail"
  },
  {
    id: "moss",
    label: "Green Moss",
    description: "Soft damp growth for cave walls and floors.",
    accent: "#6f9a52",
    defaultSize: 86,
    category: "detail"
  },
  {
    id: "bones",
    label: "Bones",
    description: "Remains, warnings, and old battlefields.",
    accent: "#d8d0c4",
    defaultSize: 72,
    category: "detail"
  },
  {
    id: "nest",
    label: "Nest",
    description: "Creature nest with eggs and debris.",
    accent: "#8e6745",
    defaultSize: 90,
    category: "detail"
  },
  {
    id: "bonfire_cold",
    label: "Bonfire",
    description: "Stone-ring bonfire with stacked logs and cold ash.",
    accent: "#8b7666",
    defaultSize: 84,
    category: "variant-detail"
  },
  {
    id: "camp",
    label: "Bonfire",
    description: "Stone-ring bonfire with active flame and warm light.",
    accent: "#f08f4e",
    defaultSize: 84,
    category: "variant-detail",
    light: {
      radius: 170,
      innerColor: "rgba(255, 215, 126, 0.32)",
      outerColor: "rgba(255, 144, 68, 0.16)"
    }
  },
  {
    id: "treasure",
    label: "Treasure",
    description: "Chest, coins, and a focal reward.",
    accent: "#f2c45e",
    defaultSize: 74,
    category: "detail"
  },
  {
    id: "entrance",
    label: "Entrance",
    description: "A marked cave mouth or carved threshold.",
    accent: "#d8c68b",
    defaultSize: 110,
    category: "detail"
  }
];

const BUILTIN_ASSET_MAP = new Map(BUILTIN_ASSETS.map((asset) => [asset.id, asset]));

export function getBuiltinAsset(assetId) {
  return BUILTIN_ASSET_MAP.get(assetId) || BUILTIN_ASSETS[0];
}

export function listBuiltinAssetsByCategory(category) {
  return BUILTIN_ASSETS.filter((asset) => (asset.category || "detail") === category);
}

export function isBuiltinWallAsset(assetId) {
  return getBuiltinAsset(assetId).category === "wall";
}

export function isBuiltinDoorAsset(assetId) {
  return getBuiltinAsset(assetId).category === "door";
}

export function isBuiltinStructuralAsset(assetId) {
  const category = getBuiltinAsset(assetId).category;
  return category === "wall" || category === "door";
}

function drawStoneSpike(ctx, x, y, width, height, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x, y + height / 2);
  ctx.lineTo(x + width * 0.18, y - height / 2);
  ctx.lineTo(x + width * 0.55, y - height * 0.24);
  ctx.lineTo(x + width * 0.85, y + height / 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1, width * 0.05);
  ctx.fill();
  ctx.stroke();
}

function drawCrystalShard(ctx, x, y, size, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.58);
  ctx.lineTo(x + size * 0.34, y - size * 0.08);
  ctx.lineTo(x + size * 0.16, y + size * 0.58);
  ctx.lineTo(x - size * 0.18, y + size * 0.34);
  ctx.lineTo(x - size * 0.34, y - size * 0.1);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1, size * 0.08);
  ctx.fill();
  ctx.stroke();
}

function drawMushroom(ctx, x, y, size, capFill) {
  ctx.strokeStyle = "#d7d3c2";
  ctx.lineWidth = Math.max(1.2, size * 0.08);
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.42);
  ctx.lineTo(x, y - size * 0.08);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(x, y - size * 0.18, size * 0.34, size * 0.22, 0, Math.PI, 0, true);
  ctx.fillStyle = capFill;
  ctx.fill();
}

function drawBone(ctx, x, y, length, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.strokeStyle = "#e5dfd3";
  ctx.lineWidth = Math.max(2, length * 0.12);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-length / 2, 0);
  ctx.lineTo(length / 2, 0);
  ctx.stroke();

  [-1, 1].forEach((direction) => {
    ctx.beginPath();
    ctx.arc(direction * length * 0.42, -length * 0.08, length * 0.11, 0, Math.PI * 2);
    ctx.arc(direction * length * 0.42, length * 0.08, length * 0.11, 0, Math.PI * 2);
    ctx.fillStyle = "#f3ede2";
    ctx.fill();
  });
  ctx.restore();
}

function drawRock(ctx, x, y, size, fill, stroke, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(-size * 0.42, size * 0.18);
  ctx.lineTo(-size * 0.26, -size * 0.28);
  ctx.lineTo(size * 0.06, -size * 0.4);
  ctx.lineTo(size * 0.34, -size * 0.14);
  ctx.lineTo(size * 0.28, size * 0.26);
  ctx.lineTo(-size * 0.08, size * 0.38);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1.4, size * 0.08);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawMossPatch(ctx, x, y, width, height, fill, stroke, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(-width * 0.5, height * 0.05);
  ctx.bezierCurveTo(-width * 0.42, -height * 0.48, -width * 0.22, -height * 0.34, -width * 0.12, -height * 0.06);
  ctx.bezierCurveTo(-width * 0.02, -height * 0.54, width * 0.18, -height * 0.42, width * 0.1, -height * 0.02);
  ctx.bezierCurveTo(width * 0.28, -height * 0.42, width * 0.44, -height * 0.18, width * 0.48, height * 0.06);
  ctx.bezierCurveTo(width * 0.3, height * 0.36, 0, height * 0.48, -width * 0.18, height * 0.3);
  ctx.bezierCurveTo(-width * 0.34, height * 0.44, -width * 0.52, height * 0.24, -width * 0.5, height * 0.05);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1.2, width * 0.05);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawWallStoneBlock(ctx, x, y, width, height, rotation = 0, profile = 0) {
  void profile;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(-width * 0.52, height * 0.16);
  ctx.lineTo(-width * 0.42, -height * 0.4);
  ctx.lineTo(-width * 0.08, -height * 0.48);
  ctx.lineTo(width * 0.36, -height * 0.28);
  ctx.lineTo(width * 0.5, height * 0.06);
  ctx.lineTo(width * 0.16, height * 0.46);
  ctx.lineTo(-width * 0.26, height * 0.42);
  ctx.closePath();
  ctx.fillStyle = "#dbc5a5";
  ctx.strokeStyle = "#685746";
  ctx.lineWidth = Math.max(1.4, Math.min(width, height) * 0.08);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-width * 0.28, -height * 0.14);
  ctx.lineTo(width * 0.12, -height * 0.22);
  ctx.strokeStyle = "rgba(255, 246, 224, 0.38)";
  ctx.lineWidth = Math.max(1, Math.min(width, height) * 0.05);
  ctx.stroke();
  ctx.restore();
}

function drawWallCourse(ctx, length, thickness, rotation = 0) {
  const parts = [0.24, 0.18, 0.22, 0.16, 0.2];
  const total = parts.reduce((sum, value) => sum + value, 0);
  const scale = length / total;
  let cursor = -length / 2;

  ctx.save();
  ctx.rotate(rotation);
  parts.forEach((part, index) => {
    const segment = part * scale;
    const centerX = cursor + segment / 2;
    const centerY = (index % 2 === 0 ? -1 : 1) * thickness * 0.06;
    const blockHeight = thickness * (0.88 + (index % 3) * 0.05);
    drawWallStoneBlock(ctx, centerX, centerY, segment * 0.96, blockHeight, (index % 2 === 0 ? -1 : 1) * 0.06);
    cursor += segment;
  });
  ctx.restore();
}

function drawWallPillarStack(ctx, size) {
  drawWallStoneBlock(ctx, 0, -size * 0.16, size * 0.56, size * 0.38, 0.08);
  drawWallStoneBlock(ctx, 0, size * 0.14, size * 0.64, size * 0.42, -0.04);
}

function drawWallArm(ctx, length, thickness, rotation = 0) {
  ctx.save();
  ctx.rotate(rotation);
  ctx.translate(length / 2, 0);
  drawWallCourse(ctx, length, thickness);
  ctx.restore();
}

function drawDoorLeaf(ctx, width, height, fill, stroke, plankStroke = null) {
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, Math.max(4, width * 0.18));
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1.4, width * 0.08);
  ctx.fill();
  ctx.stroke();

  if (plankStroke) {
    ctx.strokeStyle = plankStroke;
    ctx.lineWidth = Math.max(1, width * 0.05);
    [-0.2, 0, 0.2].forEach((offset) => {
      ctx.beginPath();
      ctx.moveTo(width * offset, -height * 0.34);
      ctx.lineTo(width * offset, height * 0.34);
      ctx.stroke();
    });
  }
}

function drawBonfireBase(ctx, resolvedSize) {
  const stoneSize = resolvedSize * 0.18;
  [
    [-0.34, 0.14, 0.98],
    [-0.14, -0.22, 0.86],
    [0.18, -0.18, 0.92],
    [0.38, 0.12, 0.84],
    [0.06, 0.3, 0.88],
    [-0.24, 0.3, 0.8]
  ].forEach(([x, y, scale], index) => {
    drawRock(
      ctx,
      resolvedSize * x,
      resolvedSize * y,
      stoneSize * scale,
      index % 2 === 0 ? "#988d82" : "#7f746a",
      "#544a43",
      (index - 2) * 0.18
    );
  });

  ctx.fillStyle = "#2a201a";
  ctx.beginPath();
  ctx.ellipse(0, resolvedSize * 0.06, resolvedSize * 0.24, resolvedSize * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#4e3424";
  ctx.lineWidth = Math.max(3, resolvedSize * 0.08);
  ctx.lineCap = "round";
  [
    [-0.16, 0.24, 0.18, -0.06],
    [0.18, 0.22, -0.14, -0.08],
    [-0.04, 0.28, 0.04, -0.12]
  ].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(resolvedSize * x1, resolvedSize * y1);
    ctx.lineTo(resolvedSize * x2, resolvedSize * y2);
    ctx.stroke();
  });

  ctx.strokeStyle = "rgba(124, 92, 70, 0.48)";
  ctx.lineWidth = Math.max(1.2, resolvedSize * 0.03);
  ctx.beginPath();
  ctx.moveTo(-resolvedSize * 0.1, resolvedSize * 0.18);
  ctx.lineTo(resolvedSize * 0.12, 0);
  ctx.stroke();
}

function drawBonfireFlame(ctx, resolvedSize) {
  const glow = ctx.createRadialGradient(0, resolvedSize * 0.04, resolvedSize * 0.04, 0, resolvedSize * 0.04, resolvedSize * 0.44);
  glow.addColorStop(0, "rgba(255, 229, 162, 0.78)");
  glow.addColorStop(0.45, "rgba(255, 167, 77, 0.34)");
  glow.addColorStop(1, "rgba(255, 120, 44, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-resolvedSize * 0.5, -resolvedSize * 0.44, resolvedSize, resolvedSize * 0.92);

  ctx.beginPath();
  ctx.moveTo(0, -resolvedSize * 0.22);
  ctx.bezierCurveTo(resolvedSize * 0.12, -resolvedSize * 0.08, resolvedSize * 0.18, resolvedSize * 0.08, 0, resolvedSize * 0.22);
  ctx.bezierCurveTo(-resolvedSize * 0.16, resolvedSize * 0.06, -resolvedSize * 0.12, -resolvedSize * 0.1, 0, -resolvedSize * 0.22);
  ctx.closePath();
  ctx.fillStyle = "#ff9b3f";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -resolvedSize * 0.16);
  ctx.bezierCurveTo(resolvedSize * 0.08, -resolvedSize * 0.04, resolvedSize * 0.08, resolvedSize * 0.04, 0, resolvedSize * 0.14);
  ctx.bezierCurveTo(-resolvedSize * 0.09, 0, -resolvedSize * 0.08, -resolvedSize * 0.08, 0, -resolvedSize * 0.16);
  ctx.closePath();
  ctx.fillStyle = "#ffe2a0";
  ctx.fill();
}

export function drawBuiltinDoorCutout(ctx, assetId, { size } = {}) {
  if (!isBuiltinDoorAsset(assetId)) {
    return false;
  }

  const resolvedSize = size || getBuiltinAsset(assetId).defaultSize;
  const width = resolvedSize * 0.54;
  const height = resolvedSize * 1.02;

  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, Math.max(5, width * 0.2));
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fill();
  return true;
}

export function drawBuiltinAsset(ctx, assetId, { size, rotation = 0, alpha = 1 } = {}) {
  const asset = getBuiltinAsset(assetId);
  const resolvedSize = size || asset.defaultSize;

  ctx.save();
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;

  switch (asset.id) {
    case "wall_straight":
      drawWallArm(ctx, resolvedSize / 2, resolvedSize * 0.3, 0);
      drawWallArm(ctx, resolvedSize / 2, resolvedSize * 0.3, Math.PI);
      break;

    case "wall_corner":
      drawWallArm(ctx, resolvedSize / 2, resolvedSize * 0.3, 0);
      drawWallArm(ctx, resolvedSize / 2, resolvedSize * 0.3, -Math.PI / 2);
      drawWallPillarStack(ctx, resolvedSize * 0.44);
      break;

    case "wall_t":
      drawWallArm(ctx, resolvedSize / 2, resolvedSize * 0.28, 0);
      drawWallArm(ctx, resolvedSize / 2, resolvedSize * 0.28, Math.PI);
      drawWallArm(ctx, resolvedSize / 2, resolvedSize * 0.28, -Math.PI / 2);
      drawWallPillarStack(ctx, resolvedSize * 0.42);
      break;

    case "wall_end":
      drawWallArm(ctx, resolvedSize / 2, resolvedSize * 0.28, Math.PI);
      ctx.save();
      ctx.translate(-resolvedSize / 2, 0);
      drawWallPillarStack(ctx, resolvedSize * 0.36);
      ctx.restore();
      break;

    case "wall_pillar":
      drawWallPillarStack(ctx, resolvedSize);
      break;

    case "door_wood":
      ctx.fillStyle = "rgba(28, 22, 18, 0.48)";
      ctx.beginPath();
      ctx.roundRect(-resolvedSize * 0.3, -resolvedSize * 0.48, resolvedSize * 0.6, resolvedSize * 0.96, resolvedSize * 0.1);
      ctx.fill();

      drawDoorLeaf(ctx, resolvedSize * 0.46, resolvedSize * 0.88, "#8f613f", "#433126", "rgba(55, 35, 24, 0.5)");

      ctx.strokeStyle = "#c9b59b";
      ctx.lineWidth = Math.max(1.4, resolvedSize * 0.05);
      [-0.22, 0.22].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(resolvedSize * x, -resolvedSize * 0.34);
        ctx.lineTo(resolvedSize * x, resolvedSize * 0.34);
        ctx.stroke();
      });

      ctx.fillStyle = "#d5c39b";
      ctx.beginPath();
      ctx.arc(resolvedSize * 0.14, 0, resolvedSize * 0.045, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "door_stone":
      ctx.fillStyle = "rgba(24, 22, 20, 0.48)";
      ctx.beginPath();
      ctx.roundRect(-resolvedSize * 0.3, -resolvedSize * 0.48, resolvedSize * 0.6, resolvedSize * 0.96, resolvedSize * 0.1);
      ctx.fill();

      drawDoorLeaf(ctx, resolvedSize * 0.48, resolvedSize * 0.9, "#a9a39a", "#5d5953");

      ctx.strokeStyle = "rgba(233, 227, 215, 0.4)";
      ctx.lineWidth = Math.max(1.2, resolvedSize * 0.045);
      ctx.beginPath();
      ctx.moveTo(-resolvedSize * 0.16, -resolvedSize * 0.26);
      ctx.lineTo(resolvedSize * 0.16, -resolvedSize * 0.34);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-resolvedSize * 0.12, resolvedSize * 0.2);
      ctx.lineTo(resolvedSize * 0.14, resolvedSize * 0.12);
      ctx.stroke();
      break;

    case "stalagmites":
      drawStoneSpike(ctx, -resolvedSize * 0.45, resolvedSize * 0.02, resolvedSize * 0.24, resolvedSize * 0.94, "#92877c", "#564d46");
      drawStoneSpike(ctx, -resolvedSize * 0.08, 0, resolvedSize * 0.3, resolvedSize * 1.16, "#a09489", "#5e534b");
      drawStoneSpike(ctx, resolvedSize * 0.2, resolvedSize * 0.06, resolvedSize * 0.24, resolvedSize * 0.82, "#83776c", "#4b433d");
      break;

    case "crystals":
      drawCrystalShard(ctx, -resolvedSize * 0.18, resolvedSize * 0.1, resolvedSize * 0.62, "#9cd0ff", "#3f6ea0");
      drawCrystalShard(ctx, resolvedSize * 0.14, -resolvedSize * 0.02, resolvedSize * 0.52, "#6db8ff", "#365b83");
      drawCrystalShard(ctx, resolvedSize * 0.34, resolvedSize * 0.14, resolvedSize * 0.36, "#b8e4ff", "#4a7396");
      break;

    case "mushrooms":
      drawMushroom(ctx, -resolvedSize * 0.22, resolvedSize * 0.08, resolvedSize * 0.42, "#a9da86");
      drawMushroom(ctx, resolvedSize * 0.04, -resolvedSize * 0.04, resolvedSize * 0.56, "#8cc06a");
      drawMushroom(ctx, resolvedSize * 0.28, resolvedSize * 0.12, resolvedSize * 0.36, "#bddf9c");
      break;

    case "small_rocks":
      drawRock(ctx, -resolvedSize * 0.24, resolvedSize * 0.1, resolvedSize * 0.34, "#9b9086", "#5b524c", -0.22);
      drawRock(ctx, 0, -resolvedSize * 0.06, resolvedSize * 0.46, "#857a71", "#4e463f", 0.14);
      drawRock(ctx, resolvedSize * 0.28, resolvedSize * 0.16, resolvedSize * 0.28, "#aba095", "#655c55", 0.3);
      break;

    case "moss":
      drawMossPatch(ctx, -resolvedSize * 0.18, resolvedSize * 0.04, resolvedSize * 0.46, resolvedSize * 0.24, "#6f9b56", "#456438", -0.22);
      drawMossPatch(ctx, resolvedSize * 0.14, -resolvedSize * 0.08, resolvedSize * 0.54, resolvedSize * 0.28, "#82ae63", "#527544", 0.12);
      drawMossPatch(ctx, resolvedSize * 0.04, resolvedSize * 0.18, resolvedSize * 0.38, resolvedSize * 0.2, "#5c8446", "#3f5f33", 0.26);
      break;

    case "bones":
      drawBone(ctx, 0, 0, resolvedSize * 0.62, Math.PI / 4);
      drawBone(ctx, 0, 0, resolvedSize * 0.62, -Math.PI / 4);
      break;

    case "nest":
      ctx.strokeStyle = "#5c4330";
      ctx.lineWidth = Math.max(2, resolvedSize * 0.06);
      ctx.beginPath();
      ctx.ellipse(0, 0, resolvedSize * 0.42, resolvedSize * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(-resolvedSize * 0.12, 0, resolvedSize * 0.11, resolvedSize * 0.15, -0.2, 0, Math.PI * 2);
      ctx.ellipse(resolvedSize * 0.08, resolvedSize * 0.04, resolvedSize * 0.1, resolvedSize * 0.14, 0.1, 0, Math.PI * 2);
      ctx.fillStyle = "#e8d6aa";
      ctx.fill();
      break;

    case "bonfire_cold":
      drawBonfireBase(ctx, resolvedSize);
      ctx.fillStyle = "rgba(186, 180, 172, 0.72)";
      ctx.beginPath();
      ctx.ellipse(0, resolvedSize * 0.05, resolvedSize * 0.1, resolvedSize * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "camp":
      drawBonfireBase(ctx, resolvedSize);
      drawBonfireFlame(ctx, resolvedSize);
      break;

    case "treasure":
      ctx.fillStyle = "#6a482f";
      ctx.strokeStyle = "#2d2118";
      ctx.lineWidth = Math.max(2, resolvedSize * 0.06);
      ctx.beginPath();
      ctx.roundRect(-resolvedSize * 0.34, -resolvedSize * 0.08, resolvedSize * 0.68, resolvedSize * 0.42, resolvedSize * 0.08);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f0c95f";
      ctx.fillRect(-resolvedSize * 0.32, -resolvedSize * 0.12, resolvedSize * 0.64, resolvedSize * 0.12);
      break;

    case "entrance":
      ctx.fillStyle = "#241e1a";
      ctx.strokeStyle = "#c7b27c";
      ctx.lineWidth = Math.max(2, resolvedSize * 0.06);
      ctx.beginPath();
      ctx.moveTo(-resolvedSize * 0.38, resolvedSize * 0.34);
      ctx.lineTo(-resolvedSize * 0.38, -resolvedSize * 0.04);
      ctx.quadraticCurveTo(0, -resolvedSize * 0.48, resolvedSize * 0.38, -resolvedSize * 0.04);
      ctx.lineTo(resolvedSize * 0.38, resolvedSize * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    default:
      break;
  }

  ctx.restore();
}
