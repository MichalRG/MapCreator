import { MAP_TYPE_ORDER, TOOL_DEFS, getMapTypeDef, getToolDef, listBuiltinAssetDefs } from "./constants.js";
import { areAdjacent, cellKey, edgeKey, getCell, getMapBounds, worldToCell } from "./hex.js";
import {
  cloneProject,
  createProject,
  getSuggestedPngName,
  getSuggestedProjectName,
  listCustomPlacementsForCell,
  normalizeProject,
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

function template() {
  return `
    <div class="editor-shell">
      <div class="editor-toolbar">
        <div class="toolbar-group">
          <button data-role="new-map-button" class="action-button">New Map</button>
          <button data-role="open-project-button" class="action-button">Open</button>
          <button data-role="save-project-button" class="action-button">Save</button>
          <button data-role="save-project-as-button" class="action-button">Save As</button>
          <button data-role="export-png-button" class="action-button accent-button">Export PNG</button>
        </div>
        <div class="toolbar-group">
          <button data-role="undo-button" class="action-button">Undo</button>
          <button data-role="redo-button" class="action-button">Redo</button>
        </div>
      </div>

      <main class="workspace">
        <aside class="sidebar left-sidebar">
          <section class="panel">
            <div class="panel-heading">
              <h2>Map Setup</h2>
            </div>
            <label class="field">
              <span>Mode</span>
              <select data-role="map-type-select"></select>
            </label>
            <label class="field">
              <span>Map name</span>
              <input data-role="map-name-input" type="text" value="Untitled Map" />
            </label>
            <label class="field">
              <span>Preset</span>
              <select data-role="preset-select"></select>
            </label>
            <div class="dimension-grid">
              <label class="field">
                <span>Width</span>
                <input data-role="map-width-input" type="number" min="1" max="80" value="20" />
              </label>
              <label class="field">
                <span>Height</span>
                <input data-role="map-height-input" type="number" min="1" max="80" value="20" />
              </label>
            </div>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2>Tools</h2>
            </div>
            <div data-role="tool-palette" class="tool-grid"></div>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2 data-role="terrain-panel-title">Terrain</h2>
            </div>
            <div data-role="terrain-palette" class="asset-grid"></div>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2 data-role="overlay-panel-title">Features</h2>
            </div>
            <div data-role="overlay-palette" class="asset-grid"></div>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2 data-role="edge-panel-title">Routes</h2>
            </div>
            <div data-role="edge-palette" class="asset-grid"></div>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2>Custom Symbols</h2>
            </div>
            <label class="field">
              <span>Symbol name</span>
              <input data-role="custom-symbol-name-input" type="text" placeholder="Ancient ruin" />
            </label>
            <label class="field">
              <span>Category</span>
              <input data-role="custom-symbol-category-input" type="text" value="Custom" />
            </label>
            <button data-role="import-symbol-button" class="action-button full-width">Import SVG or PNG</button>
            <div data-role="custom-symbol-palette" class="asset-grid empty-state-grid">
              <p class="muted">No custom symbols yet.</p>
            </div>
          </section>
        </aside>

        <section class="canvas-panel">
          <div class="canvas-header">
            <div class="canvas-title-group">
              <h2 data-role="project-title">Untitled Map</h2>
              <p data-role="project-subtitle">20 x 20 hex map</p>
              <span data-role="project-mode-badge" class="mode-badge">World Hex Map</span>
            </div>

            <div class="canvas-actions">
              <button data-role="reset-view-button" class="canvas-action-button" type="button">Reset View</button>
              <span data-role="canvas-activation-indicator" class="canvas-activation-indicator">Map inactive</span>
            </div>

            <div data-role="canvas-help" class="canvas-help"></div>
          </div>

          <div data-role="canvas-container" class="canvas-container">
            <canvas data-role="map-canvas" class="editor-canvas" tabindex="0"></canvas>
          </div>
        </section>

        <aside class="sidebar right-sidebar">
          <section class="panel">
            <div class="panel-heading">
              <h2>Inspector</h2>
            </div>
            <div data-role="inspector-content" class="stacked-content">
              <p class="muted">Select a cell to inspect it.</p>
            </div>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2>Project</h2>
            </div>
            <div class="metadata-list">
              <div class="metadata-row">
                <span>Status</span>
                <strong data-role="dirty-indicator">Saved</strong>
              </div>
              <div class="metadata-row">
                <span>History</span>
                <strong data-role="history-indicator">0 undo / 0 redo</strong>
              </div>
              <div class="metadata-row">
                <span>Custom symbols</span>
                <strong data-role="custom-symbol-count">0</strong>
              </div>
              <div class="metadata-row">
                <span>File</span>
                <strong data-role="file-indicator">Not saved yet</strong>
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2>Usage</h2>
            </div>
            <ul data-role="usage-list" class="usage-list"></ul>
          </section>
        </aside>
      </main>

      <footer class="statusbar">
        <span data-role="status-tool">Tool: Terrain</span>
        <span data-role="status-hover">Hover: none</span>
        <span data-role="status-zoom">Zoom: 100%</span>
        <span data-role="status-message">Ready.</span>
      </footer>

      <input data-role="project-file-input" type="file" accept=".json,.hexmap.json,.cavemap.json,application/json" hidden />
      <input data-role="symbol-file-input" type="file" accept=".svg,.png,image/svg+xml,image/png" hidden />
    </div>
  `;
}

function byRole(container, role) {
  return container.querySelector(`[data-role="${role}"]`);
}

export function mountGridEditor(container) {
  container.innerHTML = template();

  const initialProject = createProject({ width: 20, height: 20, name: "Untitled Map", mapType: "hex-world" });
  const initialConfig = getMapTypeDef(initialProject.metadata.mapType);

  const state = {
    project: initialProject,
    selectedTool: "terrain",
    activeTerrain: Object.keys(initialConfig.terrainDefs)[0],
    activeOverlay: Object.keys(initialConfig.overlayDefs)[0],
    activeEdgeType: Object.keys(initialConfig.edgeDefs)[0],
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

  let activeMode = false;
  let spacePressed = false;

  const elements = {
    canvas: byRole(container, "map-canvas"),
    canvasContainer: byRole(container, "canvas-container"),
    presetSelect: byRole(container, "preset-select"),
    mapTypeSelect: byRole(container, "map-type-select"),
    widthInput: byRole(container, "map-width-input"),
    heightInput: byRole(container, "map-height-input"),
    mapNameInput: byRole(container, "map-name-input"),
    projectTitle: byRole(container, "project-title"),
    projectSubtitle: byRole(container, "project-subtitle"),
    projectModeBadge: byRole(container, "project-mode-badge"),
    dirtyIndicator: byRole(container, "dirty-indicator"),
    historyIndicator: byRole(container, "history-indicator"),
    customSymbolCount: byRole(container, "custom-symbol-count"),
    fileIndicator: byRole(container, "file-indicator"),
    inspectorContent: byRole(container, "inspector-content"),
    usageList: byRole(container, "usage-list"),
    canvasHelp: byRole(container, "canvas-help"),
    terrainPanelTitle: byRole(container, "terrain-panel-title"),
    overlayPanelTitle: byRole(container, "overlay-panel-title"),
    edgePanelTitle: byRole(container, "edge-panel-title"),
    statusTool: byRole(container, "status-tool"),
    statusHover: byRole(container, "status-hover"),
    statusZoom: byRole(container, "status-zoom"),
    statusMessage: byRole(container, "status-message"),
    undoButton: byRole(container, "undo-button"),
    redoButton: byRole(container, "redo-button"),
    newMapButton: byRole(container, "new-map-button"),
    openProjectButton: byRole(container, "open-project-button"),
    saveProjectButton: byRole(container, "save-project-button"),
    saveProjectAsButton: byRole(container, "save-project-as-button"),
    exportPngButton: byRole(container, "export-png-button"),
    resetViewButton: byRole(container, "reset-view-button"),
    canvasActivationIndicator: byRole(container, "canvas-activation-indicator"),
    projectFileInput: byRole(container, "project-file-input"),
    symbolFileInput: byRole(container, "symbol-file-input"),
    importSymbolButton: byRole(container, "import-symbol-button"),
    customSymbolNameInput: byRole(container, "custom-symbol-name-input"),
    customSymbolCategoryInput: byRole(container, "custom-symbol-category-input"),
    toolPalette: byRole(container, "tool-palette"),
    terrainPalette: byRole(container, "terrain-palette"),
    overlayPalette: byRole(container, "overlay-palette"),
    edgePalette: byRole(container, "edge-palette"),
    customSymbolPalette: byRole(container, "custom-symbol-palette")
  };

  const canvasContext = elements.canvas.getContext("2d");

  function currentMapConfig() {
    return getMapTypeDef(state.project.metadata.mapType);
  }

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

  function firstKey(record) {
    return Object.keys(record)[0] || null;
  }

  function ensureActiveSelections() {
    const config = currentMapConfig();
    if (!config.terrainDefs[state.activeTerrain]) {
      state.activeTerrain = firstKey(config.terrainDefs);
    }
    if (!config.overlayDefs[state.activeOverlay]) {
      state.activeOverlay = firstKey(config.overlayDefs);
    }
    if (!config.edgeDefs[state.activeEdgeType]) {
      state.activeEdgeType = firstKey(config.edgeDefs);
    }
  }

  function findPresetIdForDimensions(mapType, width, height) {
    const config = getMapTypeDef(mapType);
    const match = config.presets.find((preset) => preset.width === width && preset.height === height);
    return match?.id || "custom";
  }

  function populatePresetOptions(mapType, width = null, height = null) {
    const config = getMapTypeDef(mapType);
    const selectedId =
      width !== null && height !== null ? findPresetIdForDimensions(mapType, width, height) : config.presets[0]?.id || "custom";

    elements.presetSelect.innerHTML = "";
    config.presets.forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.label;
      elements.presetSelect.append(option);
    });
    elements.presetSelect.value = selectedId;
  }

  function syncFormWithProject() {
    const { metadata } = state.project;
    elements.mapTypeSelect.value = metadata.mapType;
    populatePresetOptions(metadata.mapType, metadata.width, metadata.height);
    elements.mapNameInput.value = metadata.name;
    elements.widthInput.value = String(metadata.width);
    elements.heightInput.value = String(metadata.height);
  }

  function renderMapTypeChrome() {
    const config = currentMapConfig();
    elements.terrainPanelTitle.textContent = config.terrainPanelTitle;
    elements.overlayPanelTitle.textContent = config.overlayPanelTitle;
    elements.edgePanelTitle.textContent = config.edgePanelTitle;
    elements.projectModeBadge.textContent = config.label;
    elements.canvasContainer.dataset.mapTheme = config.canvasTheme;

    elements.canvasHelp.innerHTML = "";
    config.canvasTips.forEach((tip) => {
      const item = document.createElement("span");
      item.textContent = tip;
      elements.canvasHelp.append(item);
    });

    elements.usageList.innerHTML = "";
    config.usageTips.forEach((tip) => {
      const item = document.createElement("li");
      item.textContent = tip;
      elements.usageList.append(item);
    });
  }

  function updateProjectHeader() {
    const { metadata } = state.project;
    const config = currentMapConfig();
    elements.projectTitle.textContent = metadata.name;
    elements.projectSubtitle.textContent = `${metadata.width} x ${metadata.height} ${config.projectNoun}`;
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
    elements.statusTool.textContent = `Tool: ${getToolDef(state.selectedTool).label}`;
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
    listBuiltinAssetDefs(state.project.metadata.mapType).forEach((entry) => {
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
      button.className = `choice-button grid-palette-button palette-row-main ${state.activeCustomSymbolId === symbol.id ? "active" : ""}`;
      button.innerHTML = `<strong><span class="asset-swatch" style="--swatch:#cdb48e"></span><span class="choice-label-text">${symbol.name}</span></strong><span>${symbol.category}</span>`;
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
      removeButton.addEventListener("click", () => removeCustomSymbolDefinition(symbol.id));

      row.append(button, removeButton);
      elements.customSymbolPalette.append(row);
    });
  }

  function updatePaletteSelections() {
    container.querySelectorAll("[data-tool-id]").forEach((element) => {
      element.classList.toggle("active", element.dataset.toolId === state.selectedTool);
    });

    container.querySelectorAll("[data-terrain-id]").forEach((element) => {
      element.classList.toggle("active", element.dataset.terrainId === state.activeTerrain);
    });

    container.querySelectorAll("[data-overlay-id]").forEach((element) => {
      element.classList.toggle("active", element.dataset.overlayId === state.activeOverlay);
    });

    container.querySelectorAll("[data-edge-id]").forEach((element) => {
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

  function clearCell(col, row) {
    const config = currentMapConfig();
    applyMutation(`Cleared ${config.cellNoun}.`, (project) => {
      const targetCell = getCell(project, col, row);
      if (!targetCell) {
        return;
      }

      targetCell.terrain = config.defaultTerrain;
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

  function rebuildInspector() {
    const config = currentMapConfig();
    const terrainDefs = config.terrainDefs;
    const overlayDefs = config.overlayDefs;
    const cell = selectedCell();
    elements.inspectorContent.innerHTML = "";

    if (!cell) {
      const message = document.createElement("p");
      message.className = "muted";
      message.textContent = `Select a ${config.cellNoun} to inspect it.`;
      elements.inspectorContent.append(message);
      return;
    }

    const summary = addInspectorCard(`${config.cellNoun[0].toUpperCase()}${config.cellNoun.slice(1)} ${cell.col}, ${cell.row}`);
    const terrainText = document.createElement("p");
    terrainText.className = "muted";
    terrainText.textContent = `${config.terrainPanelTitle}: ${terrainDefs[cell.terrain].label}`;
    summary.append(terrainText);

    const overlayCard = addInspectorCard(config.overlayInspectorTitle);
    if (!cell.overlays.length) {
      const none = document.createElement("p");
      none.className = "muted";
      none.textContent = `No built-in markers on this ${config.cellNoun}.`;
      overlayCard.append(none);
    } else {
      const tagList = document.createElement("div");
      tagList.className = "tag-list";
      cell.overlays.forEach((overlayId) => {
        const tag = document.createElement("span");
        tag.className = "inspector-tag";
        tag.innerHTML = `<span>${overlayDefs[overlayId].label}</span>`;
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "x";
        removeButton.addEventListener("click", () => {
          applyMutation(`Removed ${overlayDefs[overlayId].label}.`, (project) => {
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
      none.textContent = `No custom symbols on this ${config.cellNoun}.`;
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
        removeButton.addEventListener("click", () => removeCustomPlacement(placement.id, `Removed ${symbol.name}.`));
        tag.append(removeButton);
        tagList.append(tag);
      });
      customCard.append(tagList);
    }

    const actionCard = addInspectorCard("Actions");
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "action-button dark-button";
    clearButton.textContent = `Clear ${config.cellNoun[0].toUpperCase()}${config.cellNoun.slice(1)}`;
    clearButton.addEventListener("click", () => clearCell(cell.col, cell.row));

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "action-button dark-button";
    resetButton.textContent = `Reset To ${config.terrainDefs[config.defaultTerrain].label}`;
    resetButton.addEventListener("click", () => {
      applyMutation(`Reset to ${config.terrainDefs[config.defaultTerrain].label}.`, (project) => {
        getCell(project, cell.col, cell.row).terrain = config.defaultTerrain;
      });
    });

    actionCard.append(clearButton, resetButton);
  }

  function resizeCanvas() {
    const rect = elements.canvasContainer.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    elements.canvas.width = Math.floor(rect.width);
    elements.canvas.height = Math.floor(rect.height);
    render();
  }

  function render() {
    ensureActiveSelections();
    drawScene(canvasContext, {
      project: state.project,
      canvasWidth: elements.canvas.width,
      canvasHeight: elements.canvas.height,
      viewport: state.viewport,
      size: currentMapConfig().cellSize,
      hoverCell: hoverCell(),
      selectedCell: selectedCell(),
      pendingEdgeCell: pendingEdgeCell(),
      imageCache: state.imageCache,
      builtinIconCache: state.builtinIconCache,
      mapConfig: currentMapConfig()
    });
    updateProjectHeader();
    updateProjectMeta();
    updateCanvasActivationUi();
    updateStatusBar();
    rebuildInspector();
  }

  function centerMap() {
    const bounds = getMapBounds(state.project, currentMapConfig().cellSize);
    const usableWidth = Math.max(elements.canvas.width - 80, 200);
    const usableHeight = Math.max(elements.canvas.height - 80, 200);
    const scale = Math.min(usableWidth / bounds.width, usableHeight / bounds.height, 1.35);
    state.viewport.scale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    state.viewport.offsetX = (elements.canvas.width - bounds.width * state.viewport.scale) / 2 - bounds.minX * state.viewport.scale;
    state.viewport.offsetY = (elements.canvas.height - bounds.height * state.viewport.scale) / 2 - bounds.minY * state.viewport.scale;
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

  function refreshAfterProjectSwap({ center = false } = {}) {
    ensureActiveSelections();
    renderMapTypeChrome();
    rebuildPalettes();
    preloadBuiltinIcons();
    preloadProjectImages(state.project);
    syncFormWithProject();

    if (center) {
      centerMap();
    } else {
      render();
    }
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
    state.transactionSnapshot = null;
    state.isDirty = true;
    syncFormWithProject();
    setStatus("Undid the last action.");
    refreshAfterProjectSwap();
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
    state.transactionSnapshot = null;
    state.isDirty = true;
    syncFormWithProject();
    setStatus("Redid the last action.");
    refreshAfterProjectSwap();
  }

  function confirmLoseChanges() {
    return !state.isDirty || window.confirm("You have unsaved changes. Continue and discard them?");
  }

  function readMapSpecFromForm() {
    const width = Number.parseInt(elements.widthInput.value, 10);
    const height = Number.parseInt(elements.heightInput.value, 10);
    const name = elements.mapNameInput.value.trim() || "Untitled Map";
    return {
      width: Math.min(Math.max(width || 20, 1), 80),
      height: Math.min(Math.max(height || 20, 1), 80),
      name,
      mapType: elements.mapTypeSelect.value || "hex-world"
    };
  }

  function createNewMap() {
    if (!confirmLoseChanges()) {
      return;
    }

    const { width, height, name, mapType } = readMapSpecFromForm();
    state.project = createProject({ width, height, name, mapType });
    state.projectHandle = null;
    state.history.undoStack = [];
    state.history.redoStack = [];
    state.selectedCellKey = null;
    state.hoverCellKey = null;
    state.pendingEdgeStart = null;
    state.isDirty = false;
    state.activeCustomSymbolId = null;
    state.transactionSnapshot = null;
    state.imageCache = new Map();
    ensureActiveSelections();
    refreshAfterProjectSwap({ center: true });
    setStatus(`Created ${width} x ${height} ${getMapTypeDef(mapType).projectNoun}.`);
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

    const exclusives = currentMapConfig().exclusiveOverlayIds;
    if (exclusives?.has(state.activeOverlay)) {
      targetCell.overlays = targetCell.overlays.filter((entry) => !exclusives.has(entry));
    }

    targetCell.overlays.push(state.activeOverlay);
    return true;
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

  function toggleEdge(col, row) {
    const config = currentMapConfig();
    const current = { col, row };

    if (!state.pendingEdgeStart) {
      state.pendingEdgeStart = current;
      setStatus(`Pick a neighboring ${config.cellNoun} to finish the connection.`);
      render();
      return;
    }

    if (state.pendingEdgeStart.col === col && state.pendingEdgeStart.row === row) {
      state.pendingEdgeStart = null;
      setStatus("Canceled pending connection.");
      render();
      return;
    }

    if (!areAdjacent(state.project, state.pendingEdgeStart, current)) {
      state.pendingEdgeStart = current;
      setStatus(`Connections must link neighboring ${config.cellNounPlural}.`);
      render();
      return;
    }

    applyMutation(`Toggled ${config.edgeDefs[state.activeEdgeType].label}.`, (project) => {
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
    const config = currentMapConfig();
    setSelectedCell(col, row);

    if (state.selectedTool === "select") {
      setStatus(`Selected ${config.cellNoun} ${col}, ${row}.`);
      render();
      return;
    }

    if (state.selectedTool === "clear") {
      clearCell(col, row);
      return;
    }

    if (state.selectedTool === "overlay") {
      applyMutation(`Toggled ${config.overlayDefs[state.activeOverlay].label}.`, () => {
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
    const config = currentMapConfig();
    if (!cell || state.drag.lastCellKey === cellKey(cell.col, cell.row)) {
      return;
    }

    if (paintTerrain(cell.col, cell.row)) {
      beginTransaction();
      state.drag.lastCellKey = cellKey(cell.col, cell.row);
      touchProject(state.project);
      state.isDirty = true;
      setStatus(`Painting ${config.terrainDefs[state.activeTerrain].label}.`);
      render();
    }
  }

  function screenToWorld(clientX, clientY) {
    const rect = elements.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - state.viewport.offsetX) / state.viewport.scale,
      y: (clientY - rect.top - state.viewport.offsetY) / state.viewport.scale
    };
  }

  function cellFromPointer(clientX, clientY) {
    const world = screenToWorld(clientX, clientY);
    const point = worldToCell(state.project, world.x, world.y, currentMapConfig().cellSize);
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
        size: currentMapConfig().cellSize,
        imageCache: state.imageCache,
        builtinIconCache: state.builtinIconCache,
        mapConfig: currentMapConfig(),
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
      const normalized = normalizeProject(parsed);
      validateProjectShape(normalized);

      state.project = normalized;
      state.projectHandle = selection.handle;
      state.history.undoStack = [];
      state.history.redoStack = [];
      state.selectedCellKey = null;
      state.hoverCellKey = null;
      state.pendingEdgeStart = null;
      state.activeCustomSymbolId = state.project.customSymbols[0]?.id || null;
      state.isDirty = false;
      state.transactionSnapshot = null;
      setStatus(`Opened ${selection.file.name}.`);
      refreshAfterProjectSwap({ center: true });
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

  function populateMapTypeOptions() {
    elements.mapTypeSelect.innerHTML = "";
    MAP_TYPE_ORDER.forEach((mapType) => {
      const config = getMapTypeDef(mapType);
      const option = document.createElement("option");
      option.value = config.id;
      option.textContent = config.label;
      elements.mapTypeSelect.append(option);
    });
  }

  function populateToolPalette() {
    elements.toolPalette.innerHTML = "";
    TOOL_DEFS.forEach((tool) => {
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
    elements.terrainPalette.innerHTML = "";
    Object.entries(currentMapConfig().terrainDefs).forEach(([terrainId, terrain]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `choice-button grid-palette-button ${terrainId === state.activeTerrain ? "active" : ""}`;
      button.dataset.terrainId = terrainId;
      button.innerHTML = `<strong><img class="choice-icon" src="${terrain.icon}" alt="" /><span class="choice-label-stack"><span class="choice-preview" style="background:${terrain.color}"></span><span class="choice-label-text">${terrain.label}</span></span></strong><span>Base surface</span>`;
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
    elements.overlayPalette.innerHTML = "";
    Object.entries(currentMapConfig().overlayDefs).forEach(([overlayId, overlay]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `choice-button grid-palette-button ${overlayId === state.activeOverlay ? "active" : ""}`;
      button.dataset.overlayId = overlayId;
      button.innerHTML = `<strong><img class="choice-icon" src="${overlay.icon}" alt="" /><span class="choice-label-text">${overlay.label}</span></strong><span>Built-in marker</span>`;
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
    elements.edgePalette.innerHTML = "";
    Object.entries(currentMapConfig().edgeDefs).forEach(([edgeId, edge]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `choice-button grid-palette-button ${edgeId === state.activeEdgeType ? "active" : ""}`;
      button.dataset.edgeId = edgeId;
      button.innerHTML = `<strong><img class="choice-icon" src="${edge.icon}" alt="" /><span class="choice-label-text">${edge.label}</span></strong><span>Connect neighboring cells</span>`;
      button.addEventListener("click", () => {
        state.activeEdgeType = edgeId;
        state.selectedTool = "edge";
        updatePaletteSelections();
        render();
      });
      elements.edgePalette.append(button);
    });
  }

  function rebuildPalettes() {
    populateToolPalette();
    populateTerrainPalette();
    populateOverlayPalette();
    populateEdgePalette();
    updateCustomSymbolPalette();
    updatePaletteSelections();
  }

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
      state.viewport.offsetX += event.clientX - state.drag.startX;
      state.viewport.offsetY += event.clientY - state.drag.startY;
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
      commitTransaction(`Painted ${currentMapConfig().terrainDefs[state.activeTerrain].label}.`);
    } else {
      cancelTransaction();
    }
    state.drag.mode = null;
    state.drag.lastCellKey = null;
  }

  function handleWheel(event) {
    if (!activeMode || !state.isCanvasActive) {
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

  function handleMapTypeSetupChange() {
    const mapType = elements.mapTypeSelect.value;
    const config = getMapTypeDef(mapType);
    populatePresetOptions(mapType);
    const defaultPreset = config.presets[0];
    if (defaultPreset) {
      elements.widthInput.value = String(defaultPreset.width);
      elements.heightInput.value = String(defaultPreset.height);
    }
  }

  function handlePresetChange() {
    const mapType = elements.mapTypeSelect.value || state.project.metadata.mapType;
    const config = getMapTypeDef(mapType);
    const preset = config.presets.find((entry) => entry.id === elements.presetSelect.value);
    if (!preset || preset.id === "custom") {
      return;
    }
    elements.widthInput.value = String(preset.width);
    elements.heightInput.value = String(preset.height);
  }

  function bindEvents() {
    window.addEventListener("resize", () => {
      if (activeMode) {
        resizeCanvas();
      }
    });
    elements.mapTypeSelect.addEventListener("change", handleMapTypeSetupChange);
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
    window.addEventListener("pointerup", () => {
      if (activeMode) {
        handlePointerUp();
      }
    });
    elements.canvas.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("pointerdown", (event) => {
      if (activeMode && !elements.canvasContainer.contains(event.target)) {
        deactivateCanvas();
      }
    });

    window.addEventListener("keydown", (event) => {
      if (!activeMode) {
        return;
      }

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
      if (activeMode && event.code === "Space") {
        spacePressed = false;
      }
    });
  }

  function setActive(active) {
    activeMode = active;
    if (activeMode) {
      requestAnimationFrame(() => {
        resizeCanvas();
        render();
      });
    } else {
      deactivateCanvas();
    }
  }

  populateMapTypeOptions();
  renderMapTypeChrome();
  preloadBuiltinIcons();
  preloadProjectImages(state.project);
  syncFormWithProject();
  rebuildPalettes();
  bindEvents();

  return {
    setActive
  };
}
