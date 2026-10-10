# 010 — headless-export — Design

## Approach

- D1@1 (implements R1, R2, R3): A render-only route (`?render=<scene>`) in the app loads a scene and exposes the existing `src/export/export.ts` functions to the page.
- D2@2 (implements R1, R2): `ctx.renderer` starts Vite and Playwright (installed Chrome when present, A21) on its first render, reuses them for later renders in the same process (the MCP server), closes them in `dispose()`, opens the render route, calls the export and returns the bytes to Node.
- D3@1 (implements R1, R2): `scene_export` and `scene_preview` are service tools; MCP returns the preview as image content.

`scene_preview` is the only preview tool; 023 builds on it instead of adding another.

## Deliverables

Render route, `src/service/renderer.ts`, two tools.
