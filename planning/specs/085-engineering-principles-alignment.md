# 085 — engineering-principles-alignment

## Goal
Harmonize repository governance and historical specifications with the 10 Core Engineering
Principles. `ENGINEERING.md` defines all 10 principles in full, and specs 050, 065–084 have their
Requirements, Design, and Tasks updated to eliminate single-use abstractions, compound tasks,
anecdotal bug fixes, unparameterized test tasks, uncited decisions, and missing trade-offs.
Verification: automated markdown lint/link checks, `pnpm typecheck`, and full suite pass.

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | No code changes; fixes spec text and governance documentation directly without speculative frameworks. |
| 2 SRP | Each remediation task updates one specific spec or document for a single principle violation. |
| 3 DRY by composition | Reuses the established 10-principle structure from spec 081 and `spectrace-review` across `ENGINEERING.md`. |
| 4 Service layer / DIP | Documents anti-corruption interfaces for Vite HMR and audio format detection in affected specs. |
| 5 Doubt / Simplicity | Keeps interfaces minimal; pure functions operate on plain immutable data. |
| 6, 7 Tests | Test tasks specify input partitions, boundaries, contracts, invariants, and table-driven parameterization (`test.each`). |
| 8 Stack standards | Enforces `snake_case` error codes, standard casing, and bilingual conventions (Spanish UI text, English docs). |
| 9 Research | Cites official sources (Vite chunking docs, NLE SMPTE timecode interval standards, Zod 4 error customization). |
| 10 Trade-offs | Every design decision documents pros, cons, and mitigations. |

## Requirements
- R1: `ENGINEERING.md` defines all 10 Core Engineering Principles explicitly, restoring P5 (Small Interfaces & Pure Functions), P6 (Systematic Input Partitioning), P7 (Test Hygiene & Parameterization), P8 (Stack Standards), P9 (Research & Citations), and P10 (Document Trade-offs).
- R2: Requirements across specs avoid speculative generality (P1): `050/R6` (undo sync), `066/R5` (field edits on unloaded components), and define concrete input partitions and invariants (P6): `050/Goal`, `050/R7` (invalid scene partitions), `065/R3` (counter suffix invariants), `072/R1` (coordinate rounding & bounds), `083/R3` (validate verdict partitions), `084/R4` (reconciled stored ID compatibility).
- R3: Design items adhere to single responsibility (P2), composition over duplication (P3), dependency inversion (P4), pure functions (P5), stack casing (P8), authoritative citations (P9), and explicit trade-offs (P10):
  - Shared logic composed: `071/D2` (`effectiveElementShot`), `075/D1` (`validateShotSequence`), `080/D8` (`contentNotices`).
  - Anti-corruption interfaces: `050/D2` (`SceneEventSource`), `081/D6` (`AudioFormatDetector`).
  - Small interfaces: `078/D1` (`findPath` pure function).
  - Stack conventions: `069/R13` (`snake_case` error codes).
  - Citations: `066/D1` (Vite chunking), `073/D1` (SMPTE / NLE half-open intervals), `074/D2` (Zod error paths).
  - Trade-offs documented: `065/D1-D4`, `075/D1`, `084/D1-D4`.
- R4: Tasks enforce single responsibility (P2), avoid single-use abstractions (P1), specify input partitions and parameterized table tests (P6, P7), and name equivalence classes for bug fixes (P6):
  - Split compound tasks: `050/T001`, `066/T003`, `069/T002`, `069/T007`, `084/T002`.
  - Single-use abstraction replaced: `066/T006` (inlined dynamic import).
  - Equivalence classes named: `068/T003` (ID preservation & bounds), `071/T002` (group hierarchy shot inheritance), `074/T004` (missing asset resolution).
  - Parameterized tests specified: `067/T001`, `070/T004`, `075/T001`, `078/T002`, `081/T006`, `083/T001`, `084/T001`.
  - Execution blockers fixed: `084/T004` (automated component assertion), `077/T001` (partitioned 43-tool audit).
- R5: `CHANGES.md` and `planning/roadmap.md` record the alignment spec and track its status.

## Design
- D1 (R1): Rewrite `ENGINEERING.md` Section `## ⚙️ Core Engineering Principles` to enumerate principles 1 through 10, cross-referencing `TESTING.md` for test hygiene and input space partitions while retaining project standards in `ENGINEERING.md`.
  - _Pros_: Aligns root engineering contract with repository practice and audit guidelines.
  - _Cons_: Replaces the 6-item template scaffolding with 10 principles.
  - _Mitigation_: Keeps existing project standards (pnpm, Biome, Spanish UI text, deterministic time) unchanged.
- D2 (R2): Update requirement texts in `050-joint-mode.md`, `065-defaults-and-easing-notices.md`, `066-lazy-vendor-chunks.md`, `072-qa-round-4-fixes.md`, `083-one-validate-verdict.md`, and `084-id-charset.md` to remove speculative requirements and provide concrete boundary partitions.
  - _Pros_: Specs become unambiguous and verifiable by any human or agent.
  - _Cons_: Historical files modified.
  - _Mitigation_: Modifies only the specific text items identified in the audit without altering historical implementation code.
- D3 (R3): Update design sections in `050-joint-mode.md`, `065-defaults-and-easing-notices.md`, `066-lazy-vendor-chunks.md`, `069-qa-suite-fixes.md`, `071-qa-round-3-fixes.md`, `073-qa-round-5-fixes.md`, `074-qa-round-6-root-causes.md`, `075-shot-timing-and-full-validation.md`, `078-qa-round-7-fixes.md`, `080-qa-round-8-every-writer.md`, `081-qa-round-9-input-gaps.md`, and `084-id-charset.md` with anti-corruption interfaces, citations, and explicit `_Pros_`, `_Cons_`, `_Mitigation_` blocks.
  - _Pros_: Architectural decisions become self-justifying and cite verifiable standards.
  - _Cons_: Increases markdown length of design sections.
  - _Mitigation_: Uses concise, bulleted trade-off summaries.
- D4 (R4): Update task lists in `050-joint-mode.md`, `066-lazy-vendor-chunks.md`, `067-tool-feedback-fixes.md`, `068-qa-feedback-fixes.md`, `069-qa-suite-fixes.md`, `070-qa-suite-audit.md`, `071-qa-round-3-fixes.md`, `074-qa-round-6-root-causes.md`, `075-shot-timing-and-full-validation.md`, `077-docs-and-descriptions-audit.md`, `078-qa-round-7-fixes.md`, `081-qa-round-9-input-gaps.md`, `083-one-validate-verdict.md`, and `084-id-charset.md`. Split compound tasks into granular tasks, add parameterized table test requirements (`test.each`), name equivalence classes for bug fixes, and replace unverified assertions.
  - _Pros_: Every task becomes an actionable, single-responsibility instruction with explicit verification criteria.
  - _Cons_: Historical completed task checkboxes `[x]` are re-labeled.
  - _Mitigation_: Retains `[x]` completion markers since the underlying implementations and tests are already committed and verified.
- D5 (R5): Add row for `085` to `planning/roadmap.md` and log the change in `CHANGES.md`.
  - _Pros_: Maintains unbroken traceability across roadmap and change log.
  - _Cons_: None.
  - _Mitigation_: Standard Conventional Commit `docs(planning): spec 085 engineering principles alignment`.

## Tasks
- [x] 085/T001 [agent] Update `ENGINEERING.md` with all 10 Core Engineering Principles — covers R1, D1
- [x] 085/T002 [agent] Update `050-joint-mode.md`: Goal, R6 (undo), R7 (partitions), D2 (`SceneEventSource`), T001 (split), T008/T009 (partitions) — covers R2, R3, R4, D2, D3, D4
- [x] 085/T003 [agent] Update `065-defaults-and-easing-notices.md`: R3 (suffix invariants), D1–D4 (pros, cons, mitigations) — covers R2, R3, D2, D3
- [x] 085/T004 [agent] Update `066-lazy-vendor-chunks.md`: R5 (unloaded edits), D1 (Vite citation), T003 (split), T006 (inline import) — covers R2, R3, R4, D2, D3, D4
- [x] 085/T005 [agent] Update `067-tool-feedback-fixes.md`: T001 (parameterized table tests), D1–D5 (trade-offs) — covers R3, R4, D3, D4
- [x] 085/T006 [agent] Update `068-qa-feedback-fixes.md`: D3 (SRP bounds helper), T003 (ID preservation equivalence class) — covers R3, R4, D3, D4
- [x] 085/T007 [agent] Update `069-qa-suite-fixes.md`: R13 (`snake_case` error codes), T002 (split), T007 (split) — covers R3, R4, D3, D4
- [x] 085/T008 [agent] Update `070-qa-suite-audit.md`: D3 (SRP tree mutations), T004 (AAA parameterized tests) — covers R3, R4, D3, D4
- [x] 085/T009 [agent] Update `071-qa-round-3-fixes.md`: D2 (composition `effectiveElementShot`), T002 (group shot hierarchy equivalence class) — covers R3, R4, D3, D4
- [x] 085/T010 [agent] Update `072-qa-round-4-fixes.md`: R1 (coordinate rounding partitions and bounds) — covers R2, D2
- [x] 085/T011 [agent] Update `073-qa-round-5-fixes.md`: D1 (SMPTE / NLE half-open interval citation and trade-offs) — covers R3, D3
- [x] 085/T012 [agent] Update `074-qa-round-6-root-causes.md`: D2 (Zod error path citation), T004 (missing asset equivalence class) — covers R3, R4, D3, D4
- [x] 085/T013 [agent] Update `075-shot-timing-and-full-validation.md`: D1 (centralized validation composition & trade-offs), T001 (parameterized boundary matrix) — covers R3, R4, D3, D4
- [x] 085/T014 [agent] Update `077-docs-and-descriptions-audit.md`: T001 (split 43-tool audit into 4 domain tasks) — covers R4, D4
- [x] 085/T015 [agent] Update `078-qa-round-7-fixes.md`: D1 (pure `findPath` taking plain data), T002 (parameterized easing tests) — covers R3, R4, D3, D4
- [x] 085/T016 [agent] Update `080-qa-round-8-every-writer.md`: D8 (centralized notice composition) — covers R3, D3
- [x] 085/T017 [agent] Update `081-qa-round-9-input-gaps.md`: D6 (format detector interface), T006 (parameterized limits boundary matrix) — covers R3, R4, D3, D4
- [x] 085/T018 [agent] Update `083-one-validate-verdict.md`: R3 (verdict vs failure partitions), T001 (parameterized AAA table test) — covers R2, R4, D2, D4
- [x] 085/T019 [agent] Update `084-id-charset.md`: R4 (reconcile stored ID compatibility), D1 (trade-offs), T001 (systematic input partitions), T002 (split), T004 (automated assertion) — covers R2, R3, R4, D2, D3, D4
- [x] 085/T020 [agent] Update `planning/roadmap.md` and `CHANGES.md` with spec 085 — covers R5, D5
- [x] 085/T021 [agent] Verify: `pnpm typecheck`, `pnpm test`, markdown link validity — covers R1, R2, R3, R4, R5

## Changes
- 2026-10-30: Initial spec creation addressing the audit of all specs and repo contracts against the 10 Core Engineering Principles. Work: T001–T021.
