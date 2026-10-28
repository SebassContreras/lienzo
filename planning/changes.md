# Architecture — Changes

## 2026-10-07 — images live in `assets/`, versioned with the repo
Why: spec 002 added the `assets/` folder and `/api/assets` for image elements, and A7 did not say so; scenes that use images should open on any clone.
- MODIFIED A7@1 → A7@2
- Tasks: 001/T006 and 002/T003 re-pointed to A7@2 (still valid); 003/T002 re-pointed to A7@2; added 002/T010 (keep `assets/` in the repo) and 002/T011 (README and AGENTS.md describe 002 and A7@2)

## 2026-10-08 — CLI and MCP server enter the scope
Why: the maintainer wants scripts and AI agents (Claude through MCP) to build and export posts, both through the same tools.
- ADDED A20@1
- ADDED A21@1
- ADDED A22@1
- Tasks: specs 007–010 created

## 2026-10-08 — components become descriptors; timeline and 3D enter the scope
Why: the maintainer wants every post buildable from JSON alone, new features inherited instead of rebuilt, keyframe animation with loop/once control, any element as a particle, and a three.js element; CLI and MCP move to the end.
- MODIFIED A7@2 → A7@3
- ADDED A23@1
- ADDED A24@1
- ADDED A25@1
- Tasks: 001/T006, 002/T003, 002/T010, 002/T011 and 003/T002 re-pointed to A7@3 (still valid); specs 012–016 created; 007 and 011 rewritten; 007–011 re-prioritised after 016

## 2026-10-08 — more elements, more animations, animation presets
Why: the maintainer wants a wider range of elements and animations for explainer posts, and to save custom animations and reuse them on other elements.
- ADDED A26@1
- Tasks: specs 017–019 created; 007–011 and 014–016 re-prioritised

## 2026-10-08 — components live in descriptor folders
Why: spec 012 moved each component into a descriptor folder (A23).
- MODIFIED A5@1 → A5@2
- Tasks: 001/T003 and 005/T003 re-pointed to A5@2 (still valid: their drawing code moved into `<kind>/draw.ts`); 012/T017 re-pointed to A5@2

## 2026-10-10 — animation presets copy and expand on load
Why: the 019 review found that linked presets resolved at draw time would couple `animate` (A24) to the preset store and make export, tests and undo depend on the library.
- MODIFIED A26@1 → A26@2
- Tasks: 019/T001 (never started) replaced by 019/T009, which covers A26@2

## 2026-10-10 — A7 lists `/api/animations`
Why: wording fix; the endpoint was added by 019 under A26, and A7's list of endpoints left it out. Meaning unchanged.
- REWORDED A7@3

## 2026-10-10 — tool names are snake_case
Why: MCP tool names allow only `[a-zA-Z0-9_-]` (MCP specification); dotted names such as `scene.export` are rejected by some clients.
- MODIFIED A20@1 → A20@2
- Tasks: 007/T001, 008/T001, 009/T001, 011/T006 (never started) re-pointed to A20@2; 010/R1, 010/R2, 010/D3, 011/R6, 011/D5 reworded to the new names

## 2026-10-15 — testing policy: minimal tests for daily development (KISS / YAGNI)
Why: clarify testing scope to prevent test bloat; prioritize pure engine logic, timing math and schema boundaries over redundant E2E/micro-tests so daily development remains fast. Meaning unchanged.
- REWORDED A14@1


## 2026-10-22 — user fonts on disk (045)
Why: users need their own fonts per project and globally, and a way to fetch Google Fonts from the app; A12@1 allowed only bundled fonts.
- MODIFIED A12@1 → A12@2
- Tasks: 001/T004 re-pointed to A12@2 (the bundled fonts it loads still hold); 045 tasks cover the user fonts

## 2026-10-23 — Mediabunny 1.61.6+ for MP4s that play on phones
Why: MP4s exported in Firefox on Windows played on desktop but not on phones or WhatsApp. Firefox's H.264 encoder emits an avcC with each SPS/PPS header byte repeated (`67 67 64…`); the in-band parameter sets are correct, so desktop players cope while phones read the broken record. Mediabunny 1.61.6 detects and rebuilds it (mediabunny #559, Bugzilla 2082867). Two earlier fixes targeted the wrong cause and were reverted: forcing the software H.264 encoder (cb28a62) and requesting Annex B output (2a2443c, which Firefox ignores); both were checked only in Edge, which never shows the bug.
- MODIFIED A10@1 → A10@2
- Tasks: 001/T005 re-pointed to A10@2 (still valid); no cleanup tasks, the workarounds were already reverted in 8afdef6

## 2026-10-24 — no CI/CD
Why: the owner removes everything CI/CD from the project; lint, typecheck and test run locally.
- REMOVED A15@1
- Tasks: 001/T010 deletes `.github/workflows/ci.yml`; 001/T008 and 039/T009 re-pointed (still valid)

## 2026-10-27 — project workspaces in A7; shared rules (077)
Why: A7@3 still put scenes and assets at the repo root, which spec 040 moved into `projects/<project>/`; and 075 found that rules re-implemented per writer (shot timing in each tool, shot edits in the editor) were why QA rounds kept finding the same failures.
- MODIFIED A7@3 → A7@4
- ADDED A27@1
- Tasks: 077/T003 writes both; 075 tasks already built A27 (`src/model/shot-timing.ts`, `setShotIn` / `removeShotIn`)

## 2026-10-28 — testing policy: complete tests of rules, writers and tools (082)
Why: "minimal tests" was applied as one test per reported case; nine QA rounds (067–081) kept finding the same rules broken in the next writer, 34 of 43 tools have at most one failing-input test, and `traits` and `export` have none. Minimal now means no tests of implementation details, not fewer rules covered.
- MODIFIED A14@1 → A14@2
- Tasks: 082/T001 rewrites A14 and the AGENTS.md test rule; 082/T017–T023 build the matrix; 082/T024–T040 rewrite the suite

## 2026-10-28 — tools live with their functionality (082)
Why: `src/service` held 165 files, 32 of them loose, and a tool, its logic and its tests were in three places; the test rewrite of 082 groups each functionality in one folder. Meaning of A20 unchanged: one file per tool, one registry, thin adapters.
- MODIFIED A20@2 → A20@3
- Tasks: 082/T005–T015 move the files; 082/T015 rewrites the A20 path

