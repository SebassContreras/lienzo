# 050 — joint-mode — Requirements

The user wants to watch an agent build a post through the MCP tools in real time and correct
it by hand between instructions, in turns: while the agent edits, the editor shows each change
and is locked; when the agent stops, the user edits and the agent's next call starts from the
user's version. The mode is opt-in; outside it the editor behaves as before.

- R1@1: A "Modo conjunto" switch in the editor turns the mode on and off for the active project; it is off by default and outside it the editor reads and writes scenes exactly as before 050.
- R2@1: In joint mode, when a scene file of the active project changes on disk from outside the editor (an MCP or CLI tool, or a hand edit), the editor shows that scene within a second, opening it if another scene is open.
- R3@1: While it is the agent's turn the editor shows that the agent is editing and blocks every change to the scene (canvas, inspector, layers, shortcuts and undo); selecting, playing and scrubbing still work.
- R4@1: The agent's turn ends when no scene of the active project has changed on disk for 3 seconds, or when the user presses "Tomar el control"; the editor then unlocks.
- R5@1: In the user's turn every change to the open scene is written to its scene file shortly after editing stops, so the agent's next tool call reads the user's version.
- R6@1: Each change the agent writes is one undo step in the user's turn, and undoing it is written to the file like any other change.
- R7@1: A scene file that is not a valid scene leaves the last valid version on screen and shows the error; the editor does not write over it.
- R8@1: The mode works under `pnpm dev`, where the dev server watches `projects/*/scenes/`; the editor's own writes never start an agent turn.
