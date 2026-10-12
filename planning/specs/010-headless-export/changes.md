# 010 — headless-export — Changes

## 2026-10-10 — snake_case names, renderer reused within a process
Why: A20@2 names tools in snake_case (wording only for R1, R2, D3); starting Vite and Chromium on every MCP call is slow (a CLI call is its own process and neither gains nor loses).
- REWORDED R1@1, R2@1, D3@1
- MODIFIED D2@1 → D2@2
- Tasks: T002 (never started) re-pointed to D2@2

## 2026-10-12 — the CLI and MCP close the renderer
Why: the CLI (008) runs one command per process; a renderer left open would keep the process alive.
- ADDED D4@1
- Tasks: T005 added
