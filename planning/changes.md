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

## 2026-10-08 — components become descriptors; timeline and 3D enter the scope
Why: the maintainer wants every post buildable from JSON alone, new features inherited instead of rebuilt, keyframe animation with loop/once control, any element as a particle, and a three.js element; CLI and MCP move to the end.
- MODIFIED A7@2 → A7@3
- ADDED A23@1
- ADDED A24@1
- ADDED A25@1
- Tasks: 001/T006, 002/T003, 002/T010, 002/T011 and 003/T002 re-pointed to A7@3 (still valid); specs 012–016 created; 007 and 011 rewritten; 007–011 re-prioritised after 016

## 2026-10-08 — more elements, more animations, animation presets
Why: the maintainer wants a wider range of elements and animations for explainer posts, and to save custom animations and reuse them on other elements.
- ADDED A26@1
- Tasks: specs 017–019 created; 007–011 and 014–016 re-prioritised
