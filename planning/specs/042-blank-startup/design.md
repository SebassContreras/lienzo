# 042 — blank-startup — Design

## Approach

- D1@1 (implements R1, R4): `loadInitialScene` in `src/editor/app.tsx` is replaced by `defaultScene()`; the `demoScene()` fallback is removed from startup. The initial scene name is "Mi proyecto".
- D2@1 (implements R2): The clock starts as `{ t: 0, playing: false }` and the `playing` state starts `false`.
- D3@1 (implements R3): Autosave keeps writing `lienzo-scene:${slug}` but no longer reads it on mount; a `readAutosave(slug)` helper exposes it for the "Recuperar borrador" action of 043.

- D4@1 (implements R4): `src/demo.ts` is removed from the app. Tests that use it as a fixture import it from `src/test/fixtures/sample-scene.ts` instead (never imported by app code). `projects/mi-proyecto/scenes/ejemplo-keyframes.json` is deleted; `tracks.test.ts` and `renderer.test.ts` read a copy in `src/test/fixtures/`. The `src/demo.ts` line in `AGENTS.md` goes away.

## Deliverables

- `src/editor/app.tsx`: blank initial scene, paused clock, `readAutosave` helper.
- `src/demo.ts` → `src/test/fixtures/sample-scene.ts`; `projects/mi-proyecto/scenes/ejemplo-keyframes.json` → `src/test/fixtures/`
- `src/editor/workspace-fixes.test.ts`: startup is empty and paused.
