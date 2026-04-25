export const SURFACE_VARIANT_DEFS = Object.freeze({
  floor: Object.freeze([
    Object.freeze({ id: "normal", label: "Normal" }),
    Object.freeze({ id: "up", label: "Raised" }),
    Object.freeze({ id: "down", label: "Lowered" }),
    Object.freeze({ id: "cracked", label: "Cracked Stone" }),
    Object.freeze({ id: "wall", label: "Parent Rock" }),
    Object.freeze({ id: "wall-jagged", label: "Jagged Parent Rock" })
  ]),
  wall: Object.freeze([
    Object.freeze({ id: "normal", label: "Smooth Parent Rock" }),
    Object.freeze({ id: "jagged", label: "Jagged Parent Rock" })
  ]),
  water: Object.freeze([
    Object.freeze({ id: "normal", label: "Normal" }),
    Object.freeze({ id: "pool", label: "Dark Pool" })
  ]),
  lava: Object.freeze([
    Object.freeze({ id: "normal", label: "Normal" }),
    Object.freeze({ id: "molten", label: "Molten Vein" })
  ]),
  chasm: Object.freeze([
    Object.freeze({ id: "normal", label: "Normal" }),
    Object.freeze({ id: "rift", label: "Broken Rift" })
  ])
});

export function getSurfaceVariantOptions(tool) {
  return SURFACE_VARIANT_DEFS[tool] || [];
}

export function surfaceToolSupportsVariants(tool) {
  return getSurfaceVariantOptions(tool).length > 0;
}

export function getDefaultSurfaceVariant(tool) {
  return getSurfaceVariantOptions(tool)[0]?.id || "normal";
}

export function normalizeSurfaceVariant(tool, variant) {
  const normalized = String(variant || "");
  return getSurfaceVariantOptions(tool).some((entry) => entry.id === normalized) ? normalized : getDefaultSurfaceVariant(tool);
}

export function getSurfaceVariantLabel(tool, variant) {
  return getSurfaceVariantOptions(tool).find((entry) => entry.id === variant)?.label || getSurfaceVariantOptions(tool)[0]?.label || "Normal";
}

export function resolveSurfaceBrushSelection(tool, variant) {
  const normalizedTool = String(tool || "");
  const normalizedVariant = normalizeSurfaceVariant(normalizedTool, variant);

  if (normalizedTool === "floor") {
    if (normalizedVariant === "wall") {
      return {
        tool: "wall",
        surfaceVariant: "normal",
        paletteVariant: normalizedVariant
      };
    }

    if (normalizedVariant === "wall-jagged") {
      return {
        tool: "wall",
        surfaceVariant: "jagged",
        paletteVariant: normalizedVariant
      };
    }
  }

  return {
    tool: normalizedTool,
    surfaceVariant: normalizedVariant,
    paletteVariant: normalizedVariant
  };
}

export function getStrokeSurfaceVariant(stroke) {
  if (!stroke || typeof stroke !== "object") {
    return "normal";
  }

  return normalizeSurfaceVariant(
    String(stroke.tool || ""),
    stroke.surfaceVariant || (stroke.tool === "floor" ? stroke.floorVariant : undefined)
  );
}
