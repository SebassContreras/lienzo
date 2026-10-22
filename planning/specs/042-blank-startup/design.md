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

## Trade-offs

- Blank start (D1, D3). Pros: predictable, nothing plays or appears that the user did not open. Cons: a user may think the last draft was lost. Mitigation: the autosave is still written and "Recuperar borrador" (043/D2) reopens it.
- Paused start (D2). Pros: no CPU spent animating an empty canvas. Cons: one extra click to preview. Mitigation: play stays on the usual shortcut and button.
- Demo out of the app (D4). Pros: no unknown content in the default project. Cons: tests used it as a rich fixture. Mitigation: it moves to `src/test/fixtures/`, which app code never imports.
