# 091 — compact-trailing-easing-normalization

## Goal
In compact scene expansion (`expandScene`), normalize an inoperative easing on a track's trailing keyframe to `"auto"` when parsed from compact shorthand arrays (`[[t, value, easing], ...]`), so generator builds and MCP calls do not emit noisy `dead easing` notices for harmless trailing easings while preserving the notice for explicit editor keyframes. Verification: `pnpm test` and `pnpm typecheck` pass; a compact track with trailing easing expands cleanly with zero dead easing notices.

## Context (Animator video `pulse-speed`, 2026-11-02)
- In Lienzo, Spec 065 Requirement R4 emits a notice when any track's last keyframe specifies an easing other than `"auto"` or `"linear"`, because easings apply to the segment leading to the next keyframe.
- When automated generators or external AI agents produce compact scenes, specifying easing symmetrically on keyframes (e.g., `[[0, 0, "ease-out"], [1, 100, "ease-out"]]`) is a common intuitive shorthand.
- In compact scene expansion (`src/service/compact/expand.ts`), compact shorthand is already transformed into full schema. Normalizing the final keyframe's easing to `"auto"` when converting shorthand arrays eliminates false-positive notices for automated workflows without altering animation curves.

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | A single normalization step during compact shorthand expansion. |
| 2 SRP | Expander handles input shorthand normalization; validation rules remain untouched. |
| 5 Stack standards | Pure transformation in `expand.ts`; docs updated in the same change. |
| 6 Trade-offs | Documented pros, cons, and mitigations in Design. |
| TESTING.md | Parameterized table tests over input partitions; invariants verified. |

## Requirements
- R1: When expanding compact element or camera tracks from array shorthand (`[[t, value, easing], ...]`), if the last keyframe has an easing, it is normalized to `"auto"`.
  - Partitions:
    - Nominal 2+ keyframes shorthand array (`[[0, 0, "linear"], [1, 100, "ease-out"]]`) with trailing easing normalized to `"auto"`.
    - Single-keyframe shorthand array (`[[0, 10, "ease-in"]]`) normalized to `"auto"`.
    - Shorthand array without trailing easing or already `"auto"`/`"linear"` (`[[0, 0], [1, 100]]` or `[1, 100, "auto"]`) left unchanged as `"auto"`.
    - Object-wrapped track shorthand (`{ keys: [[0, 0, "linear"], [1, 100, "ease-out"]], repeat: "loop" }`) normalized to `"auto"`.
    - Explicit object keyframes (`[{ t: 0, value: 0 }, { t: 1, value: 100, easing: "ease-out" }]`): trailing easing is preserved untouched.
    - Camera tracks shorthand (`camera.tracks` in shot) normalized identically to element tracks (including nested elements in groups and templates).
    - Empty tracks or bare arrays (`[]`): unchanged.
  - Invariants:
    - Internal keyframes retain their specified easings unchanged.
    - Animation playback and interpolation values are byte-for-byte identical.
    - `deadKeyframeEasingNotices` continues to fire for non-compact scenes or when explicit full-schema tracks specify an inoperative trailing easing.
- R2: `.agents/skills/lienzo-usage/SKILL.md` notes that compact shorthand array tracks (`[[t, value, easing?], ...]`) automatically normalize trailing inoperative easings to `"auto"` during expansion.

### Who it serves
Generator-driven and agentic video workflows (Animator).

### Out of scope
- Changing `deadKeyframeEasingNotices` logic for full-schema scene validation.

### Dependencies
- None.

### Owner split
Agent tasks.

## Design
- D1 (R1): In `src/service/compact/expand.ts`, during the expansion of shorthand track arrays for element tracks (in `buildElement`, including recursive group and template children) and shot camera tracks, normalize the trailing keyframe's easing property to `"auto"`.
- D2 (R1): Normalization is strictly scoped to array-shorthand tuples (`[t, value, easing?]`); explicit full-schema keyframe objects (`{ t, value, easing }`) are left untouched, preserving diagnostics in `deadKeyframeEasingNotices`.

### Trade-offs & Mitigations
- D1. Pros: eliminates false-positive `dead easing` notices for generator and agent workflows that write symmetric shorthand easings; zero impact on rendered animation curves since trailing easing has no subsequent segment. Cons: silently rewrites the final keyframe's easing attribute from what the caller passed. Mitigation: normalization is strictly confined to shorthand tuple arrays during compact expansion (`expandScene`); explicit keyframe objects and full-schema scenes are never altered.
- D2. Pros: clear boundary between shorthand conveniences and schema diagnostics; preserves spec 065 validation guarantees for editor-authored scenes. Cons: callers passing full-schema objects inside compact still receive notices. Mitigation: compact generator workflows predominantly use shorthand arrays; full-schema callers retain full explicit notice feedback.

## Tasks
- [x] 091/T001 [agent] Parameterized tests in `src/service/compact/expand.test.ts` (`test.each` / `it.each`) covering R1 partitions (nominal 2+ keys, single key, trailing auto/none, object-wrapped shorthand, camera tracks, nested group/template elements), asserting easing normalization and zero `deadKeyframeEasingNotices`, plus update existing test assertions expecting trailing shorthand easings — covers R1
      verified: it.each table over R1 partitions + camera/group test in expand.test.ts; existing assertions updated; vitest src/service/compact 99 passed.
- [x] 091/T002 [agent] Implement shorthand trailing easing normalization (D1, D2) in `src/service/compact/expand.ts` across element tracks, nested group/template children, and shot camera tracks — covers R1, D1, D2
      verified: autoTrailingEasing in expand.ts applied to element and shot camera tracks (groups recurse via buildElement); tests pass.
- [x] 091/T003 [agent] Docs: update `.agents/skills/lienzo-usage/SKILL.md` to document trailing easing shorthand normalization (R2) — covers R2
      verified: SKILL.md tracks line documents the trailing auto normalization.
- [x] 091/T004 [agent] Verify: call `expandScene` on a compact scene fixture with trailing shorthand easing and assert zero `deadKeyframeEasingNotices`; assert that explicit full-schema scenes with trailing easing still trigger notices; run full test suite (`pnpm test`) and typecheck (`pnpm typecheck`); record `verified:` — covers R1, R2, D1, D2
      verified: tests assert zero dead-easing notices for shorthand and a notice for explicit objects; pnpm test 2491 passed (227 files), pnpm typecheck clean, biome clean.

## Changes
- 2026-11-02: Audit corrections applied before task execution (F1–F8):
  - F1: Corrected function name from `expandCompact` to `expandScene` in Goal and D1.
  - F2: Added systematic input space partitions to R1 covering nominal multi-keyframe shorthand, single-keyframe tracks, auto/unspecified easings, object-wrapped shorthand tracks, camera tracks, nested groups/templates, and explicit object keyframes (TEST-I1).
  - F3: Replaced test runner command pseudo-requirement R2 with documentation requirement R2 covering `.agents/skills/lienzo-usage/SKILL.md` per AGENTS.md rules.
  - F4: Replaced test task D2 with structural scope boundary decision D2 separating shorthand tuple normalization from full-schema keyframe objects (ENG-2).
  - F5: Added `### Trade-offs & Mitigations` section analyzing D1 and D2 pros/cons/mitigations, and added Principle 6 and TESTING.md to `## Principles applied` (ENG-6).
  - F6: Rewrote T001 to specify parameterized `it.each` table tests covering R1 partitions, invariants, and updating existing test assertions in `expand.test.ts` (TEST-I1, TEST-H2).
  - F7: Added documentation task T003 for R2, and structured T004 as a complete `Verify:` task recording `verified:` (TRACE).
  - F8: Added `## Changes` section documenting audit discrepancies F1–F8.
