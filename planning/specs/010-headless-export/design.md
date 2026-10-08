# 010 — headless-export — Design

## Approach

- D1@1 (implements R1, R2, R3): A render-only route (`?render=<scene>`) in the app loads a scene and exposes the existing `src/export/export.ts` functions to the page.
- D2@1 (implements R1, R2): `ctx.renderer` starts Vite and opens that route in Playwright (installed Chrome when present, A21), calls the export and returns the bytes to Node.
- D3@1 (implements R1, R2): `scene.export` and `scene.preview` are service tools; MCP returns the preview as image content.

## Deliverables

Render route, `src/service/renderer.ts`, two tools.
