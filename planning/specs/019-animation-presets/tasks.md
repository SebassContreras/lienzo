# 019 — animation-presets — Tasks

- [x] T009 [agent] [status:done] Animation preset schema in `src/model/anim-preset.ts`, `/api/animations` store, and `relative: true` on positional descriptor fields
      covers: D6@1, A26@2
      changes: src/components/fields/box.ts (+2 -2), src/components/fields/field.ts (+6 -0), src/components/line/descriptor.ts (+1 -0), src/model/anim-preset.ts (+40 -0), src/model/schema.ts (+1 -1), src/presets/store.ts (+1 -1), vite.config.ts (+8 -4)
- [x] T010 [agent] [status:done] `capturePreset` and `applyPreset`: relative times (keyframes and entry/exit delays), positional offsets, per-slot and per-path merge, skipped list
      covers: D7@2
      └─ reviewed 2026-10-10: the code already follows D7@2 (commit 662d177 shifts a loop that ends)
      changes: src/presets/anim-presets.ts (+139 -0)
- [ ] T011 [agent] [status:todo] Apply to the selection in selection order with stagger and a chosen start, dropping keyframes past the duration
      covers: D8@1
- [ ] T012 [agent] [status:todo] `animPreset` provenance on applied elements; `animate` unchanged
      covers: D9@1, A24@1
- [ ] T013 [agent] [status:todo] `animPreset` in the scene schema and `expandAnimPresets` on scene load with notices
      covers: D10@1
- [ ] T014 [agent] [status:todo] Library section "Animaciones" in `src/editor/anim-library.tsx`: save, rename, overwrite, delete, export, import, validated before writing
      covers: D11@1
- [ ] T015 [agent] [status:todo] Test: save/apply round trip on another kind; relative keyframes and delays; offsets only on `relative` fields; merge keeps other slots and tracks; type mismatches and missing paths skipped; stagger order and duration cut; editing a preset leaves applied elements alone; a scene with `animPreset` expands on load and an unknown name loads with a notice; an invalid import writes nothing
      covers: R1@1, R2@2, R3@2, R4@2, R5@2, R6@2, R7@2, R8@2
      kind: test
