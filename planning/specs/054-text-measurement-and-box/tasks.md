# 054 — text-measurement-and-box — Tasks

- [x] T001 [agent] [status:done] Create pure text measurement service (`src/engine/text-measure.ts`) with browser `OffscreenCanvas` and Node `opentype.js` metric extraction over bundled `@fontsource/*` fonts and project user fonts
      covers: D1@1
      changes: src/engine/text-measure.ts (+239 -0)
- [x] T002 [agent] [status:done] Add word-boundary line wrapping algorithm and optional `w` support in `src/engine/geometry.ts` (`textLayout` and `boxOf`), and add optional `w` field to `text` component descriptor (`src/components/text/descriptor.ts`)
      covers: D2@1
      changes: src/components/descriptor.ts (+2 -0), src/components/text/descriptor.ts (+1 -1), src/engine/geometry.ts (+78 -28), src/model/element-schema.ts (+1 -0)
- [x] T003 [agent] [status:done] Implement aligned rendering of wrapped text inside `[el.x, el.x + w]` in `src/components/text/draw.ts` and verify backward-compatible unwrapped rendering when `w` is omitted
      covers: D2@1, D3@1
      changes: src/components/text/draw.ts (+1 -0)
- [x] T004 [agent] [status:done] Update compact scene `at` placement in `src/service/compact/layout.ts`, spatial diagnostics in `src/service/layout.ts`, and regenerate `schemas/compact-scene.json`
      covers: D3@1, D4@1
      changes: schemas/compact-scene.json (+4 -0), src/model/compact.ts (+1 -0)
- [x] T005 [agent] [status:done] Unit and accuracy tests for text measurement matching real metrics within 10% across font sizes and weights in `src/engine/text-measure.test.ts`
      covers: R1@1
      kind: test
      changes: src/engine/text-measure.test.ts (+92 -0)
- [x] T006 [agent] [status:done] Unit tests for word wrapping, alignment (`left`, `center`, `right`) inside `w`, edge cases, and omit-`w` backward compatibility in `src/engine/text-wrap.test.ts`
      covers: R2@1, R3@1
      kind: test
      changes: src/engine/geometry.ts (+25 -17), src/engine/text-wrap.test.ts (+77 -0)
- [x] T007 [agent] [status:done] Integration tests for `scene_inspect_layout` and compact `at` placement with wrapped and unwrapped text in `src/service/text-layout.test.ts`
      covers: R4@1
      kind: test
      changes: src/service/text-layout.test.ts (+83 -0)
