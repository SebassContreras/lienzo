# 013 — animation-playback — Design

## Approach

- D1@1 (implements R1, R2, R5): The `anim` field group gains `mode`, `duration`, `repeat` and `easing`; `animate` computes a local progress, clamped and held per mode; missing fields mean today's behaviour.
- D2@1 (implements R2): Easings live in `src/engine/easing.ts`, shared with keyframes (015).
- D3@1 (implements R3, R4): Exit animations are new anim kinds in the `anim` field group; loop mode keeps whole cycles per loop.

## Deliverables

`anim` field group, `src/engine/easing.ts`, `animate` changes.
