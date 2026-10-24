# Lienzo — Dead code, hollow tools & documentation drift audit (2026-10-22)

Read-only. No repo file was modified.

## 1. Executive summary

- **Root:** `lienzo/` (git root, single package, `pnpm-workspace.yaml` with no sub-packages). TS/React 19 + Vite 8, Node 24.
- **Entry points:** `index.html` → `src/main.tsx` (editor + `?render` route), `src/cli/main.ts` (`pnpm lienzo`, also `mcp`), `src/cli/build.ts` → `dist/cli.js` (`bin`), `vite.config.ts` middlewares (`/api/*`), tests (`*.test.ts`).
- **Safety net:** `pnpm typecheck` 0 errors; `pnpm lint` 0 errors / 34 warnings; `pnpm test` 72 files / 628 tests green (~30 s); CI runs lint+typecheck+test. Knip (via `pnpm dlx`) used for dead exports.
- **Assumptions:** `.agents/skills/spectrace-*` are vendored (pinned in `skills-lock.json`) → audited only for references into this repo. `planning/specs/**` are spec/history, not drift. `dist/` excluded.
- **Findings:** 1 correctness/hollow-tool (high), 9 doc drift (D1×3, D2×4, D5×1, D6×4 overlapping), 1 security (red), 3 dead routes/modules, ~52 unused exports (mostly test-only or type exports; grey), 2 duplicated scripts/constants.

**Top 5 actions**
1. Add `project` to `element_update/remove/move`, `background_set`, `keyframe_set/remove`, `scene_inspect_layout` (F1) — today they can only touch `mi-proyecto`.
2. Fix stale tool descriptions (`scene_list`, `scene_create`, `scene_export`) that still say `scenes/` / `exports/` at repo root (F2, D6).
3. Fix AGENTS.md: "Planned (not built yet)" block lists done specs; Layout misses `src/mcp/`, most component kinds, and cites a removed "scenes dialog" (F3–F5, D6).
4. README: `dist/mcp.mjs` does not exist; "scenes dialog" replaced by Escenas tab; tools write `projects/<slug>/` not `scenes/` (F6–F8).
5. `.env.example`: `KOKORO_TTS_VOICE/MODEL` are never read (F9); decide on `envPrefix: "OPENROUTER_"` exposing the API key to the browser bundle (F10, red).

**Top risks:** F1 silently edits the wrong scene when two projects share a scene name; F10 inlines a secret into `vite build` output if `.env` has a key at build time.

## 2. Repo map / doc surface

| Area | Path | Notes |
|---|---|---|
| Tool registry (26 tools) | `src/service/tools/index.ts:32` | single list, used by CLI + MCP |
| CLI adapter | `src/cli/main.ts`, `args.ts`, `help.ts` | `mcp` subcommand at `main.ts:39` |
| MCP adapter | `src/mcp/server.ts` | generic, no per-tool code (verified) |
| Agent docs | `AGENTS.md` (148 l), `.agents/skills/spectrace-*` (vendored), `.claude/` (no files) | no CLAUDE.md in repo |
| Human docs | `README.md`, `planning/**`, `.spectrace/format.md` | |
| Interface docs | 26 tool descriptions + Zod schemas, `schemas/compact-scene.json`, `.env.example` | |
| CI | `.github/workflows/ci.yml` | lint, typecheck, test — matches AGENTS A15 |

## 3. Findings table

| ID | Category | Symbol/file | Location | Evidence | Conf. | Zone | Risk | Effort | Action | Principle |
|---|---|---|---|---|---|---|---|---|---|---|
| F1 | hollow-tool / doc-drift:D6 | 7 scene-editing tools | `src/service/tools/element-update.ts:16-21` (same in element-remove/move, background-set, keyframe-set/remove, scene-inspect-layout) | no `project` input; `editScene(ctx, …)` uses `ctx.store` = `projects/mi-proyecto/scenes` (`src/service/store.ts:37,46`). Contradicts AGENTS.md:117-120 and spec 040 R3/R4 | high | 🟢 | med | M | add `project` + `resolveProjectScope` like `scene-build.ts:26-27` | 1, 2, 9 |
| F2 | doc-drift:D6 | tool descriptions | `scene-list` "in scenes/", `scene-create` "in scenes/", `scene-export.ts:19-20` "default exports/<scene>.<ext>, relative to the repo" | real default `scene-export.ts:68` = `projects/${slug}/exports/…`; store at `store.ts:37` | high | 🟢 | low | S | rewrite descriptions | 9 |
| F3 | doc-drift:D2/D6 | AGENTS.md "Planned (decided, not built yet — specs 011, 016, 017, 020–025)" | `AGENTS.md:63-69` | `planning/roadmap.md:18-32` all `done`; `src/components/three/`, `src/model/compact.ts` exist | high | 🟢 | low | S | merge into "What exists today", drop the heading | 9 |
| F4 | doc-drift:D2 | AGENTS Layout component list "rect, ellipse, icon, image, group, text, line, particles"; no `src/mcp/`, `src/test/`, `src/editor/sidebar/` | `AGENTS.md:83-86, 71-101` | `src/components/` has 25 kinds (arrow, badge, bubble, chart, code, counter, list, path, polygon, progress, star, steps, subtitles, table, three…) | high | 🟢 | low | S | replace list with "one folder per kind, see `src/components/index.ts`" (stops future drift) | 9 |
| F5 | doc-drift:D5 | "scenes dialog" in `src/presets/` | `AGENTS.md:93` | no scenes dialog in `src/presets/` or `src/editor/dialogs/`; replaced by `src/editor/sidebar/project-scenes-tab.tsx` (commit f4108a0, spec 043) | high | 🟢 | low | S | point to sidebar tab | 9 |
| F6 | doc-drift:D1/D5 | `node dist/mcp.mjs` | `README.md:100` | `src/cli/build.ts:10` outputs only `dist/cli.js`; correct: `node dist/cli.js mcp` | high | 🟢 | low | S | fix snippet | 9 |
| F7 | doc-drift:D2 | "The scenes dialog shows each saved scene…" | `README.md:41-42` | same as F5 | high | 🟢 | low | S | describe "Escenas" tab | 9 |
| F8 | doc-drift:D2 | "Tools read and write the files of this repo (`scenes/`, `presets/`)" | `README.md:107` | `store.ts:37`, spec 040 R2 removed root `scenes/` | high | 🟢 | low | S | say `projects/<slug>/`, `presets/`, `fonts/` | 9 |
| F9 | doc-drift:D1 | `KOKORO_TTS_VOICE`, `KOKORO_TTS_MODEL` | `.env.example:52-53` | never read (grep over `src/`, `vite.config.ts`); local adapter hardcodes `"kokoro"`/`"af_heart"` at `src/service/tts/local-adapter.ts:97-98`; `DEFAULT_LOCAL_TTS_MODEL/VOICE` (`config.ts:18-19`) unused | high | 🟡 | low | S | either read them in `LocalTtsAdapter` via `config.ts` (doc→code) or delete lines + constants | 9, 2 |
| F10 | security / doc-drift:D3 | `envPrefix: ["VITE_", "OPENROUTER_"]` | `vite.config.ts:184`; `.env.example:11-12` advertises it | exposes `OPENROUTER_API_KEY` to client code; `vite build` statically inlines `import.meta.env.*` into `dist/` | high | 🔴 | high | S | owner decision: keep key server-side (proxy endpoint in middleware) or document the risk | 3, 9 |
| F11 | doc-drift:D3 | undocumented env aliases `KOKORO_PROVIDER`, `KOKORO_TTS_URL`, `LOCAL_TTS_URL` | `src/service/tts/config.ts:139,161-162` | only `TTS_PROVIDER`/`TTS_LOCAL_URL`(+KOKORO_TTS_URL) in `.env.example:43-48` | high | 🟡 | low | S | drop aliases (YAGNI) or list them | 4, 9 |
| F12 | dead | `/api/scenes`, `/api/voices` json-store routes | `vite.config.ts:16-20` | no client fetches `/api/scenes` (grep); `/api/voices` only used by `loadVoicePresetFiles/saveVoicePreset` (`src/presets/store.ts:159,185`) which knip reports unused; `presets/voices/` does not exist | high | 🟡 | low | S | remove both route keys + the two functions | 4 |
| F13 | dead | `loadUserPresets` + `toVoicePreset` | `src/presets/store.ts:34` | knip unused; presets now load via project middleware (`project-middleware.ts:123`) | med | 🟡 | low | S | delete after confirming sidebar uses project route | 4 |
| F14 | dead | subtitles barrel `index.ts` (`src/engine/subtitles/`) | whole file | knip "unused file", no import of `subtitles/index` (grep) | high | 🟢 | low | S | delete barrel | 4 |
| F15 | valueless-fn | `pnpm verify` ≡ `pnpm typecheck` | `package.json:15,19` | identical command; AGENTS.md:128 sells `verify` as "fast single-pass" | high | 🟡 | low | S | keep one (`typecheck` is what CI uses) and update AGENTS | 2, 9 |
| F16 | doc-drift:D2 | "keep daily execution under a few seconds" | `AGENTS.md:124-126` | measured 30 s for 628 tests | med | 🟡 | low | S | restate as a goal or drop | 9 |
| F17 | dead (grey) | ~52 unused exports / 28 types (knip list in §8 appendix) | e.g. `src/service/registry.ts` `callTool`, `src/mcp/server.ts` `mcpToolOf/contentOf`, `src/service/tts/config.ts` `persistOpenRouterApiKey`, `src/model/compact.ts` `generateCompactJsonSchema` | most are internal helpers exported for no consumer; some are deliberate test seams | med | 🟡 | low | M | un-export (not delete) in one sweep; keep `generateCompactJsonSchema` (see F18) | 4 |
| F18 | doc-drift:mechanize | `schemas/compact-scene.json` | generator `src/model/compact.ts:185` | currently **in sync** (byte-equal JSON, checked via tsx) but nothing regenerates or asserts it | high | 🟢 | low | S | one test: `expect(generateCompactJsonSchema()).toEqual(readJson(...))` | 9 |
| F19 | obsolete (grey) | `resolveTtsRuntimeConfig` | `src/service/tts/config.ts:216` | only consumer is `tts-config.test.ts:77` | high | 🟡 | low | S | delete with its test | 4 |

## 4. Documentation alignment matrix (claims verified)

| Claim | Doc | Claim (quoted, short) | Code anchor | Class | Verdict | Fix |
|---|---|---|---|---|---|---|
| C1 | AGENTS.md:117 | "All scenes … MUST be saved within the target project" | element_* tools lack `project` (F1) | D6 | code violates doc | doc→code |
| C2 | AGENTS.md:63 | "Planned (decided, not built yet)" | roadmap all done | D2/D6 | false | code→doc |
| C3 | AGENTS.md:83 | component list of 8 kinds | `src/components/` 25 kinds | D2 | stale | code→doc (point to index) |
| C4 | AGENTS.md:93 | "scenes dialog" | removed (043) | D5 | orphan | code→doc |
| C5 | AGENTS.md:128 | `pnpm verify` fast check | `package.json:19` = typecheck | D2 | misleading | delete script or doc |
| C6 | AGENTS.md:49-56 | CLI flags/`--json -`/exit 1/stderr JSON | `src/cli/main.ts:51-73` | — | true | — |
| C7 | AGENTS.md:57-60 | MCP generic, stdout protocol only, ImageResult as image | `src/mcp/server.ts:31-37,85` | — | true | — |
| C8 | AGENTS.md:61-67 | renderer disposed after every CLI command | `src/cli/main.ts:93-96` | — | true | — |
| C9 | AGENTS.md:39 | user fonts git-ignored | `.gitignore` `fonts/*`, `projects/mi-proyecto/fonts/` | — | true | — |
| C10 | AGENTS.md:134-145 | `.spectrace/trace.py`, `format.md` | present | — | true | — |
| C11 | AGENTS.md:40 | CI runs lint, typecheck, test | `ci.yml` | — | true | — |
| C12 | README.md:100 | `dist/mcp.mjs` | `build.ts:10` | D1/D5 | phantom | code→doc |
| C13 | README.md:41 | scenes dialog | removed | D2 | stale | code→doc |
| C14 | README.md:107 | tools write `scenes/` | `store.ts:37` | D2 | stale | code→doc |
| C15 | README.md:160 | schema in `schemas/compact-scene.json` | in sync | — | true, unenforced | mechanize (F18) |
| C16 | tool `scene_list`/`scene_create` | "in scenes/" | `store.ts:37` | D6 | stale | code→doc |
| C17 | tool `scene_export` | "default exports/<scene>.<ext>" | `scene-export.ts:68` | D6 | stale | code→doc |
| C18 | tool `font_*`, `scene_build`, `element_add` | project-aware | inputs include `project` | — | true | — |
| C19 | .env.example:52-53 | KOKORO voice/model defaults | not read | D1 | phantom | decide (Q2) |
| C20 | .env.example:11 | key "works automatically in the web editor" | `vite.config.ts:184` | — | true (but F10) | owner |
| C21 | config.ts:3-10 header | precedence list incl. `VITE_OPENROUTER_*` | `getEnvVariable` | — | true | — |

D3 (undocumented): F10 env exposure, F11 env aliases, `INIT_CWD` resolution of `--json <file>` (`src/cli/main.ts:85-86`, minor).
D7 (orphan docs): none found; `.claude/` is empty.

## 5. Detail per key finding

**F1 — project scope missing on 7 tools.** Change: add `project: z.string().optional()` and route through `resolveProjectScope` as `scene-build.ts:26-27` does; better, make `editScene/openScene` take the scope so every tool gets it once (DRY). ✅ fixes isolation rule, wrong-scene edits. ❌ input schema change (additive, optional — non-breaking). 🛡️ default stays `mi-proyecto`. Verify: test that `element_update` with `project:"x"` edits `projects/x/scenes/…` and leaves `mi-proyecto` untouched.

**F2–F8 — doc text.** Pure text edits; docs move after F1 lands so descriptions can say "in the project's scenes/ (default mi-proyecto)". For F4, prefer pointing to `src/components/index.ts` rather than listing kinds (it drifted already).

**F9/F11 — TTS env.** Recommended: wire `KOKORO_TTS_VOICE/MODEL` into `LocalTtsAdapter` defaults through `config.ts` (the doc expresses a reasonable contract and the constants already exist), drop `KOKORO_PROVIDER`/`LOCAL_TTS_URL` aliases. ✅ one source of defaults. ❌ changes local default voice from `af_heart` to `ef_dora`. 🛡️ release note.

**F10 — API key in browser.** Owner decision. Options: (a) serve TTS through a Vite middleware that reads `process.env` server-side, drop `OPENROUTER_` from `envPrefix`; (b) keep, and document that `pnpm build` output embeds the key. ✅(a) no secret in bundle ❌ new middleware 🛡️ reuse existing middleware pattern in `vite.config.ts`.

**F12–F14, F17, F19 — dead code.** Phase-2 checks done: no dynamic `import()` with variables over these paths, no config references, routes not fetched by any client file. Un-export first, delete second; typecheck + knip confirm.

**F18 — mechanize schema.** One test, no pipeline.

## 6. Prioritized plan

1. Quick wins (docs follow code, no behavior change): F14, F12, F13, F19, F15, F16, F3–F8, F18 test. Safety net: typecheck + 628 tests.
2. F1 (code first, then F2 descriptions) — new test per tool family.
3. F9/F11 after Q2.
4. F10 after owner decision.
5. F17 un-export sweep (one commit), re-run knip.

## 7. Architectural decisions & sources

- Server-side secret for TTS (F10): Vite docs, `envPrefix` / env variables — https://vite.dev/config/shared-options#envprefix and https://vite.dev/guide/env-and-mode (variables with an exposed prefix end up in client bundle). Taken: keep secrets unprefixed. Adapted: existing middleware pattern. *(Cited from known official docs; not fetched in this session.)*
- Dead-export detection (F17): Knip — https://knip.dev. Used read-only via `pnpm dlx`; not proposed as a new dependency.
- Schema-sync test (F18): no external validation needed (single assertion); not a structural decision.

## 8. Discards / do not touch

- `.agents/skills/spectrace-*` — vendored, owned upstream (`skills-lock.json`).
- the `src/test/` legacy schema (removed in 061) — test fixture for backward compat.
- Exported Zod schemas in `src/model/*` flagged by knip — public shape of scene JSON; un-export only after Q3.
- Lint warnings (`noNonNullAssertion`) — style, not dead code.

## 9. Decisions (owner, 2026-10-22)

- Q1 (F1): nothing may run outside a project — `project` is **required** on every scene, asset and export tool; the `mi-proyecto` default is removed (R1).
- Q2 (F9/F11): implement `KOKORO_TTS_VOICE/MODEL`, remove the undocumented aliases (R5).
- Q3 (F17): un-export every unused export, `src/model` schemas included (R6).
- Q4 (F10): server-side proxy; the key leaves the browser (R4).
- Q5 (F16): resolved in the AGENTS.md rewrite (R3).
### Appendix — knip unused exports (raw)
Run: `pnpm dlx knip --reporter compact`. 1 unused file, 52 unused exports, 28 unused types; full list reproducible with the same command.
