# 066 — lazy-vendor-chunks

## Goal
`pnpm build` warns that two chunks pass 500 kB: one is three.js (1.5 MB, 400 kB gzip), the other Mediabunny with its AAC encoder (1.27 MB, 333 kB gzip). Both the editor and the `?render` route download them on start, though most scenes have no 3D element and only exporting a video needs Mediabunny. When this spec is done, three.js loads only when a scene draws a 3D element, Mediabunny only when a video is exported, the build shows no chunk-size warning, and exports still show every 3D element (A3).

## Requirements
- R1: The editor and the `?render` route start without downloading three.js or Mediabunny.
- R2: A 3D element shows its placeholder until three.js has loaded, then its picture, with no reload.
- R3: An export, a scene thumbnail or a headless render of a scene with a 3D element waits for three.js, so no frame shows the placeholder.
- R4: An MP4/WebM export loads Mediabunny when it starts; PNG and GIF exports never load it.
- ~~R5: `pnpm build` prints no "chunks are larger than 500 kB" warning, without raising `chunkSizeWarningLimit`.~~ → R6
- R6: `pnpm build` prints no chunk-size warning; no chunk loaded at start passes 500 kB, and the limit is raised only for a single on-demand module that cannot be split, with the reason in the config.
- R7: The `icon` and `badge` elements and the icon picker draw lucide icons without the whole icon set in the startup bundle; exports never miss an icon.

## Design
### Approach

- D1 (R1, R2): The three.js half of the 3D element (`draw`'s scene setup, `geometry.ts`, `model.ts`, `font.ts`, `renderer.ts`) moves behind one module, `src/components/three/runtime.ts`, that exports `renderThree(el, t, duration)`. `draw.ts` keeps only the 2D part (transform, `drawImage`, placeholder) and reaches the runtime through a dynamic `import()`, started on the first draw and remembered in a module variable; until it resolves, `draw` paints the placeholder, as it already does while a model or font loads. The stage redraws on every animation frame, so the picture appears once the import resolves. `SHAPES`, `Primitive` and `SIZE` move to `shapes.ts` (no three.js), so the descriptor keeps loading in plain Node (A20). The `.glb` and `.woff` asset loaders stay registered at start, and import `model.ts`/`font.ts` lazily inside the loader.
  - _Trade-offs_: The first 3D element in a session shows the placeholder for the time three.js takes to download (local, tens of milliseconds).
  - _Mitigation_: It is the same placeholder already shown while a model loads; exports never see it (D2).

- D2 (R3): The descriptor type gains an optional `load?: () => Promise<void>` — code a kind needs before it can draw. `loadSceneAssets` awaits `load()` of every kind present in the scene (groups included) next to the asset files. Exports, thumbnails and the headless renderer all go through `loadSceneAssets`, so they wait for three.js with no other change. The 3D descriptor's `load` is the same import `draw` starts.
  - _Trade-offs_: One more optional field on the descriptor, with one user today.
  - _Mitigation_: It sits next to `assets`, has the same meaning ("what drawing needs, awaited before export") and keeps the waiting in the one place that already does it, instead of a special case for 3D in `export.ts`.

- D3 (R4): `export.ts` imports `video-encoder.ts` with `await import()` inside the MP4 branch. `video-encoder.ts` stays the one adapter over Mediabunny (A10); nothing else imports it. Inside it, `@mediabunny/aac-encoder` (a ~1 MB WASM build, only needed where the browser has no native AAC encoder, as in Firefox) is imported in the branch that registers it.
  - _Trade-offs_: Starting a video export waits for Mediabunny to download once.
  - _Mitigation_: It is a local file and the export already awaits fonts and assets before the first frame; the progress bar covers it.

- ~~D4 (R5): No `codeSplitting` groups and no raised warning limit: once D1 and D3 move the two libraries behind `import()`, the bundler emits them as their own chunks, which load only on demand. Vite's own warning recommends `import()` first. If three.js alone still passes 500 kB, that chunk is loaded only on demand and the remaining warning is recorded in the roadmap's Ideas rather than hidden.~~ → D6
  - _Trade-offs_: Chunk names stay the ones the bundler picks.
  - _Mitigation_: Names do not matter at runtime; the build output lists sizes for the check in T005.

- D5 (R7, R2): The lucide icon set moves to `src/engine/icon-set.ts` (`ICON_NAMES`, `iconNode`), imported only through a lazy holder in `icon-shapes.ts`. `iconPaths` returns no paths until the set is there (and caches only once it is); the `icon` and `badge` descriptors declare `load`, so exports wait for it (D2). The editor's `IconSvg` and `IconPicker` use a small hook that loads the set and re-renders once.
  - _Trade-offs_: Icons are blank on the stage and in the picker for the moment the set takes to download.
  - _Mitigation_: The stage redraws every frame and the hook re-renders, so they appear on their own; exports and thumbnails await it.

- D6 (R6): With three.js (D1), Mediabunny (D3) and lucide (D5) behind `import()`, no startup chunk passes 500 kB. The one left over is `@mediabunny/aac-encoder` (~990 kB): a single WASM build the bundler cannot split, downloaded only for a video export in a browser without native AAC. `build.chunkSizeWarningLimit` goes to 1024 kB with a comment naming that module.
  - _Trade-offs_: A startup chunk between 500 kB and 1 MB would no longer warn.
  - _Mitigation_: T009 checks the startup chunks by size; the comment says why the limit is there, so it is revisited when the AAC encoder goes.

- D7 (D1, D5): Both lazy imports share one helper, `lazyModule(importer)` in `src/engine/lazy-module.ts`: `get()` returns the module or undefined (starting the load), `load()` resolves when it is there; a failed import is retried on the next call. `three/lazy.ts` uses it.
  - _Trade-offs_: A small helper in `engine/`.
  - _Mitigation_: Two users today (three.js, lucide), each a few lines instead of a hand-written cache.

## Tasks
- [x] 066/T001 [agent] Test: `loadSceneAssets` waits for a kind's `load` (in a group too) before resolving — covers R3
- [x] 066/T002 [agent] Descriptor `load` and `loadSceneAssets` awaiting it — covers D2
- [x] 066/T003 [agent] Split the 3D element into `draw.ts`/`shapes.ts` and a lazily imported `runtime.ts`; lazy `.glb`/`.woff` loaders; descriptor `load` — covers D1, R2
- [x] 066/T004 [agent] Import the video encoder lazily in `export.ts` — covers D3, R4
- ~~066/T005 [agent] Verify: typecheck, tests, `pnpm build` chunk sizes, and a 3D scene and an MP4 export in the browser; update AGENTS.md — covers R1, R5, D4~~ → T009
- [x] 066/T006 [agent] Test and `lazyModule` helper; `three/lazy.ts` on it — covers D7
- [x] 066/T007 [agent] Lazy lucide icon set: `icon-set.ts`, `iconPaths`, `icon`/`badge` `load`, editor hook; tests await it — covers D5, R7
- [ ] 066/T008 [agent] `chunkSizeWarningLimit` for the AAC encoder, with the reason — covers D6
- [ ] 066/T009 [agent] Verify: typecheck, tests, `pnpm build` with no warning and startup chunks under 500 kB, a 3D scene, an icon and an MP4 export in the browser; update AGENTS.md — covers R1, R6, R7

## Changes
- 2026-10-27: R5 → R6, D4 → D6, T005 → T009. Why: after D1 and D3 two chunks still passed 500 kB, the startup core (the whole lucide set) and the on-demand AAC WASM encoder, which cannot be split; the maintainer chose to load lucide lazily and accept the AAC chunk with a documented limit. Work: T006–T009.
