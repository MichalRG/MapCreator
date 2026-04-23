import { mountFreeformEditor } from "./freeform-editor.js";
import { mountGridEditor } from "./grid-editor.js";

const STORAGE_KEY = "map-creator-editor-mode";

const elements = {
  modeSelect: document.querySelector("#editor-mode-select"),
  gridRoot: document.querySelector("#grid-mode-root"),
  freeformRoot: document.querySelector("#freeform-mode-root")
};

const gridEditor = mountGridEditor(elements.gridRoot);
const freeformEditor = mountFreeformEditor(elements.freeformRoot);

function applyMode(mode) {
  const normalized = mode === "freeform-cave" ? "freeform-cave" : "grid";
  const gridActive = normalized === "grid";

  elements.modeSelect.value = normalized;
  elements.gridRoot.classList.toggle("hidden", !gridActive);
  elements.freeformRoot.classList.toggle("hidden", gridActive);

  gridEditor.setActive(gridActive);
  freeformEditor.setActive(!gridActive);

  try {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // Ignore storage access failures.
  }
}

function getInitialMode() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "grid" || stored === "freeform-cave") {
      return stored;
    }
  } catch {
    // Ignore storage access failures.
  }

  return "grid";
}

elements.modeSelect.addEventListener("change", () => {
  applyMode(elements.modeSelect.value);
});

applyMode(getInitialMode());
