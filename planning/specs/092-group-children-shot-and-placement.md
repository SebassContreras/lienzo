# 092 — group-children-shot-and-placement

## Goal
Ensure group children agree across all relevant writers (`scene_build`, `element_add`, `element_update`, `shot_set`) on two contracts discovered in the 2026-11-02 QA audit (`F-03`, `F-04`): (1) a `counter` or preset with tracks inside a shot-bound group (`shot: "s2"`) starts its default tracks at the ancestor group's shot `start` in `scene_build` and `element_add`, and (2) `element_update` with `at` on a group child (`id: "g/child"` or bare unique `id`) places the child inside the parent group's content box (`cw × ch`) instead of the root canvas (`width × height`). Tool descriptions and skill documentation are kept in sync per AGENTS.md rules. Verification: `pnpm test`, `pnpm replay`, and `pnpm typecheck` pass.

## Context (Animator QA `V2-product` and `V5-errors`, 2026-11-02)
- **Origin classification against prior specs (`051`, `069`, `072`, `074`, `075`, `080`, `082`):**
  - **`F-03` (Missing cell / Gap in `072`, `074` & `075/R1`, Class 1 — `src/service/compact/expand.ts:291-293,319-331`, `src/service/elements/tools/element-add.ts:120-124`, `src/components/counter/count-up.ts:22-35` vs `src/model/shot-timing.ts:86-97`):**
    - Spec `075` (`075/R1`, `075/D1`) centralized the rule *"a shot-bound element animates while its shot is on screen"* in `src/model/shot-timing.ts`. When `rebindShot` (`src/model/shot-timing.ts:86-97`) or `shot_set` moves a group to `shot: "s2"` (`start: 4, end: 8`), it recursively shifts the tracks of the group's children to `t = 4..5.5s`.
    - However, `expand.ts:291-293` (`buildElement` for `group` children) and `element-add.ts:120-124` (when `parent` is passed) call `withCountUp(element, raw, state.timing)` / `fromShotStart` checking only `element.shot` on the child itself (which is `undefined` because `shot` lives on the parent group per `069/D13` and `080/R4`). Consequently, a `counter` or preset with tracks inside a group bound to `shot: "s2"` gets its default tracks timed at `t = 0..1.5s` and finishes before `s2` even starts (`qa/evidence/v5-errors-battery.json` `writerDiscrepancyRepros.child_counter_in_shot_group`, `qa/evidence/product-s3.png`).
  - **`F-04` (Missing cell / Gap in `051` & `082/R7` "Writers agree", Class 1 — `src/service/elements/tools/element-update.ts:65` vs `src/service/elements/tools/element-add.ts:134-136` and `src/service/compact/expand.ts:481-484`):**
    - `scene_build` (`expand.ts:481-484`) and `element_add` with `parent` (`element-add.ts:134-136`) resolve `at` on a group child against the group's content box `{ width: parentGroup.cw, height: parentGroup.ch }` (with fallback to `w × h`).
    - `element_update` (`src/service/elements/tools/element-update.ts:65`) calls `placeAt(out, at, s)` with the root scene `s` (`width × height`), moving `"s1-box/s1-box-pill"` (`w: 300, h: 80` inside a `700×260` group on a `1080×1920` canvas) to `x: 390, y: 920` instead of `x: 200, y: 90` (`qa/evidence/v5-errors-battery.json` `writerDiscrepancyRepros.group_child_at_center`).

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | Pass inherited `shot` / parent box through existing parameters; no new abstractions. |
| 2 SRP | Shot timing resolution stays in `shot-timing.ts` / `expand.ts`; placement box resolution stays in element tools; tests partitioned into dedicated suites. |
| 3 DRY by composition | Reuse `findElement` / parent group box lookup across `element_add` and `element_update`. |
| 5 Stack standards | Pure transformations; tool descriptions and `lienzo-usage` skill updated in the same change; replay corpus entries added for both findings (`F-03`, `F-04`). |
| 6 Trade-offs | Documented pros, cons, and mitigations in Design. |
| TESTING.md | Parameterized table tests over all writers, input partitions, boundaries, and nesting levels. |

## Requirements
- R1 (`F-03`): When building or adding a child inside a group (`scene_build` in `src/service/compact/expand.ts:291-293,319-331` and `element_add` with `parent` in `src/service/elements/tools/element-add.ts:120-124`), default `counter` tracks (`withCountUp` in `src/components/counter/count-up.ts:22-35`) and preset tracks (`fromShotStart` in `src/model/shots.ts:294`) use `child.shot ?? ancestorShot` to resolve the shot start time without persisting redundant `shot` properties on child elements.
  - Partitions:
    - Nominal: Top-level `counter` with `shot: "s2"` (`start: 4`) → `progress` track at `4..5.5s`.
    - Nominal: Child `counter` (no `shot` on child) inside a group with `shot: "s2"` (`start: 4`) via `scene_build` (`compact`) → `progress` track at `4..5.5s`.
    - Nominal: Child `counter` (no `shot` on child) added via `element_add` (`parent: "g2"`) into a group with `shot: "s2"` (`start: 4`) → `progress` track at `4..5.5s`.
    - Nominal: Preset with default tracks inside a group with `shot: "s2"` (`start: 4`) via `scene_build` → preset tracks shifted to start at `4s`.
    - Nominal: Preset with default tracks added via `element_add` (`parent: "g2"`) into a group with `shot: "s2"` (`start: 4`) → preset tracks shifted to start at `4s`.
    - Nesting: 2-level nested group child (`gOuter/gInner/cnt`) where `gOuter` has `shot: "s2"` and `gInner` has no `shot` → `progress` track at `4..5.5s`.
    - Boundary: Shot with `start: 0` (`s1`) → track starts at `0s` (delta 0).
    - Boundary: Child `counter` inside an unbound group (`shot` omitted) → `progress` track at `0..1.5s`.
    - Boundary: Child `counter` with explicit `tracks.progress` provided by caller → caller's track keys are preserved as given without auto-timing overrides.
    - Boundary: Child with explicit `shot` (`child.shot: "s1"`) inside group bound to `"s2"` → `child.shot` takes precedence over `ancestorShot`.
  - Invariant: `scene_build`, `element_add` (`parent`), and `element_update` (`shot` rebind) produce identical `progress` track timestamps (`4..5.5s`) for a `counter` inside a `shot: "s2"` group.
- R2 (`F-04`): In `src/service/elements/tools/element-update.ts:65`, when `at` is provided and `id` addresses a group child (by slash path `"group/child"` or bare unique `id`), `placeAt` resolves coordinates against the immediate parent group's content dimensions `{ width: parent.cw, height: parent.ch }` (falling back to `{ width: parent.w, height: parent.h }`) instead of the root scene `{ width: s.width, height: s.height }`.
  - Partitions:
    - Top-level element `id: "el"` with `at: "center"` → placed against `{ width: s.width, height: s.height }`.
    - Direct group child by slash path `id: "g/child"` with `at: "center"` (and all 9 `at` anchors + `{ anchor, offset }` + `[x, y]` tuple) → placed against `{ width: g.cw, height: g.ch }`.
    - Direct group child by bare unique id `id: "child"` with `at: "center"` → placed against `{ width: g.cw, height: g.ch }`.
    - Nested group child by slash path `id: "g1/g2/child"` with `at: "bottom-right"` → placed against `{ width: g2.cw, height: g2.ch }`.
    - Group child inside group lacking explicit `cw`/`ch` → falls back to `{ width: parent.w, height: parent.h }`.
  - Invariant: for any group `g` and child `c`, `scene_build` with `at`, `element_add` with `parent: "g", at`, and `element_update` with `id: "g/c"` (or bare `id`) and `at` yield identical `(x, y)` coordinates on `c`.
- R3: Tool descriptions, agent usage skill, and QA log reflect the group child placement and shot timing contracts per AGENTS.md rules:
  - `src/service/elements/tools/element-update.ts` description clarifies that `at` places the patched element against the scene canvas, or against the parent group's content box when targeting a group child.
  - `.agents/skills/lienzo-usage/SKILL.md` notes that `element_update` with `at` resolves within the parent group's coordinate box for grouped elements.
  - `docs/qa-log.md` status for `F-03` and `F-04` updated to Closed upon verification.

### Who it serves
All multi-shot scenes using grouped cards (`metricCard`, composite presets) and targeted updates (`element_update`).

### Out of scope
- Changing how `shot` visibility is evaluated at render time (children already inherit visibility from their parent group).
- Supporting `at` in `scene_create` (full-schema creation ignores `at` by contract).

### Dependencies
- None.

### Owner split
Agent tasks.

## Design
- D1 (R1): In `src/service/compact/expand.ts:291-293,319-331`, thread `inheritedShot?: string` through `buildElement(raw, state, pathPrefix, inheritedShot)` so a group passes `el.shot ?? inheritedShot` to its children, and pass `{ ...element, shot: element.shot ?? inheritedShot }` into `fromShotStart` and `withCountUp`. In `src/service/elements/tools/element-add.ts:120-124`, when `parent` is given, resolve the parent group's effective shot and pass it to `fromShotStart` and `withCountUp`. In `src/service/compact/expand.ts:481-484`, ensure group layout pass resolves against `(size as GroupEl).cw ?? size.w`.
- D2 (R2): In `src/service/elements/tools/element-update.ts:65`, when `at` is passed, resolve the element's container box: determine whether the target element is nested inside a group (via slash path `id.includes("/")` or via ancestor indices from `resolvePath(s.elements, id)`). If nested, locate the immediate parent group and pass `{ width: parent.cw ?? parent.w, height: parent.ch ?? parent.h }` to `placeAt(out, at, box)`; otherwise pass the root scene `s`.
- D3 (R3): Update tool description text in `src/service/elements/tools/element-update.ts` and documentation in `.agents/skills/lienzo-usage/SKILL.md` to state that `at` places against the parent group's content box for group children.

### Trade-offs & Mitigations
- D1. Pros: makes `scene_build` and `element_add` agree with `rebindShot` (`shot-timing.ts:86-97`) without storing redundant `shot` fields on child elements. Cons: `buildElement` takes one optional parameter `inheritedShot`. Mitigation: default `undefined` preserves all top-level calls unchanged.
- D2. Pros: eliminates writer discrepancy between `element_update`, `element_add`, and `scene_build`. Cons: ancestor group resolution incurs an element tree traversal (inspecting slash segments or index path) before placement. Mitigation: `resolvePath` already computes ancestor indices during `updateElement`, adding negligible in-memory overhead.
- D3. Pros: keeps tool descriptions and agent usage documentation synchronized with runtime behavior as required by AGENTS.md. Cons: none. Mitigation: covered by tool description and doc assertions.

## Tasks
- [ ] 092/T001 [agent] Parameterized tests in `src/service/compact/expand.test.ts` and `src/service/elements/tools/counter-count-up.test.ts` (`test.each` tables with shape `[description, { input, parent?, shot?, expectedStart }]` covering R1 partitions: top-level counter, 1-level group child, 2-level nested group child, presets with tracks, explicit tracks preserved, start 0 boundary), plus replay corpus case for `F-03` — covers R1
- [ ] 092/T002 [agent] Parameterized tests in `src/service/elements/tools/nested-elements.test.ts` and `src/service/elements/tools/element-update.test.ts` (`test.each` tables with shape `[description, { id, at, expectedPos }]` covering R2 partitions: top-level element, slash path group child, bare id group child, 2-level nested group child, 9 anchors + offset, custom cw × ch box), plus replay corpus case for `F-04` — covers R2
- [ ] 092/T003 [agent] Implement inherited `shot` timing for group children in `src/service/compact/expand.ts:291-293,319-331,481-484` and `src/service/elements/tools/element-add.ts:120-124` (D1) — covers R1, D1
- [ ] 092/T004 [agent] Implement parent group content box resolution for `at` in `src/service/elements/tools/element-update.ts:65` (D2) — covers R2, D2
- [ ] 092/T005 [agent] Docs: update `element_update` description in `src/service/elements/tools/element-update.ts`, update `.agents/skills/lienzo-usage/SKILL.md`, and update `docs/qa-log.md` entries for `F-03` and `F-04` (D3) — covers R3, D3
- [ ] 092/T006 [agent] Verify: run `pnpm test`, `pnpm replay`, and `pnpm typecheck`, confirming all R1–R3 partitions and replay corpus cases pass; record `verified:` — covers R1, R2, R3, D1, D2, D3

## Changes
- 2026-11-02: Audit corrections applied before task execution (F1–F7):
  - F1: Clarified Goal and Out of scope to distinguish writers supporting `at` and auto shot timing (`scene_build`, `element_add`, `element_update`, `shot_set`) from `scene_create` (which ignores `at` with a notice by contract).
  - F2: Added systematic input space partitions to R1 covering presets with default tracks, nested groups, start 0 boundary, explicit caller tracks, and child shot precedence (TEST-I1, TEST-I3).
  - F3: Added partitions to R2 covering group children targeted by bare unique id and parent box fallback to `w × h` when `cw`/`ch` omitted (TEST-I1, TEST-I2).
  - F4: Added requirement R3, design D3, and task T005 covering tool description update in `element-update.ts` and `.agents/skills/lienzo-usage/SKILL.md` per AGENTS.md rules.
  - F5: Replaced invalid "Cons: none" in D2 trade-offs with concrete tree traversal cost analysis and mitigation (ENG-6).
  - F6: Restructured tasks into SRP-aligned units (T001 for R1 test suite, T002 for R2 test suite, T003 for D1 implementation, T004 for D2 implementation, T005 for docs/descriptions, T006 for verification) citing dedicated test files and specifying table shapes and equivalence classes (ENG-2, TEST-I2, TEST-I3, TEST-H2).
  - F7: Added `## Changes` section documenting audit discrepancies F1–F7.
