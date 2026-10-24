# 056 — reusable-symbols — Requirements

Complex multi-part objects (like a 12-element car or character) repeated across a scene or across shots must currently be duplicated in full, inflating the element count and requiring every copy to be updated whenever the design changes.

- R1@1: A scene supports an optional `symbols` dictionary (`Record<string, { w: number; h: number; children: SceneElement[] }>`) in both the full scene schema and the compact scene format.
- R2@1: A registered `use` component (`src/components/use/`) references a symbol by `symbol: "<name>"` with `{ x, y, w, h }` and an optional `overrides` map (`Record<string, Record<string, unknown>>` keyed by child id/path to override fields such as fill color or text).
- R3@1: Rendering a `use` element draws the referenced symbol's `children` scaled to the instance's `w × h` box with its `overrides`, transform, and effective opacity applied; an unknown symbol name draws a non-crashing placeholder and reports a diagnostic in `scene_inspect_layout`.
- R4@1: Editing a symbol definition in `scene.symbols` updates the appearance of every `use` instance referencing it without duplicating the child elements in the scene file.
