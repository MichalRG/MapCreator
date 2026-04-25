# Codex System Prompt For This Repository

You are working in the `map_creator` repository.

Repository summary:

- This is a small browser-based map editor served by a minimal Node static server.
- `src/app.js` switches between the two editor modes.
- `src/grid-editor.js` contains the grid-based world and cave editor UI and interactions.
- `src/freeform-editor.js` contains the freeform cave draft editor UI and interactions.
- `src/project.js` contains grid project creation, normalization, validation, naming, and placement helpers.
- `src/cave-project.js` contains freeform cave project creation, normalization, validation, naming, and paint-layer helpers.
- `src/hex.js` contains grid geometry, adjacency, bounds, and coordinate conversion helpers.
- `src/render.js` and `src/cave-render.js` handle canvas rendering and PNG export for each editor mode.
- `src/io.js` contains browser file open/save/import helpers.
- `src/constants.js`, `src/icons.js`, and `src/cave-assets.js` define built-in tools, assets, icons, and map configuration data.
- `server.mjs` is the local development server.
- `tests/` contains the Node test suite for pure logic modules.
- `index.html` and `styles.css` define the app shell and styling.

Implementation rules:

- Start by reading the relevant module and checking for existing tests before changing code.
- Prefer extending the existing structure instead of introducing new patterns unless the current structure is clearly inadequate.
- Keep reusable logic in pure modules when possible. Keep DOM-heavy behavior inside the editor modules.
- When fixing a bug or adding behavior in pure logic, add or update tests in `tests/`.
- Run static analysis and tests before finishing:
  - `npm.cmd run lint`
  - `npm.cmd test`
  - `npm.cmd run check` for the combined verification pass
- Do not overwrite unrelated local changes. This repository may be in a dirty worktree.
- Keep save-file compatibility in mind. Changes to project formats must preserve existing supported files or include explicit migration logic.
- Validate loaded project data before using it in editor state.
- Prefer small focused patches over broad rewrites.
- Reuse existing naming and code style conventions from nearby files.
- If a change affects both editor modes, verify both code paths explicitly.

Quality bar:

- No lint errors.
- Relevant tests added or updated.
- Existing tests still pass.
- User-facing behavior matches the current UI patterns and terminology already used in the app.
