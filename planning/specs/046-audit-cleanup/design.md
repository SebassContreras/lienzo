# 046 — audit-cleanup — Design

## Approach

- D1@1 (implements R1): The base `Ctx.store` holds only presets and animation presets (`PresetStore`); scene methods exist only on a project store. `inProject(ctx, project)` (replacing `resolveProjectScope`) takes a required slug and returns a `ProjectCtx` (`Ctx` whose `store` has scenes). `openScene`, `saveScene` and `editScene` take a `ProjectCtx`, so the compiler rejects any scene access that skipped a project. A shared `PROJECT` Zod field (required slug) is used by every project-scoped tool; the `mi-proyecto` default is removed.
- D2@1 (implements R2): `scene_export` resolves `out` against `projects/<slug>/exports/` and fails with `out_of_project` on `out` when the resolved path is outside it.
- D3@1 (implements R3): Docs follow the code: tool descriptions say "in the project's scenes/"; AGENTS.md drops the stale "Planned" block, points to `src/components/index.ts` for the kinds instead of listing them, names `src/mcp/` and the Escenas sidebar tab, and drops `pnpm verify`; README fixes the MCP bundle command (`node dist/cli.js mcp`) and the scenes UI.
- D4@1 (implements R4): `src/service/tts-proxy.ts` handles `POST /api/tts/speech` in the Vite dev server: it forwards the JSON body to the OpenRouter speech endpoint with the server's `OPENROUTER_API_KEY` (fetch injected). `envPrefix` drops `OPENROUTER_`; `getEnvVariable` reads `process.env` only. `OpenRouterTtsAdapter` sends `Authorization` only when it has a key and fails for a missing key only when the endpoint is not the same-origin proxy; the editor dialog uses the proxy unless the user typed a key.
- D5@1 (implements R5): `config.ts` resolves the local voice and model (`resolveLocalTtsVoice/Model`) and `LocalTtsAdapter` uses them as defaults; the `KOKORO_PROVIDER` and `LOCAL_TTS_URL` aliases are removed.
- D6@1 (implements R6): Delete the unused subtitles barrel (`index.ts` in `src/engine/subtitles/`), the `/api/scenes` and `/api/voices` json-store routes with their client functions, `resolveTtsRuntimeConfig`, and the `verify` script; drop `export` from every symbol knip reports as unused outside its module, and delete those that become unused.
- D7@1 (implements R7): One test compares the committed schema with the generator.

## Deliverables

- `src/service/project-scope.ts`, `store.ts`, `ctx.ts`, `scenes.ts`, scene tools
- `src/service/tts-proxy.ts`, `vite.config.ts`, `src/service/tts/*`, `tts-dialog.tsx`
- `AGENTS.md`, `README.md`, `.env.example`, `package.json`
- `src/model/compact-schema.test.ts`, `src/service/tts-proxy.test.ts`

## Trade-offs

- Required `project` (D1). Pros: no hidden default; an agent can never edit the wrong project's scene of the same name; enforced by types, not review. Cons: every call is longer and old calls break. Mitigation: the error names `project`; `project_list` lists the slugs.
- Dev-server proxy (D4). Pros: the key stays in `.env` on the server; same pattern as the other `/api/*` middlewares. Cons: works only under `pnpm dev`, not a static `dist/`. Mitigation: the app is local-only (product.md); a user key typed in the dialog still works anywhere.
- Un-exporting everything unused (D6). Pros: knip stays clean, the public surface is what is used. Cons: future reuse needs an `export` back. Mitigation: adding `export` is a one-word change.
