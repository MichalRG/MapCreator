# Map Creator

Local hex map editor that runs in the browser with a small Node static server.

## Run

```powershell
npm.cmd start
```

Then open `http://localhost:4173`.

## Features

- Pointy-top hex maps with preset sizes and custom dimensions
- Terrain painting for plains, forest, mountains, and swamp
- Built-in overlays for village, stronghold, city, cave, tower, and special place
- Edge features for rivers, paths, and tracks
- Custom symbol import from local SVG or PNG files
- Undo/redo
- Project save/load as `.hexmap.json`
- PNG export

## Notes

- The environment here does not include Rust, so this implementation ships as a local web app instead of a Tauri desktop wrapper.
- Custom symbols are stored inside the project file as data URLs, so reopening a project does not depend on the original image path.
