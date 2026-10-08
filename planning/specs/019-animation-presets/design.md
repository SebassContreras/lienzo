# 019 — animation-presets — Design

## Approach

- D1@1 (implements R1, R4, R7): An animation preset is JSON in `presets/animations/` (A26): `{ name, category, anim?, tracks? }` with keyframe times relative to 0 and positional values as offsets; stored through the existing JSON store and schema validation (003).
- D2@1 (implements R2, R3): Applying merges per property path: paths in the preset replace the element's, others stay; unknown paths are skipped and reported.
- D3@1 (implements R5): Apply-to-selection shifts each element's start by `index × stagger`.
- D4@1 (implements R6): A linked element stores `animPreset: { name, start, offset }` instead of copied values; `animate` resolves it at draw time; unlink copies the values in.
- D5@1 (implements R8): The scene and compact schemas accept a preset name wherever an `anim` is accepted.

## Deliverables

Animation preset store and schema, apply logic, library section "Animaciones", JSON support.
