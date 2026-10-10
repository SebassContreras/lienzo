# 016 — three-d — Changes

## 2026-10-10 — one shared WebGL renderer, determinism within a session
Why: one WebGL context per element hits the browser's cap on live contexts (around 16 in Chrome); WebGL output is not guaranteed equal across GPUs or software rasterizers, so R5 is checked within a session; three.js stays behind the descriptor folder (adapter).
- MODIFIED D1@1 → D1@2
- ADDED D4@1, D5@1
- Tasks: T001, T002, T007 (never started) re-pointed to D1@2; T001 also covers D4@1; T008 also covers D5@1
