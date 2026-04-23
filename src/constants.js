import { BUILTIN_ICON_URLS } from "./icons.js";

export const HEX_SIZE = 34;

export const MAP_PRESETS = [
  { id: "6x6", label: "6 x 6", width: 6, height: 6 },
  { id: "10x10", label: "10 x 10", width: 10, height: 10 },
  { id: "20x20", label: "20 x 20", width: 20, height: 20 },
  { id: "20x40", label: "20 x 40", width: 20, height: 40 },
  { id: "40x20", label: "40 x 20", width: 40, height: 20 },
  { id: "40x40", label: "40 x 40", width: 40, height: 40 },
  { id: "custom", label: "Custom", width: 20, height: 20 }
];

export const TOOLS = [
  { id: "terrain", label: "Terrain", description: "Paint the selected terrain." },
  { id: "overlay", label: "Feature", description: "Toggle a built-in feature." },
  { id: "custom", label: "Custom", description: "Toggle an imported symbol." },
  { id: "edge", label: "Route", description: "Connect two neighboring hexes." },
  { id: "clear", label: "Clear", description: "Reset a hex and linked routes." },
  { id: "select", label: "Select", description: "Inspect one hex in detail." },
  { id: "pan", label: "Pan", description: "Drag the workspace." }
];

export const TERRAIN_DEFS = {
  plains: { label: "Plains", color: "#d9c89a", stroke: "#b39b6f", icon: BUILTIN_ICON_URLS.terrain.plains },
  forest: { label: "Forest", color: "#6f8f5d", stroke: "#4f6941", icon: BUILTIN_ICON_URLS.terrain.forest },
  mountains: { label: "Mountains", color: "#8d8f93", stroke: "#676a6f", icon: BUILTIN_ICON_URLS.terrain.mountains },
  swamp: { label: "Swamp", color: "#748562", stroke: "#576649", icon: BUILTIN_ICON_URLS.terrain.swamp },
  lake: { label: "Lake", color: "#86c0e8", stroke: "#4c89b3", icon: BUILTIN_ICON_URLS.terrain.lake }
};

export const OVERLAY_DEFS = {
  village: { label: "Village", marker: "V", fill: "#8f5d2b", icon: BUILTIN_ICON_URLS.overlay.village },
  stronghold: { label: "Stronghold", marker: "S", fill: "#593a1c", icon: BUILTIN_ICON_URLS.overlay.stronghold },
  city: { label: "City", marker: "C", fill: "#5e4a31", icon: BUILTIN_ICON_URLS.overlay.city },
  cave: { label: "Cave", marker: "Cv", fill: "#545454", icon: BUILTIN_ICON_URLS.overlay.cave },
  tower: { label: "Tower", marker: "T", fill: "#334b60", icon: BUILTIN_ICON_URLS.overlay.tower },
  special_place: { label: "Special Place", marker: "*", fill: "#8d3f4a", icon: BUILTIN_ICON_URLS.overlay.special_place },
  camp: { label: "Camp", marker: "Cp", fill: "#8a5b2a", icon: BUILTIN_ICON_URLS.overlay.camp }
};

export const EDGE_FEATURE_DEFS = {
  river: { label: "River", stroke: "#2f6f9e", lineWidth: 7, dash: [], icon: BUILTIN_ICON_URLS.edge.river },
  path: { label: "Path", stroke: "#a17645", lineWidth: 4, dash: [7, 5], icon: BUILTIN_ICON_URLS.edge.path },
  track: { label: "Track", stroke: "#77563a", lineWidth: 3, dash: [2, 8], icon: BUILTIN_ICON_URLS.edge.track }
};

export const SETTLEMENT_FAMILY = new Set(["village", "stronghold", "city"]);
