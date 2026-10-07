# 001 — editor-base — Design

## Approach

- D1@1 (implements R11): Root project: `package.json` (scripts `dev`, `typecheck`, `lint`, `format`, `test`), `tsconfig.json`, `biome.json`, `vite.config.ts`, `index.html`, `.gitignore`, and `.github/workflows/ci.yml` running lint, typecheck and test with the Node version from `.nvmrc`.
- D2@1 (implements R1, R4, R5, R6, R7): `src/model/model.ts` holds the scene types (`Scene`, `RectEl`, `TextEl`, `LineEl`, `Anim`, `Glow`, `Shadow`, `Fill`), size presets, font list, animation lists per element kind, and `default*()` factories; elements carry a random id and a display name.
- D3@1 (implements R1, R4, R5, R6, R7): `src/engine/` holds `render.ts` (`drawScene`: background, then elements in order), `paint.ts` (color, gradient, shadow-only glow, dash patterns, animation transform), `anim.ts` (`animState(anim, t, duration)` → offset, scale, alpha, glow multiplier, progress) and `geometry.ts` (text layout, bounding boxes, line resolution with attachments, quadratic curve sampling, hit testing); `src/components/{rect,text,line}.ts` each export the draw function of one element kind.
- D4@1 (implements R6): A line end with `attach: <id>` is resolved at draw time to the point where the ray from the target's center towards the curve's control point leaves the target's box, pushed out by a small gap; the curve is a quadratic Bézier whose control point is offset perpendicular to the chord by `bend`.
- D5@1 (implements R7): Glows and shadows paint only the shape's shadow (the shape drawn far off-canvas with a compensating shadow offset), so their strength does not depend on the fill opacity; loop phase is `(t − delay) / duration × cycles`, and entry animations last 0.8 s.
- D6@1 (implements R2, R3): `src/editor/stage.tsx` draws the scene every animation frame plus a selection overlay (box, corner handles, line end and bend handles, attach-target highlight) and handles pointer input; `src/editor/library.tsx` lists items with canvas thumbnails and starts HTML drag-and-drop carrying the element JSON; `src/editor/app.tsx` owns the scene state, undo/redo stacks (a checkpoint before each interaction), keyboard shortcuts, top bar and timeline.
- D7@1 (implements R1, R4, R5, R6, R7): `src/editor/inspector.tsx` renders per-kind property sections (slider + number, color + hex, checkbox, select, textarea) and the scene panel when nothing is selected.
- D8@1 (implements R8): `src/export/export.ts` renders frames into an `OffscreenCanvas` with `drawScene` after `document.fonts.ready`; GIF uses gifenc with a per-frame 256-color palette at up to 25 fps; video uses Mediabunny `CanvasSource` (H.264 MP4 when `canEncodeVideo('avc')`, else VP9 WebM); sizes are rounded to even numbers.
- D9@2 (implements R9): `vite.config.ts` registers a dev-server middleware: `GET /api/{presets,scenes}` returns `[{ name, data }]` from the JSON files in that folder, `POST /api/{kind}?name=x` writes `<kind>/<slug>.json`; `src/presets/store.ts` wraps these calls and `src/presets/recipes.ts` loads the pre-made presets (JSON recipes, 004); the scene autosaves to `localStorage` under `lienzo-scene`.
- D10@1 (implements R10): `src/demo.ts` builds the MCP demo scene from the default factories and built-in presets, with lines attached to the cards.
- D11@1 (implements R11): Vitest unit tests cover `animState` (loops are periodic over the scene duration, entries end fully visible), curve sampling and line attachment geometry, and the JSON store path slugging.

## Deliverables

Root config files, `src/{model,engine,components,editor,export,presets}/`, `src/demo.ts`,
`src/main.tsx`, `src/styles.css`, `presets/`, `scenes/`, CI workflow.

## Sequencing

Project setup → model and engine → components → editor → export → presets and scenes →
demo → tests and CI.
