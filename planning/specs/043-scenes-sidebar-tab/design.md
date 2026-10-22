# 043 — scenes-sidebar-tab — Design

## Approach

- D1@2 (implements R1, R2, R5): New `src/editor/sidebar/project-scenes-tab.tsx` following `project-presets-tab.tsx`: props `projectSlug`, `scene`, `name`, `setName`, `onOpen`, `setStatus`; data through the existing `loadScenes`, `saveScene`, `renameStored`, `deleteStored` in `src/presets/store.ts`, re-fetched when `projectSlug` changes. Thumbnails via `drawScene` at `min(1.5, duration)` as `SceneFiles` does today (t = 0 hides elements with an entry animation, 003).
- D2@1 (implements R3): A header row of actions in the tab: blank scene (`defaultScene()` keeping the mode), recover draft (`readAutosave`, 042/D3). No demo.
- D3@2 (implements R4): Delete the `SceneFiles` modal component and its top-bar usage, plus the blank-scene button (the Demo button goes with 042/D4). The non-UI logic (parse stored items into scenes or errors, pick a free name) moves to pure functions in `src/presets/scene-list.ts`; the tab only renders and calls them.
- D4@1 (implements R1): `sidebarTab` gains `"scenes"`; the tab button uses the lucide `Film` icon and the label "Escenas".

## Deliverables

- `src/editor/sidebar/project-scenes-tab.tsx` (new)
- `src/editor/app.tsx`: new tab, removed top-bar buttons
- the `SceneFiles` modal component: deleted

## Trade-offs

- Sidebar tab instead of a modal (D1). Pros: one place for everything in a project, no modal hiding the canvas. Cons: less room for thumbnails. Mitigation: a compact list with small thumbnails, the same layout as the Presets tab.
- Pure `scene-list.ts` (D3). Pros: the logic is tested without React. Cons: one more file. Mitigation: it holds only what the tab would otherwise inline.
