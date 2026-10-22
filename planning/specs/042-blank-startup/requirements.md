# 042 — blank-startup — Requirements

The editor opens on an unknown scene (the last autosave, or the MCP demo when there is none)
that is already playing. It should open idle and empty, in the default project.

- R1@1: On startup the editor shows an empty scene (`defaultScene()`, no elements) in the `mi-proyecto` workspace, with the scene name "Mi proyecto".
- R2@1: On startup playback is paused at t = 0; nothing animates until the user presses play.
- R3@1: The previous autosaved scene of a workspace is not loaded automatically; it stays recoverable on demand (see 043).
- R4@1: The demo scene is never loaded unless the user asks for it explicitly.
