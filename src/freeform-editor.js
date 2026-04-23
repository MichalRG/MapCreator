import { BUILTIN_ASSETS, getBuiltinAsset } from "./cave-assets.js";
import {
  cloneProject,
  createProject,
  getSuggestedPngName,
  getSuggestedProjectName,
  normalizeProject,
  touchProject,
  validateProjectShape
} from "./cave-project.js";
import {
  openProjectFile,
  pickCustomSymbolFile,
  readFileAsDataUrl,
  readFileAsText,
  sanitizeFileStem,
  saveBlobFile,
  saveTextFile
} from "./io.js";
import { drawExportCanvas, drawScene } from "./cave-render.js";

const PAGE_PRESETS = [
  { id: "compact", label: "Compact 1600 x 1000", width: 1600, height: 1000 },
  { id: "adventure", label: "Adventure 2400 x 1600", width: 2400, height: 1600 },
  { id: "atlas", label: "Atlas 3200 x 2000", width: 3200, height: 2000 },
  { id: "epic", label: "Epic 4000 x 2400", width: 4000, height: 2400 },
  { id: "custom", label: "Custom", width: 2400, height: 1600 }
];

const TOOL_DEFS = [
  { id: "floor", label: "Floor", description: "Carve chambers, tunnels, and walkable passages." },
  { id: "wall", label: "Wall", description: "Push rock back in and tighten silhouettes." },
  { id: "water", label: "Water", description: "Paint underground pools and streams." },
  { id: "lava", label: "Lava", description: "Add glowing magma cuts and vents." },
  { id: "chasm", label: "Chasm", description: "Mark deep cracks, drops, and voids." },
  { id: "erase", label: "Rubber", description: "Erase parts of painted cave surfaces." },
  { id: "detail", label: "Detail", description: "Place props like crystals, nests, and treasure." },
  { id: "erase-detail", label: "Erase Detail", description: "Remove a placed detail with one click." },
  { id: "select", label: "Select", description: "Select and drag an existing placed detail." },
  { id: "pan", label: "Pan", description: "Drag the workspace without editing." }
];

const PAINT_TOOLS = new Set(["floor", "wall", "water", "lava", "chasm"]);
const SURFACE_BRUSH_TOOLS = new Set(["floor", "wall", "water", "lava", "chasm", "erase"]);

function template() {
  return `
    <div class="editor-shell">
      <div class="editor-toolbar">
        <div class="toolbar-group">
          <button data-role="new-map-button" class="action-button">New Page</button>
          <button data-role="open-project-button" class="action-button">Open</button>
          <button data-role="save-project-button" class="action-button">Save</button>
          <button data-role="save-project-as-button" class="action-button">Save As</button>
          <button data-role="export-png-button" class="action-button accent-button">Export PNG</button>
        </div>
        <div class="toolbar-group">
          <button data-role="undo-button" class="action-button">Undo</button>
          <button data-role="redo-button" class="action-button">Redo</button>
          <button data-role="import-asset-button" class="action-button">Import Detail</button>
        </div>
      </div>

      <main class="workspace">
        <aside class="sidebar left-sidebar">
          <section class="panel">
            <div class="panel-heading">
              <h2>Project</h2>
            </div>

            <label class="field">
              <span>Map name</span>
              <input data-role="map-name-input" type="text" value="Untitled Cavern" />
            </label>

            <label class="field">
              <span>Page preset</span>
              <select data-role="page-preset-select"></select>
            </label>

            <div class="dimension-grid">
              <label class="field">
                <span>Width</span>
                <input data-role="map-width-input" type="number" min="800" max="5000" step="100" value="2400" />
              </label>
              <label class="field">
                <span>Height</span>
                <input data-role="map-height-input" type="number" min="600" max="4000" step="100" value="1600" />
              </label>
            </div>

            <button data-role="apply-page-button" class="action-button full-width">Create Fresh Page</button>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2>Tools</h2>
            </div>
            <div data-role="tool-palette" class="tool-grid"></div>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2>Brush</h2>
            </div>

            <label class="field">
              <span>Brush size</span>
              <input data-role="brush-size-input" type="range" min="20" max="280" step="2" value="96" />
            </label>

            <label class="field">
              <span>Brush opacity</span>
              <input data-role="brush-opacity-input" type="range" min="20" max="100" step="1" value="100" />
            </label>

            <label class="field">
              <span>Floor variant</span>
              <select data-role="floor-variant-select">
                <option value="normal">Normal</option>
                <option value="up">Raised</option>
                <option value="down">Lowered</option>
              </select>
            </label>

            <div class="toggle-stack">
              <label class="toggle-row">
                <input data-role="connect-paint-input" type="checkbox" checked />
                <span>Merge touching brush marks</span>
              </label>
              <label class="toggle-row">
                <input data-role="show-grid-input" type="checkbox" checked />
                <span>Show drafting grid</span>
              </label>
              <label class="toggle-row">
                <input data-role="snap-to-grid-input" type="checkbox" />
                <span>Snap details to grid</span>
              </label>
            </div>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2>Built-In Details</h2>
            </div>
            <div data-role="asset-palette" class="asset-grid"></div>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2>Custom Details</h2>
            </div>

            <label class="field">
              <span>Imported detail name</span>
              <input data-role="custom-asset-name-input" type="text" placeholder="Ancient statue" />
            </label>

            <button data-role="panel-import-asset-button" class="action-button full-width">Import PNG or SVG Detail</button>

            <div data-role="custom-asset-palette" class="asset-grid empty-state-grid">
              <p class="muted">No custom details yet.</p>
            </div>
          </section>
        </aside>

        <section class="canvas-panel">
          <div class="canvas-header">
            <div class="canvas-title-group">
              <h2 data-role="project-title">Untitled Cavern</h2>
              <p data-role="project-subtitle">2400 x 1600 drafting page</p>
              <span class="mode-badge">Freeform Cave Draft</span>
            </div>

            <div class="canvas-actions">
              <button data-role="reset-view-button" class="canvas-action-button" type="button">Reset View</button>
              <span data-role="canvas-activation-indicator" class="canvas-activation-indicator">Page inactive</span>
            </div>

            <div class="canvas-help">
              <span>Click canvas to activate</span>
              <span>Wheel to zoom</span>
              <span>Space + drag to pan</span>
              <span>Select tool to move or remove placed details</span>
            </div>
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
              <p class="muted">Select a placed detail to inspect it.</p>
            </div>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2>Project Stats</h2>
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
                <span>Strokes</span>
                <strong data-role="stroke-count">0</strong>
              </div>
              <div class="metadata-row">
                <span>Placed details</span>
                <strong data-role="stamp-count">0</strong>
              </div>
              <div class="metadata-row">
                <span>Imported details</span>
                <strong data-role="custom-asset-count">0</strong>
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
        <span data-role="status-tool">Tool: Floor</span>
        <span data-role="status-hover">Cursor: off page</span>
        <span data-role="status-zoom">Zoom: 100%</span>
        <span data-role="status-message">Ready.</span>
      </footer>

      <input data-role="project-file-input" type="file" accept=".json,.caveforge.json,application/json" hidden />
      <input data-role="asset-file-input" type="file" accept=".svg,.png,image/svg+xml,image/png" hidden />
    </div>
  `;
}

function byRole(container, role) {
  return container.querySelector(`[data-role="${role}"]`);
}

export function mountFreeformEditor(container) {
  container.innerHTML = template();

  const state = {
    project: createProject(),
    selectedTool: "floor",
    selectedAssetKind: "builtin",
    selectedAssetId: BUILTIN_ASSETS[0].id,
    brushSize: 96,
    brushOpacity: 1,
    floorVariant: "normal",
    connectPaint: true,
    selectedStampId: null,
    hoverPoint: null,
    isCanvasActive: false,
    isDirty: false,
    projectHandle: null,
    history: {
      undoStack: [],
      redoStack: []
    },
    viewport: {
      scale: 0.55,
      offsetX: 0,
      offsetY: 0
    },
    drag: {
      mode: null,
      startX: 0,
      startY: 0,
      activeStrokeId: null,
      stampPointerOffsetX: 0,
      stampPointerOffsetY: 0
    },
    transactionSnapshot: null,
    imageCache: new Map(),
    statusMessage: "Ready."
  };

  let activeMode = false;
  let spacePressed = false;

  const elements = {
    canvas: byRole(container, "map-canvas"),
    canvasContainer: byRole(container, "canvas-container"),
    projectTitle: byRole(container, "project-title"),
    projectSubtitle: byRole(container, "project-subtitle"),
    mapNameInput: byRole(container, "map-name-input"),
    pagePresetSelect: byRole(container, "page-preset-select"),
    mapWidthInput: byRole(container, "map-width-input"),
    mapHeightInput: byRole(container, "map-height-input"),
    applyPageButton: byRole(container, "apply-page-button"),
    brushSizeInput: byRole(container, "brush-size-input"),
    brushOpacityInput: byRole(container, "brush-opacity-input"),
    floorVariantSelect: byRole(container, "floor-variant-select"),
    connectPaintInput: byRole(container, "connect-paint-input"),
    showGridInput: byRole(container, "show-grid-input"),
    snapToGridInput: byRole(container, "snap-to-grid-input"),
    toolPalette: byRole(container, "tool-palette"),
    assetPalette: byRole(container, "asset-palette"),
    customAssetPalette: byRole(container, "custom-asset-palette"),
    customAssetNameInput: byRole(container, "custom-asset-name-input"),
    inspectorContent: byRole(container, "inspector-content"),
    usageList: byRole(container, "usage-list"),
    dirtyIndicator: byRole(container, "dirty-indicator"),
    historyIndicator: byRole(container, "history-indicator"),
    strokeCount: byRole(container, "stroke-count"),
    stampCount: byRole(container, "stamp-count"),
    customAssetCount: byRole(container, "custom-asset-count"),
    fileIndicator: byRole(container, "file-indicator"),
    undoButton: byRole(container, "undo-button"),
    redoButton: byRole(container, "redo-button"),
    newMapButton: byRole(container, "new-map-button"),
    openProjectButton: byRole(container, "open-project-button"),
    saveProjectButton: byRole(container, "save-project-button"),
    saveProjectAsButton: byRole(container, "save-project-as-button"),
    exportPngButton: byRole(container, "export-png-button"),
    importAssetButton: byRole(container, "import-asset-button"),
    panelImportAssetButton: byRole(container, "panel-import-asset-button"),
    resetViewButton: byRole(container, "reset-view-button"),
    canvasActivationIndicator: byRole(container, "canvas-activation-indicator"),
    projectFileInput: byRole(container, "project-file-input"),
    assetFileInput: byRole(container, "asset-file-input"),
    statusTool: byRole(container, "status-tool"),
    statusHover: byRole(container, "status-hover"),
    statusZoom: byRole(container, "status-zoom"),
    statusMessage: byRole(container, "status-message")
  };

  const canvasContext = elements.canvas.getContext("2d");

  function setStatus(message) {
    state.statusMessage = message;
    elements.statusMessage.textContent = message;
  }

  function projectFileLabel() {
    return state.projectHandle?.name || "Not saved yet";
  }

  function makeId(prefix) {
    if (globalThis.crypto?.randomUUID) {
      return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }

  function clampToPage(point) {
    return {
      x: Math.max(0, Math.min(state.project.metadata.width, point.x)),
      y: Math.max(0, Math.min(state.project.metadata.height, point.y))
    };
  }

  function pointInPage(point) {
    return !!point && point.x >= 0 && point.y >= 0 && point.x <= state.project.metadata.width && point.y <= state.project.metadata.height;
  }

  function snapPoint(point) {
    if (!state.project.metadata.snapToGrid) {
      return point;
    }

    const grid = state.project.metadata.gridSize;
    return clampToPage({
      x: Math.round(point.x / grid) * grid,
      y: Math.round(point.y / grid) * grid
    });
  }

  function screenToWorld(clientX, clientY) {
    const rect = elements.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - state.viewport.offsetX) / state.viewport.scale,
      y: (clientY - rect.top - state.viewport.offsetY) / state.viewport.scale
    };
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function currentAssetSelection() {
    if (state.selectedAssetKind === "custom") {
      const asset = state.project.customAssets.find((entry) => entry.id === state.selectedAssetId);
      if (!asset) {
        return null;
      }

      return {
        assetKind: "custom",
        assetId: asset.id,
        label: asset.name,
        description: "Imported detail",
        size: 108
      };
    }

    const asset = getBuiltinAsset(state.selectedAssetId);
    return {
      assetKind: "builtin",
      assetId: asset.id,
      label: asset.label,
      description: asset.description,
      size: asset.defaultSize
    };
  }

  function selectedStamp() {
    return state.project.stamps.find((stamp) => stamp.id === state.selectedStampId) || null;
  }

  function updatePaletteSelections() {
    container.querySelectorAll("[data-tool-id]").forEach((element) => {
      element.classList.toggle("active", element.dataset.toolId === state.selectedTool);
    });

    container.querySelectorAll("[data-asset-kind][data-asset-id]").forEach((element) => {
      const active = element.dataset.assetKind === state.selectedAssetKind && element.dataset.assetId === state.selectedAssetId;
      element.classList.toggle("active", active);
    });
  }

  function setActiveAsset(kind, assetId) {
    state.selectedAssetKind = kind;
    state.selectedAssetId = assetId;
    state.selectedTool = "detail";
    updatePaletteSelections();
    render();
  }

  function pushHistory(snapshot) {
    state.history.undoStack.push(snapshot);
    state.history.redoStack = [];
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

    pushHistory(state.transactionSnapshot);
    state.transactionSnapshot = null;
    touchProject(state.project);
    state.isDirty = true;
    setStatus(message);
    render();
  }

  function cancelTransaction() {
    state.transactionSnapshot = null;
  }

  function applyMutation(message, mutator) {
    const before = cloneProject(state.project);
    mutator(state.project);
    pushHistory(before);
    touchProject(state.project);
    state.isDirty = true;
    setStatus(message);
    render();
  }

  function activateCanvas() {
    if (document.activeElement !== elements.canvas) {
      elements.canvas.focus({ preventScroll: true });
    }

    if (!state.isCanvasActive) {
      state.isCanvasActive = true;
      render();
    }
  }

  function deactivateCanvas() {
    if (!state.isCanvasActive) {
      return;
    }

    state.isCanvasActive = false;
    state.hoverPoint = null;
    render();
  }

  function updateCanvasActivationUi() {
    elements.canvasContainer.classList.toggle("active", state.isCanvasActive);
    elements.canvasActivationIndicator.classList.toggle("active", state.isCanvasActive);
    elements.canvasActivationIndicator.textContent = state.isCanvasActive ? "Page active" : "Page inactive";
  }

  function updateProjectHeader() {
    elements.projectTitle.textContent = state.project.metadata.name;
    elements.projectSubtitle.textContent = `${state.project.metadata.width} x ${state.project.metadata.height} drafting page`;
  }

  function updateProjectMeta() {
    elements.dirtyIndicator.textContent = state.isDirty ? "Unsaved changes" : "Saved";
    elements.historyIndicator.textContent = `${state.history.undoStack.length} undo / ${state.history.redoStack.length} redo`;
    elements.strokeCount.textContent = String(state.project.strokes.length);
    elements.stampCount.textContent = String(state.project.stamps.length);
    elements.customAssetCount.textContent = String(state.project.customAssets.length);
    elements.fileIndicator.textContent = projectFileLabel();
    elements.undoButton.disabled = state.history.undoStack.length === 0;
    elements.redoButton.disabled = state.history.redoStack.length === 0;
  }

  function updateBrushControls() {
    elements.floorVariantSelect.disabled = state.selectedTool !== "floor";
  }

  function updateStatusBar() {
    const tool = TOOL_DEFS.find((entry) => entry.id === state.selectedTool) || TOOL_DEFS[0];
    elements.statusTool.textContent = `Tool: ${tool.label}`;
    elements.statusHover.textContent = pointInPage(state.hoverPoint)
      ? `Cursor: ${Math.round(state.hoverPoint.x)}, ${Math.round(state.hoverPoint.y)}`
      : "Cursor: off page";
    elements.statusZoom.textContent = `Zoom: ${Math.round(state.viewport.scale * 100)}%`;
  }

  function rebuildUsageList() {
    const tips = [
      "Use Floor to block out the cavern silhouette, then switch Floor Variant to Raised or Lowered where you want elevation markers.",
      "Turn on Merge Touching Brush Marks if you want touching strokes of the same paint type to read as one surface.",
      "Water, Lava, and Chasm brushes work as fast encounter overlays on top of carved floor.",
      "Use Rubber to carve away parts of any painted surface without deleting placed details.",
      "Pick Detail to place props; use Select to drag them and Erase Detail to remove them.",
      "Turn on Snap To Grid if you want clean prop alignment for tactical encounters.",
      "Save stores the editable cave draft as JSON, while Export PNG renders a presentation image."
    ];

    elements.usageList.innerHTML = "";
    tips.forEach((tip) => {
      const item = document.createElement("li");
      item.textContent = tip;
      elements.usageList.append(item);
    });
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

  function moveSelectedStamp(direction) {
    const stamp = selectedStamp();
    if (!stamp) {
      return;
    }

    applyMutation(direction === "front" ? "Brought detail to front." : "Sent detail backward.", (project) => {
      const index = project.stamps.findIndex((entry) => entry.id === stamp.id);
      if (index === -1) {
        return;
      }

      const [entry] = project.stamps.splice(index, 1);
      if (direction === "front") {
        project.stamps.push(entry);
      } else {
        project.stamps.unshift(entry);
      }
    });
  }

  function deleteSelectedStamp() {
    const stamp = selectedStamp();
    if (!stamp) {
      return;
    }

    applyMutation("Removed detail.", (project) => {
      project.stamps = project.stamps.filter((entry) => entry.id !== stamp.id);
    });
    state.selectedStampId = null;
    render();
  }

  function duplicateSelectedStamp() {
    const stamp = selectedStamp();
    if (!stamp) {
      return;
    }

    applyMutation("Duplicated detail.", (project) => {
      project.stamps.push({
        ...stamp,
        id: makeId("stamp"),
        x: stamp.x + 24,
        y: stamp.y + 24
      });
    });
  }

  function rebuildInspector() {
    elements.inspectorContent.innerHTML = "";
    const stamp = selectedStamp();

    if (!stamp) {
      const summary = addInspectorCard("Current Tool");
      const tool = TOOL_DEFS.find((entry) => entry.id === state.selectedTool) || TOOL_DEFS[0];
      const selectedAsset = currentAssetSelection();
      const copy = document.createElement("p");
      copy.className = "muted";
      copy.textContent = tool.description;
      summary.append(copy);

      if (state.selectedTool === "detail" && selectedAsset) {
        const detail = document.createElement("p");
        detail.className = "muted";
        detail.textContent = `Selected detail: ${selectedAsset.label}`;
        summary.append(detail);
      }

      const stats = addInspectorCard("Composition");
      [
        ["Floor strokes", state.project.strokes.filter((stroke) => stroke.tool === "floor").length],
        ["Water strokes", state.project.strokes.filter((stroke) => stroke.tool === "water").length],
        ["Lava strokes", state.project.strokes.filter((stroke) => stroke.tool === "lava").length],
        ["Chasm strokes", state.project.strokes.filter((stroke) => stroke.tool === "chasm").length]
      ].forEach(([label, value]) => {
        const row = document.createElement("p");
        row.className = "muted";
        row.textContent = `${label}: ${value}`;
        stats.append(row);
      });
      return;
    }

    const details = addInspectorCard("Placed Detail");
    const assetLabel =
      stamp.assetKind === "custom"
        ? state.project.customAssets.find((entry) => entry.id === stamp.assetId)?.name || "Imported detail"
        : getBuiltinAsset(stamp.assetId).label;

    [
      `Asset: ${assetLabel}`,
      `Position: ${Math.round(stamp.x)}, ${Math.round(stamp.y)}`,
      `Size: ${Math.round(stamp.size)} px`,
      `Rotation: ${Math.round((stamp.rotation * 180) / Math.PI)} deg`
    ].forEach((text) => {
      const line = document.createElement("p");
      line.className = "muted";
      line.textContent = text;
      details.append(line);
    });

    const actions = addInspectorCard("Actions");

    [
      ["Duplicate", duplicateSelectedStamp],
      ["Bring To Front", () => moveSelectedStamp("front")],
      ["Send Backward", () => moveSelectedStamp("back")]
    ].forEach(([label, handler]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "action-button dark-button";
      button.textContent = label;
      button.addEventListener("click", handler);
      actions.append(button);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "action-button full-width accent-button";
    deleteButton.textContent = "Delete Detail";
    deleteButton.addEventListener("click", deleteSelectedStamp);
    actions.append(deleteButton);
  }

  function populatePresetOptions() {
    elements.pagePresetSelect.innerHTML = "";
    PAGE_PRESETS.forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.label;
      elements.pagePresetSelect.append(option);
    });
    elements.pagePresetSelect.value = "adventure";
  }

  function updatePresetFromDimensions() {
    const width = Number(elements.mapWidthInput.value);
    const height = Number(elements.mapHeightInput.value);
    const match = PAGE_PRESETS.find((preset) => preset.width === width && preset.height === height);
    elements.pagePresetSelect.value = match?.id || "custom";
  }

  function syncFormWithProject() {
    elements.mapNameInput.value = state.project.metadata.name;
    elements.mapWidthInput.value = String(state.project.metadata.width);
    elements.mapHeightInput.value = String(state.project.metadata.height);
    elements.brushSizeInput.value = String(state.brushSize);
    elements.brushOpacityInput.value = String(Math.round(state.brushOpacity * 100));
    elements.floorVariantSelect.value = state.floorVariant;
    elements.connectPaintInput.checked = state.connectPaint;
    elements.showGridInput.checked = state.project.metadata.showGrid;
    elements.snapToGridInput.checked = state.project.metadata.snapToGrid;
    updatePresetFromDimensions();
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
        updatePaletteSelections();
        setStatus(`Tool changed to ${tool.label}.`);
        render();
      });
      elements.toolPalette.append(button);
    });
  }

  function createAssetButton(asset, kind) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.dataset.assetKind = kind;
    button.dataset.assetId = asset.id;
    button.innerHTML = `<strong><span class="asset-swatch" style="--swatch:${asset.accent || "#cab58d"}"></span><span class="choice-label-text">${asset.label || asset.name}</span></strong><span>${asset.description || "Imported detail"}</span>`;
    button.addEventListener("click", () => {
      setActiveAsset(kind, asset.id);
      setStatus(`Selected ${asset.label || asset.name}.`);
    });
    return button;
  }

  function rebuildAssetPalette() {
    elements.assetPalette.innerHTML = "";
    BUILTIN_ASSETS.forEach((asset) => {
      elements.assetPalette.append(createAssetButton(asset, "builtin"));
    });

    elements.customAssetPalette.innerHTML = "";
    if (!state.project.customAssets.length) {
      elements.customAssetPalette.classList.add("empty-state-grid");
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "No custom details yet.";
      elements.customAssetPalette.append(empty);
    } else {
      elements.customAssetPalette.classList.remove("empty-state-grid");
      state.project.customAssets.forEach((asset) => {
        const row = document.createElement("div");
        row.className = "palette-row";

        const assetButton = createAssetButton({ ...asset, description: "Imported detail", accent: "#cdb48e" }, "custom");
        assetButton.classList.add("palette-row-main");

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "palette-row-remove";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", () => removeCustomAsset(asset.id));

        row.append(assetButton, removeButton);
        elements.customAssetPalette.append(row);
      });
    }

    updatePaletteSelections();
  }

  function updateCustomImageCache() {
    const nextCache = new Map();
    state.project.customAssets.forEach((asset) => {
      const existing = state.imageCache.get(asset.id);
      if (existing) {
        nextCache.set(asset.id, existing);
        return;
      }

      const image = new Image();
      image.src = asset.assetData;
      image.onload = () => render();
      nextCache.set(asset.id, image);
    });
    state.imageCache = nextCache;
  }

  function render() {
    updateProjectHeader();
    updateProjectMeta();
    updateBrushControls();
    updateCanvasActivationUi();
    updateStatusBar();
    rebuildInspector();

    drawScene(canvasContext, {
      project: state.project,
      canvasWidth: elements.canvas.width,
      canvasHeight: elements.canvas.height,
      viewport: state.viewport,
      imageCache: state.imageCache,
      selectedStampId: state.selectedStampId,
      hoverPoint: state.hoverPoint,
      selectedTool: state.selectedTool,
      floorVariant: state.floorVariant,
      brushSize: state.brushSize,
      detailPreview: currentAssetSelection()
    });
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

  function centerPage() {
    const padding = 160;
    const usableWidth = Math.max(320, elements.canvas.width - padding);
    const usableHeight = Math.max(240, elements.canvas.height - padding);
    const scale = Math.min(usableWidth / state.project.metadata.width, usableHeight / state.project.metadata.height, 1);

    state.viewport.scale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    state.viewport.offsetX = (elements.canvas.width - state.project.metadata.width * state.viewport.scale) / 2;
    state.viewport.offsetY = (elements.canvas.height - state.project.metadata.height * state.viewport.scale) / 2;
    render();
  }

  function confirmLoseChanges() {
    return !state.isDirty || window.confirm("Discard unsaved changes?");
  }

  function resetEditorState({ preserveHandle = false } = {}) {
    state.history.undoStack = [];
    state.history.redoStack = [];
    state.selectedStampId = null;
    state.hoverPoint = null;
    state.drag.mode = null;
    state.drag.activeStrokeId = null;
    state.transactionSnapshot = null;
    state.isDirty = false;
    if (!preserveHandle) {
      state.projectHandle = null;
    }
  }

  function rebuildEditor() {
    syncFormWithProject();
    updateCustomImageCache();
    rebuildAssetPalette();
    render();
  }

  function createFreshPage() {
    if (!confirmLoseChanges()) {
      return;
    }

    const width = Math.max(800, Math.min(5000, Math.round(Number(elements.mapWidthInput.value) || 2400)));
    const height = Math.max(600, Math.min(4000, Math.round(Number(elements.mapHeightInput.value) || 1600)));
    const name = elements.mapNameInput.value.trim() || "Untitled Cavern";

    state.project = createProject({ width, height, name });
    state.project.metadata.showGrid = elements.showGridInput.checked;
    state.project.metadata.snapToGrid = elements.snapToGridInput.checked;
    resetEditorState();
    updateCustomImageCache();
    centerPage();
    rebuildEditor();
    setStatus("Started a fresh cave page.");
  }

  function undo() {
    if (!state.history.undoStack.length) {
      return;
    }

    const previous = state.history.undoStack.pop();
    state.history.redoStack.push(cloneProject(state.project));
    state.project = previous;
    state.selectedStampId = state.project.stamps.some((stamp) => stamp.id === state.selectedStampId) ? state.selectedStampId : null;
    state.transactionSnapshot = null;
    state.isDirty = true;
    updateCustomImageCache();
    syncFormWithProject();
    setStatus("Undo.");
    render();
  }

  function redo() {
    if (!state.history.redoStack.length) {
      return;
    }

    const next = state.history.redoStack.pop();
    state.history.undoStack.push(cloneProject(state.project));
    state.project = next;
    state.selectedStampId = state.project.stamps.some((stamp) => stamp.id === state.selectedStampId) ? state.selectedStampId : null;
    state.transactionSnapshot = null;
    state.isDirty = true;
    updateCustomImageCache();
    syncFormWithProject();
    setStatus("Redo.");
    render();
  }

  function appendPointToActiveStroke(point) {
    const stroke = state.project.strokes.find((entry) => entry.id === state.drag.activeStrokeId);
    if (!stroke) {
      return;
    }

    const clamped = clampToPage(point);
    const lastPoint = stroke.points[stroke.points.length - 1];
    const minDistance = Math.max(6, state.brushSize / 6);

    if (!lastPoint || distance(lastPoint, clamped) >= minDistance) {
      stroke.points.push(clamped);
      touchProject(state.project);
      state.isDirty = true;
      render();
    }
  }

  function beginPaint(point) {
    beginTransaction();
    const stroke = {
      id: makeId("stroke"),
      tool: state.selectedTool,
      floorVariant: state.selectedTool === "floor" ? state.floorVariant : "normal",
      size: state.brushSize,
      opacity: state.brushOpacity,
      mergeTouches: state.selectedTool === "erase" ? false : state.connectPaint,
      points: [clampToPage(point)]
    };

    state.project.strokes.push(stroke);
    state.drag.activeStrokeId = stroke.id;
    state.selectedStampId = null;
    touchProject(state.project);
    state.isDirty = true;
    render();
  }

  function placeDetail(point) {
    const asset = currentAssetSelection();
    if (!asset) {
      setStatus("Select or import a detail first.");
      return;
    }

    const placement = snapPoint(clampToPage(point));
    const size = asset.assetKind === "custom" ? asset.size : asset.size * (0.88 + Math.random() * 0.3);
    const rotation = asset.assetKind === "custom" ? 0 : (Math.random() - 0.5) * 0.6;

    applyMutation(`Placed ${asset.label}.`, (project) => {
      project.stamps.push({
        id: makeId("stamp"),
        assetKind: asset.assetKind,
        assetId: asset.assetId,
        x: placement.x,
        y: placement.y,
        size,
        rotation
      });
    });
  }

  function hitTestStamp(point) {
    for (let index = state.project.stamps.length - 1; index >= 0; index -= 1) {
      const stamp = state.project.stamps[index];
      if (distance(point, stamp) <= stamp.size * 0.58) {
        return stamp;
      }
    }
    return null;
  }

  function removeStampAtPoint(point) {
    const stamp = hitTestStamp(point);
    if (!stamp) {
      return;
    }

    applyMutation("Removed detail.", (project) => {
      project.stamps = project.stamps.filter((entry) => entry.id !== stamp.id);
    });

    if (state.selectedStampId === stamp.id) {
      state.selectedStampId = null;
    }
    render();
  }

  function removeCustomAsset(assetId) {
    const asset = state.project.customAssets.find((entry) => entry.id === assetId);
    if (!asset) {
      return;
    }

    const inUse = state.project.stamps.some((stamp) => stamp.assetKind === "custom" && stamp.assetId === assetId);
    if (inUse && !window.confirm(`"${asset.name}" is placed on the page. Remove the asset and all of its placements?`)) {
      return;
    }

    applyMutation(`Removed ${asset.name}.`, (project) => {
      project.customAssets = project.customAssets.filter((entry) => entry.id !== assetId);
      project.stamps = project.stamps.filter((stamp) => !(stamp.assetKind === "custom" && stamp.assetId === assetId));
    });

    if (state.selectedAssetKind === "custom" && state.selectedAssetId === assetId) {
      state.selectedAssetKind = "builtin";
      state.selectedAssetId = BUILTIN_ASSETS[0].id;
    }

    if (state.selectedStampId && !state.project.stamps.some((stamp) => stamp.id === state.selectedStampId)) {
      state.selectedStampId = null;
    }

    updateCustomImageCache();
    rebuildAssetPalette();
    render();
  }

  function handlePointerDown(event) {
    activateCanvas();
    const world = screenToWorld(event.clientX, event.clientY);
    state.hoverPoint = world;

    if (state.selectedTool === "pan" || event.button === 1 || spacePressed) {
      state.drag.mode = "pan";
      state.drag.startX = event.clientX;
      state.drag.startY = event.clientY;
      return;
    }

    if (!pointInPage(world)) {
      render();
      return;
    }

    if (SURFACE_BRUSH_TOOLS.has(state.selectedTool) && event.button === 0) {
      state.drag.mode = "paint";
      beginPaint(world);
      return;
    }

    if (state.selectedTool === "detail" && event.button === 0) {
      placeDetail(world);
      return;
    }

    if (state.selectedTool === "erase-detail" && event.button === 0) {
      removeStampAtPoint(world);
      return;
    }

    if (state.selectedTool === "select" && event.button === 0) {
      const stamp = hitTestStamp(world);
      state.selectedStampId = stamp?.id || null;
      if (stamp) {
        state.drag.mode = "move-stamp";
        beginTransaction();
        state.drag.stampPointerOffsetX = world.x - stamp.x;
        state.drag.stampPointerOffsetY = world.y - stamp.y;
        setStatus("Dragging detail.");
      }
      render();
    }
  }

  function handlePointerMove(event) {
    const world = screenToWorld(event.clientX, event.clientY);
    state.hoverPoint = world;

    if (state.drag.mode === "pan") {
      state.viewport.offsetX += event.clientX - state.drag.startX;
      state.viewport.offsetY += event.clientY - state.drag.startY;
      state.drag.startX = event.clientX;
      state.drag.startY = event.clientY;
      render();
      return;
    }

    if (state.drag.mode === "paint") {
      appendPointToActiveStroke(world);
      return;
    }

    if (state.drag.mode === "move-stamp") {
      const stamp = selectedStamp();
      if (!stamp) {
        cancelTransaction();
        state.drag.mode = null;
        return;
      }

      const nextPoint = snapPoint(
        clampToPage({
          x: world.x - state.drag.stampPointerOffsetX,
          y: world.y - state.drag.stampPointerOffsetY
        })
      );
      stamp.x = nextPoint.x;
      stamp.y = nextPoint.y;
      touchProject(state.project);
      state.isDirty = true;
      render();
      return;
    }

    render();
  }

  function handlePointerUp() {
    if (state.drag.mode === "paint") {
      const tool = TOOL_DEFS.find((entry) => entry.id === state.selectedTool);
      commitTransaction(`Painted ${tool?.label || "stroke"}.`);
    } else if (state.drag.mode === "move-stamp") {
      commitTransaction("Moved detail.");
    } else {
      cancelTransaction();
    }

    state.drag.mode = null;
    state.drag.activeStrokeId = null;
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
    const nextScale = Math.min(2.2, Math.max(0.2, state.viewport.scale * factor));

    state.viewport.scale = nextScale;
    state.viewport.offsetX = pointerX - worldX * nextScale;
    state.viewport.offsetY = pointerY - worldY * nextScale;
    render();
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
        imageCache: state.imageCache
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
      resetEditorState({ preserveHandle: true });
      updateCustomImageCache();
      syncFormWithProject();
      centerPage();
      rebuildEditor();
      setStatus(`Opened ${selection.file.name}.`);
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : "Opening the project failed.");
    }
  }

  async function importCustomAsset() {
    try {
      const file = await pickCustomSymbolFile(elements.assetFileInput);
      if (!file) {
        return;
      }

      const isSupported =
        file.type === "image/svg+xml" ||
        file.type === "image/png" ||
        file.name.toLowerCase().endsWith(".svg") ||
        file.name.toLowerCase().endsWith(".png");

      if (!isSupported) {
        setStatus("Only SVG and PNG details are supported.");
        return;
      }

      const assetData = await readFileAsDataUrl(file);
      const name = elements.customAssetNameInput.value.trim() || sanitizeFileStem(file.name);

      applyMutation(`Imported ${name}.`, (project) => {
        project.customAssets.push({
          id: makeId("asset"),
          name,
          assetData,
          assetType: file.name.toLowerCase().endsWith(".svg") ? "svg" : "png"
        });
      });

      const imported = state.project.customAssets[state.project.customAssets.length - 1];
      if (imported) {
        elements.customAssetNameInput.value = "";
        updateCustomImageCache();
        setActiveAsset("custom", imported.id);
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(error);
        setStatus("Importing the detail failed.");
      }
    }
  }

  function bindEvents() {
    window.addEventListener("resize", () => {
      if (activeMode) {
        resizeCanvas();
      }
    });

    elements.pagePresetSelect.addEventListener("change", () => {
      const preset = PAGE_PRESETS.find((entry) => entry.id === elements.pagePresetSelect.value);
      if (preset && preset.id !== "custom") {
        elements.mapWidthInput.value = String(preset.width);
        elements.mapHeightInput.value = String(preset.height);
      }
    });

    elements.mapWidthInput.addEventListener("input", updatePresetFromDimensions);
    elements.mapHeightInput.addEventListener("input", updatePresetFromDimensions);
    elements.mapNameInput.addEventListener("change", () => {
      state.project.metadata.name = elements.mapNameInput.value.trim() || "Untitled Cavern";
      touchProject(state.project);
      state.isDirty = true;
      render();
    });
    elements.applyPageButton.addEventListener("click", createFreshPage);
    elements.newMapButton.addEventListener("click", createFreshPage);
    elements.openProjectButton.addEventListener("click", openProject);
    elements.saveProjectButton.addEventListener("click", () => saveProject(false));
    elements.saveProjectAsButton.addEventListener("click", () => saveProject(true));
    elements.exportPngButton.addEventListener("click", exportPng);
    elements.importAssetButton.addEventListener("click", importCustomAsset);
    elements.panelImportAssetButton.addEventListener("click", importCustomAsset);
    elements.resetViewButton.addEventListener("click", () => {
      activateCanvas();
      centerPage();
      setStatus("View reset.");
    });
    elements.undoButton.addEventListener("click", undo);
    elements.redoButton.addEventListener("click", redo);

    elements.brushSizeInput.addEventListener("input", () => {
      state.brushSize = Number(elements.brushSizeInput.value);
      render();
    });

    elements.brushOpacityInput.addEventListener("input", () => {
      state.brushOpacity = Number(elements.brushOpacityInput.value) / 100;
      render();
    });

    elements.floorVariantSelect.addEventListener("change", () => {
      state.floorVariant = elements.floorVariantSelect.value;
      if (state.selectedTool === "floor") {
        setStatus(`Floor variant set to ${state.floorVariant}.`);
      }
      render();
    });

    elements.connectPaintInput.addEventListener("change", () => {
      state.connectPaint = elements.connectPaintInput.checked;
      setStatus(
        state.connectPaint
          ? "New brush marks will merge with touching strokes of the same type."
          : "New brush marks will keep their own visible edge."
      );
      render();
    });

    elements.showGridInput.addEventListener("change", () => {
      state.project.metadata.showGrid = elements.showGridInput.checked;
      touchProject(state.project);
      state.isDirty = true;
      render();
    });

    elements.snapToGridInput.addEventListener("change", () => {
      state.project.metadata.snapToGrid = elements.snapToGridInput.checked;
      touchProject(state.project);
      state.isDirty = true;
      render();
    });

    elements.canvas.addEventListener("pointerdown", handlePointerDown);
    elements.canvas.addEventListener("pointermove", handlePointerMove);
    elements.canvas.addEventListener("pointerleave", () => {
      state.hoverPoint = null;
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

      const target = event.target;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if (event.code === "Space") {
        spacePressed = true;
      }

      if (event.key === "Escape") {
        deactivateCanvas();
        setStatus("Canvas interaction disabled.");
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

      if (!isTypingTarget && (event.key === "Delete" || event.key === "Backspace") && selectedStamp()) {
        event.preventDefault();
        deleteSelectedStamp();
      }

      if (!isTypingTarget && event.key.toLowerCase() === "r" && selectedStamp()) {
        event.preventDefault();
        applyMutation("Rotated detail.", (project) => {
          const stamp = project.stamps.find((entry) => entry.id === state.selectedStampId);
          if (stamp) {
            stamp.rotation += Math.PI / 6;
          }
        });
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

  populatePresetOptions();
  populateToolPalette();
  rebuildUsageList();
  syncFormWithProject();
  rebuildAssetPalette();
  updateCustomImageCache();
  bindEvents();

  return {
    setActive
  };
}
