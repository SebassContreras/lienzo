# 091 — compact-trailing-easing-normalization

## Goal
In compact scene expansion (`expandCompact`), normalize an inoperative easing on a track's trailing keyframe to `"auto"` when parsed from compact shorthand arrays (`[[t, value, easing], ...]`), so generator builds and MCP calls do not emit noisy `dead easing` notices for harmless trailing easings while preserving the notice for explicit editor keyframes. Verification: `pnpm test` and `pnpm typecheck` pass; a compact track with trailing easing expands cleanly with zero dead easing notices.

## Context (Animator video `pulse-speed`, 2026-11-02)
- In Lienzo, Spec 065 Requirement R4 emits a notice when any track's last keyframe specifies an easing other than `"auto"` or `"linear"`, because easings apply to the segment leading to the next keyframe.
- When automated generators or external AI agents produce compact scenes, specifying easing symmetrically on keyframes (e.g., `[[0, 0, "ease-out"], [1, 100, "ease-out"]]`) is a common intuitive shorthand.
- In compact scene expansion (`src/service/compact/expand.ts`), compact shorthand is already transformed into full schema. Normalizing the final keyframe's easing to `"auto"` when converting shorthand arrays eliminates false-positive notices for automated workflows without altering animation curves.

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | A single normalization step during compact shorthand expansion. |
| 2 SRP | Expander handles input shorthand normalization; validation rules remain untouched. |
| 5 Stack standards | Pure transformation in `expand.ts`. |

## Requirements
- R1: When expanding compact element or camera tracks from array shorthand (`[[t, value, easing], ...]`), if the last keyframe has an easing, it is normalized to `"auto"`.
  - Invariants:
    - Internal keyframes retain their specified easings unchanged.
    - Animation playback and interpolation values are byte-for-byte identical.
    - `deadKeyframeEasingNotices` continues to fire for non-compact scenes or when explicit full-schema tracks specify an inoperative trailing easing.
- R2: `pnpm test` and `pnpm typecheck` pass across the entire Lienzo test suite.

### Who it serves
Generator-driven and agentic video workflows (Animator).

### Out of scope
- Changing `deadKeyframeEasingNotices` logic for full-schema scene validation.

### Dependencies
- None.

### Owner split
Agent tasks.

## Design
- D1 (R1): In `src/service/compact/expand.ts`, during the expansion of shorthand track arrays, normalize the trailing keyframe's easing property to `"auto"`.
- D2 (R1): Add unit tests in `src/service/compact/expand.test.ts` verifying that trailing easings in compact shorthand expand without notices.

## Tasks
- [ ] 091/T001 [agent] Add tests for compact trailing easing normalization in `src/service/compact/expand.test.ts` — covers R1
- [ ] 091/T002 [agent] Implement trailing easing normalization in compact track expansion (`src/service/compact/expand.ts`) — covers R1, D1
- [ ] 091/T003 [agent] Run full test suite (`pnpm test`) and typecheck (`pnpm typecheck`) in Lienzo — covers R2
