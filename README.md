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
- **Backgrounds:** the "Fondo" button (or a click on an empty part of the canvas) opens the
  background settings: color or gradient, dots, spotlight. The "Fondos" library section
  applies a background preset (undoable); "Guardar fondo como preset" saves yours.
- **Scenes:** scenes are JSON files in `scenes/`. The scenes dialog shows each saved scene
  with a thumbnail to open, rename, duplicate, export or delete it, and imports scenes
  from `.json` files.
- **Validation:** an imported preset or scene is checked before anything is written; an
  invalid file is rejected with the exact path that is wrong (e.g. `elements.1.fill.color`).
- **Files:** presets, scenes and the images in `assets/` are plain files you can version
  with the repo.
- **Export:** PNG (current frame), looping GIF, and MP4 (WebM when the browser cannot
  encode H.264).

## Run

Requires Node 24 (`.nvmrc`) and pnpm.

```sh
pnpm install
pnpm dev
```

Open http://localhost:5173.

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
