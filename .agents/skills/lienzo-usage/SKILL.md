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

- Every scene, asset and export tool needs `project` (a slug from `project_list`); there
  is no default. Never use an asset from another project.
- Files go only inside `projects/<slug>/` (scenes, assets, exports).
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
   `notices` without writing anything. Read the notices (ignored keys, missing fonts).
4. **Check:** `scene_inspect_layout` (overlaps, out of canvas, contrast, drawn boxes) at
   the times that matter; `scene_preview` at a time `t` to look at a frame (`out` saves the
   PNG in `exports/`).
5. **Save:** `scene_build` with `save: "<name>"` (`overwrite: true` to replace; the stored
   audio is kept unless you pass `audioTracks`).
6. **Edit:** `element_update` / `element_add` (`parent` to insert in a group) /
   `element_move` / `element_remove`, `keyframe_set` / `keyframe_remove`, `background_set`,
   `shot_set`, `image_trim`, `element_group` / `element_ungroup`. Targets are an `id` or a
   `group/child` path. Scene settings (size, duration, fps, mode, audio tracks, symbols) go
   through `scene_update`; `scene_rename` / `scene_delete` manage the files.
   Reusables: `preset_save` / `preset_rename` / `preset_delete`, `animation_list` /
   `animation_save`.
   - **Duplicate** (no tool of its own): `scene_get`, copy the element, then `element_add`
     with a new `id` and the position shifted (`x`/`y`).
   - **Align** (no tool of its own): `scene_inspect_layout` gives each drawn box; compute the
     shared edge or center and set `x`/`y` on each element with `element_update`.
7. **Voice:** `scene_generate_speech`; for one clip per shot use `asTrack: true` and
   `startOffset` (the shot's start) so each call appends a track. Subtitles follow the cues.
8. **Export:** `scene_export` (`png`, `gif`, `mp4`) into `projects/<slug>/exports/`.

## Compact scene, by example

```json
{
  "size": "Story",
  "duration": 8,
  "defaults": "flat",
  "background": { "color": "#0b1020" },
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

- `at` places an element (`"center"`, an anchor, or `{ anchor, offset }`); `fit: "canvas"`
  fills the canvas; lines join elements with `from` / `to`.
- `anim` is an entry/loop/exit shorthand; `tracks` are keyframes `[t, value, easing?]` by
  field path or `@rotate` / `@scale`, with `repeat: "loop" | "pingpong"` and `until`.
- `origin` is the pivot for rotation and scale; `w` on `text` wraps it.
- Shots: an element with `shot` only shows during that shot, and only it moves with that
  shot's camera (groups included, applied once); elements with no `shot` (subtitles, logos)
  never move. `transition` `fade` / `slide` / `zoom` plays over `duration` before the
  shot's `start` and after its `end`; consecutive shots overlap there.
- Defaults: shapes fill at `fill.opacity: 1`; a `path` has no stroke unless you set
  `border.width` (a `"draw"` entrance gives it 3). Unknown keys come back as notices,
  named by path.
- Shapes: `polygon` `fit: "box"`, `path` `mode: "layers"`, group `clip`, fills with
  `fill.type: "radial"` or `fill.stops`. Partial `effects` merge with the defaults.
- `audioTracks: [{ assetId, startOffset?, volume? }]` sets the audio.

The full schema is `schemas/compact-scene.json`; component fields are in
`docs/components.md` and `component_list`.

## In the editor

`pnpm dev` (http://localhost:5173) opens the same scenes. The editor edits shots, symbols, track
`repeat`/`until` and `origin` too, writing the same JSON as the tools.
