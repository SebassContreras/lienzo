# Lienzo

A free-form canvas editor for animated social media posts. Drag pre-made components onto
the canvas, edit them live, and export PNG, GIF or MP4.

- **Rectangle and ellipse:** fill or gradient, border (solid, dashed, dotted, moving),
  border glow, background glow, shadow, inner text. Lines attach to the ellipse's outline.
- **Text:** font, size, weight, color or gradient, glow.
- **Icon:** any [Lucide](https://lucide.dev) icon from a searchable picker, with stroke,
  color, glow and an optional rounded tile (color or gradient).
- **Image:** PNG, JPG, SVG or WebP picked from disk and stored in `assets/`; size (aspect
  kept by default), corners, opacity, border, shadow.
- **Line:** attach its ends to elements so it follows them; curve, arrows, glow, and
  animated flow (light pulses, marching ants, comet).
- **Particles:** points drifting inside a box and joined by lines when close (a
  "constellation"), with no background of their own: count (up to 300), speed, drift,
  seed ("Redistribuir"), point and line style, glow. "Ajustar al lienzo" makes them cover
  the whole post. Their motion loops seamlessly.
- **Groups:** select several elements (Shift+click or drag a box), move them together,
  and group them; a group moves, resizes, duplicates and animates as one.
- **Animations:** float, pulse, breathing glow, fade-in, pop-in, slide-up, draw-on. Loops
  are seamless in GIF and MP4.
- **Presets:** the library's presets are JSON recipes in `presets/built-in/` that combine
  reusable traits (glow, glass, border, float…), grouped by category (Tarjetas, Texto,
  Conexiones, Iconos e imágenes, Partículas) and filterable by name. Save any element or
  group as your own preset in `presets/`; each of your presets can be renamed, given a
  category, overwritten with the selected element, exported as `.json` or deleted.
  "Importar preset" adds one from a `.json` file.
- **Animation presets:** the "Animaciones" library section saves the selected element's
  animation (entry, loop, exit and keyframes) under a name, in `presets/animations/`, and
  applies it to the selection from a chosen start, with an optional stagger between
  elements. Times are relative to the start and movements to each element's position;
  what an element cannot take is skipped and listed. Applying copies the animation, so
  editing a preset later changes nothing already applied. Presets can be renamed, given a
  category, overwritten, exported, imported and deleted. A scene can name one
  (`"animPreset": "mi-entrada"`), and it is copied in when the scene opens.
- **Backgrounds:** the "Fondo" button (or a click on an empty part of the canvas) opens the
  background settings: color or gradient, dots, spotlight. The "Fondos" library section
  applies a background preset (undoable); "Guardar fondo como preset" saves yours.
- **Scenes & Workspaces:** scenes are JSON files residing inside project workspaces (`projects/<slug>/scenes/`).
  The "Escenas" sidebar tab shows each saved scene of the active project with a thumbnail to
  open, rename, duplicate, export or delete it, and imports scenes from `.json` files.
- **Validation:** an imported preset or scene is checked before anything is written; an
  invalid file is rejected with the exact path that is wrong (e.g. `elements.1.fill.color`).
- **Files:** presets and project workspaces (`projects/<slug>/` containing scenes, local assets and exports)
  are plain files you can version with the repo. `projects/mi-proyecto/` serves as the committed default project.
- **Export:** PNG (current frame), looping GIF, and MP4 (WebM when the browser cannot
  encode H.264).

## Run

Requires Node 24 (`.nvmrc`) and pnpm.

```sh
pnpm install
pnpm dev
```

Open http://localhost:5173.

## Use from Claude Code & Other MCP Clients (MCP)

`pnpm lienzo mcp` starts an MCP server over stdio that exposes every Lienzo tool (the same
ones `pnpm lienzo --help` lists) with the same names, descriptions and input schemas.

### Claude Code

From the repo root:

```sh
claude mcp add lienzo -- pnpm lienzo mcp
```

Add `--scope project` to share it through `.mcp.json`. Check it with `claude mcp list` or
`/mcp` inside Claude Code.

### OpenCode & Generic Stdio Clients

In OpenCode (`opencode.json`) or other MCP clients, configure the server with explicit `command`, `args`, and `cwd`:

```json
{
  "mcpServers": {
    "lienzo": {
      "command": "pnpm",
      "args": ["lienzo", "mcp"],
      "cwd": "/path/to/lienzo"
    }
  }
}
```

Or with the compiled bundle (`pnpm build:cli` writes `dist/cli.js`):

```json
{
  "mcpServers": {
    "lienzo": {
      "command": "node",
      "args": ["dist/cli.js", "mcp"],
      "cwd": "/path/to/lienzo"
    }
  }
}
```

Tools read and write the files of this repo (`projects/<slug>/`, `presets/`, `fonts/`), so always set `cwd` to the Lienzo root directory. Every tool that touches scenes, assets or exports requires `project` (a slug from `project_list`, e.g. `mi-proyecto`); there is no default project. A failed call comes back as an MCP error result with the same JSON `{ code, message, path }` the CLI prints.

To remove the transparent margin of a PNG, call `image_trim` on an image element, or pass `trim: true` to `element_add`; the asset file is not changed, only the element's `crop`. In the editor, the same trim is the **Recortar transparencia** button of an image, and double-clicking an image opens its manual crop handles.

## Compact Scenes (Spec 011)

Lienzo supports writing posts in a concise, human- and LLM-friendly format. The compact format
allows declaring a complete post with minimal syntax: partial presets, layout anchors (`at`),
automatic canvas fitting (`fit`), readable IDs, line connections (`from`/`to`), and shorthand
animations and keyframe tracks (`[t, value, easing?]`).

You can build and preview or save any compact post with the `scene_build` tool:

```sh
pnpm lienzo scene_build --json '{
  "compact": {
    "size": "Story",
    "duration": 4,
    "background": { "color": "#050b1a", "spotlight": 0.5 },
    "elements": [
      {
        "id": "bg-particles",
        "kind": "particles",
        "fit": "canvas",
        "count": 40
      },
      {
        "id": "card",
        "preset": "01-tarjeta-neon",
        "at": "center",
        "w": 600,
        "h": 320,
        "anim": "float"
      },
      {
        "id": "heading",
        "kind": "text",
        "text": "Lienzo 0.1",
        "at": { "anchor": "top", "offset": [0, 200] },
        "size": 56,
        "weight": "bold",
        "anim": "pop-in"
      },
      {
        "id": "conn",
        "kind": "line",
        "from": "heading",
        "to": "card"
      }
    ]
  },
  "project": "mi-proyecto",
  "save": "anuncio-lienzo"
}'
```

The schema is defined in `schemas/compact-scene.json`.

## Shortcuts

| Key | Action |
|---|---|
| Space | Play / pause |
| Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y) | Undo / redo |
| Ctrl+D | Duplicate |
| Ctrl+A | Select all |
| Shift+click, drag on empty canvas | Add to selection, selection box |
| Ctrl+G / Ctrl+Shift+G | Group / ungroup |
| Delete | Remove |
| Arrows (Shift = ×10) | Nudge |
| Esc | Deselect |

## License

MIT
