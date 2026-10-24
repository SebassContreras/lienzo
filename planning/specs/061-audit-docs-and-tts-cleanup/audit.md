# Lienzo — Dead code, hollow tools & documentation drift audit (read-only)

Date: 2026-10-24 · HEAD `8c82d73` · Auditor mode: read-only (no repo files changed)

## 1. Executive summary

- **Root/stack:** `lienzo/` is the root (single package, `pnpm-workspace.yaml` with no sub-packages). TypeScript 7 on Node 24, React 19 + Vite 8, Vitest 5, Biome 2.5, Zod 4, MCP SDK.
- **Assumptions:** scope = all versioned `src/`, `presets/`, `schemas/`, root docs, `.agents/skills/`, `.spectrace/`; `planning/specs/**` is treated as spec/roadmap (not drift) per its labels; excludes `dist/`, `node_modules/`, `.spectrace/changes/*.patch`, `projects/*` user data.
- **Safety net (verified):** `pnpm typecheck` ✅ 0 errors · `pnpm lint` ✅ 437 files clean · `pnpm test` 904/904 passed, **but one of three runs exited non-zero** (see F-01). CI runs lint+typecheck+test as AGENTS.md claims (`.github/workflows/ci.yml`).
- **Findings:** 14 total — obsolete 2 · dead 2 · hollow-tool 0 · valueless-fn 1 (dup) · doc-drift 9 (D1 0, D2 4, D3 3, D4 1, D5 0, D6 1, D7 0). Zones: 🟢 8 · 🟡 5 · 🔴 1.
- **Overall health is good:** every registered tool (28) has a real handler, every declared input field is read, CLI and MCP are generic adapters with no per-tool code, the compact JSON schema is already mechanized (generated + asserted in a test).
- **Top 5 actions:** (1) stop tracking `.spectrace/__pycache__/*.pyc` · (2) find the intermittent test-run failure · (3) one source for TTS defaults (dialog re-hardcodes them) · (4) document the browser-side API-key path in AGENTS.md · (5) refresh AGENTS.md layout + README feature list.
- **Top risks:** the stale `dist/cli.js` (no `shot_set`) is what README tells generic MCP clients to run; the browser stores the OpenRouter key in `localStorage` twice and calls OpenRouter directly when one is typed, which the agent docs do not mention.

## 2. Repo map, entry points, documentation surface

**Entry points (define "reachable")**
| Entry | File |
|---|---|
| Editor (Vite) | `index.html` → `src/main.tsx` |
| Dev-server middlewares | `vite.config.ts` → `src/service/*-middleware.ts`, `tts-proxy.ts` |
| CLI | `package.json` `lienzo` → `src/cli/main.ts` |
| MCP | `pnpm lienzo mcp` → `src/mcp/server.ts` |
| Bundle build | `build:cli` → `src/cli/build.ts` → `dist/cli.js` (`bin`) |
| Render route | `?render` → `src/export/render-page.ts` |
| Tests | `**/*.test.ts(x)`, helpers in `src/test/` |

**Analysis tools available:** `tsc --noEmit`, `biome check`, `vitest`, project CLI `--help`. **Not available:** knip, ts-prune, depcheck, madge (not installed; installing is out of scope) → replaced by a grep heuristic (exported symbol referenced in no other file; dependency imported by no file) — confidence medium.

**Documentation surface**
| Doc | Type | Scope |
|---|---|---|
| `AGENTS.md` | agent | stack, layout, rules, task workflow |
| `README.md` | human | features, run, MCP setup, compact scenes, shortcuts |
| `.env.example` | interface | TTS env vars |
| `.agents/skills/spectrace-*/SKILL.md` | agent | spec workflow (vendored, `skills-lock.json`) |
| `planning/**` | spec/roadmap | out of scope for drift |
| 28 tool descriptions + Zod schemas | agent/interface | MCP + CLI `--help` (generated from registry) |
| `schemas/compact-scene.json` | interface | generated, asserted by `src/model/compact-schema.test.ts:6` |
| JSDoc in `src/**` | inline | sampled |

No `CLAUDE.md` in the repo, no `.cursor/rules`, no subagent definitions.

## 3. Findings table

| ID | Category | Symbol/file | Location | Evidence | Conf. | Zone | Risk | Effort | Proposed action | Principle |
|---|---|---|---|---|---|---|---|---|---|---|
| F-01 | safety-net | test run | `pnpm test` | run 1: "Tests 904 passed" then `ELIFECYCLE Test failed`; runs 2–3 exit 0 | med | 🟡 | med | S | reproduce with `--reporter=verbose`, find the unhandled error | 9 |
| F-02 | dead | `.spectrace/__pycache__/trace.cpython-314.pyc` | tracked | `git ls-files .spectrace/__pycache__`; `.gitignore` has no `__pycache__` | high | 🟢 | low | S | `git rm --cached`, add `__pycache__/` to `.gitignore` | 6 |
| F-03 | valueless-fn (DRY) | TTS defaults | `src/editor/dialogs/tts-dialog.tsx:53,117-135` vs `src/service/tts/config.ts:20,23` | `"openai/tts-1"`, `"ef_dora"`, `"kokoro-es"`, `"alloy"` re-hardcoded in the dialog | high | 🟢 | low | S | import the constants from `config.ts` (export the local ones) | 2 |
| F-04 | obsolete | legacy OpenRouter key slot | `src/service/tts/preferences.ts:59-66,114-123` | key written to both prefs JSON and `STORAGE_KEY_OPENROUTER_API_KEY` "legacy" | med | 🟡 | med | S | migrate once on load, then drop the second write | 4 |
| F-05 | obsolete | the `src/test/` legacy schema (removed in 061) | whole file | "hand-written schema before spec 012, kept only so tests can check…"; covers only pre-012 kinds | med | 🟡 | low | S | owner decides: retire once golden/registry tests cover parity | 4 |
| F-06 | dead (test-only in prod dir) | `fakeRenderer` | `src/service/fake-renderer.ts:11` | only test files import it | high | 🟢 | low | S | keep (documented in AGENTS.md); optionally move to `src/test/` | 1 |
| F-07 | doc-drift:D6 | AGENTS.md TTS rule | `AGENTS.md` "Speech (TTS)" bullet | says editor reaches OpenRouter through the proxy; code calls OpenRouter directly with a user-typed key (`tts-dialog.tsx:66-68`, `openrouter-adapter.ts:37,63`) and stores it in `localStorage` | high | 🟢 | med | S | state the two paths explicitly | 9 |
| F-08 | doc-drift:D2 | stale MCP bundle | `README.md` "Or with the compiled bundle" | `dist/cli.js` (Oct 22) has 0 occurrences of `shot_set`; registry has it (`src/service/tools/index.ts:58`) | high | 🟡 | med | S | README: "rebuild after pulling"; consider a `prepare`/check | 9 |
| F-09 | doc-drift:D2 | AGENTS.md Layout | `AGENTS.md` Layout block | omits `src/service/compact/`, `src/engine/{audio,subtitles,path}/`, `src/editor/{brand,dialogs,footer,widgets,joint}/` | high | 🟢 | low | S | add one line per dir | 9 |
| F-10 | doc-drift:D2 | test duration | `AGENTS.md` "about 30 s today" | measured 41 s and 52 s | high | 🟢 | low | S | drop the number or say "~45 s" | 9 |
| F-11 | doc-drift:D3 | README feature list | `README.md` bullets | lists rect/ellipse/text/icon/image/line/particles/groups; registry has 24 kinds (`src/components/index.ts`: three, polygon, star, arrow, badge, progress, counter, bubble, steps, list, table, code, chart, path, subtitles, use…); no mention of shots, audio, TTS, fonts | high | 🟢 | low | M | point to `component_list` instead of enumerating; add short sections for audio/TTS/fonts | 9 |
| F-12 | doc-drift:D3 | `--json @file` | `src/cli/help.ts:5`, `src/cli/args.ts:88-95` vs `AGENTS.md` CLI bullet | AGENTS.md mentions `--json` and `--json -` only | high | 🟢 | low | S | add `@file` to AGENTS.md | 9 |
| F-13 | doc-drift:D4 | `.env.example` language | `.env.example` (all comments Spanish) vs `AGENTS.md` "code, comments and docs in English (A16)" | direct contradiction | high | 🟡 | low | S | owner: translate, or carve out `.env.example` in A16 | 9 |
| F-14 | doc-drift:D3 | spec ids in tool descriptions | `src/service/tools/shot-set.ts` ("(055/D3)"), `scene-build` ("(spec 011)") | the id appears in the first sentence shown by `--help` and MCP; meaningless to an agent | med | 🔴→🟢 | low | S | drop ids from descriptions (keep in JSDoc) | 9 |

Note on F-14 zone: tool descriptions are the agent contract; changing wording is safe, but treat as reviewed-by-owner.

Exported-but-locally-used types (≈110 symbols such as `NumberField`, `CompactShot`, `ShotSchema`) were found by the heuristic; all are used inside their own file. They are **discarded** as findings (see §8).

## 4. Documentation alignment matrix

| Claim | Doc | Claim (quoted) | Code anchor | Class | Verdict | Conf. | Fix |
|---|---|---|---|---|---|---|---|
| C1 | AGENTS.md Stack | "CI runs lint, typecheck, test (A15)" | `.github/workflows/ci.yml` | — | true | high | — |
| C2 | AGENTS.md Tools | "logic lives only in tools, CLI and MCP are thin adapters" | `src/cli/main.ts`, `src/mcp/server.ts:51-74` | — | true | high | — |
| C3 | AGENTS.md MCP | "stdout is the protocol only" | `src/mcp/server.ts:86` | — | true | high | — |
| C4 | AGENTS.md MCP | "a result shaped like `ImageResult` goes out as image content" | `src/mcp/server.ts:39-49` | — | true | high | — |
| C5 | AGENTS.md CLI | "result JSON on stdout, errors JSON on stderr with exit 1" | `src/cli/main.ts:66-71` | — | true | high | — |
| C6 | AGENTS.md CLI | "`--json` (or `--json -` from stdin)" | `src/cli/args.ts:88-95` (`@file` too) | D3 | incomplete | high | doc→code (F-12) |
| C7 | AGENTS.md TTS | "editor reaches OpenRouter through `/api/tts/speech`… no `OPENROUTER_*` value reaches the browser" | `tts-dialog.tsx:66-68`, `preferences.ts:114-123` | D6 | true for env vars, silent on user-typed key path | high | doc→code (F-07) |
| C8 | AGENTS.md Rules | "Every scene, asset and export tool requires `project`" | `PROJECT` in every scene tool's input (`--help` shows `required`) | — | true | high | — |
| C9 | AGENTS.md Rules | "suite… about 30 s today" | measured 41–52 s | D2 | stale | high | doc→code (F-10) |
| C10 | AGENTS.md Layout | directory list | see F-09 | D2 | incomplete | high | doc→code |
| C11 | AGENTS.md Doc map | `planning/*.md`, `.spectrace/format.md` exist | files present | — | true | high | — |
| C12 | AGENTS.md A16 | "docs in English" | `.env.example` | D4 | contradicted | high | owner (F-13) |
| C13 | README MCP | "exposes every Lienzo tool (the same ones `pnpm lienzo --help` lists)" | `src/mcp/server.ts:58` | — | true from source; false for stale `dist/cli.js` | high | F-08 |
| C14 | README Compact | "schema is defined in `schemas/compact-scene.json`" | `src/model/compact-schema.test.ts:6-10` | — | true, mechanized | high | — |
| C15 | README features | component/animation lists | `src/components/index.ts` | D3 | incomplete | high | F-11 |
| C16 | README trim | "`image_trim`… or `trim: true` to `element_add`; asset not changed" | `image_trim`/`element_add` descriptions + schemas | — | true | high | — |
| C17 | `.env.example` | 8 vars | all read in `src/service/tts/config.ts:94-190` | — | true | high | — |
| C18 | `.env.example` | "openai/tts-1 (por defecto)", "ef_dora / kokoro-es" | `config.ts:20,23` | — | true | high | — |
| C19 | tool descriptions (28) | declared fields | each tool's `run` reads every field (checked per file) | — | true | high | — |
| C20 | `tools/index.ts:2` | "A new tool is a file here plus one line in `TOOLS`" | `index.ts:33-62` | — | true | high | — |

Not verified (stated, not assumed): README shortcuts table, `.agents/skills/*` workflow content (vendored from an external repo, pinned by hash in `skills-lock.json`).

**D3 (undocumented behavior):** user-typed OpenRouter key bypasses the proxy (F-07); `--json @file` (F-12); `INIT_CWD` resolves `--json @file` relative to where the user typed (`src/cli/main.ts:86`); test-only env vars `UPDATE_GOLDEN`, `KOKORO_PROVIDER`, `LOCAL_TTS_URL` (test files only — fine undocumented).

**D7 (orphan docs):** none found.

## 5. Detail per finding

**F-01 intermittent test failure.** Vitest reported all 904 passing and pnpm still exited non-zero once — typically an unhandled rejection/error after tests (jsdom also prints `HTMLCanvasElement.getContext not implemented`). Principle 9 (the safety net is a claim). Change: rerun until it reproduces with `--reporter=verbose` and fix the leak; consider a `getContext` stub in the jsdom tests. ✅ trustworthy CI ❌ time to reproduce 🛡️ loop the run in the scratchpad. Risk med, S. Verify: 10 consecutive green runs.

**F-02 tracked `.pyc`.** Build artifact under version control, regenerates per Python version. Principle 6. ✅ clean diffs ❌ none 🛡️ —. Low, S. Verify: `git ls-files | grep pyc` empty.

**F-03 duplicated TTS defaults.** Dialog repeats the defaults owned by `config.ts`; changing one leaves the UI resetting to the old one. Principle 2. Change: export `DEFAULT_LOCAL_TTS_VOICE/MODEL` and an OpenRouter default voice from `config.ts`, import in the dialog. ✅ one source ❌ dialog imports from service (already does: `TTS_PROXY_PATH`) 🛡️ —. Low, S. Verify: typecheck + `tts-config.test.ts`.

**F-04 legacy key slot.** Two `localStorage` keys hold the same secret. Principle 4. Change: on load, read legacy key into prefs once, then stop writing it. ✅ one copy of a secret ❌ users who downgrade lose the key 🛡️ keep the read-side migration. Med (secret handling), S.

**F-05 legacy schema oracle.** Kept to prove parity with spec 012; new kinds never entered it, so its value shrinks. Principle 4. Owner decision; not deleted without it.

**F-07 D6 TTS key path.** Agents told "no key reaches the browser" may assume the dialog is key-free. Principle 9. Change AGENTS.md: "the dialog may also take a user-typed key, stored in `localStorage`, and then calls OpenRouter directly". ✅ accurate threat model ❌ none. Low, S. Code-or-doc first: doc first (code is intended behavior per `tts-dialog.tsx:68`).

**F-08 stale bundle.** `dist/` is ignored and built by hand; README's second recipe silently serves an older tool set. Principle 9. Change: README note "run `pnpm build:cli` after every pull", or prefer the `pnpm lienzo mcp` recipe. Mechanizing (check in CI) is not proportional yet (principle 4). Low, S.

**F-09/F-10/F-12 AGENTS.md refresh.** Doc→code edits only. Low, S. Verify: reread vs `ls src/*/`.

**F-11 README features.** Enumerations drift with each new kind (already 16 kinds behind). Prefer "run `component_list`" over a full list. Low, M.

**F-13 `.env.example` language.** Owner picks: translate, or amend A16 via the `spectrace-change` skill (AGENTS.md forbids hand-editing A items).

**F-14 spec ids in tool descriptions.** Low, S. Verify: `pnpm lienzo --help`.

## 6. Prioritized plan

Score = Impact×Confidence/Risk.
1. **Quick wins (docs move first; code is the intended truth):** F-07 (D6, +1 tier) → F-12 → F-09 → F-10 → F-08 → F-14. Safety net: none needed beyond `--help`.
2. **Quick code wins:** F-02, F-03 (typecheck + tts tests).
3. **Investigate:** F-01 before any larger refactor, so the net is trustworthy.
4. **Owner decisions:** F-04, F-05, F-13, F-11 wording.

## 7. Architectural decisions with sources

No structural decision is proposed (no new layers, libraries or pipelines). Small supported points:
- F-02: Python writes `__pycache__` per interpreter version — https://docs.python.org/3/tutorial/modules.html#compiled-python-files ; ignore patterns — https://git-scm.com/docs/gitignore . Taken as-is.
- F-08 mechanization was considered and rejected (principle 4): not externally validated, not needed.

## 8. Discards / do not touch

- ~110 exported types/schemas used only in their own file (e.g. `ShotSchema`, `CompactShot`, `NumberField`): harmless `export` on a private symbol; removing exports is churn with no behavior gain.
- `scene.audio` single-track fallback (`src/engine/audio/audio-tracks.ts:6-16`): still written by `scene_generate_speech` by default — live, not obsolete.
- All dependencies: each has ≥1 real import (`jsdom` via `@vitest-environment jsdom` pragmas, `esbuild` via `src/cli/build.ts`).
- 28 tools: none hollow, none overlapping enough to merge; `scene_preview` vs `scene_export` differ in purpose (look vs write).
- `.agents/skills/*`: vendored and hash-pinned; edits belong upstream.

## 9. Open questions for the owner

1. F-01: have you seen `pnpm test` fail locally/CI with all tests green?
2. F-04: can the legacy `localStorage` key slot go after a one-time migration?
3. F-05: keep the `src/test/` legacy schema (removed in 061) as a parity oracle, or retire it?
4. F-13: should `.env.example` be English, or is it a deliberate user-facing (Spanish) file like the UI?
5. F-08: should README keep the `dist/cli.js` recipe at all?
6. F-11: is the README feature list meant to be exhaustive (then it's drift) or a highlights list (then label it)?
