# 046 — audit-cleanup — Requirements

An audit (2026-10-22) of dead code, hollow tools and documentation drift found that seven
scene-editing tools could only reach `mi-proyecto`, that tool descriptions and the agent
docs described a layout that no longer exists, that `.env.example` documented variables
nothing read, and that the OpenRouter API key was exposed to the browser. Findings and plan
are in `audit.md` next to this file.

- R1@1: Every tool that reads or writes a scene, an asset or an export takes a required `project`; a call without it fails with `invalid_input` on `project`. No tool reads or writes scenes, assets or exports outside `projects/<slug>/`.
- R2@1: `scene_export` writes only inside the target project: `out` is resolved inside `projects/<slug>/exports/` and a path that escapes it is rejected.
- R3@1: Tool descriptions, `AGENTS.md`, `README.md` and `.env.example` state only what the code does (paths, commands, scripts, env variables, component list).
- R4@1: The OpenRouter API key never reaches browser code or the built bundle; the editor synthesizes OpenRouter speech through a dev-server endpoint that adds the key server side. A key the user types in the dialog still works.
- R5@1: The local TTS provider takes its default voice and model from `KOKORO_TTS_VOICE` and `KOKORO_TTS_MODEL` (defaults `ef_dora`, `kokoro-es`); env names not documented in `.env.example` are not read.
- R6@1: Code with no consumer is removed: unused files, routes, functions and scripts are deleted, and exports used only inside their own module are no longer exported.
- R7@1: `schemas/compact-scene.json` is checked by a test to equal what `generateCompactJsonSchema()` produces.
