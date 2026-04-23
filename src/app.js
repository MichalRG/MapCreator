import {
  EDGE_FEATURE_DEFS,
  HEX_SIZE,
  MAP_PRESETS,
  OVERLAY_DEFS,
  SETTLEMENT_FAMILY,
  TERRAIN_DEFS,
  TOOLS
} from "./constants.js";
import { areAdjacent, cellKey, edgeKey, getCell, getMapBounds, worldToCellWithSize } from "./hex.js";
import {
  cloneProject,
  createProject,
  getSuggestedPngName,
  getSuggestedProjectName,
  listCustomPlacementsForCell,
  touchProject,
  validateProjectShape
} from "./project.js";
import {
  openProjectFile,
  pickCustomSymbolFile,
  readFileAsDataUrl,
  readFileAsText,
  sanitizeFileStem,
  saveBlobFile,
  saveTextFile
} from "./io.js";
import { drawExportCanvas, drawScene } from "./render.js";

const state = {
  project: createProject({ width: 20, height: 20, name: "Untitled Map" }),
  selectedTool: "terrain",
  activeTerrain: "plains",
  activeOverlay: "village",
  activeEdgeType: "river",
  activeCustomSymbolId: null,
  selectedCellKey: null,
  hoverCellKey: null,
  pendingEdgeStart: null,
  isCanvasActive: false,
  isDirty: false,
  projectHandle: null,
  history: {
    undoStack: [],
    redoStack: []
  },
  viewport: {
    scale: 1,
    offsetX: 0,
    offsetY: 0
  },
  drag: {
    mode: null,
    startX: 0,
    startY: 0,
    lastCellKey: null
  },
  transactionSnapshot: null,
  builtinIconCache: new Map(),
  imageCache: new Map(),
  statusMessage: "Ready."
};

const elements = {
  canvas: document.querySelector("#map-canvas"),
  canvasContainer: document.querySelector("#canvas-container"),
  presetSelect: document.querySelector("#preset-select"),
  widthInput: document.querySelector("#map-width-input"),
  heightInput: document.querySelector("#map-height-input"),
  mapNameInput: document.querySelector("#map-name-input"),
  projectTitle: document.querySelector("#project-title"),
  projectSubtitle: document.querySelector("#project-subtitle"),
  dirtyIndicator: document.querySelector("#dirty-indicator"),
  historyIndicator: document.querySelector("#history-indicator"),
  customSymbolCount: document.querySelector("#custom-symbol-count"),
  fileIndicator: document.querySelector("#file-indicator"),
  inspectorContent: document.querySelector("#inspector-content"),
  statusTool: document.querySelector("#status-tool"),
  statusHover: document.querySelector("#status-hover"),
  statusZoom: document.querySelector("#status-zoom"),
  statusMessage: document.querySelector("#status-message"),
  undoButton: document.querySelector("#undo-button"),
  redoButton: document.querySelector("#redo-button"),
  newMapButton: document.querySelector("#new-map-button"),
  openProjectButton: document.querySelector("#open-project-button"),
  saveProjectButton: document.querySelector("#save-project-button"),
  saveProjectAsButton: document.querySelector("#save-project-as-button"),
  exportPngButton: document.querySelector("#export-png-button"),
  resetViewButton: document.querySelector("#reset-view-button"),
  canvasActivationIndicator: document.querySelector("#canvas-activation-indicator"),
  projectFileInput: document.querySelector("#project-file-input"),
  symbolFileInput: document.querySelector("#symbol-file-input"),
  importSymbolButton: document.querySelector("#import-symbol-button"),
  customSymbolNameInput: document.querySelector("#custom-symbol-name-input"),
  customSymbolCategoryInput: document.querySelector("#custom-symbol-category-input"),
  toolPalette: document.querySelector("#tool-palette"),
  terrainPalette: document.querySelector("#terrain-palette"),
  overlayPalette: document.querySelector("#overlay-palette"),
  edgePalette: document.querySelector("#edge-palette"),
  customSymbolPalette: document.querySelector("#custom-symbol-palette")
};

const canvasContext = elements.canvas.getContext("2d");

function setStatus(message) {
  state.statusMessage = message;
  elements.statusMessage.textContent = message;
}

function projectFileLabel() {
  return state.projectHandle?.name || "Not saved yet";
}

function selectedCell() {
  if (!state.selectedCellKey) {
    return null;
  }

  const [col, row] = state.selectedCellKey.split(",").map(Number);
  return getCell(state.project, col, row);
}

function hoverCell() {
  if (!state.hoverCellKey) {
    return null;
  }

  const [col, row] = state.hoverCellKey.split(",").map(Number);
  return getCell(state.project, col, row);
}

function pendingEdgeCell() {
  if (!state.pendingEdgeStart) {
    return null;
  }

  return getCell(state.project, state.pendingEdgeStart.col, state.pendingEdgeStart.row);
}

function syncFormWithProject() {
  elements.mapNameInput.value = state.project.metadata.name;
  elements.widthInput.value = String(state.project.metadata.width);
  elements.heightInput.value = String(state.project.metadata.height);
}

function updateProjectHeader() {
  const { metadata } = state.project;
  elements.projectTitle.textContent = metadata.name;
  elements.projectSubtitle.textContent = `${metadata.width} x ${metadata.height} hex map`;
}

function updateProjectMeta() {
  elements.dirtyIndicator.textContent = state.isDirty ? "Unsaved changes" : "Saved";
  elements.historyIndicator.textContent = `${state.history.undoStack.length} undo / ${state.history.redoStack.length} redo`;
  elements.customSymbolCount.textContent = String(state.project.customSymbols.length);
  elements.fileIndicator.textContent = projectFileLabel();
  elements.undoButton.disabled = state.history.undoStack.length === 0;
  elements.redoButton.disabled = state.history.redoStack.length === 0;
}

function updateCanvasActivationUi() {
  elements.canvasContainer.classList.toggle("active", state.isCanvasActive);
  elements.canvasActivationIndicator.classList.toggle("active", state.isCanvasActive);
  elements.canvasActivationIndicator.textContent = state.isCanvasActive ? "Map active" : "Map inactive";
}

function updateStatusBar() {
  const hovered = hoverCell();
  elements.statusTool.textContent = `Tool: ${state.selectedTool}`;
  elements.statusHover.textContent = hovered ? `Hover: ${hovered.col}, ${hovered.row}` : "Hover: none";
  elements.statusZoom.textContent = `Zoom: ${Math.round(state.viewport.scale * 100)}%`;
}

function preloadCustomSymbol(symbol) {
  if (!symbol || state.imageCache.has(symbol.id)) {
    return;
  }

  const image = new Image();
  image.src = symbol.assetData;
  image.onload = () => render();
  state.imageCache.set(symbol.id, image);
}

function preloadProjectImages(project) {
  state.imageCache = new Map();
  project.customSymbols.forEach(preloadCustomSymbol);
}

function preloadBuiltinIcons() {
  state.builtinIconCache = new Map();

  [...Object.values(TERRAIN_DEFS), ...Object.values(OVERLAY_DEFS), ...Object.values(EDGE_FEATURE_DEFS)].forEach((entry) => {
    if (!entry.icon || state.builtinIconCache.has(entry.icon)) {
      return;
    }

    const image = new Image();
    image.src = entry.icon;
    image.onload = () => render();
    state.builtinIconCache.set(entry.icon, image);
  });
}

function updateCustomSymbolPalette() {
  elements.customSymbolPalette.innerHTML = "";

  if (!state.project.customSymbols.length) {
    elements.customSymbolPalette.classList.add("empty-state-grid");
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No custom symbols yet.";
    elements.customSymbolPalette.append(empty);
    return;
  }

  elements.customSymbolPalette.classList.remove("empty-state-grid");

  state.project.customSymbols.forEach((symbol) => {
    const row = document.createElement("div");
    row.className = "palette-row";

    const button = document.createElement("button");
    button.type = "button";
    button.className = `choice-button palette-row-main ${state.activeCustomSymbolId === symbol.id ? "active" : ""}`;
    button.innerHTML = `<strong>${symbol.name}</strong><span>${symbol.category}</span>`;
    button.addEventListener("click", () => {
      state.activeCustomSymbolId = symbol.id;
      state.selectedTool = "custom";
      updatePaletteSelections();
      render();
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "palette-row-remove";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      removeCustomSymbolDefinition(symbol.id);
    });

    row.append(button, removeButton);
    elements.customSymbolPalette.append(row);
  });
}

function updatePaletteSelections() {
  document.querySelectorAll("[data-tool-id]").forEach((element) => {
    element.classList.toggle("active", element.dataset.toolId === state.selectedTool);
  });

  document.querySelectorAll("[data-terrain-id]").forEach((element) => {
    element.classList.toggle("active", element.dataset.terrainId === state.activeTerrain);
  });

  document.querySelectorAll("[data-overlay-id]").forEach((element) => {
    element.classList.toggle("active", element.dataset.overlayId === state.activeOverlay);
  });

  document.querySelectorAll("[data-edge-id]").forEach((element) => {
    element.classList.toggle("active", element.dataset.edgeId === state.activeEdgeType);
  });

  updateCustomSymbolPalette();
  updateStatusBar();
}

function addInspectorCard(title) {
  const card = document.createElement("div");
  card.className = "inspector-card";
  const heading = document.createElement("h3");
  heading.textContent = title;
  card.append(heading);
  elements.inspectorContent.append(card);
  return card;
}

function rebuildInspector() {
  const cell = selectedCell();
  elements.inspectorContent.innerHTML = "";

  if (!cell) {
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = "Select a hex to inspect it.";
    elements.inspectorContent.append(message);
    return;
  }

  const summary = addInspectorCard(`Hex ${cell.col}, ${cell.row}`);
  const terrainText = document.createElement("p");
  terrainText.className = "muted";
  terrainText.textContent = `Terrain: ${TERRAIN_DEFS[cell.terrain].label}`;
  summary.append(terrainText);

  const overlayCard = addInspectorCard("Built-in Features");
  if (!cell.overlays.length) {
    const none = document.createElement("p");
    none.className = "muted";
    none.textContent = "No built-in features on this hex.";
    overlayCard.append(none);
  } else {
    const tagList = document.createElement("div");
    tagList.className = "tag-list";
    cell.overlays.forEach((overlayId) => {
      const tag = document.createElement("span");
      tag.className = "inspector-tag";
      tag.innerHTML = `<span>${OVERLAY_DEFS[overlayId].label}</span>`;
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "x";
      removeButton.addEventListener("click", () => {
        applyMutation(`Removed ${OVERLAY_DEFS[overlayId].label}.`, (project) => {
          const target = getCell(project, cell.col, cell.row);
          target.overlays = target.overlays.filter((entry) => entry !== overlayId);
        });
      });
      tag.append(removeButton);
      tagList.append(tag);
    });
    overlayCard.append(tagList);
  }

  const customCard = addInspectorCard("Custom Symbols");
  const placements = listCustomPlacementsForCell(state.project, cell.col, cell.row);

  if (!placements.length) {
    const none = document.createElement("p");
    none.className = "muted";
    none.textContent = "No custom symbols on this hex.";
    customCard.append(none);
  } else {
    const tagList = document.createElement("div");
    tagList.className = "tag-list";
    placements.forEach((placement) => {
      const symbol = state.project.customSymbols.find((entry) => entry.id === placement.symbolId);
      if (!symbol) {
        return;
      }

      const tag = document.createElement("span");
      tag.className = "inspector-tag";
      tag.innerHTML = `<span>${symbol.name}</span>`;
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "x";
      removeButton.addEventListener("click", () => {
        removeCustomPlacement(placement.id, `Removed ${symbol.name}.`);
      });
      tag.append(removeButton);
      tagList.append(tag);
    });
    customCard.append(tagList);
  }

  const actionCard = addInspectorCard("Actions");
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "action-button";
  clearButton.textContent = "Clear Hex";
  clearButton.addEventListener("click", () => clearHex(cell.col, cell.row));

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "action-button";
  resetButton.textContent = "Reset To Plains";
  resetButton.addEventListener("click", () => {
    applyMutation("Reset terrain to plains.", (project) => {
      getCell(project, cell.col, cell.row).terrain = "plains";
    });
  });

  actionCard.append(clearButton, resetButton);
}

function resizeCanvas() {
  const rect = elements.canvasContainer.getBoundingClientRect();
  elements.canvas.width = Math.floor(rect.width);
  elements.canvas.height = Math.floor(rect.height);
  render();
}

function render() {
  drawScene(canvasContext, {
    project: state.project,
    canvasWidth: elements.canvas.width,
    canvasHeight: elements.canvas.height,
    viewport: state.viewport,
    size: HEX_SIZE,
    hoverCell: hoverCell(),
    selectedCell: selectedCell(),
    pendingEdgeCell: pendingEdgeCell(),
    imageCache: state.imageCache,
    builtinIconCache: state.builtinIconCache
  });
  updateProjectHeader();
  updateProjectMeta();
  updateCanvasActivationUi();
  updateStatusBar();
  rebuildInspector();
}

function centerMap() {
  const bounds = getMapBounds(state.project, HEX_SIZE);
  const width = elements.canvas.width;
  const height = elements.canvas.height;
  const usableWidth = Math.max(width - 80, 200);
  const usableHeight = Math.max(height - 80, 200);
  const scale = Math.min(usableWidth / bounds.width, usableHeight / bounds.height, 1.35);
  state.viewport.scale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  state.viewport.offsetX = (width - bounds.width * state.viewport.scale) / 2 - bounds.minX * state.viewport.scale;
  state.viewport.offsetY = (height - bounds.height * state.viewport.scale) / 2 - bounds.minY * state.viewport.scale;
  render();
}

function activateCanvas() {
  const wasActive = state.isCanvasActive;
  state.isCanvasActive = true;
  if (document.activeElement !== elements.canvas) {
    elements.canvas.focus({ preventScroll: true });
  }
  if (!wasActive) {
    updateCanvasActivationUi();
    render();
  }
}

function deactivateCanvas() {
  if (!state.isCanvasActive) {
    return;
  }

  state.isCanvasActive = false;
  state.pendingEdgeStart = null;
  updateCanvasActivationUi();
  render();
}

function pushHistory(snapshot) {
  state.history.undoStack.push(snapshot);
  state.history.redoStack = [];
}

function applyMutation(message, mutator) {
  const before = cloneProject(state.project);
  mutator(state.project);
  touchProject(state.project);
  pushHistory(before);
  state.isDirty = true;
  setStatus(message);
  render();
}

function beginTransaction() {
  if (!state.transactionSnapshot) {
    state.transactionSnapshot = cloneProject(state.project);
  }
}

function commitTransaction(message) {
  if (!state.transactionSnapshot) {
    return;
  }

  state.history.undoStack.push(state.transactionSnapshot);
  state.history.redoStack = [];
  state.transactionSnapshot = null;
  touchProject(state.project);
  state.isDirty = true;
  setStatus(message);
  render();
}

function cancelTransaction() {
  state.transactionSnapshot = null;
}

function undo() {
  if (!state.history.undoStack.length) {
    return;
  }

  const current = cloneProject(state.project);
  const previous = state.history.undoStack.pop();
  state.history.redoStack.push(current);
  state.project = previous;
  preloadProjectImages(state.project);
  state.pendingEdgeStart = null;
  state.isDirty = true;
  setStatus("Undid the last action.");
  render();
}

function redo() {
  if (!state.history.redoStack.length) {
    return;
  }

  const current = cloneProject(state.project);
  const next = state.history.redoStack.pop();
  state.history.undoStack.push(current);
  state.project = next;
  preloadProjectImages(state.project);
  state.pendingEdgeStart = null;
  state.isDirty = true;
  setStatus("Redid the last action.");
  render();
}

function confirmLoseChanges() {
  if (!state.isDirty) {
    return true;
  }

  return window.confirm("You have unsaved changes. Continue and discard them?");
}

function readMapSpecFromForm() {
  const width = Number.parseInt(elements.widthInput.value, 10);
  const height = Number.parseInt(elements.heightInput.value, 10);
  const name = elements.mapNameInput.value.trim() || "Untitled Map";

  return {
    width: Math.min(Math.max(width || 20, 1), 80),
    height: Math.min(Math.max(height || 20, 1), 80),
    name
  };
}

function createNewMap() {
  if (!confirmLoseChanges()) {
    return;
  }

  const { width, height, name } = readMapSpecFromForm();
  state.project = createProject({ width, height, name });
  state.projectHandle = null;
  state.history.undoStack = [];
  state.history.redoStack = [];
  state.selectedCellKey = null;
  state.hoverCellKey = null;
  state.pendingEdgeStart = null;
  state.isDirty = false;
  state.activeCustomSymbolId = null;
  state.imageCache = new Map();
  syncFormWithProject();
  centerMap();
  setStatus(`Created ${width} x ${height} map.`);
}

function setSelectedCell(col, row) {
  state.selectedCellKey = cellKey(col, row);
}

function paintTerrain(col, row) {
  const targetCell = getCell(state.project, col, row);
  if (!targetCell || targetCell.terrain === state.activeTerrain) {
    return false;
  }

  targetCell.terrain = state.activeTerrain;
  return true;
}

function toggleOverlay(col, row) {
  const targetCell = getCell(state.project, col, row);
  if (!targetCell) {
    return false;
  }

  if (targetCell.overlays.includes(state.activeOverlay)) {
    targetCell.overlays = targetCell.overlays.filter((entry) => entry !== state.activeOverlay);
    return true;
  }

  if (SETTLEMENT_FAMILY.has(state.activeOverlay)) {
    targetCell.overlays = targetCell.overlays.filter((entry) => !SETTLEMENT_FAMILY.has(entry));
  }

  targetCell.overlays.push(state.activeOverlay);
  return true;
}

function removeCustomPlacement(placementId, message) {
  applyMutation(message, (project) => {
    const placementIndex = project.customPlacements.findIndex((entry) => entry.id === placementId);
    if (placementIndex === -1) {
      return;
    }

    const [placement] = project.customPlacements.splice(placementIndex, 1);
    const targetCell = getCell(project, placement.col, placement.row);
    if (targetCell) {
      targetCell.customPlacementIds = targetCell.customPlacementIds.filter((entry) => entry !== placementId);
    }
  });
}

function makeId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function toggleCustomPlacement(col, row) {
  const targetCell = getCell(state.project, col, row);
  if (!targetCell || !state.activeCustomSymbolId) {
    return false;
  }

  const existingId = targetCell.customPlacementIds.find((placementId) => {
    const placement = state.project.customPlacements.find((entry) => entry.id === placementId);
    return placement?.symbolId === state.activeCustomSymbolId;
  });

  if (existingId) {
    const placementIndex = state.project.customPlacements.findIndex((entry) => entry.id === existingId);
    if (placementIndex !== -1) {
      state.project.customPlacements.splice(placementIndex, 1);
      targetCell.customPlacementIds = targetCell.customPlacementIds.filter((entry) => entry !== existingId);
      return true;
    }
    return false;
  }

  const placementId = makeId("placement");
  state.project.customPlacements.push({
    id: placementId,
    symbolId: state.activeCustomSymbolId,
    col,
    row
  });
  targetCell.customPlacementIds.push(placementId);
  return true;
}

function clearHex(col, row) {
  applyMutation("Cleared hex.", (project) => {
    const targetCell = getCell(project, col, row);
    if (!targetCell) {
      return;
    }

    targetCell.terrain = "plains";
    targetCell.overlays = [];
    const placementIds = new Set(targetCell.customPlacementIds);
    targetCell.customPlacementIds = [];
    project.customPlacements = project.customPlacements.filter((placement) => !placementIds.has(placement.id));
    project.edgeFeatures = project.edgeFeatures.filter((feature) => {
      const touchesCell =
        (feature.from.col === col && feature.from.row === row) ||
        (feature.to.col === col && feature.to.row === row);
      return !touchesCell;
    });
  });
}

function toggleEdge(col, row) {
  const current = { col, row };

  if (!state.pendingEdgeStart) {
    state.pendingEdgeStart = current;
    setStatus("Pick a neighboring hex to finish the route.");
    render();
    return;
  }

  if (state.pendingEdgeStart.col === col && state.pendingEdgeStart.row === row) {
    state.pendingEdgeStart = null;
    setStatus("Canceled pending route.");
    render();
    return;
  }

  if (!areAdjacent(state.pendingEdgeStart, current)) {
    state.pendingEdgeStart = current;
    setStatus("Routes must connect neighboring hexes.");
    render();
    return;
  }

  applyMutation(`Toggled ${EDGE_FEATURE_DEFS[state.activeEdgeType].label}.`, (project) => {
    const key = edgeKey(state.activeEdgeType, state.pendingEdgeStart, current);
    const existingIndex = project.edgeFeatures.findIndex((feature) => feature.id === key);

    if (existingIndex >= 0) {
      project.edgeFeatures.splice(existingIndex, 1);
    } else {
      project.edgeFeatures.push({
        id: key,
        type: state.activeEdgeType,
        from: { ...state.pendingEdgeStart },
        to: { ...current }
      });
    }
  });

  state.pendingEdgeStart = null;
}

function handleToolAction(col, row) {
  setSelectedCell(col, row);

  if (state.selectedTool === "select") {
    setStatus(`Selected hex ${col}, ${row}.`);
    render();
    return;
  }

  if (state.selectedTool === "clear") {
    clearHex(col, row);
    return;
  }

  if (state.selectedTool === "overlay") {
    applyMutation(`Toggled ${OVERLAY_DEFS[state.activeOverlay].label}.`, () => {
      toggleOverlay(col, row);
    });
    return;
  }

  if (state.selectedTool === "custom") {
    if (!state.activeCustomSymbolId) {
      setStatus("Import or select a custom symbol first.");
      render();
      return;
    }

    applyMutation("Toggled custom symbol.", () => {
      toggleCustomPlacement(col, row);
    });
    return;
  }

  if (state.selectedTool === "edge") {
    toggleEdge(col, row);
    return;
  }

  render();
}

function applyTerrainDrag(cell) {
  if (!cell || state.drag.lastCellKey === cellKey(cell.col, cell.row)) {
    return;
  }

  if (paintTerrain(cell.col, cell.row)) {
    beginTransaction();
    state.drag.lastCellKey = cellKey(cell.col, cell.row);
    touchProject(state.project);
    state.isDirty = true;
    render();
  }
}

function screenToWorld(clientX, clientY) {
  const rect = elements.canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  return {
    x: (x - state.viewport.offsetX) / state.viewport.scale,
    y: (y - state.viewport.offsetY) / state.viewport.scale
  };
}

function cellFromPointer(clientX, clientY) {
  const world = screenToWorld(clientX, clientY);
  const point = worldToCellWithSize(world.x, world.y, HEX_SIZE);
  return getCell(state.project, point.col, point.row);
}

async function saveProject(asNewFile = false) {
  try {
    const nextHandle = await saveTextFile({
      contents: JSON.stringify(state.project, null, 2),
      suggestedName: getSuggestedProjectName(state.project),
      handle: asNewFile ? null : state.projectHandle
    });

    state.projectHandle = nextHandle;
    state.isDirty = false;
    setStatus("Project saved.");
    render();
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.error(error);
      setStatus("Saving the project failed.");
    }
  }
}

async function exportPng() {
  try {
    const exportCanvas = document.createElement("canvas");
    drawExportCanvas(exportCanvas, {
      project: state.project,
      size: HEX_SIZE,
      imageCache: state.imageCache,
      builtinIconCache: state.builtinIconCache,
      scale: 2
    });

    const blob = await new Promise((resolve, reject) => {
      exportCanvas.toBlob((result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Canvas export failed."));
        }
      }, "image/png");
    });

    await saveBlobFile({
      blob,
      suggestedName: getSuggestedPngName(state.project),
      handle: null
    });
    setStatus("PNG exported.");
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.error(error);
      setStatus("PNG export failed.");
    }
  }
}

async function openProject() {
  if (!confirmLoseChanges()) {
    return;
  }

  try {
    const selection = await openProjectFile(elements.projectFileInput);
    if (!selection) {
      return;
    }

    const text = await readFileAsText(selection.file);
    const parsed = JSON.parse(text);
    validateProjectShape(parsed);

    state.project = parsed;
    state.projectHandle = selection.handle;
    state.history.undoStack = [];
    state.history.redoStack = [];
    state.selectedCellKey = null;
    state.hoverCellKey = null;
    state.pendingEdgeStart = null;
    state.activeCustomSymbolId = state.project.customSymbols[0]?.id || null;
    state.isDirty = false;
    preloadProjectImages(state.project);
    syncFormWithProject();
    centerMap();
    setStatus(`Opened ${selection.file.name}.`);
  } catch (error) {
    console.error(error);
    setStatus(error instanceof Error ? error.message : "Opening the project failed.");
  }
}

async function importCustomSymbol() {
  try {
    const file = await pickCustomSymbolFile(elements.symbolFileInput);
    if (!file) {
      return;
    }

    const isSupported =
      file.type === "image/svg+xml" ||
      file.type === "image/png" ||
      file.name.toLowerCase().endsWith(".svg") ||
      file.name.toLowerCase().endsWith(".png");

    if (!isSupported) {
      setStatus("Only SVG and PNG custom symbols are supported.");
      return;
    }

    const assetData = await readFileAsDataUrl(file);
    const name = elements.customSymbolNameInput.value.trim() || sanitizeFileStem(file.name);
    const category = elements.customSymbolCategoryInput.value.trim() || "Custom";

    applyMutation(`Imported ${name}.`, (project) => {
      const symbol = {
        id: makeId("symbol"),
        name,
        category,
        assetData,
        assetType: file.name.toLowerCase().endsWith(".svg") ? "svg" : "png"
      };

      project.customSymbols.push(symbol);
      state.activeCustomSymbolId = symbol.id;
      preloadCustomSymbol(symbol);
    });

    state.selectedTool = "custom";
    updatePaletteSelections();
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.error(error);
      setStatus("Importing the custom symbol failed.");
    }
  }
}

function removeCustomSymbolDefinition(symbolId) {
  const symbol = state.project.customSymbols.find((entry) => entry.id === symbolId);
  if (!symbol) {
    return;
  }

  const inUse = state.project.customPlacements.some((placement) => placement.symbolId === symbolId);
  if (inUse && !window.confirm(`"${symbol.name}" is placed on the map. Remove it and all placements?`)) {
    return;
  }

  applyMutation(`Removed ${symbol.name}.`, (project) => {
    const placementIds = new Set(
      project.customPlacements
        .filter((placement) => placement.symbolId === symbolId)
        .map((placement) => placement.id)
    );
    project.customPlacements = project.customPlacements.filter((placement) => placement.symbolId !== symbolId);
    project.cells.forEach((cell) => {
      cell.customPlacementIds = cell.customPlacementIds.filter((placementId) => !placementIds.has(placementId));
    });
    project.customSymbols = project.customSymbols.filter((entry) => entry.id !== symbolId);
  });

  if (state.activeCustomSymbolId === symbolId) {
    state.activeCustomSymbolId = state.project.customSymbols[0]?.id || null;
  }

  state.imageCache.delete(symbolId);
  updatePaletteSelections();
}

function populatePresetOptions() {
  MAP_PRESETS.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    elements.presetSelect.append(option);
  });

  elements.presetSelect.value = "20x20";
}

function populateToolPalette() {
  TOOLS.forEach((tool) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tool-button ${tool.id === state.selectedTool ? "active" : ""}`;
    button.dataset.toolId = tool.id;
    button.innerHTML = `<strong>${tool.label}</strong><span>${tool.description}</span>`;
    button.addEventListener("click", () => {
      state.selectedTool = tool.id;
      if (tool.id !== "edge") {
        state.pendingEdgeStart = null;
      }
      updatePaletteSelections();
      setStatus(`Tool changed to ${tool.label}.`);
      render();
    });
    elements.toolPalette.append(button);
  });
}

function populateTerrainPalette() {
  Object.entries(TERRAIN_DEFS).forEach(([terrainId, terrain]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `choice-button ${terrainId === state.activeTerrain ? "active" : ""}`;
    button.dataset.terrainId = terrainId;
    button.innerHTML = `<strong><img class="choice-icon" src="${terrain.icon}" alt="" /><span class="choice-preview" style="background:${terrain.color}"></span>${terrain.label}</strong><span>Base terrain</span>`;
    button.addEventListener("click", () => {
      state.activeTerrain = terrainId;
      state.selectedTool = "terrain";
      updatePaletteSelections();
      render();
    });
    elements.terrainPalette.append(button);
  });
}

function populateOverlayPalette() {
  Object.entries(OVERLAY_DEFS).forEach(([overlayId, overlay]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `choice-button ${overlayId === state.activeOverlay ? "active" : ""}`;
    button.dataset.overlayId = overlayId;
    button.innerHTML = `<strong><img class="choice-icon" src="${overlay.icon}" alt="" />${overlay.label}</strong><span>Built-in feature</span>`;
    button.addEventListener("click", () => {
      state.activeOverlay = overlayId;
      state.selectedTool = "overlay";
      updatePaletteSelections();
      render();
    });
    elements.overlayPalette.append(button);
  });
}

function populateEdgePalette() {
  Object.entries(EDGE_FEATURE_DEFS).forEach(([edgeId, edge]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `choice-button ${edgeId === state.activeEdgeType ? "active" : ""}`;
    button.dataset.edgeId = edgeId;
    button.innerHTML = `<strong><img class="choice-icon" src="${edge.icon}" alt="" />${edge.label}</strong><span>Connect neighboring hexes</span>`;
    button.addEventListener("click", () => {
      state.activeEdgeType = edgeId;
      state.selectedTool = "edge";
      updatePaletteSelections();
      render();
    });
    elements.edgePalette.append(button);
  });
}

let spacePressed = false;

function handlePointerDown(event) {
  activateCanvas();
  const cell = cellFromPointer(event.clientX, event.clientY);

  if (state.selectedTool === "pan" || event.button === 1 || spacePressed) {
    state.drag.mode = "pan";
    state.drag.startX = event.clientX;
    state.drag.startY = event.clientY;
    return;
  }

  if (!cell) {
    return;
  }

  if (state.selectedTool === "terrain") {
    applyTerrainDrag(cell);
    state.drag.mode = "terrain";
    return;
  }

  if (event.button === 0) {
    handleToolAction(cell.col, cell.row);
  }
}

function handlePointerMove(event) {
  const cell = cellFromPointer(event.clientX, event.clientY);
  state.hoverCellKey = cell ? cellKey(cell.col, cell.row) : null;

  if (state.drag.mode === "pan") {
    const deltaX = event.clientX - state.drag.startX;
    const deltaY = event.clientY - state.drag.startY;
    state.viewport.offsetX += deltaX;
    state.viewport.offsetY += deltaY;
    state.drag.startX = event.clientX;
    state.drag.startY = event.clientY;
    render();
    return;
  }

  if (state.drag.mode === "terrain" && cell) {
    applyTerrainDrag(cell);
    return;
  }

  render();
}

function handlePointerUp() {
  if (state.drag.mode === "terrain") {
    commitTransaction(`Painted ${TERRAIN_DEFS[state.activeTerrain].label}.`);
  } else {
    cancelTransaction();
  }

  state.drag.mode = null;
  state.drag.lastCellKey = null;
}

function handleWheel(event) {
  if (!state.isCanvasActive) {
    return;
  }

  event.preventDefault();
  const rect = elements.canvas.getBoundingClientRect();
  const pointerX = event.clientX - rect.left;
  const pointerY = event.clientY - rect.top;
  const worldX = (pointerX - state.viewport.offsetX) / state.viewport.scale;
  const worldY = (pointerY - state.viewport.offsetY) / state.viewport.scale;
  const factor = event.deltaY < 0 ? 1.08 : 0.92;
  const nextScale = Math.min(2.8, Math.max(0.35, state.viewport.scale * factor));

  state.viewport.scale = nextScale;
  state.viewport.offsetX = pointerX - worldX * nextScale;
  state.viewport.offsetY = pointerY - worldY * nextScale;
  render();
}

function handlePresetChange() {
  const preset = MAP_PRESETS.find((entry) => entry.id === elements.presetSelect.value);
  if (!preset || preset.id === "custom") {
    return;
  }

  elements.widthInput.value = String(preset.width);
  elements.heightInput.value = String(preset.height);
}

function bindEvents() {
  window.addEventListener("resize", resizeCanvas);
  elements.presetSelect.addEventListener("change", handlePresetChange);
  elements.newMapButton.addEventListener("click", createNewMap);
  elements.openProjectButton.addEventListener("click", openProject);
  elements.saveProjectButton.addEventListener("click", () => saveProject(false));
  elements.saveProjectAsButton.addEventListener("click", () => saveProject(true));
  elements.exportPngButton.addEventListener("click", exportPng);
  elements.resetViewButton.addEventListener("click", () => {
    activateCanvas();
    centerMap();
    setStatus("View reset.");
  });
  elements.undoButton.addEventListener("click", undo);
  elements.redoButton.addEventListener("click", redo);
  elements.importSymbolButton.addEventListener("click", importCustomSymbol);
  elements.mapNameInput.addEventListener("change", () => {
    state.project.metadata.name = elements.mapNameInput.value.trim() || "Untitled Map";
    touchProject(state.project);
    state.isDirty = true;
    render();
  });

  elements.canvas.addEventListener("pointerdown", handlePointerDown);
  elements.canvas.addEventListener("pointermove", handlePointerMove);
  elements.canvas.addEventListener("pointerleave", () => {
    state.hoverCellKey = null;
    render();
  });
  elements.canvas.addEventListener("focus", activateCanvas);
  window.addEventListener("pointerup", handlePointerUp);
  elements.canvas.addEventListener("wheel", handleWheel, { passive: false });
  document.addEventListener("pointerdown", (event) => {
    if (!elements.canvasContainer.contains(event.target)) {
      deactivateCanvas();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      spacePressed = true;
    }

    if (event.key === "Escape") {
      deactivateCanvas();
      setStatus("Map interaction disabled.");
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
      event.preventDefault();
      undo();
    }

    if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "y" || (event.shiftKey && event.key.toLowerCase() === "z"))) {
      event.preventDefault();
      redo();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveProject(false);
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
      spacePressed = false;
    }
  });
}

function init() {
  preloadBuiltinIcons();
  populatePresetOptions();
  populateToolPalette();
  populateTerrainPalette();
  populateOverlayPalette();
  populateEdgePalette();
  preloadProjectImages(state.project);
  syncFormWithProject();
  bindEvents();
  resizeCanvas();
  centerMap();
  updatePaletteSelections();
  updateProjectHeader();
  updateProjectMeta();
}

init();
