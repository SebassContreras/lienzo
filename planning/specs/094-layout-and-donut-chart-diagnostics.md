# 094 — layout-and-donut-chart-diagnostics

## Goal
Eliminate false-positive `shape_overlap` layout diagnostics on full-frame `particles` (`F-08`) and canvas-sized backdrop plates (`F-14`), fix `pie`/`donut` chart slice overpaint and `showValues` rendering (`F-10`), and add a notice + shot-rebind shift when a shot-bound element's `anim.in` or `anim.out` falls outside its shot (`F-17`). Verification: `pnpm test`, `pnpm replay`, and `pnpm typecheck` pass.

## Context (Animator QA `V2-product`, `V3-claims`, `V4-dense`, 2026-11-02)
- **Origin classification against prior specs (`071`, `075`, `080`):**
  - **`F-08` (Gap in `071/D4` & `080/R14`, Class 4 — `src/service/layout/layout.ts:404,411-429,536-551`):**
    - Spec `071/D4` introduced `shapesStack` with `NOT_SHAPES = new Set(["text", "line", "group"])` (`src/service/layout/layout.ts:404`), and Spec `080/R14` treated `particles` as see-through in `contrast.ts` without excluding `"particles"` (or `"subtitles"`) in `layout.ts:404`.
    - When a shot has a full-frame background `s1-bg` (`kind: "rect", w: 1080, h: 1920`) and a full-frame ambient particle field `s1-particles` (`kind: "particles", w: 1080, h: 1920`), `contains(a, b)` is `false` (`area(inner) < 0.9 * area(outer)`) and `shapesStack` (`src/service/layout/layout.ts:411-429`) emits a false-positive `shape_overlap` between `s1-bg` and `s1-particles`.
  - **`F-14` (Side effect of `071/D4` `shapesStack` / `contains`, Class 4 — `src/service/layout/layout.ts:411-429`):**
    - When a foreground card (`s2-oob-card`, `x: 860, y: 1360, w: 360, h: 160`) protrudes 140 px past the right edge of the canvas (`out_of_bounds`), `contains(s2-bg, s2-oob-card)` returns `false` because `inner.x + inner.w <= outer.x + outer.w` fails, while 61% of `s2-oob-card` remains inside `s2-bg` (`1080×1920`). `shapesStack` then reports a redundant, confusing `shape_overlap` against `s2-bg` in addition to `out_of_bounds` (`qa/evidence/v4-dense-layout.json`).
  - **`F-10` (New component bug, Class 2 — `src/components/chart/draw.ts:143-166`):**
    - In `pie()` (`src/components/chart/draw.ts:143-166`, not audited in prior QA rounds with narrow slices and `showValues: true`), each slice arc (`ctx.fill()`) and its label (`ctx.fillText(d.label || short(d.value), ...)`) are drawn inside the same `data.forEach` loop. Subsequent slices (`Renew 25.1%`, `Other 68%`) paint over the text of an earlier narrow slice (`"Solar 6.9%"` is clipped to `"olar 6.9"`, see `qa/evidence/claims-s3-donut-overpaint.png`). Furthermore, `d.label || short(d.value)` hides the numeric value whenever a slice has a label, even when `el.showValues` is `true`.
  - **`F-17` (Incomplete premise in `075/R1` & `075/D1`, Class 4 — `src/model/shot-timing.ts:1-6,86-97`, `src/service/scenes/scene-notices.ts:159-196`, `src/service/layout/layout.ts:108-123`):**
    - Spec `075/R1` and `src/model/shot-timing.ts:1-6` assumed `"its tracks are timed from its shot's start, and an unbound element's from 0, as anim already is"`, yet `anim.in.delay` and `anim.out.delay` are actually evaluated against global scene time `t` (`src/service/layout/layout.ts:108-123`). If an element in `shot: "s2"` (`5.5..11.0s`) has `anim.out.delay: 5.25, duration: 0.25`, it finishes fading out at `t = 5.5s` right as `s2` starts and remains invisible for the entire shot with zero notices from `scene_validate` or `scene_build`. Moreover, `rebindShot` (`src/model/shot-timing.ts:86-97`) shifts `tracks` when a shot moves or an element changes shot, but does not shift `anim.in.delay` or `anim.out.delay`.

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | Small, targeted rules in `layout.ts`, `draw.ts`, `scene-notices.ts`, and `shot-timing.ts`. |
| 2 SRP | Layout overlap stays in `layout.ts`; chart drawing stays in `draw.ts`; notice rules stay in `scene-notices.ts`. |
| 5 Stack standards | Notice rule added to `RULES` and checked across all writers in `matrix.test.ts` and `silence.test.ts`. |
| 6 Trade-offs | Documented pros, cons, and mitigations in Design. |
| TESTING.md | Parameterized table tests over input partitions and invariants. |

## Requirements
- R1 (`F-08`): `scene_inspect_layout` (`src/service/layout/layout.ts:404`) excludes `"particles"` and `"subtitles"` from `shapesStack` (`NOT_SHAPES`).
  - Partitions: full-frame `particles` over `s1-bg` `rect`; partial-frame `particles` overlapping a card; `subtitles` element over a lower-third `rect`.
  - Invariant: `particles` and `subtitles` never appear as either element of a `shape_overlap` diagnostic.
- R2 (`F-14`): `shapesStack` (`src/service/layout/layout.ts:411-429`) does not report `shape_overlap` when the larger box covers at least 90% of the canvas area (`area(outer) >= 0.9 * scene.width * scene.height`), acting as a full-bleed shot backdrop plate (`s1-bg`, `s2-bg`).
  - Partitions:
    - Full-canvas backdrop `s2-bg` (`0, 0, 1080, 1920`) and an in-bounds card (`100, 100, 400, 200`) → no `shape_overlap`.
    - Full-canvas backdrop `s2-bg` (`0, 0, 1080, 1920`) and a partially off-canvas card (`860, 1360, 360, 160`) → reports `out_of_bounds` on the card, and zero `shape_overlap` against `s2-bg`.
    - Two foreground cards (`400×200` and `400×200`) overlapping by >50% → still reports `shape_overlap`.
  - Invariant: foreground shapes overlapping by >50% without containment still trigger `shape_overlap`, while full-canvas backdrop plates never trigger `shape_overlap` against foreground elements.
- R3 (`F-10`): In `src/components/chart/draw.ts:143-166` (`pie()`), all slice arcs are filled in a first pass before any slice labels are drawn in a second pass, and when `el.showValues` is `true` on a slice that has both `d.label` and `d.value`, the label text formats as `` `${d.label} (${short(d.value)})` `` (or `d.label` when `d.label` already contains `short(d.value)`).
  - Partitions:
    - Narrow slice (`6.9%`) followed by wide slices (`25.1%`, `68%`) → narrow slice label is drawn on top of adjacent slice fills, never clipped by subsequent `ctx.fill()`.
    - Slice with `d.label: "Solar"` and `d.value: 6.9` when `showValues: true` vs `showValues: false`.
    - Slice with `d.label: ""` and `d.value: 6.9` → displays `short(d.value)`.
  - Invariant: every slice arc fill executes before any `ctx.fillText` call in `pie()`.
- R4 (`F-17`): When an element bound to a shot (`shot: "s2"`, `[start, end]`) has `anim.in` (`delay + duration <= start` or `delay >= end`) or `anim.out` (`delay + duration <= start` or `delay >= end`) outside `[shot.start, shot.end]`, `contentNotices` (`src/service/scenes/scene-notices.ts:159-196`) emits a Spanish notice naming the element ID and shot ID; and `rebindShot` (`src/model/shot-timing.ts:86-97`) shifts `anim.in.delay` and `anim.out.delay` by the same `delta` as `tracks`.
  - Partitions:
    - Element in `shot: "s2"` (`5.5..11.0s`) with `anim.in.delay: 0.15` (ends at `0.55s < 5.5s`) → emits notice naming the element and `"s2"`.
    - Element in `shot: "s2"` (`5.5..11.0s`) with `anim.in.delay: 5.65` and `anim.out.delay: 10.75` → zero notices.
    - Unbound element (`shot` omitted) with `anim.in.delay: 0.15` → zero notices.
    - Moving `shot: "s2"` from `4..8s` to `6..10s` via `shot_set` or changing `shot` from `"s1"` (`0..4s`) to `"s2"` (`4..8s`) via `element_update` → shifts `anim.in.delay` and `anim.out.delay` by `+2s` / `+4s`.
  - Invariant: the notice rule satisfies `matrix.test.ts` (fires in every scene writer, names the element ID) and `silence.test.ts` (never repeats on an unchanged element).

### Who it serves
All scenes audited with `scene_inspect_layout`, `pie`/`donut` charts, and multi-shot animations using `anim.in` / `anim.out`.

### Out of scope
- Changing `anim.in.delay` / `anim.out.delay` in compact JSON from global seconds to shot-relative seconds (existing scenes and Animator's `label()` helper already pass global timestamps `a` and `b - 0.25`).

### Dependencies
- None.

### Owner split
Agent tasks.

## Design
- D1 (R1, R2): In `src/service/layout/layout.ts:404`, add `"particles"` and `"subtitles"` to `NOT_SHAPES`; in `shapesStack` (`src/service/layout/layout.ts:411-429`), return `false` when `area(outer) >= 0.9 * sceneWidth * sceneHeight`.
- D2 (R3): In `src/components/chart/draw.ts:143-166` (`pie()`), split the `data.forEach` loop into Pass 1 (compute start/end angles, draw and fill each slice path) and Pass 2 (draw each slice label on top), and format the label as `d.label ? (el.showValues && !d.label.includes(short(d.value)) ? `${d.label} (${short(d.value)})` : d.label) : short(d.value)`.
- D3 (R4): Add `animOutsideShotNotices(scene)` in `src/service/scenes/scene-notices.ts:159-196` and register it in `RULES` (`src/service/contract/rules.ts`); in `src/model/shot-timing.ts:86-97` (`shiftElement`), shift `anim.in.delay` and `anim.out.delay` by `delta` (`Math.max(0, round(delay + delta))`).

### Trade-offs & Mitigations
- D1. Pros: removes the two most common false-positive `shape_overlap` diagnostics in multi-shot videos (`particles` and `s1-bg` / `s2-bg` plates) without weakening foreground shape overlap checks. Cons: two full-bleed background plates in the same shot will not trigger `shape_overlap`. Mitigation: deliberate layered backdrops (e.g. `sea` + `blob`) are meant to stack.
- D2. Pros: guarantees slice labels are always legible on top of all slice fills. Cons: very narrow adjacent slices could have labels close to each other. Mitigation: strictly better than having the next slice fill paint over the text.
- D3. Pros: catches the exact bug where an author writes shot-relative `anim` delays on Shot 2+ while keeping global `anim` timestamps backwards-compatible. Cons: shifting `anim` delays on `shot_set` changes `anim.in.delay` alongside `tracks`. Mitigation: matches `shot-timing.ts:1-6` and user expectation when moving a shot on the timeline.

## Tasks
- [ ] 094/T001 [agent] Write failing tests in `src/service/layout/layout.test.ts`, `src/components/chart/chart.test.ts`, and `src/service/scenes/scene-notices.test.ts` (`test.each` tables over R1–R4 partitions), plus replay corpus cases for `F-08` and `F-14` — covers R1–R4
- [ ] 094/T002 [agent] Exclude `"particles"` and `"subtitles"` from `NOT_SHAPES` (`src/service/layout/layout.ts:404`) and skip full-canvas backdrops (`>= 90%` canvas area) in `shapesStack` (`src/service/layout/layout.ts:411-429`) (D1) — covers R1, R2, D1
- [ ] 094/T003 [agent] Separate slice fill pass and text pass in `pie()` (`src/components/chart/draw.ts:143-166`) and render `d.label` + `short(d.value)` when `showValues: true` (D2) — covers R3, D2
- [ ] 094/T004 [agent] Add `animOutsideShotNotices` in `src/service/scenes/scene-notices.ts:159-196` and `src/service/contract/rules.ts`, and shift `anim.in.delay` / `anim.out.delay` in `src/model/shot-timing.ts:86-97` (D3) — covers R4, D3
- [ ] 094/T005 [agent] Verify: run `pnpm test` (including `matrix.test.ts` and `silence.test.ts`), `pnpm replay`, and `pnpm typecheck`, update `docs/qa-log.md` status for `F-08`, `F-10`, `F-14`, and `F-17`, and record `verified:` — covers R1–R4, D1–D3
