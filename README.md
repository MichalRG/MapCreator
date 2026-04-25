# Cave Map Creator

Local browser app with two editor modes:

- `Grid Maps + Grid Caves` for the original tile-based world and cave workflow
- `Freeform Cave Draft` for blank-page cave drawing closer to a Dungeondraft-style workflow

## Run

```powershell
npm.cmd start
```

Then open `http://localhost:4173`.

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

## Features

- Two editor modes: grid-based world or cave maps, plus a freeform cave draft workflow
- Grid mode supports terrain painting, built-in features, route or connection drawing, custom symbols, save or load, undo or redo, and PNG export
- Freeform cave mode supports `Floor`, `Wall`, `Water`, `Lava`, `Chasm`, and `Rubber` brushes across 5 paint layers
- Freeform cave mode includes brush variants, `Circle` or `Square` brush shapes, merge-touching paint, and same-layer repaint after erase
- Freeform cave mode includes built-in encounter details such as stalagmites, crystals, mushrooms, nests, bonfires, treasure, entrances, wall pieces, and doors
- Lit bonfires add a local warm glow to nearby painted cave surfaces on the same layer
- Freeform cave details follow the selected layer and can be selected, moved, rotated, duplicated, reordered, or deleted
- Custom detail import from local `SVG` or `PNG`
- Pan and zoom canvas navigation in both modes
- Save and reopen editable projects for both modes
- Export presentation PNGs

## Notes

- This is a static web app served by the included Node server.
- Freeform cave projects save as `.caveforge.json`.
- Grid projects keep the existing `.hexmap.json` and `.cavemap.json` formats.
- Older version 2 grid-based cave projects are intentionally not loaded into the freeform editor mode.
- Imported detail images are embedded into the saved project file as data URLs.
