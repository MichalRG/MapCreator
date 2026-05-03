import { BUILTIN_ICON_URLS } from "./icons.js";

export const TOOL_DEFS = [
  { id: "terrain", label: "Terrain", description: "Paint the selected ground." },
  { id: "overlay", label: "Feature", description: "Toggle a built-in marker." },
  { id: "custom", label: "Custom", description: "Toggle an imported symbol." },
  { id: "edge", label: "Connection", description: "Connect two neighboring cells." },
  { id: "clear", label: "Clear", description: "Reset a cell and linked connections." },
  { id: "select", label: "Select", description: "Inspect one cell in detail." },
  { id: "pan", label: "Pan", description: "Drag the workspace." }
];

export const MAP_TYPE_ORDER = ["hex-world", "cave"];

export const MAP_TYPE_DEFS = {
  "hex-world": {
    id: "hex-world",
    label: "World Hex Map",
    shortLabel: "World",
    description: "Classic pointy-top hex terrain map.",
    layout: "hex-pointy",
    cellSize: 34,
    defaultTerrain: "plains",
    fileExtension: ".hexmap.json",
    projectNoun: "hex map",
    cellNoun: "hex",
    cellNounPlural: "hexes",
    terrainPanelTitle: "Terrain",
    overlayPanelTitle: "Features",
    edgePanelTitle: "Routes",
    overlayInspectorTitle: "Built-in Features",
    canvasTheme: "hex-world",
    exportBackground: "#f5ebd6",
    canvasBackground: "#f7edd9",
    presets: [
      { id: "6x6", label: "6 x 6", width: 6, height: 6 },
      { id: "10x10", label: "10 x 10", width: 10, height: 10 },
      { id: "20x20", label: "20 x 20", width: 20, height: 20 },
      { id: "20x40", label: "20 x 40", width: 20, height: 40 },
      { id: "40x20", label: "40 x 20", width: 40, height: 20 },
      { id: "40x40", label: "40 x 40", width: 40, height: 40 },
      { id: "custom", label: "Custom", width: 20, height: 20 }
    ],
    terrainDefs: {
      plains: { label: "Plains", color: "#d9c89a", stroke: "#b39b6f", icon: BUILTIN_ICON_URLS.terrain.plains },
      forest: { label: "Forest", color: "#6f8f5d", stroke: "#4f6941", icon: BUILTIN_ICON_URLS.terrain.forest },
      mountains: { label: "Mountains", color: "#8d8f93", stroke: "#676a6f", icon: BUILTIN_ICON_URLS.terrain.mountains },
      swamp: { label: "Swamp", color: "#748562", stroke: "#576649", icon: BUILTIN_ICON_URLS.terrain.swamp },
      lake: { label: "Lake", color: "#86c0e8", stroke: "#4c89b3", icon: BUILTIN_ICON_URLS.terrain.lake }
    },
    overlayDefs: {
      village: { label: "Village", marker: "V", fill: "#8f5d2b", icon: BUILTIN_ICON_URLS.overlay.village },
      stronghold: { label: "Stronghold", marker: "S", fill: "#593a1c", icon: BUILTIN_ICON_URLS.overlay.stronghold },
      city: { label: "City", marker: "C", fill: "#5e4a31", icon: BUILTIN_ICON_URLS.overlay.city },
      cave: { label: "Cave", marker: "Cv", fill: "#545454", icon: BUILTIN_ICON_URLS.overlay.cave },
      tower: { label: "Tower", marker: "T", fill: "#334b60", icon: BUILTIN_ICON_URLS.overlay.tower },
      special_place: { label: "Special Place", marker: "*", fill: "#8d3f4a", icon: BUILTIN_ICON_URLS.overlay.special_place },
      camp: { label: "Camp", marker: "Cp", fill: "#8a5b2a", icon: BUILTIN_ICON_URLS.overlay.camp },
      quarry: { label: "Quarry", marker: "Q", fill: "#71695f", icon: BUILTIN_ICON_URLS.overlay.quarry },
      lumber_camp: { label: "Lumberjack's Camp", marker: "Lc", fill: "#577046", icon: BUILTIN_ICON_URLS.overlay.lumber_camp },
      well: { label: "Well", marker: "W", fill: "#4d7a90", icon: BUILTIN_ICON_URLS.overlay.well }
    },
    edgeDefs: {
      river: { label: "River", stroke: "#2f6f9e", lineWidth: 7, dash: [], icon: BUILTIN_ICON_URLS.edge.river },
      path: { label: "Path", stroke: "#a17645", lineWidth: 4, dash: [7, 5], icon: BUILTIN_ICON_URLS.edge.path },
      track: { label: "Track", stroke: "#77563a", lineWidth: 3, dash: [2, 8], icon: BUILTIN_ICON_URLS.edge.track }
    },
    exclusiveOverlayIds: new Set(["village", "stronghold", "city"]),
    usageTips: [
      "Terrain tool paints the selected terrain.",
      "Feature tool toggles the selected built-in marker.",
      "Custom tool toggles the selected imported symbol.",
      "Clear tool resets a hex and removes connected routes.",
      "Route tool toggles rivers, paths, or tracks between neighbors."
    ],
    canvasTips: [
      "Click map to activate",
      "Wheel to zoom",
      "Space + drag to pan",
      "Route tool: click two neighboring hexes"
    ]
  },
  cave: {
    id: "cave",
    label: "Cave Map",
    shortLabel: "Cave",
    description: "Square-grid cave layout with chambers and links.",
    layout: "square",
    cellSize: 42,
    defaultTerrain: "rock",
    fileExtension: ".cavemap.json",
    projectNoun: "cave map",
    cellNoun: "tile",
    cellNounPlural: "tiles",
    terrainPanelTitle: "Cave Surface",
    overlayPanelTitle: "Cave Elements",
    edgePanelTitle: "Connections",
    overlayInspectorTitle: "Built-in Cave Elements",
    canvasTheme: "cave",
    exportBackground: "#161513",
    canvasBackground: "#1d1a18",
    presets: [
      { id: "12x12", label: "12 x 12", width: 12, height: 12 },
      { id: "20x20", label: "20 x 20", width: 20, height: 20 },
      { id: "30x20", label: "30 x 20", width: 30, height: 20 },
      { id: "40x30", label: "40 x 30", width: 40, height: 30 },
      { id: "custom", label: "Custom", width: 20, height: 20 }
    ],
    terrainDefs: {
      rock: { label: "Solid Rock", color: "#403832", stroke: "#241f1b", icon: BUILTIN_ICON_URLS.terrain.rock },
      chamber: { label: "Open Chamber", color: "#7d6a58", stroke: "#584739", icon: BUILTIN_ICON_URLS.terrain.chamber },
      underground_water: {
        label: "Underground Water",
        color: "#345764",
        stroke: "#203a46",
        icon: BUILTIN_ICON_URLS.terrain.underground_water
      },
      lava: { label: "Lava", color: "#b2552b", stroke: "#6b2f16", icon: BUILTIN_ICON_URLS.terrain.lava },
      mushroom_grove: {
        label: "Mushroom Grove",
        color: "#5d6951",
        stroke: "#3e4838",
        icon: BUILTIN_ICON_URLS.terrain.mushroom_grove
      },
      crystal_field: {
        label: "Crystal Field",
        color: "#586a81",
        stroke: "#394657",
        icon: BUILTIN_ICON_URLS.terrain.crystal_field
      }
    },
    overlayDefs: {
      entrance: { label: "Entrance", marker: "In", fill: "#d7c07e", icon: BUILTIN_ICON_URLS.overlay.entrance },
      exit: { label: "Exit", marker: "Out", fill: "#9bc0c7", icon: BUILTIN_ICON_URLS.overlay.exit },
      treasure: { label: "Treasure", marker: "Tr", fill: "#d6a54c", icon: BUILTIN_ICON_URLS.overlay.treasure },
      nest: { label: "Nest", marker: "Ns", fill: "#9a5a4b", icon: BUILTIN_ICON_URLS.overlay.nest },
      altar: { label: "Altar", marker: "Al", fill: "#8577a6", icon: BUILTIN_ICON_URLS.overlay.altar },
      stalagmites: {
        label: "Stalagmites",
        marker: "St",
        fill: "#7d878d",
        icon: BUILTIN_ICON_URLS.overlay.stalagmites
      },
      rope_bridge: {
        label: "Rope Bridge",
        marker: "Rb",
        fill: "#90704f",
        icon: BUILTIN_ICON_URLS.overlay.rope_bridge
      }
    },
    edgeDefs: {
      tunnel: { label: "Tunnel", stroke: "#b59a75", lineWidth: 6, dash: [], icon: BUILTIN_ICON_URLS.edge.tunnel },
      stream: {
        label: "Underground Stream",
        stroke: "#5d95b0",
        lineWidth: 4,
        dash: [10, 5],
        icon: BUILTIN_ICON_URLS.edge.stream
      },
      chasm: {
        label: "Chasm",
        stroke: "#0f0f12",
        lineWidth: 8,
        dash: [16, 6],
        icon: BUILTIN_ICON_URLS.edge.chasm
      }
    },
    exclusiveOverlayIds: new Set(["entrance", "exit"]),
    usageTips: [
      "Terrain tool paints cave floor, rock, water, lava, or crystal areas.",
      "Feature tool toggles cave elements like entrances, treasure, nests, or altars.",
      "Custom tool lets you place imported cave symbols.",
      "Clear tool can either cut to void or leave a wall border on neighboring floor tiles.",
      "Connection tool toggles tunnels, streams, or chasms between neighboring tiles."
    ],
    canvasTips: [
      "Click map to activate",
      "Wheel to zoom",
      "Space + drag to pan",
      "Connection tool: click two neighboring tiles"
    ]
  }
};

export function getMapTypeDef(mapType) {
  return MAP_TYPE_DEFS[mapType] || MAP_TYPE_DEFS["hex-world"];
}

export function getToolDef(toolId) {
  return TOOL_DEFS.find((tool) => tool.id === toolId) || TOOL_DEFS[0];
}

export function listBuiltinAssetDefs(mapType) {
  const config = getMapTypeDef(mapType);
  return [
    ...Object.values(config.terrainDefs),
    ...Object.values(config.overlayDefs),
    ...Object.values(config.edgeDefs)
  ];
}
