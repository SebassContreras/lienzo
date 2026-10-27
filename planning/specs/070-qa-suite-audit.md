# 070 — qa-suite-audit

## Goal
An audit of spec 069 against the architecture guide found one bug and some drift: `isColor` accepts any letters inside `rgb()`/`hsl()`, tree walks and messages are duplicated, helpers live in the wrong module, a few tests loop or branch, and some 069 decisions have no trade-offs written. When this spec is done, the bug is fixed with a regression test, each of those is cleaned up, and the 069 spec states its trade-offs.

## Requirements
- R1: `isColor` rejects a color function whose arguments are not numbers, percentages, angles, `none`, `/` or commas (`rgb(abc)`, `hsl(red)`).
- R2: One tree walk (`mapElementsDeep`) serves the 069 code that visits every element; the missing-font message is the one `fontNotices` writes; rounding helpers live in one module.
- R3: Tools do not import placement notices from the compact expansion module, and a saved `scene_build` checks resources once, with no dedupe.
- R4: The 069 tests have no loops or conditionals around assertions, and `unknown_shot` has a test.
- R5: The 069 spec writes the trade-offs of D4, D8, D12 and D14, and the choice of a hand-written image header reader over a dependency.

## Design
- D1 (R1): The function pattern takes, per argument, a number with an optional `%`/`deg`/`rad`/`grad`/`turn` unit or `none`, separated by commas, spaces or `/` (CSS Color 4 syntax).
- D2 (R2): `unbindShot` and `allElements` use `mapElementsDeep`; `project_update` calls `fontNotices` over a scene-free list (`missingFamilyNotices(families, installed)` shared by both); `round2`/`round3` move to `src/service/round.ts`.
- D3 (R3): `hasPositionTrack`/`trackOverridesAt` move to `src/service/elements.ts`; `buildCompact` takes `{ resources: false }` from a saving `scene_build`, whose save adds them.
- D4 (R4): `it.each` for the color cases; results are asserted whole (`toMatchObject({ ok: true, value: … })`).
- D5 (R5): Trade-offs added to 069 D4, D8, D12, D14 under `_Trade-offs_` / `_Mitigation_`.
  - _Trade-offs_: A hand-written header reader (`image-header.ts`) must be kept for formats and edge cases (EXIF before SOF, progressive JPEG) that the `image-size` package already covers.
  - _Mitigation_: It reads only PNG, JPEG, WebP and SVG, the image types `asset_add` accepts; a file it cannot size fails with `invalid_image` instead of getting a wrong size. Switch to `image-size` if another format is accepted.

## Tasks
- [x] 070/T001 [agent] isColor: strict function arguments, regression test, `it.each` — covers R1, D1
- [ ] 070/T002 [agent] One tree walk, one missing-font message, one rounding module — covers R2, D2
- [ ] 070/T003 [agent] Placement notices in elements.ts; resources checked once in scene_build — covers R3, D3
- [ ] 070/T004 [agent] Test hygiene in the 069 tests; unknown_shot test — covers R4, D4
- [ ] 070/T005 [agent] Trade-offs in spec 069 — covers R5, D5
- [ ] 070/T006 [agent] Verify: typecheck, lint of touched files, tests — covers R1, R2, R3, R4, R5
