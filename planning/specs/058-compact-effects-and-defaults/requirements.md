# 058 — compact-effects-and-defaults — Requirements

`scene_build` silently drops `effects` from compact elements, shape defaults always turn on gradients and shadows (requiring repetitive boilerplate in flat illustrations), and `scene_preview` in the CLI only returns base64 inside JSON instead of writing a PNG file directly when requested.

- R1@1: The compact element format (`src/model/compact.ts` and `src/service/compact/expand.ts`) accepts partial `effects` (`blur`, `blend`, `mask`, etc.) on any element and merges them with the default effects object, reporting any unrecognized or dropped keys in `notices`.
- R2@1: Compact scenes accept an optional scene-level `defaults: "flat"` setting that disables default gradients (`gradient: false`), shadows (`shadow.enabled: false`), and borders (`border.width: 0`) on shapes unless explicitly specified on the element.
- R3@1: The `scene_preview` tool (`src/service/tools/scene-preview.ts`) accepts an optional `out` path (resolved inside `projects/<slug>/exports/`), writes the rendered PNG file to disk when `out` is provided, and returns the saved file path alongside the preview result.
