# 019 — animation-presets — Design

## Approach

- ~~D1@1 (implements R1, R4, R7): An animation preset is JSON in `presets/animations/` (A26): `{ name, category, anim?, tracks? }` with keyframe times relative to 0 and positional values as offsets; stored through the existing JSON store and schema validation (003).~~ retired 2026-10-10 → D6
- ~~D2@1 (implements R2, R3): Applying merges per property path: paths in the preset replace the element's, others stay; unknown paths are skipped and reported.~~ retired 2026-10-10 → D7
- ~~D3@1 (implements R5): Apply-to-selection shifts each element's start by `index × stagger`.~~ retired 2026-10-10 → D8
- ~~D4@1 (implements R6): A linked element stores `animPreset: { name, start, offset }` instead of copied values; `animate` resolves it at draw time; unlink copies the values in.~~ retired 2026-10-10 → D9
- ~~D5@1 (implements R8): The scene and compact schemas accept a preset name wherever an `anim` is accepted.~~ retired 2026-10-10 → D10
- D6@1 (implements R1, R4, R7): An animation preset is JSON in `presets/animations/` (A26@2): `{ name, category?, anim?, tracks? }`, typed and validated by a Zod schema in `src/model/anim-preset.ts`. Times are relative to 0: keyframe `t` and the `anim` entry and exit delays. Positional fields hold offsets; a field is positional when its descriptor field says `relative: true` (the box's `x`/`y`, a line's ends), so new components (016, 017) declare it once (A23). Stored through `handleStore` under `/api/animations` (`StoreKind` gains `"animations"`); no new store abstraction.
- D7@1 (implements R1, R2, R3, R4): `src/presets/anim-presets.ts` holds pure functions only. `capturePreset(el, start)` subtracts `start` from times and the element's position from positional values; `applyPreset(el, preset, start) → { el, skipped }` adds them back and merges per `anim` slot and per track path, skipping paths the element's descriptor lacks or whose `valueKind` (015) differs.
- D8@1 (implements R5): `staggerStarts(count, start, step)` gives each selected element its start in selection order; keyframes past `scene.duration` are dropped and reported in the same `skipped` list. Applying to a selection is one scene change, so 020 can undo it as one step.
- D9@1 (implements R6): After applying, the element stores `animPreset: { name, start }` as provenance only. `animate` never reads it (A24 stays pure); nothing resolves it at draw time.
- D10@1 (implements R8): `expandAnimPresets(scene, library) → { scene, notices }`, in the same module, runs once when a scene loads (the editor now; 007 and 010 later) and turns every `animPreset` whose element has no `anim` or tracks of its own into copied values through `applyPreset`. The scene schema accepts `animPreset` as a name or `{ name, start }` without checking the library.
- D11@1 (implements R7): The "Animaciones" library section lives in `src/editor/anim-library.tsx`, separate from `library.tsx`; it reuses `deleteStored` and `renameStored` and validates with the D6 schema before every save and import.

## Deliverables

`src/model/anim-preset.ts`, `src/presets/anim-presets.ts`, `relative` on positional
descriptor fields, `/api/animations`, `src/editor/anim-library.tsx`, `animPreset` in the
scene schema and on load.
