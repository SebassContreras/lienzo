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
- **Groups:** select several elements (Shift+click or drag a box), move them together,
  and group them; a group moves, resizes, duplicates and animates as one.
- **Animations:** float, pulse, breathing glow, fade-in, pop-in, slide-up, draw-on. Loops
  are seamless in GIF and MP4.
- **Presets:** the library's presets are JSON recipes in `presets/built-in/` that combine
  reusable traits (glow, glass, border, float…). Save any element or group, or the scene
  background, as your own preset in `presets/` and drop it again.
- **Files:** scenes are JSON files in `scenes/`; images live in `assets/`. All three
  folders are plain files you can version with the repo.
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
