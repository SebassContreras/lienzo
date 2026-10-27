# 076 — bundle-root-and-input-hints

## Goal
An earlier QA note (before 074) reports three things none of 074–075 covers, replayed on
`main` (8ddc0bb):
- `node dist/cli.js mcp` (the package's `bin`) fails on `scene_preview` with
  `Cannot resolve entry module ../vite.config.ts`: `ctx.ts` computes the app root as two
  folders above its own file, which in the one-file bundle `dist/cli.js` is the repo's
  parent. `findAppRoot` (`src/service/root.ts`, 029/D2) already finds the root from either
  place; `ctx.ts` does not use it (the 075 rule: one rule, one place).
- `scene_build` called with the compact fields at the top level answers only
  `compact: Invalid input: expected object, received undefined`; `content` on a text gets no
  hint (only `fontSize` → `size` does).
- `project_create` needs `project` even though it can be made from `name`.

When this spec is done, the bundle renders, a misplaced or misnamed input says where it
belongs, and `project_create` takes `name` alone.

## Requirements
- R1: The renderer and the image probe find the app (the folder with `vite.config.ts`) from
  `src/service/` and from `dist/` alike.
- R2: A call missing a required object parameter whose input has keys the tool does not
  take says so: «`elements`, `size` no son parámetros de scene_build: ¿van dentro de
  `compact`?». Generic for every tool.
- R3: `content` (and `fontSize`, `fontFamily`, as today) on an element suggests its field
  (`text`).
- R4: `project_create` takes `name` alone; `project` defaults to the slug of `name`
  (`projectSlug`, 074/D6) and the result names it.
- R5: Docs and descriptions say so; the CLI bundle is part of the verification.

## Design
- D1 (R1): `ctx.ts` uses `findAppRoot(import.meta.dirname)` for `APP_ROOT`. The test builds
  nothing; it checks that `findAppRoot` from `dist/` and from `src/service/` give the same
  folder, holding `vite.config.ts`. The real bundle is checked in the Verify task
  (`pnpm build:cli`, then `node dist/cli.js scene_preview`).
  - _Trade-offs_: `findAppRoot` stops at the first `package.json` going up; a `package.json`
    placed inside `dist/` would stop it there.
  - _Mitigation_: `dist/` holds only `cli.js` (029); the test pins the result.
- D2 (R2): In `callTool` (`src/service/registry.ts`), when the input fails, the top-level keys
  the input schema does not have and the missing object parameters are named in one hint
  appended to the message. Pure helper `misplacedHint(shape, input, issues)` next to it.
  - _Trade-offs_: Only top-level keys and object parameters; a misplaced nested key is still
    the ignored-field notice.
  - _Mitigation_: That notice already names the path and the closest field.
- D3 (R3): `ALIASES` in `src/model/ignored.ts` gains `content → text`.
- D4 (R4): `project_create` input `project` optional; `projectSlug(name)`; an empty slug
  fails asking for `project`. Output already has `project`.
- D5 (R5): `project_create` and `scene_build` descriptions; README and the usage skill.

## Tasks
- [x] 076/T001 [agent] App root from `findAppRoot` in `ctx.ts`, test from `dist/` and `src/service/` — covers R1, D1
- [x] 076/T002 [agent] Misplaced-key hint in `callTool`; `content → text` alias — covers R2, R3, D2, D3
- [x] 076/T003 [agent] `project_create` with `name` alone — covers R4, D4
- [x] 076/T004 [agent] Docs and descriptions — covers R5, D5
- [x] 076/T005 [agent] Verify: typecheck, lint on touched files, tests, `pnpm build:cli` and `node dist/cli.js scene_preview`, replay R2–R4 with `pnpm lienzo` — covers R1, R2, R3, R4, R5
      verified: `pnpm typecheck`, biome on the 7 touched source files, `pnpm test` (1273 tests, 154 files); `pnpm build:cli`, then with `node dist/cli.js` on scratch projects `qa-076` and `cafe-norte` (deleted after): `scene_preview` returns a PNG (image/png, 511 KB base64) where the QA note got `Cannot resolve entry module ../vite.config.ts`; `scene_build` with `elements`/`size` at the top level answers «¿van dentro de «compact»?»; `content`/`fontSize` suggest «text»/«size»; `project_create { name: "Café Norte" }` makes `cafe-norte` — found: nothing new
