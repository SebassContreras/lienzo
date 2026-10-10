# 025 — effects — Design

## Approach

- D1@1 (implements R1, R3): Blur and blend are a shared `effects` field group (A23) applied by `drawScene` around each element's draw (`filter`, `globalCompositeOperation`), never by a component.
- D2@1 (implements R2, R3): A mask is a field `mask` holding the id of another element, like a line's `attach`; `drawScene` clips with that element's outline through `src/engine/clip.ts` (017/D4) and skips drawing the mask element itself; a deleted mask target clears the field.
- D3@1 (implements R1): Blur radius is an animatable number, so presets (013/018) and keyframes (015) drive it.

## Deliverables

`effects` field group, mask support in `drawScene` and `clip.ts`, inspector section.

## Sequencing

Needs 017's `clip.ts` (T010).
