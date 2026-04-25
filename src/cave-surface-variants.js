export const SURFACE_VARIANT_DEFS = Object.freeze({
  floor: Object.freeze([
    Object.freeze({ id: "normal", label: "Normal" }),
    Object.freeze({ id: "up", label: "Raised" }),
    Object.freeze({ id: "down", label: "Lowered" }),
    Object.freeze({ id: "cracked", label: "Cracked Stone" })
  ]),
  wall: Object.freeze([
    Object.freeze({ id: "normal", label: "Normal" }),
    Object.freeze({ id: "jagged", label: "Jagged Rock" })
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

export function getStrokeSurfaceVariant(stroke) {
  if (!stroke || typeof stroke !== "object") {
    return "normal";
  }

  return normalizeSurfaceVariant(
    String(stroke.tool || ""),
    stroke.surfaceVariant || (stroke.tool === "floor" ? stroke.floorVariant : undefined)
  );
}
