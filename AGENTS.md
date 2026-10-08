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
- Scene = plain JSON typed in `src/model/` (A4); one file per component in `src/components/` (A5)
- Looping animations use whole cycles per loop (A6)
- Presets in `presets/`, scenes in `scenes/`, images in `assets/`, via the Vite middleware;
  no database (A7)
- Reusable styling = traits in `src/traits/`; presets are JSON recipes of traits (A19)
- Export: gifenc (GIF), Mediabunny (MP4/WebM), canvas (PNG) (A10)
- Icons: lucide-react / lucide (A11); fonts: `@fontsource/*` (A12)
- pnpm only (A13); Biome + Vitest (A14); CI runs lint, typecheck, test (A15)
- UI text in Spanish; code, comments and docs in English (A16)
- Conventional Commits (A17); MIT-compatible deps only (A18)
- Scenes and preset recipes are validated with Zod in `src/model/schema.ts` before any
  import is written

Planned (decided, not built yet — specs 007–019):

- One descriptor per component kind drives schema, inspector, keyframes, compact JSON and tools
  (A23, spec 012); time is applied only by `animate(el, t, scene)` before drawing (A24);
  3D = three.js in an offscreen WebGL canvas composited with `drawImage` (A25, spec 016)
- Animation presets in `presets/animations/`, copied or linked, relative times and offsets
  (A26, spec 019)
- CLI and MCP are thin adapters over one tool registry in `src/service/`; logic lives only
  in tools (A20); off-editor rendering = headless Chromium via Playwright (A21); MCP SDK
  over stdio, CLI via `tsx` (A22) — specs 007–010, built last

## Layout

```
src/model/       scene types, defaults, size presets, fonts; Zod schemas (schema.ts)
src/engine/      drawScene, painting helpers, animation state, geometry, particle field
src/components/  one draw function per element kind (rect, ellipse, text, icon, image, line,
                 group, particles)
src/editor/      React UI: app shell, stage, library, background library, inspector
src/export/      PNG / GIF / MP4
src/traits/      reusable style pieces, one file per trait
src/presets/     recipe resolver, recipe diff, JSON store (server side: json-store.ts; client:
                 store.ts), categories and filter, JSON import/export helpers, scenes dialog
src/types/       type declarations for packages that ship none
src/demo.ts      the "how MCP works" demo scene
presets/built-in/  built-in preset recipes (JSON); user presets sit next to it in presets/
scenes/          saved scenes (JSON)
assets/          images used by scenes, named by content hash
```

## Rules for agents

- To add a component: a type, a `default…()` and its `ANIMS_BY_KIND` entry in
  `src/model/model.ts`; a draw file in `src/components/`; a case in `src/engine/render.ts`;
  an inspector section; an entry in `BASICS` (`src/editor/app.tsx`); an `apply.<kind>` in each trait
  that should style it (and the kind in `TraitTargets`); its schema in `src/model/schema.ts`
  (the element union and the recipe `kind` list) and the known-kinds list in
  `src/presets/resolve.test.ts`; and a built-in preset recipe with a `category`.
- To add a preset: a JSON recipe in `presets/built-in/` combining traits; add a trait in
  `src/traits/` only when no existing one fits.
- Never draw with wall-clock time: everything takes `t` (seconds within the loop) so exports
  are deterministic.
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
