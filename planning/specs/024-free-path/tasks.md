# 024 — free-path — Tasks

- [ ] T001 [agent] [status:todo] `svgpath` dependency behind `src/engine/path/parse.ts` (normalised cubic subpaths, errors naming the shape)
      covers: D4@1, A18@1
- [ ] T002 [agent] [status:todo] `path` descriptor: `shapes`, view box, `Path2D` scaled to the box, paste and `.svg` import
      covers: D1@2, A23@1
- [ ] T003 [agent] [status:todo] Animatable draw-on `progress` with cached path length
      covers: D2@1
- [ ] T004 [agent] [status:todo] Pure morph preparation: resample, winding, subpath pairing, unpaired collapse, start alignment
      covers: D5@1
- [ ] T005 [agent] [status:todo] Pure morph interpolation over the shape list, with fill, stroke and opacity
      covers: D6@1
- [ ] T006 [agent] [status:todo] Cache of prepared pairs by `d` hash
      covers: D7@1
- [ ] T007 [agent] [status:todo] Built-in presets: outline drawing on, morphing loop
      covers: D3@1, A19@1
- [ ] T008 [agent] [status:todo] Test: parsing of every command type; invalid `d` named; morph between paths with different counts and subpaths; no twist (winding and start); same value same points; loop closes; cache hit on the second frame
      covers: R4@1, R5@1, R6@1, R7@1, R8@1, R9@1, R10@1
      kind: test
- [ ] T009 [agent] [status:todo] Test in the browser: paste and import a path, draw it on, morph it, drop the presets and export a GIF
      covers: R1@1, R2@1, R3@1
      kind: test
