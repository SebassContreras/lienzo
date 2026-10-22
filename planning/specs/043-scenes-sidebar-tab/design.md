# 043 — scenes-sidebar-tab — Design

## Approach

- D1@1 (implements R1, R2, R5): New `src/editor/sidebar/project-scenes-tab.tsx` following `project-presets-tab.tsx`: props `projectSlug`, `scene`, `name`, `setName`, `onOpen`, `setStatus`; data through the existing `loadScenes`, `saveScene`, `renameStored`, `deleteStored` in `src/presets/store.ts`, re-fetched when `projectSlug` changes. Thumbnails via `drawScene` at t = 0 as `SceneFiles` does today.
- D2@1 (implements R3): A header row of actions in the tab: blank scene (`defaultScene()` keeping the mode), recover draft (`readAutosave`, 042/D3), demo (`demoScene()`).
- D3@1 (implements R4): Delete `src/presets/scene-files.tsx` and its top-bar usage, plus the Demo and blank-scene buttons in `app.tsx`; reusable list logic (parse, `freeSlug`, import/export) moves into the tab or a pure helper in `src/presets/`.
- D4@1 (implements R1): `sidebarTab` gains `"scenes"`; the tab button uses the lucide `Film` icon and the label "Escenas".

## Deliverables

- `src/editor/sidebar/project-scenes-tab.tsx` (new)
- `src/editor/app.tsx`: new tab, removed top-bar buttons
- `src/presets/scene-files.tsx`: deleted
