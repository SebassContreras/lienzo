# 066 — lazy-vendor-chunks

## Goal
`pnpm build` warns that two chunks pass 500 kB: one is three.js (1.5 MB, 400 kB gzip), the other Mediabunny with its AAC encoder (1.27 MB, 333 kB gzip). Both the editor and the `?render` route download them on start, though most scenes have no 3D element and only exporting a video needs Mediabunny. When this spec is done, three.js loads only when a scene draws a 3D element, Mediabunny only when a video is exported, the build shows no chunk-size warning, and exports still show every 3D element (A3).

## Requirements
- R1: The editor and the `?render` route start without downloading three.js or Mediabunny.
- R2: A 3D element shows its placeholder until three.js has loaded, then its picture, with no reload.
- R3: An export, a scene thumbnail or a headless render of a scene with a 3D element waits for three.js, so no frame shows the placeholder.
- R4: An MP4/WebM export loads Mediabunny when it starts; PNG and GIF exports never load it.
- R5: `pnpm build` prints no "chunks are larger than 500 kB" warning, without raising `chunkSizeWarningLimit`.

## Design
### Approach

- D1 (R1, R2): The three.js half of the 3D element (`draw`'s scene setup, `geometry.ts`, `model.ts`, `font.ts`, `renderer.ts`) moves behind one module, `src/components/three/runtime.ts`, that exports `renderThree(el, t, duration)`. `draw.ts` keeps only the 2D part (transform, `drawImage`, placeholder) and reaches the runtime through a dynamic `import()`, started on the first draw and remembered in a module variable; until it resolves, `draw` paints the placeholder, as it already does while a model or font loads. The stage redraws on every animation frame, so the picture appears once the import resolves. `SHAPES`, `Primitive` and `SIZE` move to `shapes.ts` (no three.js), so the descriptor keeps loading in plain Node (A20). The `.glb` and `.woff` asset loaders stay registered at start, and import `model.ts`/`font.ts` lazily inside the loader.
  - _Trade-offs_: The first 3D element in a session shows the placeholder for the time three.js takes to download (local, tens of milliseconds).
  - _Mitigation_: It is the same placeholder already shown while a model loads; exports never see it (D2).

- D2 (R3): The descriptor type gains an optional `load?: () => Promise<void>` — code a kind needs before it can draw. `loadSceneAssets` awaits `load()` of every kind present in the scene (groups included) next to the asset files. Exports, thumbnails and the headless renderer all go through `loadSceneAssets`, so they wait for three.js with no other change. The 3D descriptor's `load` is the same import `draw` starts.
  - _Trade-offs_: One more optional field on the descriptor, with one user today.
  - _Mitigation_: It sits next to `assets`, has the same meaning ("what drawing needs, awaited before export") and keeps the waiting in the one place that already does it, instead of a special case for 3D in `export.ts`.

- D3 (R4): `export.ts` imports `video-encoder.ts` with `await import()` inside the MP4 branch. `video-encoder.ts` stays the one adapter over Mediabunny (A10); nothing else imports it.
  - _Trade-offs_: Starting a video export waits for Mediabunny to download once.
  - _Mitigation_: It is a local file and the export already awaits fonts and assets before the first frame; the progress bar covers it.

- D4 (R5): No `codeSplitting` groups and no raised warning limit: once D1 and D3 move the two libraries behind `import()`, the bundler emits them as their own chunks, which load only on demand. Vite's own warning recommends `import()` first. If three.js alone still passes 500 kB, that chunk is loaded only on demand and the remaining warning is recorded in the roadmap's Ideas rather than hidden.
  - _Trade-offs_: Chunk names stay the ones the bundler picks.
  - _Mitigation_: Names do not matter at runtime; the build output lists sizes for the check in T005.

## Tasks
- [x] 066/T001 [agent] Test: `loadSceneAssets` waits for a kind's `load` (in a group too) before resolving — covers R3
- [x] 066/T002 [agent] Descriptor `load` and `loadSceneAssets` awaiting it — covers D2
- [x] 066/T003 [agent] Split the 3D element into `draw.ts`/`shapes.ts` and a lazily imported `runtime.ts`; lazy `.glb`/`.woff` loaders; descriptor `load` — covers D1, R2
- [ ] 066/T004 [agent] Import the video encoder lazily in `export.ts` — covers D3, R4
- [ ] 066/T005 [agent] Verify: typecheck, tests, `pnpm build` chunk sizes, and a 3D scene and an MP4 export in the browser; update AGENTS.md — covers R1, R5, D4
