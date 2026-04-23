export const BUILTIN_ASSETS = [
  {
    id: "stalagmites",
    label: "Stalagmites",
    description: "Sharp stone teeth for chamber edges.",
    accent: "#8b817a",
    defaultSize: 92
  },
  {
    id: "crystals",
    label: "Crystals",
    description: "Blue mineral clusters and shard gardens.",
    accent: "#79b4ff",
    defaultSize: 84
  },
  {
    id: "mushrooms",
    label: "Mushrooms",
    description: "Bioluminescent fungal patches.",
    accent: "#9bc879",
    defaultSize: 80
  },
  {
    id: "small_rocks",
    label: "Small Rocks",
    description: "Loose stone scatter and rubble patches.",
    accent: "#8f857d",
    defaultSize: 76
  },
  {
    id: "moss",
    label: "Green Moss",
    description: "Soft damp growth for cave walls and floors.",
    accent: "#6f9a52",
    defaultSize: 86
  },
  {
    id: "bones",
    label: "Bones",
    description: "Remains, warnings, and old battlefields.",
    accent: "#d8d0c4",
    defaultSize: 72
  },
  {
    id: "nest",
    label: "Nest",
    description: "Creature nest with eggs and debris.",
    accent: "#8e6745",
    defaultSize: 90
  },
  {
    id: "camp",
    label: "Camp",
    description: "Bedrolls and a guarded fire pit.",
    accent: "#f08f4e",
    defaultSize: 82
  },
  {
    id: "treasure",
    label: "Treasure",
    description: "Chest, coins, and a focal reward.",
    accent: "#f2c45e",
    defaultSize: 74
  },
  {
    id: "entrance",
    label: "Entrance",
    description: "A marked cave mouth or carved threshold.",
    accent: "#d8c68b",
    defaultSize: 110
  }
];

const BUILTIN_ASSET_MAP = new Map(BUILTIN_ASSETS.map((asset) => [asset.id, asset]));

export function getBuiltinAsset(assetId) {
  return BUILTIN_ASSET_MAP.get(assetId) || BUILTIN_ASSETS[0];
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

export function drawBuiltinAsset(ctx, assetId, { size, rotation = 0, alpha = 1 } = {}) {
  const asset = getBuiltinAsset(assetId);
  const resolvedSize = size || asset.defaultSize;

  ctx.save();
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;

  switch (asset.id) {
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

    case "camp":
      ctx.fillStyle = "#805839";
      ctx.fillRect(-resolvedSize * 0.34, resolvedSize * 0.06, resolvedSize * 0.26, resolvedSize * 0.16);
      ctx.fillRect(resolvedSize * 0.08, resolvedSize * 0.02, resolvedSize * 0.28, resolvedSize * 0.18);
      ctx.strokeStyle = "#4a3224";
      ctx.lineWidth = Math.max(2, resolvedSize * 0.05);
      ctx.beginPath();
      ctx.moveTo(-resolvedSize * 0.1, resolvedSize * 0.34);
      ctx.lineTo(0, -resolvedSize * 0.1);
      ctx.lineTo(resolvedSize * 0.12, resolvedSize * 0.34);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, resolvedSize * 0.08, resolvedSize * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = "#ff9c52";
      ctx.fill();
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
