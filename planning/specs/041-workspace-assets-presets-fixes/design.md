# 041 — workspace-assets-presets-fixes — Design

## Approach

- D1@1 (implements R1): Default workspace to "mi-proyecto" on startup. In `App`, initialize `activeProjectSlug` to `"mi-proyecto"` and trigger brand loading on initial mount.
- D2@2 (implements R2): Scope scene autosave and active session state by project slug (`lienzo-scene:${slug}`). Switching projects persists the current workspace scene and loads the target workspace's scene (or empty/default scene if new), preventing cross-project scene pollution.
- D3@3 (implements R3): Expose project assets inside a new sidebar tab ("Recursos") and implement native HTML5 Drag & Drop onto the canvas (`stage.tsx`) that instantiates an `image` element with the asset's project URL.
- D4@4 (implements R4): Add a dedicated "Presets del Proyecto" tab in the sidebar alongside "Biblioteca", "Capas" and "Recursos". Mount `/api/projects/:slug/presets` endpoint in `project-middleware.ts` using `handleStore` on `projects/<slug>/presets/`, and provide "Guardar preset en proyecto" using the project's active brand palette.

## Deliverables

- `src/service/project-middleware.ts`: Add handler for `/api/projects/<slug>/presets` (GET, POST, DELETE, /rename).
- `src/service/project-middleware.test.ts`: Integration tests for project presets endpoint.
- `src/presets/store.ts`: Add `loadProjectPresets`, `saveProjectPreset`, `deleteProjectPreset`.
- `src/editor/app.tsx`: Default to `"mi-proyecto"`, project-scoped autosave, and sidebar tab navigation (Biblioteca, Capas, Recursos, Presets).
- `src/editor/sidebar/project-assets-tab.tsx`: Component displaying uploaded project assets with drag handlers.
- `src/editor/sidebar/project-presets-tab.tsx`: Component displaying project-specific presets with save/delete controls.
- `src/editor/stage.tsx`: Support dropping project assets (MIME `application/x-lienzo-asset`) to instantiate image elements.
