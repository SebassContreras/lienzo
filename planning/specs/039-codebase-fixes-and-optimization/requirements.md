# 039 — codebase-fixes-and-optimization — Requirements

## What's being built

A comprehensive hardening and optimization pass over the service layer, MCP server, compact scene expansion, and canvas rendering engine based on real-world agent interactions and architectural review (the 8 principles).

1. Fixes agent workflow bugs: partial animations deep-merged with canonical defaults, compact `group` elements accepting recursive partial children, and subtitle karaoke highlight scaling without inter-word collision.
2. Architectural refactoring & dependency inversion: in-process render helper deduplication (DRY), `TtsService` injection through `Ctx` (SRP / Dependency Inversion), and cached schema serialization for MCP `tools/list`.
3. Dead code pruning: removing confirmed unused functions, constants, and obsolete types while strictly preserving active parsers (such as WebVTT used in cues-editor).

## Who it serves

AI agents and creators authoring posts via MCP, CLI, or the web editor who need reliable, contract-compliant declarative scene generation and high-performance execution.

## Requirements

- R1@1: Compact scene expansion deep-merges partial `anim` definitions (`in`, `loop`, `out`, or shorthand strings) with the element's canonical animation defaults, preserving default easing, duration, loops, and exits instead of replacing the anim object with incomplete properties.
- R2@1: Compact `group` elements accept recursive partial `children` matching the compact schema (`CompactElementSchema`), resolving children with their respective defaults during expansion.
- R3@1: Subtitle karaoke rendering prevents word collision when `highlightScale > 1` by reserving non-destructive horizontal spacing padding in the layout or scaling within safe bounds.
- R4@1: Headless rendering logic shared between `scene_export` and `scene_preview` is unified into a dedicated service helper to eliminate duplicated resolution and rendering code.
- R5@1: `TtsService` is injectable through `Ctx`, decoupling `scene_generate_speech` from low-level environment access and direct provider instantiation.
- R6@1: The MCP server memoizes the translated JSON schemas of registered tools so `tools/list` requests respond in O(1) without re-evaluating schemas on every call.
- R7@1: Confirmed dead code and unused symbols (`SAME_T`, `HUE_STEPS`, `isWordCompleted`, obsolete types in `compact.ts`) are eliminated without impacting active runtime features.
- R8@1: MCP setup documentation in `README.md` provides explicit working configuration examples (e.g. `cwd`, stdio flags) for OpenCode and other MCP clients.

## Out of scope

- Changing the canonical scene format or adding new canvas components.
- Removing active WebVTT parsing needed by the cues editor.

## Dependencies

007, 009, 010, 011, 027, 028, 032.

## Owner split

All tasks agent.
