# 041 — workspace-assets-presets-fixes — Requirements

Resolve workspace startup defaults, workspace-scoped scene autosave persistence, and project resources/presets access in the web editor sidebar.

- R1@1: On startup, the web editor initializes into the default project workspace `mi-proyecto` instead of `(Sin proyecto - global)`, loading its brand palette and project settings automatically.
- R2@1: Scene autosave and active session state are scoped per project workspace (`lienzo-scene:${slug}`). Switching workspaces cleanly isolates scenes, preventing cross-project contamination of canvas state.
- R3@1: A dedicated "Recursos" (Assets) tab in the left sidebar lists all uploaded assets in `projects/<slug>/assets/` and enables native drag-and-drop directly onto the canvas to insert elements (e.g. `image`).
- R4@1: A dedicated "Presets" tab in the left sidebar displays project-scoped presets stored in `projects/<slug>/presets/`, supporting saving selected canvas elements with the project brand palette, and `/api/projects/:slug/presets` backend endpoint.
