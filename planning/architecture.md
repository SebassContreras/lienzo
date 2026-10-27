# Architecture

Project-wide decisions.

These decisions come from the canvas prototype the user validated on 2026-10-07 ("that is
exactly what I wanted").

## Container

- A1: A single web app built with React and Vite, at the repository root; no monorepo — why: one app, no other consumers; simplest structure that holds the editor.
- A2: Runs locally from a cloned repository with `pnpm dev`; no hosted deployment, no accounts, no authentication — why: single local user, zero cost.
- A3: Scenes are drawn on an HTML canvas with the Canvas 2D API by one pure function `drawScene(ctx, scene, t)`; the editor preview and every export call it — why: one drawing path means the preview equals the export, and frame-by-frame export is deterministic.
- A4: A scene is plain JSON (size, loop duration, fps, background, ordered element list) defined by TypeScript types in `src/model/` — why: JSON is what presets and scenes are stored as; no translation layer.
- A5: Each canvas component kind lives in its own folder `src/components/<kind>/` (its descriptor and its draw function, see A23); shared painting helpers (glow, shadow, gradients, animation state, `animate`) live in `src/engine/` — why: adding a component means adding a folder.
- A6: Animations are a function of time within one loop; looping animations use a whole number of cycles per loop so exported GIF and MP4 loops are seamless — why: validated in the prototype.
- A7: No database. Presets and scenes are JSON files in `presets/` and `scenes/`, and the images and 3D models (`.glb`) scenes use are files in `assets/` (named by content hash), all at the repo root and versioned with it; they are read and written through a small Vite dev-server middleware (`/api/presets`, `/api/animations`, `/api/scenes`, `/api/assets`); the current scene is also autosaved to `localStorage` — why: files are easy to inspect, copy and version, and a scene that uses images or models opens on any clone.

## Stack

- A8: TypeScript on Node.js 24 LTS; version pinned in `.nvmrc` — why: newest LTS.
- A9: React 19 + Vite for the editor UI — why: used by the validated prototype.
- A10: GIF export with gifenc; MP4 export with Mediabunny on WebCodecs (H.264, falling back to WebM/VP9 when the browser cannot encode H.264), Mediabunny at 1.61.6 or later; PNG through `OffscreenCanvas.convertToBlob` — why: all run in the browser with no server; gifenc MIT, Mediabunny MPL-2.0 used unmodified; 1.61.6 repairs the malformed AVC description Firefox emits on Windows (Bugzilla 2082867, mediabunny #559), which phones and WhatsApp cannot decode.
- A11: Icons from lucide-react (UI) and lucide (canvas icon component) — why: one icon set; ISC.
- A12: Fonts are bundled with `@fontsource/*` packages; user fonts are files on disk (git-ignored `fonts/` globally, `projects/<slug>/fonts/` per project) and the only network use is an explicit, user-triggered Google Fonts download saved to those folders — never loaded from a CDN at run time — why: works offline; the user chooses when a third-party service is used.

## Conventions

- A13: pnpm is the package manager — why: user's standing preference.
- A14: Biome for lint and format; Vitest for minimal unit tests of the model, engine and pure business logic (SRP/KISS: test contracts, domain transformations and math timing; avoid redundant/heavy E2E micro-tests; keep daily development fast) — why: one tool each; fits Vite and prevents test bloat.
- ~~A15: CI on GitHub Actions runs `pnpm lint`, `pnpm typecheck` and `pnpm test` on every push and pull request — why: free for public repositories.~~ retired 2026-10-24
- A16: UI text is Spanish; code, comments, docs and commit messages are English — why: user preference.
- A17: Conventional Commits, with a `Spec: NNN/TNNN` trailer when a commit belongs to a task — why: standard (https://www.conventionalcommits.org/en/v1.0.0/).
- A18: The repository is MIT and every runtime dependency must be MIT-compatible at zero cost — why: hard constraint.

## Presets

- A19: Reusable styling lives as traits in `src/traits/`, one file per trait; a preset is a JSON recipe (kind, traits with parameters, own values) resolved into a plain element when dropped — why: presets compose pieces instead of rebuilding elements, and scenes stay plain JSON (A4).

## Automation

- A20: Every operation on scenes and presets outside the editor is a tool defined once in `src/service/tools/` (one file per tool): a `snake_case` noun_verb name (`scene_export`), description, Zod input and output, `run(input, ctx)`; the CLI and the MCP server are thin adapters that expose every tool of the one registry and hold no logic — why: both stay identical, a new capability is one file, and MCP tool names allow only `[a-zA-Z0-9_-]`.
- A21: Rendering outside the editor loads the app in headless Chromium through Playwright, using the installed Chrome when present so MP4 can use H.264 — why: keeps A3 (preview = export) with no second drawing path.
- A22: The MCP server uses `@modelcontextprotocol/sdk` (MIT) over stdio; the CLI runs with `tsx` — why: the official SDK; no build step for a local tool.

## Components and time

- A23: Every component kind is one descriptor in `src/components/<kind>/` declaring its fields (type, range, label, inspector section), defaults, draw function and animatable properties; the scene schema, the inspector, keyframe targets, the compact format and the service tools are derived from the descriptors; shared field groups (box, fill, stroke, glow, shadow, label, anim) are reusable pieces descriptors compose — why: a new component or field is declared once and works everywhere.
- A24: Time is applied by one pure layer, `animate(el, t, scene)`, that resolves preset animations and keyframe tracks into a plain element plus its transform before any component draws; components never read `t` to animate — why: every component gets every kind of animation with no code of its own.
- A25: The 3D element renders with three.js into an offscreen WebGL canvas composited into the 2D canvas with `drawImage`, driven only by `t` — why: keeps `drawScene` the single drawing path (A3).
- A26: Animations can be saved as animation presets: JSON files in `presets/animations/` holding an `anim` and keyframe tracks with times relative to their start and movements relative to the element (positional fields are marked `relative` in their descriptors); applying one always copies it, and a scene may name a preset (`animPreset`) that is expanded into copied values when the scene loads, so `animate` never reads the library — why: the same reuse model as element presets (A19), without After Effects' known pitfalls (absolute positions, playhead-dependent timing, overwriting unrelated animation), and drawing stays pure (A24).
