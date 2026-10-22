# 042 — blank-startup — Design

## Approach

- D1@1 (implements R1, R4): `loadInitialScene` in `src/editor/app.tsx` is replaced by `defaultScene()`; the `demoScene()` fallback is removed from startup. The initial scene name is "Mi proyecto".
- D2@1 (implements R2): The clock starts as `{ t: 0, playing: false }` and the `playing` state starts `false`.
- D3@1 (implements R3): Autosave keeps writing `lienzo-scene:${slug}` but no longer reads it on mount; a `readAutosave(slug)` helper exposes it for the "Recuperar borrador" action of 043.

## Deliverables

- `src/editor/app.tsx`: blank initial scene, paused clock, `readAutosave` helper.
- `src/editor/workspace-fixes.test.ts`: startup is empty and paused.
