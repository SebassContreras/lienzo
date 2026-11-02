# 090 — build-from-file

## Goal
`scene_build` and `scene_validate` read a compact scene from a JSON file on disk, so a generator's
output is built through MCP without pasting it into the call. Verification: `scene_build` with
`compactFile` set to Animator's `videos/ringana-skin-perfection/scene.json` saves the same scene
as passing its contents in `compact`; `pnpm test` and `pnpm typecheck` pass.

## Context (Animator video `ringana-skin-perfection`, 2026-10-31)
- Animator's generators write `scene.json` (36 KB for a 20 s, six-shot reel). Passing it inline
  in the MCP call is impractical, so the build went through the CLI
  (`pnpm lienzo scene_build --json @file`), which the MCP route does not offer.
- `asset_add` already takes a local file path and copies it into the project, so the server
  already reads caller-named files.

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | One optional input, read once, then the existing build path. |
| 2 SRP | Reading the file is input resolution; building is unchanged. |
| 3 DRY by composition | Shared `readCompactFile` helper used by both `scene_build` and `scene_validate`. |
| 4 Service layer / DIP | The file is read through the same file access and size cap `asset_add` uses. |
| 5 Stack standards | Spanish error messages and notices, `snake_case` codes, docs updated in the same change. |
| 6 Trade-offs | Documented pros, cons, and mitigations in Design. |

## Requirements
- R1: `scene_build` and `scene_validate` accept `compactFile`, a path (absolute or relative to
  current working directory) to a JSON file holding a compact scene; exactly one of the scene
  inputs is given (`compact` or `compactFile` for `scene_build`; `data`, `compact`, or `compactFile`
  for `scene_validate`).
  Partitions: `compact` only (unchanged); `compactFile` with absolute path; `compactFile` with
  relative path; conflicting inputs (`compact` and `compactFile` provided, or `data` and
  `compactFile` provided in `scene_validate`); missing scene input (neither `compact` nor
  `compactFile` in `scene_build`, or none of `data`/`compact`/`compactFile` in `scene_validate`);
  missing file (`not_found`); non-JSON file (`invalid_json`); JSON file whose root is not an
  object (`invalid_compact`); file exceeding 20 MB (`too_large`).
  Contract: `scene_build` fails the call with tool errors (`fail`); `scene_validate` returns a
  validation verdict (`{ valid: false, errors }`) per 083/R6.
  Invariant: for the same content, `compactFile` and `compact` give byte-identical saved scenes,
  `errors` and `notices`.
- R2: Errors name the path (`compactFile` or `compact`) and the problem in Spanish, with a
  `snake_case` code (`not_found`, `too_large`, `invalid_json`, `invalid_compact`, `invalid_input`),
  like the other input errors.
- R3: Tool descriptions, README and `lienzo-usage` mention `compactFile`.

### Who it serves
Generator-driven workflows (Animator's `lienzo-animate` step 3).

### Out of scope
- Watching the file for changes.

### Dependencies
- None.

### Owner split
Agent tasks.

## Design
- D1 (R1): extract `readCompactFile(filePath)` in `src/service/compact/compact-file.ts` that
  resolves the path, checks file size against `MAX_ASSET_BYTES` (20 MB), reads and parses JSON,
  returning the parsed compact scene object or structured failure. Called at the top of both tools
  before expansion so the rest of the pipeline is unchanged.
- D2 (R1): path resolution follows `asset_add`'s rule (`path.resolve(filePath)`), supporting both
  absolute and relative paths; file size is capped at `MAX_ASSET_BYTES` (20 MB from
  `src/service/assets/asset-helpers.ts`).

### Trade-offs & Mitigations
- D1. Pros: no new build path; expansion remains identical. Cons: callers can pass arbitrary local
  files. Mitigation: file is strictly opened read-only, limited to 20 MB, parsed only as JSON, and
  never written or executed.
- D2. Pros: consistent with `asset_add` and `font_install` file handling. Cons: relative paths
  depend on the server process working directory. Mitigation: docs explicitly state relative paths
  resolve from server cwd and recommend absolute paths when invoked remotely.

## Tasks
- [x] 090/T001 [agent] Tests, written first, in `src/service/scenes/tools/scene-build-file.test.ts`: `test.each` table covering R1 partitions (absolute path, relative path, missing file, non-JSON, non-object root, size <= 20 MB, size > 20 MB, input conflicts) asserting tool failure for `scene_build` and validation verdict for `scene_validate`, plus byte-identical scene output invariant — covers R1, R2, D1, D2
  verified: 2026-11-02, wrote `scene-build-file.test.ts` with test.each table and invariant test; 9 of 10 tests fail as expected prior to implementation.
- [x] 090/T002 [agent] Shared `readCompactFile` helper (D1, D2) in `src/service/compact/` with `MAX_ASSET_BYTES` cap and path resolution — covers R1, R2, D1, D2
  verified: 2026-11-02, implemented `src/service/compact/compact-file.ts` with 20 MB cap, JSON checking, and path resolution; `pnpm typecheck` clean.
- [x] 090/T003 [agent] Wire `compactFile` into `scene_build` and `scene_validate` (D1) — covers R1, R2, D1
  verified: 2026-11-02, wired `compactFile` input schema and resolution in `scene_build` and `scene_validate`; `scene-build-file.test.ts`, `scene-tools.test.ts`, and full contract suite pass; `pnpm typecheck` clean.
- [x] 090/T004 [agent] Docs: update `scene_build` and `scene_validate` descriptions, `README.md`, and `.agents/skills/lienzo-usage/SKILL.md` (R3) — covers R3
  verified: 2026-11-02, documented `compactFile` in tool descriptions, README.md, and lienzo-usage skill; `descriptions.test.ts` passes.
- [x] 090/T005 [agent] Verify: build CLI (`pnpm build:cli`); call `scene_build` and `scene_validate` with `compactFile` on a compact scene JSON fixture and confirm byte-identical output to `compact`; run `pnpm test` and `pnpm typecheck`; record `verified:` — covers R1, R2
  verified: 2026-11-02, `pnpm build:cli` built cleanly; tested CLI `scene_build` and `scene_validate` with `--compactFile`; full suite (2484 tests) and `pnpm typecheck` passed.

## Changes
- 2026-11-02: Audit corrections applied before task execution (F1–F6):
  - F1: Aligned R1 path rule with D2, Goal, and `asset_add` (`path.resolve` supporting relative and absolute paths instead of erroneously requiring absolute-only).
  - F2: Replaced assumed size cap in D1 and unrecorded rule in D2 with concrete 20 MB `MAX_ASSET_BYTES` and `path.resolve`.
  - F3: Added `scene_validate` input partitions (`data` vs `compact` vs `compactFile`) and clarified the 083 verdict contract vs `scene_build` failure.
  - F4: Removed speculative discovery task T001 and added end-to-end Goal verification task T005.
  - F5: Specified test file, table structure, partitions, boundaries, and compound error assertions in T001 (formerly T002).
  - F6: Renamed Trade-offs to `### Trade-offs & Mitigations`, added D2 trade-off analysis, and corrected task coverage tags.
