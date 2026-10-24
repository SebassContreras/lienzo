# 052 — track-loops-and-step — Tasks

- [x] T001 [agent] [status:done] Add `step` and `hold` easing functions (`p < 1 ? 0 : 1`) to `EASINGS` in `src/engine/easing.ts`
      covers: D4@1
      changes: src/engine/easing.ts (+2 -0)
- [x] T002 [agent] [status:done] Define `TrackRepeat`, `Track` union (`Keyframe[] | { keys, repeat?, until? }`), `TracksSchema` and pure helpers `trackKeys` / `trackEntry` in `src/model/track.ts`
      covers: D1@1
      changes: src/model/track.ts (+63 -2)
- [x] T003 [agent] [status:done] Implement `effectiveTrackTime` and update `valueAt`, track editing helpers, `src/presets/anim-presets.ts`, `src/editor/keyframe-controls.tsx` and `src/editor/timeline/tracks-panel.tsx` to support `Track` objects and preserve `repeat`/`until`
      covers: D2@1
      changes: src/editor/keyframe-controls.tsx (+6 -6), src/editor/timeline/tracks-panel.tsx (+19 -8), src/engine/tracks.ts (+63 -14), src/presets/anim-presets.ts (+38 -10)
- [x] T004 [agent] [status:done] Support track object form `{ keys, repeat?, until? }` in `src/model/compact.ts` and `src/service/compact/tracks.ts`, and add `repeat` / `until` support to `src/service/tools/keyframe-set.ts` and `src/service/tools/keyframe-remove.ts`
      covers: D1@1, D3@1
      changes: src/model/compact.ts (+8 -1), src/presets/anim-presets.test.ts (+9 -5), src/service/compact/expand.ts (+1 -1), src/service/compact/tracks.ts (+25 -4), src/service/elements.ts (+7 -2), src/service/tools/keyframe-remove.ts (+14 -2), src/service/tools/keyframe-set.ts (+70 -18)
- [x] T005 [agent] [status:done] Unit tests for `step` / `hold` easing, `repeat: "loop"` / `"pingpong"`, `until` clamping, and backwards-compatible track evaluation in `src/engine/tracks.test.ts`
      covers: R1@1, R2@1, R4@1, R5@1
      kind: test
      changes: src/engine/tracks.test.ts (+75 -2)
- [x] T006 [agent] [status:done] Compact track object expansion tests in `src/service/compact/expand.test.ts` and `keyframe_set` `repeat` / `until` tool tests in `src/service/service.test.ts`
      covers: R3@1, R4@1
      kind: test
      changes: src/editor/timeline/tracks-panel.tsx (+1 -2), src/presets/anim-presets.test.ts (+1 -5), src/presets/anim-presets.ts (+6 -8), src/service/compact/expand.test.ts (+55 -0), src/service/service.test.ts (+70 -0), src/service/tools/keyframe-set.ts (+1 -5)
