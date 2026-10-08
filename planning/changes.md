# Architecture — Changes

## 2026-10-07 — images live in `assets/`, versioned with the repo
Why: spec 002 added the `assets/` folder and `/api/assets` for image elements, and A7 did not say so; scenes that use images should open on any clone.
- MODIFIED A7@1 → A7@2
- Tasks: 001/T006 and 002/T003 re-pointed to A7@2 (still valid); 003/T002 re-pointed to A7@2; added 002/T010 (keep `assets/` in the repo) and 002/T011 (README and AGENTS.md describe 002 and A7@2)

## 2026-10-08 — CLI and MCP server enter the scope
Why: the maintainer wants scripts and AI agents (Claude through MCP) to build and export posts, both through the same tools.
- ADDED A20@1
- ADDED A21@1
- ADDED A22@1
- Tasks: specs 007–010 created
