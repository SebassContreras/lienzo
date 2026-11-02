# 092 — group-children-shot-and-placement

## Goal
Ensure group children agree across all writers (`scene_build`, `scene_create`, `element_add`, `element_update`, `shot_set`) on two contracts discovered in the 2026-11-02 QA audit (`F-03`, `F-04`): (1) a `counter` or preset with tracks inside a shot-bound group (`shot: "s2"`) starts its default tracks at the ancestor group's shot `start` in `scene_build` and `element_add`, and (2) `element_update` with `at` on a group child (`id: "g/child"`) places the child inside the parent group's content box (`cw × ch`) instead of the root canvas (`width × height`). Verification: `pnpm test`, `pnpm replay`, and `pnpm typecheck` pass.

## Context (Animator QA `V2-product` and `V5-errors`, 2026-11-02)
- **Origin classification against prior specs (`051`, `069`, `072`, `074`, `075`, `080`, `082`):**
  - **`F-03` (Missing cell / Gap in `072`, `074` & `075/R1`, Class 1 — `src/service/compact/expand.ts:291-293,319-331`, `src/service/elements/tools/element-add.ts:120-124`, `src/components/counter/count-up.ts:22-35` vs `src/model/shot-timing.ts:86-97`):**
    - Spec `075` (`075/R1`, `075/D1`) centralized the rule *"a shot-bound element animates while its shot is on screen"* in `src/model/shot-timing.ts`. When `rebindShot` (`src/model/shot-timing.ts:86-97`) or `shot_set` moves a group to `shot: "s2"` (`start: 4, end: 8`), it recursively shifts the tracks of the group's children to `t = 4..5.5s`.
    - However, `expand.ts:291-293` (`buildElement` for `group` children) and `element-add.ts:120-124` (when `parent` is passed) call `withCountUp(element, raw, state.timing)` / `fromShotStart` checking only `element.shot` on the child itself (which is `undefined` because `shot` lives on the parent group per `069/D13` and `080/R4`). Consequently, a `counter` inside a group bound to `shot: "s2"` gets its `progress` track timed at `t = 0..1.5s` and finishes counting before `s2` even starts (`qa/evidence/v5-errors-battery.json` `writerDiscrepancyRepros.child_counter_in_shot_group`, `qa/evidence/product-s3.png`).
  - **`F-04` (Missing cell / Gap in `051` & `082/R7` "Writers agree", Class 1 — `src/service/elements/tools/element-update.ts:65` vs `src/service/elements/tools/element-add.ts:134-136` and `src/service/compact/expand.ts:481-484`):**
    - `scene_build` (`expand.ts:481-484`) and `element_add` with `parent` (`element-add.ts:134-136`) resolve `at` on a group child against `{ width: parentGroup.cw, height: parentGroup.ch }`.
    - `element_update` (`src/service/elements/tools/element-update.ts:65`) calls `placeAt(out, at, s)` with the root scene `s` (`width × height`), moving `"s1-box/s1-box-pill"` (`w: 300, h: 80` inside a `700×260` group on a `1080×1920` canvas) to `x: 390, y: 920` instead of `x: 200, y: 90` (`qa/evidence/v5-errors-battery.json` `writerDiscrepancyRepros.group_child_at_center`).

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | Pass inherited `shot` / parent box through existing parameters; no new abstractions. |
| 2 SRP | Shot timing resolution stays in `shot-timing.ts` / `expand.ts`; placement box resolution stays in element tools. |
| 3 DRY by composition | Reuse `findElement` / parent group box lookup across `element_add` and `element_update`. |
| 5 Stack standards | Replay corpus entries added for both findings (`F-03`, `F-04`). |
| 6 Trade-offs | Documented pros, cons, and mitigations in Design. |
| TESTING.md | Parameterized table tests over all writers and nesting levels. |

## Requirements
- R1 (`F-03`): When building or adding a child inside a group (`scene_build` in `src/service/compact/expand.ts:291-293,319-331` and `element_add` with `parent` in `src/service/elements/tools/element-add.ts:120-124`), default `counter` tracks (`withCountUp` in `src/components/counter/count-up.ts:22-35`) and preset tracks (`fromShotStart`) use `child.shot ?? ancestorShot` to resolve the shot start time.
  - Partitions:
    - Top-level `counter` with `shot: "s2"` (`start: 4`) → `progress` track at `4..5.5s`.
    - Child `counter` (no `shot` on child) inside a group with `shot: "s2"` (`start: 4`) via `scene_build` (`compact`) → `progress` track at `4..5.5s`.
    - Child `counter` (no `shot` on child) added via `element_add` (`parent: "g2"`) into a group with `shot: "s2"` (`start: 4`) → `progress` track at `4..5.5s`.
    - Nested group child (`gOuter/gInner/cnt`) where `gOuter` has `shot: "s2"` → `progress` track at `4..5.5s`.
    - Child `counter` inside an unbound group (`shot` omitted) → `progress` track at `0..1.5s`.
    - Child `counter` with explicit `tracks.progress` provided by caller → caller's track keys are preserved (`fromShotStart` shifts relative keys once from `ancestorShot`).
  - Invariant: `scene_build`, `element_add` (`parent`), and `element_update` (`shot` rebind) produce identical `progress` track timestamps (`4..5.5s`) for a `counter` inside a `shot: "s2"` group.
- R2 (`F-04`): In `src/service/elements/tools/element-update.ts:65`, when `at` is provided and `id` addresses a group child (`"group/child"` or deeper `"g1/g2/child"`), `placeAt` resolves coordinates against the immediate parent group's content dimensions `{ width: parent.cw, height: parent.ch }` instead of the root scene `{ width: s.width, height: s.height }`.
  - Partitions:
    - Top-level element `id: "el"` with `at: "center"` → placed against `{ width: s.width, height: s.height }`.
    - Direct group child `id: "g/child"` with `at: "center"` (and all 9 `at` anchors + `[x, y]` tuple) → placed against `{ width: g.cw, height: g.ch }`.
    - Nested group child `id: "g1/g2/child"` with `at: "bottom-right"` → placed against `{ width: g2.cw, height: g2.ch }`.
  - Invariant: for any group `g` and child `c`, `scene_build` with `at`, `element_add` with `parent: "g", at`, and `element_update` with `id: "g/c", at` yield identical `(x, y)` coordinates on `c`.

### Who it serves
All multi-shot scenes using grouped cards (`metricCard`, composite presets) and targeted updates (`element_update`).

### Out of scope
- Changing how `shot` visibility is evaluated at render time (children already inherit visibility from their parent group).

### Dependencies
- None.

### Owner split
Agent tasks.

## Design
- D1 (R1): In `src/service/compact/expand.ts:291-293,319-331`, thread `inheritedShot?: string` through `buildElement(raw, state, pathPrefix, inheritedShot)` so a group passes `el.shot ?? inheritedShot` to its children, and pass `{ ...element, shot: element.shot ?? inheritedShot }` (or `effectiveShot`) into `fromShotStart` and `withCountUp`. In `src/service/elements/tools/element-add.ts:120-124`, resolve the ancestor group's effective `shot` when `parent` is given and pass it to `fromShotStart` and `withCountUp`.
- D2 (R2): In `src/service/elements/tools/element-update.ts:65`, when `id.includes("/")`, look up the parent group (`id.slice(0, id.lastIndexOf("/"))`) via `findElement(s.elements, parentPath)` and pass `{ width: parent.cw, height: parent.ch }` as the box argument to `placeAt(out, at, box)`.

### Trade-offs & Mitigations
- D1. Pros: makes `scene_build` and `element_add` agree with `rebindShot` (`shot-timing.ts:86-97`) without storing redundant `shot` fields on child elements. Cons: `buildElement` takes one optional parameter `inheritedShot`. Mitigation: default `undefined` preserves all top-level calls unchanged.
- D2. Pros: 3-line fix in `element-update.ts:65` that aligns `element_update` with `element-add.ts:134-136` and `expand.ts:481-484`. Cons: none. Mitigation: covered by writer-agreement matrix tests and replay corpus cases.

## Tasks
- [ ] 092/T001 [agent] Write failing tests in `src/service/compact/expand.test.ts` and `src/service/elements/tools/element-tools.test.ts` (`test.each` tables covering R1 and R2 partitions: top-level, 1-level group, 2-level nested group, across `scene_build`, `element_add`, and `element_update`), plus replay corpus cases for `F-03` and `F-04` — covers R1, R2
- [ ] 092/T002 [agent] Implement inherited `shot` timing for group children in `src/service/compact/expand.ts:291-293,319-331` and `src/service/elements/tools/element-add.ts:120-124` (D1) — covers R1, D1
- [ ] 092/T003 [agent] Implement parent group `{ width: parent.cw, height: parent.ch }` resolution for `at` in `src/service/elements/tools/element-update.ts:65` (D2) — covers R2, D2
- [ ] 092/T004 [agent] Verify: run `pnpm test`, `pnpm replay`, and `pnpm typecheck`, update `docs/qa-log.md` status for `F-03` and `F-04`, and record `verified:` — covers R1, R2, D1, D2
