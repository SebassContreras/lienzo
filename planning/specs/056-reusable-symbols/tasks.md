- [x] T001 [agent] [status:done] Add `symbols` dictionary definition and validation in canonical and compact scene schemas (`src/model/model.ts`, `src/model/schema.ts`, `src/model/compact.ts`)
      covers: D1@1
      changes: src/model/compact.ts (+19 -0), src/model/model.ts (+7 -0), src/model/schema.ts (+7 -0)
- [x] T002 [agent] [status:done] Implement the `use` component descriptor with properties `{ symbol, x, y, w, h, opacity?, overrides? }` and register it in the component registry (`src/components/use/descriptor.ts`, `src/components/index.ts`)
      covers: D2@1
      changes: src/components/index.ts (+4 -1), src/components/use/descriptor.ts (+52 -0), src/components/use/draw.ts (+13 -0)
- [x] T003 [agent] [status:done] Implement `drawUse` in `src/components/use/draw.ts` with deep cloning, override application, scaled drawing, and missing symbol fallback placeholder
      covers: D3@1
      changes: src/components/use/draw.ts (+92 -3)
- [x] T004 [agent] [status:done] Expand compact symbols and compact `use` elements into canonical scene definitions in `expandScene` (`src/service/compact/expand.ts`)
      covers: D1@1, D2@1
      changes: src/service/compact/expand.ts (+27 -0)
- [x] T005 [agent] [status:done] Update layout analysis and diagnostics in `src/service/layout.ts` to inspect `use` elements and emit `"missing_symbol"` diagnostic
      covers: D4@1
      changes: src/service/layout.ts (+48 -1)
- [x] T006 [agent] [status:done] Unit test symbol parsing in schemas and expansion from compact scene representation
      covers: R1@1
      kind: test
      changes: src/model/symbols-schema.test.ts (+99 -0)
- [x] T007 [agent] [status:done] Unit test `use` component descriptor, overrides application, drawing execution, and missing symbol placeholder fallback
      covers: R2@1, R3@1
      kind: test
      changes: src/components/use/use.test.ts (+170 -0)
- [x] T008 [agent] [status:done] Integration test layout inspection reporting `"missing_symbol"` diagnostics for unmapped symbols
      covers: R3@1
      kind: test
      changes: src/service/symbols-layout.test.ts (+94 -0)
- [x] T009 [agent] [status:done] Integration test verifying editing a symbol definition in `scene.symbols` updates every `use` instance rendering without element duplication
      covers: R4@1, D5@1
      kind: test
      changes: src/components/use/symbols-reactivity.test.ts (+106 -0)
