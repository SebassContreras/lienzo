# 007 — service-layer — Changes

## 2026-10-10 — one store logic for the editor and the tools
Why: review against DRY: reusing "the logic" of `json-store.ts` without saying how invites a copy; the Vite middleware and the tools are two real users of the same file operations.
- MODIFIED D2@1 → D2@2
- Tasks: T002–T007 (never started) re-pointed to D2@2; T001 re-pointed to A20@2; ADDED T012
