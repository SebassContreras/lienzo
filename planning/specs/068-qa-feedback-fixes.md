# 068 — qa-feedback-fixes

## Goal
A QA run of the tools on a scratch project found seven rough edges. When this spec is done, a shape given only a `color` is flat, group children use the group's own pixels, misordered gradient stops are rejected, and the tools say when an element leaves the canvas, round the coordinates they compute, honor `patch.id` and fill a partial `scene_create` background.

## Requirements
- R1: Gradient stops out of order (`at` decreasing) fail validation.
- R2: An element built from a kind (compact scene or `element_add`) whose input sets a fill's `color` but none of `gradient`, `color2`, `type`, `stops` draws a flat color.
- R3: A group built from a kind whose input sets `w`/`h` but not `cw`/`ch` gets `cw = w`, `ch = h`, so its children are in the group's pixels.
- R4: `element_add` returns a notice when the added top-level element's box leaves the canvas, pointing at `w` for long text.
- R5: `element_add` honors `patch.id` when it is free in the scene, and fails when it is taken.
- R6: Positions computed by `at` and boxes returned by `scene_inspect_layout` are rounded to two decimals.
- R7: `scene_create` merges a partial `data.background` onto the default background.

## Design
- D1 (R1): `StopsSchema` refines that every `at` is ≥ the previous one; equal stays allowed (hard edges).
- D2 (R2, R3): `impliedFields(el, input)` (`src/service/compact/implied.ts`) runs after the input is merged into a kind's default element, in `buildElement` and `element_add`: any object of the input holding `color` whose element counterpart has a boolean `gradient`, with no gradient key in the input, gets `gradient: false`; a group with no `cw`/`ch` in the input takes its `w`/`h`. Presets are left alone, their look is the recipe's.
  - _Trade-offs_: A compact rect with only a color no longer shows the library's default gradient.
  - _Mitigation_: Writing `gradient: true` (or `color2`/`stops`) keeps it; the editor library is unchanged.
- D3 (R4): `element_add` checks `boxOf` of the placed top-level element against the scene size and adds a notice with the box.
- D4 (R5): `element_add` sets the element's id from `patch.id`, failing with `duplicate_id` if any element at any depth has it.
- D5 (R6): `placeAt` and `layoutBoxes` round with `round2`.
- D6 (R7): `scene_create` deep-merges an object `data.background` onto the defaults' background before validating.

## Tasks
- [x] 068/T001 [agent] Ordered gradient stops — covers R1, D1
- [ ] 068/T002 [agent] Implied flat fill and group content size — covers R2, R3, D2
- [ ] 068/T003 [agent] element_add: out-of-canvas notice and `patch.id` — covers R4, R5, D3, D4
- [ ] 068/T004 [agent] Rounded placement and boxes; partial background in scene_create — covers R6, R7, D5, D6
- [ ] 068/T005 [agent] Verify: typecheck, lint of touched files, tests — covers R1, R2, R3, R4, R5, R6, R7
