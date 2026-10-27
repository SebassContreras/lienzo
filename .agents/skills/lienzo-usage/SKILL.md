---
name: lienzo-usage
description: >-
  How to make an animated post or video with Lienzo's tools (MCP `lienzo` server or
  `pnpm lienzo <tool>`): pick a project, write a compact scene, check it, preview it and
  export PNG/GIF/MP4, with shots and camera, reusable symbols, keyframe loops, voice-over
  tracks and fonts. Use when asked to create, edit, check or export a Lienzo scene,
  post, reel, story or video ("haz un post", "arma un video", "exporta la escena").
---

# lienzo-usage

The MCP tools and the CLI are the same registry: `mcp__lienzo__scene_build` is
`pnpm lienzo scene_build --json '…'`. Each tool's description and input schema is the
reference; this skill is the workflow. If a tool named here is missing from the MCP list,
the server is stale: run `pnpm build:cli` (for `dist/cli.js`) and reconnect.

## Rules

- Every scene, asset and export tool needs `project` (the `project` of an entry in `project_list`); there
  is no default. Never use an asset from another project.
- Files go only inside `projects/<project>/` (scenes, assets, exports).
- One name means one thing in every tool: `project` is a project (the `project_*` tools
  too), `scene` is a saved scene's name, `data` is a whole scene object (`scene_create`,
  `scene_validate`, `scene_inspect_layout`), `recipe` a preset object, `patch` the values
  merged onto an element, scene or background, `id` an element, `at` a placement.
- Write scenes in compact form with `scene_build`; use the element tools for small edits
  to a saved scene.

## Workflow

1. **Project:** `project_list`, or `project_create`. `project_inspect` lists its assets,
   scenes, presets and brand; `project_update` changes the brand, `asset_add` copies a local
   file into `assets/`, `asset_rename` moves one (scenes follow) and `asset_delete` removes
   one (refused while a scene uses it, unless `force`).
2. **Catalog:** `component_list` (kinds, fields and animatable paths), `preset_list` /
   `preset_get`, `font_list` (then `font_install` for a Google font you need).
3. **Build:** `scene_build` with `compact` and no `save` returns the expanded scene and
   `notices` without writing anything. Read the notices (ignored keys, with the field they
   likely meant, missing fonts, which draw in Inter, text widths estimated for a font with no
   metrics: check those with `scene_preview`).
4. **Check:** `scene_inspect_layout` (overlaps, out of canvas, contrast, drawn boxes as the
   shot camera shows them) at the times that matter; `scene_preview` at a time `t` to look at a frame (`out` saves the
   PNG in `exports/`).
5. **Save:** `scene_build` with `save: "<name>"` (`overwrite: true` to replace; the stored
   audio is kept unless you pass `audioTracks`). `saved` is the scene name and every notice,
   build and save, is in the one `notices` list. A saving build answers short: `saved`,
   `notices` and the `id`/`kind` of each top-level element; pass `response_format:
   "detailed"` (or call `scene_get`) when you need the expanded scene.
6. **Edit:** `element_update` / `element_add` (`parent` to insert in a group) /
   `element_move` / `element_remove`, `keyframe_set` / `keyframe_remove`, `background_set`,
   `shot_set`, `image_trim`, `element_group` / `element_ungroup`. Targets are an `id` or a
   `group/child` path. Scene settings (size, duration, fps, mode, audio tracks, symbols) go
   through `scene_update`; `scene_rename` / `scene_delete` manage the files.
   Reusables: `preset_save` / `preset_rename` / `preset_delete`, `animation_list` /
   `animation_save`.
   - **Duplicate** (no tool of its own): `scene_get`, copy the element, then `element_add`
     with its fields in `patch`, a new `id` and the position shifted (`x`/`y`).
   - **Align** (no tool of its own): `scene_inspect_layout` gives each drawn box; compute the
     shared edge or center and set `x`/`y` on each element with `element_update`.
7. **Voice:** `scene_generate_speech`; for one clip per shot use `asTrack: true` and
   `startOffset` (the shot's start) so each call appends a track. Subtitles follow the cues.
8. **Export:** `scene_export` (`png`, `gif`, `mp4`) into `projects/<project>/exports/`.

## Compact scene, by example

```json
{
  "size": "Story",
  "duration": 8,
  "defaults": "flat",
  "background": "#0b1020",
  "symbols": {
    "sun": { "w": 120, "h": 120, "children": [
      { "id": "disc", "kind": "ellipse", "w": 120, "h": 120, "fill": { "color": "#ffcc33" } }
    ] }
  },
  "shots": [
    { "id": "s1", "start": 0, "end": 4 },
    { "id": "s2", "start": 4, "end": 8, "transition": { "kind": "fade", "duration": 0.5 },
      "camera": { "zoom": 1.2 } }
  ],
  "elements": [
    { "id": "title", "kind": "text", "shot": "s1", "text": "Hola", "w": 800,
      "at": "center", "size": 72, "anim": "pop" },
    { "id": "sun", "kind": "use", "symbol": "sun", "shot": "s2", "at": "center",
      "w": 120, "h": 120, "origin": "center",
      "tracks": { "@rotate": { "keys": [[4, 0], [6, 180]], "repeat": "loop" } } }
  ]
}
```

- `at` places an element the same way in every tool (`scene_build`, `element_add`,
  `element_update`): `"center"` or another anchor, `{ anchor, offset: [dx, dy] }`, or a
  point `{ x, y }` it is centred on; `fit: "canvas"` fills the canvas; lines join elements with `from` / `to`.
- Italic text is `italic: true` (`fontStyle` is not a field and comes back as ignored).
- Only `scene_build` and `scene_validate` (with `compact`) take the compact form;
  `scene_create` and `scene_update` take full scenes.
- `anim` is an entry/loop/exit shorthand; `tracks` are keyframes `[t, value, easing?]` by
  field path or `@rotate` / `@scale`, with `repeat: "loop" | "pingpong"` and `until`.
- `origin` is the pivot for rotation and scale; `w` on `text` wraps it.
- `background` is a background preset name, a color (`"#0b1020"`: solid, no gradient,
  dots or light) or an object that starts solid and adds only what it turns on
  (`{ "color": …, "dots": true }`); any other string comes back as a notice.
- Shots: an element with `shot` only shows during that shot, and only it moves with that
  shot's camera (groups included, applied once); elements with no `shot` (subtitles, logos)
  never move. `transition` `fade` / `slide` / `zoom` plays over `duration` before the
  shot's `start` and after its `end`; consecutive shots overlap there.
- Defaults: shapes fill at `fill.opacity: 1`; a `path` has no stroke unless you set
  `border.width` (a `"draw"` entrance gives it 3). Unknown keys come back as notices,
  named by path, with the field they likely meant (`fontSize` → `size`).
- Shapes: `polygon` `fit: "box"`, `path` `mode: "layers"`, group `clip`, fills with
  `fill.type: "radial"` (it reaches the edge of an ellipse, polygon or star, the farthest
  corner of a rect) or `fill.stops` (ordered by `at`). A fill given only `color` is flat;
  a group given `w`/`h` places its children in those pixels (`cw`/`ch` follow them).
  Partial `effects` merge with the defaults.
- `audioTracks: [{ assetId, startOffset?, volume? }]` sets the audio.

The full schema is `schemas/compact-scene.json`; component fields are in
`docs/components.md` and `component_list`.

## In the editor

`pnpm dev` (http://localhost:5173) opens the same scenes. The editor edits shots, symbols, track
`repeat`/`until` and `origin` too, writing the same JSON as the tools.
