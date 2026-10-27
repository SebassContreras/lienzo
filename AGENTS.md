# Lienzo

Lienzo is a free-form canvas editor for animated social media posts: drag pre-made
components (cards, text, connecting lines) onto a canvas, edit them live, and export PNG,
GIF or MP4. Presets and scenes are JSON files. Type: local web app (React + Vite).

## Doc map

- `planning/product.md` — what this is, who it's for, out of scope.
- `planning/architecture.md` — project-wide decisions (A items).
- `planning/roadmap.md` — specs, order, status.
- `planning/specs/NNN-name.md` — one file per spec: goal, requirements (R), design (D), tasks, changes.

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
- Presets in `presets/`, and project workspaces in `projects/<project>/` containing `project.json`,
  `scenes/`, `assets/`, `presets/`, and `exports/`; no database (A7, spec 040)
- The default workspace template is `projects/mi-proyecto/`, which is the only project tracked in Git
- Reusable styling = traits in `src/traits/`; presets are JSON recipes of traits (A19)
- Export: gifenc (GIF), Mediabunny (MP4/WebM), canvas (PNG) (A10); Mediabunny and its AAC encoder are
  dynamic imports, loaded only by a video export (066)
- Icons: lucide-react / lucide (A11); the lucide set drawn on the canvas (`src/engine/icon-set.ts`) loads
  on demand through `iconSet` in `icon-shapes.ts` (066); on-demand imports use `lazyModule`
  (`src/engine/lazy-module.ts`); fonts: `@fontsource/*` (A12); user fonts are files in git-ignored `fonts/`
  (global) and `projects/<project>/fonts/`, named `Family-Weight.ext`, served at `/api/fonts`,
  loaded with `FontFace` by `src/engine/fonts.ts` in the editor and the `?render` route;
  Google Fonts only through `src/service/google-fonts.ts` (`font_install`) (A12, spec 045)
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
- Tool/editor parity (062): every editor save has a tool (`scene_update` with JSON Merge
  Patch, `scene_rename`/`scene_delete`, `preset_save`/`_rename`/`_delete`, `animation_list`/
  `_save`, `project_update`, `asset_add`, `element_group`/`_ungroup`), built on the editor's
  own helpers; the editor's "Revisión" section calls `inspectLayout` in the browser
- Shot rendering (063): each shot-bound top-level element is drawn through `withShotView`
  (`src/engine/shots.ts`): its own shot's transition (`shotTransitionAt`) and camera, once;
  elements with no `shot` never move. Unknown input keys become notices (`ignoredPaths`, in
  the tool registry and `sceneNotices`); `asset_rename`/`asset_delete` share
  `src/service/project-assets.ts` with the assets tab
- Compact extras: partial `effects`, `defaults: "flat"` (build time only), `audioTracks`;
  `notices` lists what was ignored and missing fonts (058, 060). Speech `asTrack: true`
  appends an `audioTracks` entry at `startOffset` (060)
- Editor controls for these (062): shots in `src/editor/scene/shots-section.tsx` and
  symbols in `scene/symbols-section.tsx`, both over pure helpers shared with the tools
  (`src/model/shots.ts`, `src/model/symbols.ts`); symbol editing swaps the stage to a
  temporary scene and is never autosaved; `origin` in `widgets/origin-picker.tsx`
- Tool feedback fixes (067): radial fills on ellipses, polygons and stars reach the shape's
  edge (`reach` in `fillGradient`); layout boxes are the on-screen ones (`shotBox`); ignored
  keys suggest a field (`closestKey`); canvas fonts fall back to Inter; installed fonts are
  measured (`measureInstalledFonts`) and `font_install` stores ttf (opentype.js reads no woff2)
- QA fixes (068): gradient `stops` must be ordered; a kind-built element whose input gives a
  fill only `color` is flat and a group given `w`/`h` gets `cw`/`ch` from them (`applyImplied`,
  `src/service/compact/implied.ts`); `element_add` honors `patch.id` and notices an element off
  the canvas; `at` positions and layout boxes are rounded (`round2`); `scene_create` fills a
  partial `background`
- QA suite fixes (069): colors are CSS colors (`ColorSchema`, `src/model/color.ts`) and the
  scene schema checks keyframe values against their field (`keyframeError`); every scene write
  appends `resourceNotices` (`src/service/scene-resources.ts`: unknown icons, missing assets,
  loose line ends); `asset_add` and image `aspect` read picture headers
  (`src/service/image-header.ts`, `image-aspect.ts`); edge anchors keep a 5% margin
  (`anchorMargin`) and unplaced compact elements are centred; shots are checked by
  `shotProblem` and unbound by `unbindShot` (`src/model/shots.ts`); animation tools take an
  optional `project` (`animationsDir`) and `animation_delete` exists
- QA round 3 (071): `translate`/`placeChild` carry `x`/`y` (and size) tracks, so grouping
  keeps motion; `saveScene(…, previous)` reports resource notices only for changed elements;
  `scene_inspect_layout` has `shape_overlap`; a new counter gets a count-up `progress` track
  (`src/components/counter/count-up.ts`); the local TTS adapter checks the voice against
  `GET /v1/audio/voices` first
- How an agent builds a post or video with the tools: `.agents/skills/lienzo-usage/`

- Animation presets: JSON in `presets/animations/` (`/api/animations`) with times from 0 and
  offsets on `relative` fields; applying always copies; `animPreset` on an element is
  provenance only, and a scene naming one is expanded on load; pure logic in
  `src/presets/anim-presets.ts` (A26, spec 019)
- Descriptors also drive compact JSON (`src/model/compact.ts`, A23, spec 011); 3D = three.js
  in an offscreen WebGL canvas composited with `drawImage` (A25, spec 016); three.js loads on
  demand through `src/components/three/lazy.ts` and a descriptor's `load`, which
  `loadSceneAssets` awaits before an export (066)
- Tool parameter names (064/R13, R14): one name per meaning in every input and result —
  `project` (never `slug`), `scene` (a saved scene's name), `data` (a whole scene object),
  `recipe` (a preset object), `patch` (values merged in), `id` (an element), `at` (placement)
- Tools: one registry in `src/service/` (007); logic lives only in tools, CLI and MCP are thin
  adapters (A20); names are `snake_case` noun_verb (`scene_export`). Every tool that reads or
  writes a scene, an asset or an export takes a required `project` and runs on
  `projects/<project>/` (`inProject` in `src/service/project-scope.ts`, 046); only a
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
  writes only inside `projects/<project>/exports/`
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
  and exports MUST be saved within the target project (`projects/<project>/`). Never write scenes,
  assets or exports to the repository root. Every scene, asset and export tool requires
  `project`; there is no default project (`project_list` lists them by `project`).
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
- Before a QA run of the MCP tools, restart the MCP server after pulling: it runs the code
  it started with, and a stale server reports fixed bugs as open (071).

<!-- spectrace -->
## Planning

Work is planned in `planning/`:

```
planning/product.md      what this is, who it's for, stack, how to run and test, docs
planning/roadmap.md      specs in order, their status, and a free "Ideas" list
planning/specs/NNN-name.md  one file per spec
```

A spec file:

```markdown
# 003 — login

## Goal
What should work when this spec is done, and how we'll know.

## Requirements
- R1: A user signs in with email and password.

## Design
- ~~D1 (R1): Sessions live in localStorage.~~ → D2
- D2 (R1): Sessions live in an httpOnly cookie.

## Tasks
- [x] 003/T001 [agent] Login form — covers R1
- [ ] 003/T002 [agent] Session cookie middleware — covers D2
- [ ] 003/T003 [agent] Remove the localStorage session code — replaces D1
- [ ] 003/T004 [human] Create the mail provider account — covers R1
      blocked: waiting for billing approval

## Changes
- 2026-10-12: D1 → D2. Why: localStorage is readable by any script. Work: T003.
```

- `R`/`D` labels are never reused; a replaced item stays, struck through, with `→`.
- A task ends with `— covers` and the R or D items it implements, comma-separated
  (`covers R2, D3`); a cleanup task ends with `— replaces D1` (or
  `— covers D3; replaces D1`). Items of another spec are written `006/D1`, both
  after `→` and in `covers`/`replaces`.
- `[agent]`: any agent does it. `[human]`: the user does it; agents report and skip it.
- `## Changes` appears with the first change.
- **Docs are deliverables.** `product.md` → `## Docs` lists the docs the project keeps
  and what each describes. A doc changes inside the task whose work it describes, so
  `git blame` on any doc line leads to a commit, its `Spec:` and the decision behind it.
- A task whose text starts with `Review:` is closed only with an indented
  `reviewed: <files read> — found <what>` line under it. Anything it finds becomes a
  new task placed before it.
- A task whose text starts with `Verify:` checks something (tests, a build, the app
  in a browser) without changing files; it is closed only with an indented
  `verified: <commands run, what was checked> — found <what>` line under it.
- Roadmap table: `| ID | Spec | Status | Depends on |`. `Spec` is the name after
  `NNN-`; `Depends on` is `—` or spec IDs separated by commas. `Status` (`todo`,
  `in progress`, `done`) is written by the git hook from the `[agent]` checkboxes —
  never by hand.

## Working on tasks

Git hooks in `.githooks/` keep this honest: they write the roadmap `Status`, refuse a
commit whose `Spec:` task isn't ticked or that ticks an `[agent]` task without any work,
and refuse a ticked `Review:` or `Verify:` task without its `reviewed:`/`verified:` note.
Work is any change outside `planning/`, `.githooks/` and `.gitattributes`, including
`AGENTS.md` lines outside the spectrace block (the project's own conventions are docs);
a `Review:` or `Verify:` task needs none.
Never bypass them (`--no-verify`); when one refuses, fix what it says.

1. `git pull` and `git status`. If `git config core.hooksPath` isn't `.githooks`, run
   `git config core.hooksPath .githooks`; if `.githooks/` itself is missing, tell the
   user to run the `spectrace-plan` skill, which reinstalls it. Uncommitted changes in
   `planning/`,
   `AGENTS.md`, `.githooks/` or `.gitattributes` (fresh specs, a spectrace install) →
   commit them first as `docs(planning): <what>`. Leave other untracked files
   alone. Open `planning/roadmap.md` and take the first `[ ]` `[agent]` task of the
   first spec not `done` whose dependencies are done (or the task you were asked for).
2. Read the spec. Do only that task, then verify it: run the project's tests, or run
   the thing itself when there are no tests yet.
3. **Close it with one commit**: the change, the task's `[x]`, and a trailer. Stage
   the files you touched by name, never `git add -A`.

   ```
   feat(login): session cookie middleware

   Spec: 003/T002
   ```

   The `Spec:` line goes in the message's last paragraph, together with any other
   trailer (`Co-Authored-By:`…) and no blank line between them — git only reads that
   paragraph as trailers. A change that belongs to no spec on purpose (a typo, a
   chore) carries `Spec: none` instead; a code commit with neither is refused, and
   CI refuses one that skipped the hook with `--no-verify`.

   Two small tasks that only make sense together (a function and its test) may share a
   commit with one `Spec:` line each. To fold a task into the previous commit,
   `git commit --amend` works: the hook judges the whole amended commit against its
   parent. A task is closed only when that commit exists — never leave a ticked box
   uncommitted or a commit without its trailer.
4. **A `Review:` task** needs eyes that didn't write the code: hand it to a fresh
   agent (a subagent given only the task text and the spec) when your harness can;
   otherwise do it yourself and write `reviewed (self):`. Read the files, don't skim.
5. Stuck: add `blocked: <reason>` under the task, commit it, tell the user, move on.
6. **A convention or decision in the way** — or two items of a spec that contradict
   each other: these files describe the current state, not laws. Don't work around one
   and don't pick a side silently. Propose the simplest change to the user (the
   `spectrace-change` skill applies it). If the user isn't there to answer, mark the
   task `blocked: conflicts D2: <why>; propose: <change>`, commit, and move on.
7. **A new idea or a bug found mid-task**: add a line to the roadmap's `## Ideas` (or
   a task to the right spec) and keep going. Nothing is out of scope; it's just later.

What a spec built: `git log --grep "Spec: 003/" --stat`.
<!-- /spectrace -->

