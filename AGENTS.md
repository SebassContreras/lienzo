# Lienzo

Lienzo is a free-form canvas editor for animated social media posts: drag pre-made
components (cards, text, connecting lines) onto a canvas, edit them live, and export PNG,
GIF or MP4. Presets and scenes are JSON files. Type: local web app (React + Vite).

## Doc map

- `planning/product.md` — what this is, who it's for, out of scope.
- `planning/architecture.md` — project-wide decisions (A items).
- `planning/roadmap.md` — specs, order, status.
- `planning/specs/NNN-name/` — requirements (R), design (D), tasks, changes.
- `.spectrace/format.md` — how all of the above is written.

## Stack & conventions

What exists today:

- Single React 19 + Vite app at the repo root, TypeScript on Node 24 (A1, A8, A9)
- Everything is drawn with Canvas 2D by `drawScene(ctx, scene, t)`; preview = export (A3)
- Scene = plain JSON (A4); every component kind is one descriptor in `src/components/<kind>/`
  that declares its fields, defaults, inspector sections, draw function and animations; the
  element types, the Zod element schema, default elements, the inspector and the library's
  basic components are derived from the descriptors (A23)
- Time is applied only by `animate(el, t, scene)` (`src/engine/animate.ts`) before a component
  draws; components get the result as a transform (A24)
- Looping animations use whole cycles per loop (A6)
- Presets in `presets/`, and project workspaces in `projects/<slug>/` containing `project.json`,
  `scenes/`, `assets/`, `presets/`, and `exports/`; no database (A7, spec 040)
- The default workspace template is `projects/mi-proyecto/`, which is the only project tracked in Git
- Reusable styling = traits in `src/traits/`; presets are JSON recipes of traits (A19)
- Export: gifenc (GIF), Mediabunny (MP4/WebM), canvas (PNG) (A10)
- Icons: lucide-react / lucide (A11); fonts: `@fontsource/*` (A12); user fonts are files in git-ignored `fonts/`
  (global) and `projects/<slug>/fonts/`, named `Family-Weight.ext`, served at `/api/fonts`,
  loaded with `FontFace` by `src/engine/fonts.ts` in the editor and the `?render` route;
  Google Fonts only through `src/service/google-fonts.ts` (`font_install`) (A12@2, spec 045)
- pnpm only (A13); Biome + Vitest (A14); lint, typecheck and test run locally
- UI text in Spanish; code, comments and docs in English (A16)
- Conventional Commits (A17); MIT-compatible deps only (A18)
- Scenes and preset recipes are validated with Zod in `src/model/schema.ts` before any
  import is written
- Keyframes: `el.tracks` (optional) by field path or channel (`@rotate`, `@scale`); all
  evaluating and editing goes through `src/engine/tracks.ts`, applied by `animate` before
  the preset animation (spec 015)
- Image crop: non-destructive `crop` on image elements (fractions of the picture); trimming and
  cropping go through `alphaBounds`/`applyCrop` in `src/engine/image-trim.ts`, shared by the
  inspector, the stage crop mode and the `image_trim` tool (specs 048, 049)

- Element targets: tools resolve an `id` or `group/child` path at any depth; `element_add`
  takes a `parent` (spec 051)
- Tracks take `repeat: "loop" | "pingpong"` and `until`, evaluated in `src/engine/tracks.ts`
  (052); every element has `origin` (pivot, box fractions) and `opacity` (053); `text` takes
  a wrap width `w`, and Node-side text measurement uses real glyph metrics (054)
- Shots: `scene.shots` (cut windows, transitions, camera) and `el.shot` bindings; edited by
  `shot_set` (055). Symbols: `scene.symbols` drawn by the `use` kind with `overrides` (056)
- Compact extras: partial `effects`, `defaults: "flat"` (build time only), `audioTracks`;
  `notices` lists what was ignored and missing fonts (058, 060). Speech `asTrack: true`
  appends an `audioTracks` entry at `startOffset` (060)
- Editor gaps: shots, symbols, track `repeat`/`until` and `origin` have no editor controls yet
  (only the tools and JSON); the layers panel groups by shot
- How an agent builds a post or video with the tools: `.agents/skills/lienzo-usage/`

- Animation presets: JSON in `presets/animations/` (`/api/animations`) with times from 0 and
  offsets on `relative` fields; applying always copies; `animPreset` on an element is
  provenance only, and a scene naming one is expanded on load; pure logic in
  `src/presets/anim-presets.ts` (A26, spec 019)
- Descriptors also drive compact JSON (`src/model/compact.ts`, A23, spec 011); 3D = three.js
  in an offscreen WebGL canvas composited with `drawImage` (A25, spec 016)
- Tools: one registry in `src/service/` (007); logic lives only in tools, CLI and MCP are thin
  adapters (A20); names are `snake_case` noun_verb (`scene_export`). Every tool that reads or
  writes a scene, an asset or an export takes a required `project` and runs on
  `projects/<slug>/` (`inProject` in `src/service/project-scope.ts`, 046); only a
  `ProjectCtx` reaches scenes, so the compiler rejects scene access without a project.
  `pnpm lienzo <tool>` (`src/cli/`, 008) runs
  any of them under `tsx` — top-level scalar fields as flags, the rest in `--json` (inline,
  `--json @file` relative to where the command was typed, or `--json -` from stdin), result
  JSON on stdout, errors JSON on stderr with exit 1. Code
  the descriptors import must load in plain Node: no Vite-only imports (`?url`, `?raw`,
  `import.meta.glob`); static files go in `public/`
- MCP: `pnpm lienzo mcp` (`src/mcp/server.ts`, 009) serves every registry tool over stdio
  with `@modelcontextprotocol/sdk`; generic, no per-tool code; stdout is the protocol only;
  a result shaped like `ImageResult` (`src/service/image.ts`) goes out as image content
- Headless export (010): `scene_export` / `scene_preview` render through `ctx.renderer`
  (`src/service/renderer.ts`): an in-process Vite server + Playwright (`playwright-core`;
  Chrome, else Edge, else Playwright's Chromium) on the `?render` route
  (`src/export/render-page.ts`), which calls the editor's own `exportScene`. Started on the
  first render, reused within a process, closed by `ctx.dispose()` — the CLI disposes after
  every command, the MCP server when stdin ends. Tests pass `fakeRenderer()` unless they
  need a real browser (`renderer.test.ts`, skipped when none is installed). `scene_export`
  writes only inside `projects/<slug>/exports/`
- Speech (TTS): adapters in `src/service/tts/` (OpenRouter, local Kokoro-compatible server);
  env variables (`.env.example`) are read in Node only. The editor reaches OpenRouter through
  the dev server's `/api/tts/speech` (`src/service/tts-proxy.ts`), which adds the key, so no
  `OPENROUTER_*` value reaches the browser or `dist/` (046). A key the user types in the TTS
  dialog is the one exception: it is kept in the browser's TTS preferences (`localStorage`,
  `src/service/tts/preferences.ts`) and sent straight to OpenRouter, bypassing the proxy (061)

## Layout

```
src/model/       scene and background types, size presets, fonts; Zod schemas (schema.ts,
                 element-schema.ts generated from the descriptors)
src/animations/  the animation registry, one file per family (entrances, attention, emphasis,
                 text): pure functions of progress; exits replay entrances backwards
src/engine/      drawScene, animate, keyframe tracks, painting helpers, animation state,
                 geometry, particle field; audio/ = audio tracks and timing; subtitles/ =
                 cue layout and word windows; path/ = free-path geometry
src/components/  index.ts = the registry; descriptor.ts = the descriptor type; fields/ = field
                 builders and shared field groups (box, fill, stroke, glow, shadow, label, anim);
                 <kind>/descriptor.ts + <kind>/draw.ts per element kind (the kinds are the
                 ones registered in index.ts)
src/editor/      React UI: app shell, stage, library, background library, animation library
                 (anim-library.tsx), inspector (the
                 element inspector is generated: layout.ts + field-editor.tsx; keyframe
                 buttons in keyframe-controls.tsx; timeline/ = the keyframe tracks panel;
                 sidebar/ = the project tabs: Escenas, assets, presets; brand/ = brand guide
                 managers; dialogs/ = modal dialogs (TTS, brand); footer/ = editor footer;
                 widgets/ = custom field widgets; joint/ = joint mode)
src/export/      PNG / GIF / MP4
src/traits/      reusable style pieces, one file per trait
src/presets/     recipe resolver, recipe diff, JSON store (server side: json-store.ts; client:
                 store.ts), categories and filter, JSON import/export helpers,
                 animation presets (anim-presets.ts: capture, apply, stagger, expand on load)
src/service/     tool registry, ctx, Node store, project scope, headless renderer (010), dev
                 server middlewares (projects, fonts, TTS proxy); tools/ = one file per tool
                 (007); tts/ = speech adapters; compact/ = compact scene expansion (011)
src/cli/         `pnpm lienzo`: args (flags/--json → input), help, main (008); build.ts
                 bundles dist/cli.js
src/mcp/         `pnpm lienzo mcp`: the stdio MCP server over the registry (009)
src/test/        golden render tests, fixtures and test helpers
src/types/       type declarations for packages that ship none
docs/            reference docs (components.md: every component kind)
presets/built-in/  built-in preset recipes (JSON); user presets sit next to it in presets/
presets/animations/  animation presets (JSON)
projects/        project workspaces (e.g. projects/mi-proyecto/ containing scenes/, assets/, presets/, exports/)
```

## Rules for agents

- **Project Boundary & Isolation (Strict Boundary)**: All scenes, generated speech audio, images,
  and exports MUST be saved within the target project (`projects/<slug>/`). Never write scenes,
  assets or exports to the repository root. Every scene, asset and export tool requires
  `project`; there is no default project (`project_list` lists the slugs).
  NEVER borrow or mix assets between different projects; foreign asset references are strictly prohibited.
- To add a component: add a descriptor folder `src/components/<kind>/` with `descriptor.ts`
  (fields built from `src/components/fields/`, composing the shared groups; sections; the
  animations it offers; label and library icon; `defineComponent`) and `draw.ts` (draws the
  element with the transform `animate` gives it), then register it in
  `src/components/index.ts` (import, `COMPONENTS`, `RegisteredElement`). Nothing else: type,
  defaults, schema, inspector and library entry follow. A control the field types don't
  cover is a `custom` field or a `widget` with a renderer in `WIDGETS`
  (`src/editor/field-editor.tsx`). Optionally, an `apply.<kind>` in traits that should style
  it and a built-in preset recipe with a `category`.
- To add a preset: a JSON recipe in `presets/built-in/` combining traits; add a trait in
  `src/traits/` only when no existing one fits.
- Never draw with wall-clock time: everything takes `t` (seconds within the loop) so exports
  are deterministic.
- Minimal testing (KISS / YAGNI): test pure domain logic, mathematical timing, transformations,
  and contract boundaries. Do not write redundant micro-tests for every Zod field or heavy E2E tests
  when pure unit tests suffice; keep the full suite fast and run single files while working. Do not run micro-tests
  repeatedly on intermediate tasks when a dedicated test task exists at the end of the spec.
- Fast execution & verification: use `pnpm typecheck` (single-pass TypeScript check) to confirm
  correctness. Never run full-project `pnpm lint` or `biome check` on the whole repo during a task;
  only check/format the specific files or folders touched to preserve token budget and speed.
- Use pnpm, never npm or yarn.

## Working on tasks

Specs live in `planning/`; how they are written is in `.spectrace/format.md`. Run the
trace with `python3` (`python` on Windows).

1. `python3 .spectrace/trace.py status` — pick the `next` task, or the one you were asked for. Skip `[human]` tasks; tell the user they are theirs.
2. `python3 .spectrace/trace.py start NNN/TNNN` — before editing anything. If it lists files changed outside any task, ask the user whether to `--adopt` or `--ignore` them.
3. Read the spec's `requirements.md` and `design.md`; do only that task, following `planning/architecture.md`.
4. Verify it against the task text and the R items it covers.
5. `python3 .spectrace/trace.py done NNN/TNNN` — records exactly what changed. Stuck? `block NNN/TNNN "reason"`.
6. Before saying you're finished: `python3 .spectrace/trace.py check` must exit 0.

Never edit by hand: a task's status or `changes:` line, the roadmap's `Status`/`Stage`
(the trace owns them), or the meaning of an R, D or A item (the `spectrace-change` skill does it,
so the history and the trace stay right). One commit per task is welcome but optional;
if you commit, add a `Spec: NNN/TNNN` trailer.
