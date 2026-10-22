# 007 — service-layer — Changes

## 2026-10-10 — one store logic for the editor and the tools
Why: review against DRY: reusing "the logic" of `json-store.ts` without saying how invites a copy; the Vite middleware and the tools are two real users of the same file operations.
- MODIFIED D2@1 → D2@2
- Tasks: T002–T007 (never started) re-pointed to D2@2; T001 re-pointed to A20@2; ADDED T012

## 2026-10-22 — explicit coordinates and re-centring for agents
Why: an agent placed texts at x=540 assuming centre anchoring; the tools never stated that x, y is the box's top-left, and an existing element could not be re-centred on a point without computing coordinates by hand.
- MODIFIED R3@1 → R3@2, D3@1 → D3@2
- Tasks: T005–T007 reviewed (still valid, the change only adds); T008 re-pointed to R3@2 (reviewed); ADDED T013–T015
