# 050 — joint-mode

## Goal
Enable turn-based collaborative scene editing between an AI agent (via MCP/CLI) and a human user under `pnpm dev`. The editor reflects external disk updates within 1000ms, locks editor mutations while the agent is editing (with a 3000ms idle timeout or manual takeover), and writes human edits to disk after a 400ms debounce. Verification: automated Vitest fake-timer tests and replay of joint-mode session.

## Requirements
The user wants to watch an agent build a post through the MCP tools in real time and correct
it by hand between instructions, in turns: while the agent edits, the editor shows each change
and is locked; when the agent stops, the user edits and the agent's next call starts from the
user's version. The mode is opt-in; outside it the editor behaves as before.

- R1: A "Modo conjunto" switch in the editor turns the mode on and off for the active project; it is off by default and outside it the editor reads and writes scenes exactly as before 050.
- R2: In joint mode, when a scene file of the active project changes on disk from outside the editor (an MCP or CLI tool, or a hand edit), the editor shows that scene within a second, opening it if another scene is open.
- R3: While it is the agent's turn the editor shows that the agent is editing and blocks every change to the scene (canvas, inspector, layers, shortcuts and undo); selecting, playing and scrubbing still work.
- R4: The agent's turn ends when no scene of the active project has changed on disk for 3 seconds, or when the user presses "Tomar el control"; the editor then unlocks.
- R5: In the user's turn every change to the open scene is written to its scene file shortly after editing stops, so the agent's next tool call reads the user's version.
- R6: Each external scene change applied during joint mode is registered as a single discrete undo step in the editor's local history stack; triggering undo reverts the in-memory canvas state to the prior snapshot and schedules a standard debounced write to disk.
- R7: When an external file write contains invalid scene data—partitioned into: (a) malformed JSON syntax, (b) schema failure (missing `width`, `height`, or `elements`), or (c) empty 0-byte file—the editor retains the existing valid in-memory scene, displays a warning banner with `{ code: 'invalid_scene_file', message }`, and suppresses debounced saves until valid input is received.
- R8: The mode works under `pnpm dev`, where the dev server watches `projects/*/scenes/`; the editor's own writes never start an agent turn.

## Design
### Approach

- D1 (R2, R8): `src/service/scene-watch.ts` holds a pure `sceneChangeOf(root, path)` that maps a file under `projects/<slug>/scenes/<name>.json` to `{ project, name }` (anything else → undefined), and a Vite plugin `sceneWatch()` registered in `vite.config.ts`. On the dev server's watcher `add`/`change` events it reads the file and sends the custom event `lienzo:scene-changed` with `{ project, name, text }` to the browser _(standard: Vite client-server communication — https://vite.dev/guide/api-plugin#client-server-communication; checked against the installed 8.3.3 types: `server.watcher`, `server.hot.send`)_. Under `watch: null` (the MCP renderer's server) the watcher is a no-op, so nothing is sent there.
- D2 (R2, R8): `src/editor/joint/scene-events.ts` defines the domain interface `SceneEventSource { on(cb): () => void }` isolating UI and hooks from `import.meta.hot` _(standard: `import.meta.hot.on` — https://vite.dev/guide/api-hmr#hot-on-event-cb)_. A concrete adapter `sceneEvents(): SceneEventSource | undefined` wraps `import.meta.hot` and returns undefined without a dev server (built bundle), disabling the switch with a hint. Tests inject a fake `SceneEventSource`.
- D3 (R3, R4): `src/editor/joint/turn.ts` is a pure reducer over `{ owner: "user" | "agent"; lastAgentAt: number }` with the events `agentWrote(at)`, `tick(at)` and `takeControl()`; `IDLE_MS = 3000`. An agent write gives the turn to the agent; a tick 3 s after the last write, or `takeControl`, gives it back to the user.
- D4 (R2, R6, R7, R8): `src/editor/joint/incoming.ts` is a pure `incomingScene(text, lastWritten)` returning `{ kind: "own" }` when the text is the JSON the editor itself last wrote, `{ kind: "invalid", error }` when it does not parse as a scene, or `{ kind: "scene", scene }`. A scene for the open name goes through `applyScene` (one undo step, R6); another name is opened with `loadScene` and the name is set. Own writes are ignored and never start a turn (R8).
- D5 (R5, R7): In the user's turn, with the mode on and a named scene open, the scene is written with the existing `saveScene` 400 ms after the last change, and its JSON kept as `lastWritten`. Nothing is written while the last incoming file was invalid, until a valid one arrives (R7); the status bar says why.
- D6 (R3): The lock is one choke point: while the agent owns the turn, `setScene` in `app.tsx` drops every change that does not come from D4, so canvas, inspector, layers, shortcuts and undo cannot edit through any path. Selection and the playhead are separate state and keep working. A banner over the stage says "El agente está editando…" with "Tomar el control"; the inspector is shown disabled.
- D7 (R1): `src/editor/joint/use-joint-mode.ts` is the hook that wires D2–D5 for `app.tsx` (events, a 500 ms tick with an injected clock, the debounced write). The "Modo conjunto" switch sits at the top of the Escenas tab; it starts off and turns off when the active project changes. Off, the hook does nothing.

### Deliverables

- `src/service/scene-watch.ts` (+ test), `vite.config.ts`
- `src/editor/joint/scene-events.ts`, `turn.ts` (+ test), `incoming.ts` (+ test), `use-joint-mode.ts` (+ test)
- `src/editor/app.tsx`, `src/editor/sidebar/project-scenes-tab.tsx`, `src/styles.css`

### Sequencing

- D1 → D2 → D3/D4 (pure, independent) → D5/D7 → D6 → UI.

### Trade-offs

- Vite's own watcher and HMR socket (D1, D2). Pros: no new dependency or server; the connection already exists under `pnpm dev`. Cons: only works with the dev server (R8). Mitigation: the switch is disabled with a hint elsewhere; the app is local-only.
- The file text in the event instead of a follow-up GET (D1). Pros: one round trip, the exact bytes that triggered it, no new endpoint. Cons: large scenes travel over the socket. Mitigation: scenes are small JSON; the watcher fires once per tool call.
- Turn end by idle time (D3). Pros: works with any agent unchanged. Cons: a slow agent (>3 s between calls) hands the turn back mid-task; a user edit then is overwritten in the agent's next turn only on the elements it writes. Mitigation: each agent write takes the turn again at once, and every agent write is an undo step (R6).
- Own-write detection by content (D4). Pros: no ids or headers between editor and server; pure and testable. Cons: if the agent writes byte-identical JSON it is ignored. Mitigation: identical content changes nothing on screen anyway.
- Lock at `setScene` (D6). Pros: one guard covers every edit path, present and future (DRY). Cons: a blocked action fails silently. Mitigation: the banner and the disabled inspector make the lock visible.
- Switch state not persisted (D7). Pros: off by default every session, as R1 asks; nothing stored. Cons: re-enable after a reload. Mitigation: one click, in the tab where scenes are.
- Debounced write of the whole scene (D5). Pros: reuses `saveScene` and its validation. Cons: a write per pause. Mitigation: 400 ms debounce; only in joint mode.

## Tasks
- [x] 050/T001 [agent] Pure path mapper `sceneChangeOf(root, path)` and Vite plugin `sceneWatch()` in `src/service/scene-watch.ts` registered in `vite.config.ts` — covers D1
- [x] 050/T002 [agent] `SceneEventSource` adapter `sceneEvents()` over `import.meta.hot` — covers D2
- [x] 050/T003 [agent] Turn reducer in `src/editor/joint/turn.ts` — covers D3
- [x] 050/T004 [agent] `incomingScene` in `src/editor/joint/incoming.ts` — covers D4
- [x] 050/T005 [agent] `useJointMode` hook: events, tick, apply or open incoming scenes, debounced write, no write after an invalid file — covers D5, D7
- [x] 050/T006 [agent] Lock at `setScene` during the agent's turn, banner with "Tomar el control", disabled inspector — covers D6
- [x] 050/T007 [agent] "Modo conjunto" switch in the Escenas tab, off by default, off on project change, disabled without a dev server — covers D7
- [x] 050/T008 [agent] Parameterized tests: `sceneChangeOf` across nominal, path traversal, and unrelated files; turn reducer timing boundaries (2999ms, 3000ms, 3001ms) — covers R2, R4, R8
- [x] 050/T009 [agent] Parameterized tests: own write ignored, invalid scene file partitions (syntax, schema, 0-byte) reported without file write; hook with fake timer and fake `SceneEventSource` matrix asserting undo history step and lock state transitions — covers R1, R2, R3, R5, R6, R7
- [ ] 050/T010 [human] With `pnpm dev` open and the MCP agent on the same project, turn on "Modo conjunto", ask the agent for a post, watch it build, correct something by hand and give another instruction — covers R1, R2, R3, R4, R5
- [x] 050/T011 [agent] Fix: the agent's-turn banner took a grid row and filled the stage; make it a small floating pill over the canvas — covers D6
