# 064 — tool-honesty-and-concise-results — Changes

## 2026-10-25 — Every flat kind has a border glow
Why: T001 showed that ellipse, polygon, star and arrow share the rect fields, `borderGlow` included, so the presence check of D1 guards nothing (KISS).
- R1@1 reworded (meaning unchanged; reviewed with `trace review`)
- REMOVED D1@1
- ADDED D6@1
- Tasks: T002 re-pointed to D6@1 (not started)

## 2026-10-25 — Estimated widths are their own notice
Why: measuring in Node uses only the bundled fonts, so a font installed with `font_install` is estimated too but never reported missing; tying the notice to `fontNotices` would miss it.
- MODIFIED D3@1 → D3@2
- Tasks: T006 re-pointed to D3@2 (not started)

## 2026-10-25 — Built
Why: the new notice (R4) and the concise result (R6) change what older tests pinned exactly, so those tests now list the estimated-width notice and read the saved scene from disk instead of the reply; none was loosened.
- Tasks: T001–T010 done

## 2026-10-25 — One tool-test harness
Why: `service.test.ts` kept its own copy of the setup `tool-harness.ts` now shares.
- ADDED D7@1
- Tasks: T011

## 2026-10-25 — Estimated boxes inside groups; no notice dedupe
Why: the review after building found that a text inside a group, or a subtitles element, was warned about but its box was not marked; and dropping duplicate notices guarded a case never seen.
- MODIFIED D3@2 → D3@3
- MODIFIED D4@1 → D4@2
- Tasks: T012, T013, T014; T006 and T008 still valid for the parts they built

## 2026-10-25 — `use` boxes, italic, inert anim slots
Why: the second review left two gaps (a third, an unmarked `use`, turned out not to exist: its symbol's text is already its own marked box): the estimate check did not pass `italic` like the measurer does, and an `anim` slot of kind `none` still showed its settings (e.g. an exit delay of 3) in what tools return.
- MODIFIED D3@3 → D3@4
- ADDED R7@1
- ADDED D8@1
- Tasks: T016–T018; T015 (a `use` test) dropped before it was built; T006 and T013 still valid

## 2026-10-25 — Inert anim slots stay whole
Why: building D8 showed that the scene schema requires every setting of an `anim` slot (it fills none of them on parse), so a scene returned with `{ "kind": "none" }` slots could not be passed back to `scene_inspect_layout`, `scene_validate` or any other tool. Keeping the returned scene reusable matters more than hiding inert settings, and the concise result (D5) already leaves the scene out by default. Decided with the user.
- REMOVED R7@1
- REMOVED D8@1
- Tasks: T019 retires T017; T018 (blocked, nothing built) deleted

## 2026-10-25 — A background string that is not a preset
Why: a real build with `background: "#111827"` drew the default navy background with dots and no notice: a string is looked up only as a preset name and an unknown one fell back silently, the same class of bug as 063/R6.
- ADDED R8@1
- ADDED D9@1
- Tasks: T020, T021

## 2026-10-25 — A background object starts solid
Why: after R8, `"#111827"` drew a solid background but `{ "color": "#111827" }` kept the default gradient, dots and light; the user chose to make both mean the same.
- ADDED R9@1
- ADDED D10@1
- Tasks: T022, T023
- `expand.test.ts` "expands background with deep merge" asserted the old look (`gradient: true` for `{ color, dots: false }`); R9 changes that requirement, so it now asserts `false`.

## 2026-10-25 — Compact input in validate, clearer `at`, italic named
Why: an agent found that only `scene_build` accepts the compact form, that a `{ x, y }` `at` fails with a bare "Invalid input", and that `fontStyle` is rejected without the skill naming `italic`.
- ADDED R10@1, R11@1, R12@1
- ADDED D11@1, D12@1, D13@1
- Tasks: T024–T027

## 2026-10-25 — `at` is the same in every tool
Why: the user asked that every option be written the same way in every tool; `at` was a point in `element_add`/`element_update` and an anchor in `scene_build`. (`italic` was checked: it is the only name for italic in every tool.)
- MODIFIED R11@1 → R11@2
- MODIFIED D12@1 → D12@2
- Tasks: T028, T029 retires T026; T024 re-pointed to R11@2 (its `at` test still holds)
