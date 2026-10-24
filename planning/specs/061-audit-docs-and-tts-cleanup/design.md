# 061 — audit-docs-and-tts-cleanup — Design

## Approach

- D1@1 (implements R1): Docs follow the code. `AGENTS.md`: the Speech bullet names the user-typed key path (stored in the TTS preferences, sent straight to OpenRouter), the CLI bullet names `--json @file`, the Layout block lists `src/service/compact/`, `src/engine/{audio,subtitles,path}/`, `src/editor/{brand,dialogs,footer,widgets,joint}/` and `docs/`, and the testing rule drops "about 30 s". `README.md`: the bundle recipe says to rerun `pnpm build:cli` after pulling. Tool descriptions drop `(055/D3)` and `(spec 011)`. `.env.example` comments are translated to English.
- D2@1 (implements R2): `docs/components.md` has one section per kind in `COMPONENTS` order (kind, Spanish label, what it draws, key fields), plus groups, symbols and keyframe channels. `README.md` keeps a short feature summary and links it. `src/components/components-doc.test.ts` reads the file and expects a `` ## `<kind>` `` heading for every registered kind.
- D3@1 (implements R3): `loadTtsPreferences` moves a key found in `STORAGE_KEY_OPENROUTER_API_KEY` into the saved preferences and removes that slot; `saveTtsPreferences` no longer writes it; `resolveOpenRouterApiKey` drops its `localStorage` fallback (the dialog already passes the preferences' key). The constant stays only for the migration.
- D4@1 (implements R4): `config.ts` exports `DEFAULT_LOCAL_TTS_MODEL`, `DEFAULT_LOCAL_TTS_VOICE` and `DEFAULT_TTS_VOICE`; `tts-dialog.tsx` uses them with `DEFAULT_TTS_MODEL`.
- D5@1 (implements R5): Delete the hand-written legacy schema in `src/test/` and the `LegacySceneSchema` comparisons in `src/test/registry.test.ts`; the golden render and the descriptor-generated schema tests stay.
- D6@1 (implements R6): `git rm --cached` the tracked `.pyc` and add `__pycache__/` to `.gitignore`.
- D7@2 (implements R7): The failing run was a teardown hook: closing Vite and the browser in `afterAll` outlasted Vitest's 10 s hook default under a loaded full run (`image-probe.test.ts`). The browser tests' `afterAll` hooks get a 60 s timeout; the describe-level timeout only covers tests.

## Deliverables

- `AGENTS.md`, `README.md`, `.env.example`, `docs/components.md`
- `src/service/tools/shot-set.ts`, `src/service/tools/scene-build.ts`
- `src/service/tts/config.ts`, `src/service/tts/preferences.ts`, `src/editor/dialogs/tts-dialog.tsx`
- the `src/test/` legacy schema (deleted), `src/test/registry.test.ts`
- `src/components/components-doc.test.ts`, `.gitignore`

## Trade-offs

- Component reference in its own file with a test (D2). Pros: README stays short; the kinds list has drifted twice (046, 061), and the test stops a third time. Cons: one more doc to edit per new kind. Mitigation: the failing test names the missing kind.
- Dropping the legacy key slot (D3). Pros: the secret lives in one place. Cons: a downgraded editor would not find the key. Mitigation: the app is local-only; the user retypes it once.
- Removing the legacy schema (D5). Pros: no frozen copy to maintain; it never covered the kinds added after 012. Cons: loses the old-vs-new parity check. Mitigation: parity was proven in 012; the generated schema and golden render tests stay.
