# 094 — layout-and-donut-chart-diagnostics

## Goal
Eliminate false-positive `shape_overlap` layout diagnostics on full-frame `particles` (`F-08`) and canvas-sized backdrop plates (`F-14`), fix `pie`/`donut` chart slice overpaint and `showValues` rendering (`F-10`), add a notice + shot-rebind shift when a shot-bound element's `anim.in` or `anim.out` falls outside its shot (`F-17`), and synchronize QA log status and component documentation. Verification: `pnpm test`, `pnpm replay`, and `pnpm typecheck` pass.

## Context (Animator QA `V2-product`, `V3-claims`, `V4-dense`, 2026-11-02)
- **Origin classification against prior specs (`071`, `075`, `080`):**
  - **`F-08` (Gap in `071/D4` & `080/R14`, Class 4 — `src/service/layout/layout.ts:404,411-429,536-551`):**
    - Spec `071/D4` introduced `shapesStack` with `NOT_SHAPES = new Set(["text", "line", "group"])` (`src/service/layout/layout.ts:404`), and Spec `080/R14` treated `particles` as see-through in `contrast.ts` without excluding `"particles"` (or `"subtitles"`) in `layout.ts:404`.
    - When a shot has a full-frame background `s1-bg` (`kind: "rect", w: 1080, h: 1920`) and a full-frame ambient particle field `s1-particles` (`kind: "particles", w: 1080, h: 1920`), `contains(a, b)` is `false` (`area(inner) < 0.9 * area(outer)`) and `shapesStack` (`src/service/layout/layout.ts:411-429`) emits a false-positive `shape_overlap` between `s1-bg` and `s1-particles`.
  - **`F-14` (Side effect of `071/D4` `shapesStack` / `contains`, Class 4 — `src/service/layout/layout.ts:411-429,536-551`):**
    - When a foreground card (`s2-oob-card`, `x: 860, y: 1360, w: 360, h: 160`) protrudes 140 px past the right edge of the canvas (`out_of_bounds`), `contains(s2-bg, s2-oob-card)` returns `false` because `inner.x + inner.w <= outer.x + outer.w` fails, while 61% of `s2-oob-card` remains inside `s2-bg` (`1080×1920`). `shapesStack` then reports a redundant, confusing `shape_overlap` against `s2-bg` in addition to `out_of_bounds` (`qa/evidence/v4-dense-layout.json`).
  - **`F-10` (New component bug, Class 2 — `src/components/chart/draw.ts:143-166`):**
    - In `pie()` (`src/components/chart/draw.ts:143-166`, not audited in prior QA rounds with narrow slices and `showValues: true`), each slice arc (`ctx.fill()`) and its label (`ctx.fillText(d.label || short(d.value), ...)`) are drawn inside the same `data.forEach` loop. Subsequent slices (`Renew 25.1%`, `Other 68%`) paint over the text of an earlier narrow slice (`"Solar 6.9%"` is clipped to `"olar 6.9"`, see `qa/evidence/claims-s3-donut-overpaint.png`). Furthermore, `d.label || short(d.value)` hides the numeric value whenever a slice has a label, even when `el.showValues` is `true`.
  - **`F-17` (Incomplete premise in `075/R1` & `075/D1`, Class 4 — `src/model/shot-timing.ts:1-6,63-97`, `src/service/scenes/scene-notices.ts:159-196`, `src/service/layout/layout.ts:108-123`):**
    - Spec `075/R1` and `src/model/shot-timing.ts:1-6` assumed `"its tracks are timed from its shot's start, and an unbound element's from 0, as anim already is"`, yet `anim.in.delay` and `anim.out.delay` are actually evaluated against global scene time `t` (`src/service/layout/layout.ts:108-123`). If an element in `shot: "s2"` (`5.5..11.0s`) has `anim.out.delay: 5.25, duration: 0.25`, it finishes fading out at `t = 5.5s` right as `s2` starts and remains invisible for the entire shot with zero notices from `scene_validate` or `scene_build`. Moreover, `rebindShot` (`src/model/shot-timing.ts:86-97`) shifts `tracks` when a shot moves or an element changes shot, but does not shift `anim.in.delay` or `anim.out.delay`.

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | Small, targeted rules in `layout.ts`, `draw.ts`, `scene-notices.ts`, and `shot-timing.ts` without speculative abstractions. |
| 2 SRP | `layout.ts` handles spatial overlap rules; `draw.ts` owns canvas slice/text rendering passes; `scene-notices.ts` owns semantic notice rules; tasks and design items split into single responsibilities. |
| 3 DRY via composition | Reuses shared shot origin math and element traversal helpers across `rebindShot` and `shiftTracks`. |
| 5 Stack standards | Notice rule added to `RULES` and checked across all writers in `matrix.test.ts` and `silence.test.ts`; replay corpus cases added for `F-08`, `F-10`, `F-14`, `F-17`; docs updated per AGENTS.md. |
| 6 Trade-offs | Documented pros, cons, and active mitigations for each design decision in `### Trade-offs & Mitigations`. |
| TESTING.md | Parameterized table tests over input partitions, boundary limits, compound errors, and regression equivalence classes. |

## Requirements
- R1 (`F-08`): `scene_inspect_layout` (`src/service/layout/layout.ts:404`) excludes `"particles"` and `"subtitles"` from `shapesStack` (`NOT_SHAPES`).
  - Partitions:
    - Nominal: Full-frame `particles` (`w: 1080, h: 1920`) over `s1-bg` `rect` (`1080×1920`) → zero `shape_overlap`.
    - Partial: Partial-frame `particles` (`w: 400, h: 400`) overlapping a foreground `rect` → zero `shape_overlap`.
    - Subtitles: `subtitles` element placed over a lower-third backdrop `rect` → zero `shape_overlap`.
  - Invariant: `particles` and `subtitles` never appear as either element of a `shape_overlap` diagnostic, while solid shapes (e.g. `rect`, `ellipse`) at identical coordinates still trigger `shape_overlap`.
- R2 (`F-14`): `shapesStack` (`src/service/layout/layout.ts:411-429,536-551`) does not report `shape_overlap` when the larger box covers at least 90% of the canvas area (`area(outer) >= 0.9 * scene.width * scene.height`), acting as a full-bleed shot backdrop plate (`s1-bg`, `s2-bg`).
  - Partitions:
    - Nominal: Full-canvas backdrop `s2-bg` (`0, 0, 1080, 1920`) and an in-bounds card (`100, 100, 400, 200`) → zero `shape_overlap`.
    - Off-canvas: Full-canvas backdrop `s2-bg` (`0, 0, 1080, 1920`) and a partially off-canvas card (`860, 1360, 360, 160`, protruding 140px) → reports `out_of_bounds` on the card, and zero `shape_overlap` against `s2-bg`.
    - Boundary (threshold - 1): Outer box covering 89% of canvas area (`w * h == 0.89 * canvasArea`) overlapping a foreground card by >50% → reports `shape_overlap`.
    - Boundary (threshold): Outer box covering exactly 90% of canvas area (`w * h == 0.90 * canvasArea`) overlapping a foreground card → zero `shape_overlap`.
    - Foreground overlap: Two foreground cards (`400×200` each) overlapping by >50% without containment → still reports `shape_overlap`.
  - Invariant: foreground shapes overlapping by >50% without containment still trigger `shape_overlap`, while canvas backdrop plates (`>= 90%` canvas area) never trigger `shape_overlap` against foreground elements.
- R3 (`F-10`): In `src/components/chart/draw.ts:143-166` (`pie()`), all slice arcs are filled in a first pass before any slice labels are drawn in a second pass, and when `el.showValues` is `true` on a slice that has both `d.label` and `d.value`, the label text formats as `` `${d.label} (${short(d.value)})` `` (or `d.label` when `d.label` already contains `short(d.value)`).
  - Partitions:
    - Ordering: Narrow slice (`6.9%`) followed by wide slices (`25.1%`, `68%`) → narrow slice label is drawn on top of adjacent slice fills, never clipped or covered by subsequent `ctx.fill()`.
    - Nominal formatting: Slice with `d.label: "Solar"` and `d.value: 6.9` when `showValues: true` → displays `"Solar (6.9)"`.
    - No-op formatting: Slice with `d.label: "Solar (6.9)"` or `"Solar 6.9%"` when `showValues: true` → displays `d.label` without redundant appending.
    - Missing label: Slice with `d.label: ""` and `d.value: 6.9` when `showValues: true` → displays `short(d.value)`.
    - Value disabled: Slice with `d.label: "Solar"` when `showValues: false` → displays `"Solar"`.
    - Boundary / narrow sweep: Slice with sweep angle `<= 0.25` radians → label rendering is suppressed.
    - Boundary / zero value: Slice with `d.value: 0` → zero sweep, arc not filled.
  - Invariant: every slice arc fill executes before any `ctx.fillText` call in `pie()`.
- R4 (`F-17`): When an element bound to a shot (`shot: "s2"`, `[start, end]`) has `anim.in` (`delay + duration <= start` or `delay >= end`) or `anim.out` (`delay + duration <= start` or `delay >= end`) outside `[shot.start, shot.end]`, `contentNotices` (`src/service/scenes/scene-notices.ts:159-196`) emits a Spanish notice naming the element ID and shot ID; and `rebindShot` (`src/model/shot-timing.ts:86-97`) shifts `anim.in.delay` and `anim.out.delay` by the same `delta` as `tracks`.
  - Partitions:
    - `anim.in` before shot: Element in `shot: "s2"` (`5.5..11.0s`) with `anim.in.delay: 0.15, duration: 0.4` (`0.55s <= 5.5s`) → emits notice naming the element and `"s2"`.
    - `anim.in` after shot: Element in `shot: "s2"` (`5.5..11.0s`) with `anim.in.delay: 11.5` (`11.5s >= 11.0s`) → emits notice naming the element and `"s2"`.
    - `anim.out` before shot: Element in `shot: "s2"` (`5.5..11.0s`) with `anim.out.delay: 5.25, duration: 0.25` (`5.5s <= 5.5s`) → emits notice naming the element and `"s2"`.
    - `anim.out` after shot: Element in `shot: "s2"` (`5.5..11.0s`) with `anim.out.delay: 11.0` (`11.0s >= 11.0s`) → emits notice naming the element and `"s2"`.
    - Nominal in-bounds: Element in `shot: "s2"` (`5.5..11.0s`) with `anim.in.delay: 5.65` and `anim.out.delay: 10.75` → zero notices.
    - Unbound element: Element with `shot` omitted and `anim.in.delay: 0.15` → zero notices.
    - Boundary equality: `anim.in.delay + duration == shot.start` (strictly outside, triggers notice); `anim.in.delay + duration == shot.start + 0.001` (overlaps shot, zero notice).
    - Compound: Element with both `anim.in` and `anim.out` outside shot bounds → reports both notices.
    - Rebind shift: Moving `shot: "s2"` from `4..8s` to `6..10s` via `shot_set` or changing `shot` from `"s1"` (`0..4s`) to `"s2"` (`4..8s`) via `element_update` → shifts `anim.in.delay` and `anim.out.delay` by `+2s` / `+4s`.
  - Invariant: the notice rule satisfies `matrix.test.ts` (fires in every scene writer, names the element ID) and `silence.test.ts` (never repeats on an unchanged element).
- R5: Tool descriptions, component documentation, agent usage skill, and QA log reflect the layout checks, chart label formatting, and animation shot bounds contracts per AGENTS.md rules:
  - `docs/components.md` documents `chart` `showValues` label formatting (`${label} (${short(value)})`) for `pie` and `donut` charts.
  - `docs/qa-log.md` status for `F-08`, `F-10`, `F-14`, and `F-17` updated to Closed upon verification.

### Who it serves
All scenes audited with `scene_inspect_layout`, `pie`/`donut` charts, and multi-shot animations using `anim.in` / `anim.out`.

### Out of scope
- Changing `anim.in.delay` / `anim.out.delay` in compact JSON from global seconds to shot-relative seconds (existing scenes and Animator's `label()` helper already pass global timestamps `a` and `b - 0.25`).

### Dependencies
- None.

### Owner split
Agent tasks.

## Design
- D1 (R1): In `src/service/layout/layout.ts:404`, add `"particles"` and `"subtitles"` to `NOT_SHAPES` so they are excluded from `shape_overlap` checking.
- D2 (R2): In `src/service/layout/layout.ts:411-429,536-551`, support canvas backdrop awareness by checking whether either candidate shape covers at least 90% of the canvas area (`area(box) >= 0.9 * scene.width * scene.height`), skipping `shape_overlap` for full-canvas backdrop plates.
- D3 (R3): In `src/components/chart/draw.ts:143-166` (`pie()`), split slice drawing into Pass 1 (compute sweep/angles, draw and fill each slice arc path) and Pass 2 (draw each slice label and value on top of all slice fills), formatting the label as `d.label ? (el.showValues && !d.label.includes(short(d.value)) ? `${d.label} (${short(d.value)})` : d.label) : short(d.value)`.
- D4 (R4): Add `animOutsideShotNotices(scene)` in `src/service/scenes/scene-notices.ts:159-196` and register it in `RULES` (`src/service/contract/rules.ts`); in `src/model/shot-timing.ts:63-97`, update `rebindShot` and `shiftElementTracks` (or a helper `shiftElementAnim`) to shift `anim.in.delay` and `anim.out.delay` by `delta` (`Math.max(0, round(delay + delta))`), updating `hasKeys` / animation detection so `rebindShot` returns `delta` when either keyframes or animations are shifted.
- D5 (R5): In `docs/components.md`, document `chart` slice label formatting when `showValues` is true; and in `docs/qa-log.md`, update status for `F-08`, `F-10`, `F-14`, and `F-17` from Open to Closed upon verification.

### Trade-offs & Mitigations
- D1. Pros: eliminates false-positive `shape_overlap` diagnostics for particles and subtitles across all scenes without impacting solid shape checks. Cons: two overlapping subtitle blocks or particle fields will not trigger `shape_overlap`. Mitigation: subtitles have dedicated cue windows and word collision checks; particles are transparent ambient fields designed to overlay other content.
- D2. Pros: removes false-positive `shape_overlap` when foreground elements slightly protrude off-canvas (`out_of_bounds`) over a full-bleed backdrop plate (`s1-bg`, `s2-bg`). Cons: two full-bleed backdrop plates stacked in the same shot will not trigger `shape_overlap`. Mitigation: deliberate layered backdrops (e.g. textured/gradient plate over solid color) are standard practice and intended to stack.
- D3. Pros: guarantees slice labels are always rendered on top of all slice fills, preventing narrow slice labels from being clipped or painted over by subsequent slices. Cons: two adjacent very narrow slices could have labels positioned closely. Mitigation: strictly superior to text occlusion by slice fills; label placement logic already suppresses labels for narrow sweeps `<= 0.25` radians.
- D4. Pros: catches errors where shot-relative delays are written for Shot 2+ elements while keeping global time evaluation backwards-compatible; automatically preserves animation timing when shots move. Cons: shifting an element's shot alters `anim.in.delay` and `anim.out.delay` in addition to keyframe tracks. Mitigation: matches author expectation that an element's entrance/exit moves with its shot, and mirrors `shiftTracks` behavior.
- D5. Pros: keeps component documentation and QA findings auditable across releases per AGENTS.md. Cons: requires updating markdown documents alongside code changes. Mitigation: verified as part of the standard test and typecheck cycle.

## Tasks
- [x] 094/T001 [agent] Parameterized tests in `src/service/layout/layout.test.ts` (`test.each` tables with shape `[name, { scene, elements }, { expectedOverlap, expectedCodes }]` covering R1 particles/subtitles exclusion and R2 backdrop boundary limits `0.89` vs `0.90` canvas area and out-of-bounds card partitions), plus replay corpus cases for `F-08` and `F-14` in `src/service/contract/corpus/qa-round-11.json` — covers R1, R2
      verified: layout.test.ts parameterized table added covering nominal, partial, and boundary partitions, and F08/F14 added to qa-round-11.json
- [ ] 094/T002 [agent] Parameterized tests in `src/components/chart/chart.test.ts` (`test.each` tables with shape `[name, { sliceData, showValues }, { expectedLabelTexts, expectedFillOrder }]` covering R3 partitions: narrow slice before wide slices, `showValues` true/false, pre-formatted labels, empty labels, and `<= 0.25 rad` narrow sweep suppression), plus replay corpus case for `F-10` in `src/service/contract/corpus/qa-round-11.json` — covers R3
- [ ] 094/T003 [agent] Parameterized tests in `src/service/scenes/scene-notices.test.ts`, `src/model/shot-timing.test.ts`, and `src/service/contract/matrix.test.ts` (`test.each` tables with shape `[name, { shot, anim, delta }, { expectedNotice, expectedShiftedDelay }]` covering R4 partitions: in/out finishes before shot, in/out starts after shot, compound out-of-bounds, boundary equality, and rebindShot shift equivalence classes), plus replay corpus case for `F-17` in `src/service/contract/corpus/qa-round-11.json` — covers R4
- [ ] 094/T004 [agent] Exclude `"particles"` and `"subtitles"` from `NOT_SHAPES` in `src/service/layout/layout.ts:404` (D1) — covers R1, D1
- [ ] 094/T005 [agent] Skip `shape_overlap` on full-canvas backdrops (`>= 90%` canvas area) in `src/service/layout/layout.ts:411-429,536-551` (D2) — covers R2, D2
- [ ] 094/T006 [agent] Separate slice fill pass and text pass in `pie()` in `src/components/chart/draw.ts:143-166` and format label text with value when `showValues: true` (D3) — covers R3, D3
- [ ] 094/T007 [agent] Add `animOutsideShotNotices` in `src/service/scenes/scene-notices.ts:159-196` and register in `RULES` in `src/service/contract/rules.ts` (D4) — covers R4, D4
- [ ] 094/T008 [agent] Shift `anim.in.delay` and `anim.out.delay` in `src/model/shot-timing.ts:63-97` on shot rebind / move (D4) — covers R4, D4
- [ ] 094/T009 [agent] Docs: update `docs/components.md` for chart `showValues` formatting, update `docs/qa-log.md` status for `F-08`, `F-10`, `F-14`, and `F-17` to Closed, and verify `.agents/skills/lienzo-usage/SKILL.md` (D5) — covers R5, D5
- [ ] 094/T010 [agent] Verify: run `pnpm test` (including `matrix.test.ts` and `silence.test.ts`), `pnpm replay`, and `pnpm typecheck`, confirming all test suites and replay corpus cases pass; record `verified:` — covers R1–R5, D1–D5

## Changes
- 2026-11-03: Audit corrections applied before task execution (F1–F8):
  - F1: Added Requirement R5, Design D5, and Task T009 covering documentation updates (`docs/components.md` for `chart` `showValues` formatting) and updating finding statuses (`F-08`, `F-10`, `F-14`, `F-17`) in `docs/qa-log.md` to Closed per AGENTS.md rules.
  - F2: Split composite Design D1 into D1 (R1: excluding particles and subtitles from `NOT_SHAPES`) and D2 (R2: canvas-sized backdrop plates in `shapesStack`/`layout.ts`) adhering to SRP (ENG-2).
  - F3: Clarified `shapesStack` canvas area parameter / caller check in `layout.ts:536-551` where `area >= 0.9 * scene.width * scene.height` is evaluated.
  - F4: Corrected function references in D4 (`shiftElementTracks` / `rebindShot` in `src/model/shot-timing.ts` rather than nonexistent `shiftElement`).
  - F5: Added systematic input space partitions across R1–R4 covering boundary values (`0.89` vs `0.90` canvas area), compound errors (`anim.in` and `anim.out` both out of bounds), narrow slice sweeps (`<= 0.25 rad`), and rebind shift equivalence classes (TEST-I1, TEST-I2, TEST-I3).
  - F6: Expanded `### Trade-offs & Mitigations` with explicit pros, cons, and mitigations across all design decisions D1–D5 (ENG-6).
  - F7: Decomposed monolithic test and implementation tasks into single-responsibility units (T001–T010), adding explicit parameterized test table shapes (`test.each`), exact file paths, equivalence classes, and replay corpus cases for all findings (`F-08`, `F-10`, `F-14`, `F-17`).
  - F8: Added `## Changes` section documenting audit discrepancies F1–F8.
