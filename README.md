# Cave Map Creator

Local browser map editor for tabletop world maps, square-grid cave maps, and freeform cave drafts. The app is a static frontend served by a small Node development server, with editable JSON project files and PNG export.

## Run

```powershell
npm.cmd start
```

Then open `http://localhost:4173`.

The app remembers the last selected editor mode in browser local storage.

## Editor Modes

### Grid Maps and Grid Caves

The grid editor supports two map types from one workspace:

- `World Hex Map`: pointy-top hex maps for regional terrain.
- `Cave Map`: square-grid tactical cave layouts.

Grid projects include map presets, custom dimensions up to `80 x 80`, editable map names, terrain painting, built-in markers, custom imported symbols, connection drawing, cell inspection, undo and redo, save and reopen, and PNG export.

World hex maps include:

- Terrain: `Plains`, `Forest`, `Mountains`, `Swamp`, `Lake`.
- Built-in features: `Village`, `Stronghold`, `City`, `Cave`, `Tower`, `Special Place`, `Camp`, `Quarry`, `Lumberjack's Camp`, `Well`.
- Routes: `River`, `Path`, `Track`.
- Exclusive settlement markers: `Village`, `Stronghold`, and `City` replace each other on the same hex.

Square-grid cave maps include:

- Terrain: `Solid Rock`, `Open Chamber`, `Underground Water`, `Lava`, `Mushroom Grove`, `Crystal Field`.
- Built-in elements: `Entrance`, `Exit`, `Treasure`, `Nest`, `Altar`, `Stalagmites`, `Rope Bridge`.
- Connections: `Tunnel`, `Underground Stream`, `Chasm`.
- Clear modes: `Void Cut` resets a tile, while `Wall Border` clears cave floor and adds wall edges around neighboring open tiles.
- Exclusive entrance markers: `Entrance` and `Exit` replace each other on the same tile.

The grid inspector can edit optional terrain and feature labels, remove built-in features, remove custom symbol placements, and reset a cell to the map type default terrain.

### Freeform Cave Draft

The freeform editor is a blank-page cave drawing workflow closer to a Dungeondraft-style sketch canvas. It uses page-size presets plus custom dimensions, five paint layers, placed details, canvas pan and zoom, editable save files, and PNG export.

Page presets:

- `Compact`: `1600 x 1000`
- `Adventure`: `2400 x 1600`
- `Atlas`: `3200 x 2000`
- `Epic`: `4000 x 2400`
- `Custom`: `800-5000` width and `600-4000` height

Freeform paint tools:

- `Floor`: paints walkable cave floor. Variants include `Normal`, `Raised`, `Lowered`, `Cracked Stone`, `Parent Rock`, and `Jagged Parent Rock`.
- `Floor Detail`: scatters pebbles, grit, and scratches, clipped to visible floor on the same layer.
- `Parent Rock`: paints cave background mass. Variants include smooth and jagged parent rock.
- `Water`: paints pools and streams. Variants include normal water and dark pool.
- `Lava`: paints magma. Variants include normal lava and molten vein.
- `Chasm`: paints cracks and voids. Variants include normal chasm and broken rift.
- `Rubber`: erases painted surfaces. Variants include `Void Cut` and `Wall Border`.

Freeform brush controls:

- Brush size range from `20` to `280`.
- Brush opacity range from `20%` to `100%`.
- Circle and square brush shapes.
- Detail size scale from `50%` to `180%` for the next placed detail.
- Merge Touching Brush Marks toggle for joining strokes of the same visible paint type.
- Show drafting grid toggle.
- Snap details to grid toggle.
- Shift-click with a paint tool draws a straight segment from the previous brush endpoint.
- Ctrl or Meta while straight-line painting locks the segment to 45-degree angles.

Freeform layer behavior:

- Five paint layers are available.
- `Layer 1` renders first and `Layer 5` renders on top.
- Paint and placed details use the selected active layer.
- Same-layer paint can merge into one continuous surface when Merge Touching Brush Marks is enabled.
- Rubber strokes affect paint on the active layer without deleting placed details.
- Water, lava, and chasm sit on top of carved floor and use visible-width masks so they do not remove floor borders outside their visible footprint.

Freeform built-in details:

- Structural wall pieces: `Stone Wall`, `Wall Corner`, `Wall T-Junction`, `Wall End`, `Wall Pillar`.
- Doors: `Wooden Door`, `Stone Door`.
- Encounter details: `Stalagmites`, `Crystals`, `Mushrooms`, `Small Rocks`, `Green Moss`, `Bones`, `Nest`, `Treasure`, `Entrance`.
- Bonfire variants: cold bonfire and lit bonfire.
- Lit bonfires add warm local light to nearby painted cave surfaces on the same layer.

Freeform detail editing:

- `Detail` places built-in or imported props on the active layer.
- Detail size changes the preview and the size used when the next detail is placed.
- `Select` lets placed details be selected and dragged.
- `Erase Detail` removes a detail with one click.
- Selected details can be duplicated, moved to the active layer, brought to front, sent backward, deleted, or rotated.
- Press `R` to rotate a selected detail by 30 degrees.
- Press `Delete` or `Backspace` to delete a selected detail.
- Wall pieces and doors can be rotated before placement with `Ctrl + mouse wheel`.
- Structural wall pieces and doors use the chosen detail size without random size variation.

## Shared Editing Features

- Canvas activation: click the canvas before keyboard and wheel shortcuts affect it.
- Pan: use the `Pan` tool, middle mouse drag, or hold `Space` and drag.
- Zoom: use the mouse wheel while the canvas is active.
- Reset View returns the canvas to its default framing.
- Undo and redo are available in both editors.
- Save writes editable JSON.
- Save As writes a new editable JSON file.
- Open validates and normalizes project data before loading it into editor state.
- Export PNG renders a presentation image.
- Imported `SVG` and `PNG` symbols/details are embedded into the project file as data URLs.

## File Formats

- World hex maps save as `.hexmap.json`.
- Square-grid cave maps save as `.cavemap.json`.
- Freeform cave drafts save as `.caveforge.json`.
- Freeform cave drafts support migration from older version 3 and 4 cave draft saves.
- Older version 2 grid-based cave projects are intentionally not loaded into the freeform cave draft editor.

## Project Structure

- `index.html` and `styles.css` define the app shell and shared styling.
- `server.mjs` serves the static app locally.
- `src/app.js` switches between the grid editor and freeform cave editor.
- `src/grid-editor.js` contains grid editor DOM interactions.
- `src/freeform-editor.js` contains freeform cave editor DOM interactions.
- `src/project.js` handles grid project creation, migration, validation, naming, and placement helpers.
- `src/cave-project.js` handles freeform cave project creation, migration, validation, naming, and paint layers.
- `src/hex.js` contains grid geometry, adjacency, bounds, and coordinate conversion helpers.
- `src/render.js` renders grid maps and grid PNG exports.
- `src/cave-render.js` renders freeform cave drafts and PNG exports.
- `src/io.js` contains browser file open, save, import, and export helpers.
- `src/constants.js`, `src/icons.js`, and `src/cave-assets.js` define built-in tools, terrain, markers, cave assets, and icons.
- `tests/` contains the Node test suite for pure logic modules.

## Development Quality

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run check
npm.cmd run test:coverage
```

Recommended development patterns for this repo:

- Keep geometry, project serialization, naming, and migration logic in small pure modules and test those directly.
- Run `npm.cmd run check` before committing so lint and tests fail together instead of drifting apart.
- Validate loaded project files before swapping them into editor state.
- Keep browser-only behavior inside the editor modules and keep reusable logic DOM-free where possible.
- Let `.editorconfig` enforce line endings, indentation, and trailing whitespace consistently across editors.
- Add a regression test when fixing a bug or changing a save-file format.

## Notes

- The app runs locally and does not require a backend database.
- Browser File System Access support depends on the browser; where unavailable, save and open behavior falls back through file downloads and file inputs.
- Imported image assets increase project file size because they are stored inside the saved JSON.
- Brush previews show the configured brush footprint. Some rendered tools, especially water, lava, and chasm, intentionally draw narrower visible strokes so they sit inside floor borders.
