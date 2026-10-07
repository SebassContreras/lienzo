# Architecture

Project-wide decisions. Grammar: `.spectrace/format.md`.

These decisions come from the canvas prototype the user validated on 2026-10-07 ("that is
exactly what I wanted").

## Container

- A1@1: A single web app built with React and Vite, at the repository root; no monorepo — why: one app, no other consumers; simplest structure that holds the editor.
- A2@1: Runs locally from a cloned repository with `pnpm dev`; no hosted deployment, no accounts, no authentication — why: single local user, zero cost.
- A3@1: Scenes are drawn on an HTML canvas with the Canvas 2D API by one pure function `drawScene(ctx, scene, t)`; the editor preview and every export call it — why: one drawing path means the preview equals the export, and frame-by-frame export is deterministic.
- A4@1: A scene is plain JSON (size, loop duration, fps, background, ordered element list) defined by TypeScript types in `src/model/` — why: JSON is what presets and scenes are stored as; no translation layer.
- A5@1: Each canvas component (rect, text, line, …) lives in its own file in `src/components/` and exports its draw function; shared painting helpers (glow, shadow, gradients, animation state) live in `src/engine/` — why: adding a component means adding a file.
- A6@1: Animations are a function of time within one loop; looping animations use a whole number of cycles per loop so exported GIF and MP4 loops are seamless — why: validated in the prototype.
- A7@2: No database. Presets and scenes are JSON files in `presets/` and `scenes/`, and the images scenes use are files in `assets/` (named by content hash), all at the repo root and versioned with it; they are read and written through a small Vite dev-server middleware (`/api/presets`, `/api/scenes`, `/api/assets`); the current scene is also autosaved to `localStorage` — why: files are easy to inspect, copy and version, and a scene that uses images opens on any clone.

## Stack

- A8@1: TypeScript on Node.js 24 LTS; version pinned in `.nvmrc` — why: newest LTS.
- A9@1: React 19 + Vite for the editor UI — why: used by the validated prototype.
- A10@1: GIF export with gifenc; MP4 export with Mediabunny on WebCodecs (H.264, falling back to WebM/VP9 when the browser cannot encode H.264); PNG through `OffscreenCanvas.convertToBlob` — why: all run in the browser with no server; gifenc MIT, Mediabunny MPL-2.0 used unmodified.
- A11@1: Icons from lucide-react (UI) and lucide (canvas icon component) — why: one icon set; ISC.
- A12@1: Fonts are bundled with `@fontsource/*` packages, not loaded from a CDN — why: works offline; no third-party service.

## Conventions

- A13@1: pnpm is the package manager — why: user's standing preference.
- A14@1: Biome for lint and format; Vitest for unit tests of the model and engine — why: one tool each; fits Vite.
- A15@1: CI on GitHub Actions runs `pnpm lint`, `pnpm typecheck` and `pnpm test` on every push and pull request — why: free for public repositories.
- A16@1: UI text is Spanish; code, comments, docs and commit messages are English — why: user preference.
- A17@1: Conventional Commits, with a `Spec: NNN/TNNN` trailer when a commit belongs to a task — why: standard (https://www.conventionalcommits.org/en/v1.0.0/).
- A18@1: The repository is MIT and every runtime dependency must be MIT-compatible at zero cost — why: hard constraint.

## Presets

- A19@1: Reusable styling lives as traits in `src/traits/`, one file per trait; a preset is a JSON recipe (kind, traits with parameters, own values) resolved into a plain element when dropped — why: presets compose pieces instead of rebuilding elements, and scenes stay plain JSON (A4).
