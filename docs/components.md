# Components

Every element kind Lienzo can draw, in the library's order (`COMPONENTS` in
`src/components/index.ts`). The Spanish name is the label shown in the editor. Each kind's
full field list, with the paths keyframes can animate, comes from the `component_list` tool
(`pnpm lienzo component_list`); this page says what each kind is for.

Shared by every kind: position and size (`x`, `y`, `w`, `h` where the kind has a box),
`opacity`, entry / loop / exit animations (`anim.in`, `anim.loop`, `anim.out`), keyframe
tracks (`tracks`, by field path or the `@rotate` / `@scale` channels) and a transform origin.
Most kinds also offer glow and shadow.

## `rect`

**Rectángulo.** A box with rounded corners (`radius`); fill (color or gradient, linear,
radial or multi-stop), border (solid, dashed, dotted, moving `flow`), border glow,
background glow, shadow and inner text (`label`).

## `ellipse`

**Elipse.** The same styling as `rect` in an ellipse; lines attach to its outline.

## `icon`

**Icono.** Any [Lucide](https://lucide.dev) icon from a searchable picker, with stroke,
color, glow and an optional rounded tile (color or gradient).

## `image`

**Imagen.** A PNG, JPG, SVG or WebP from the project's `assets/`: size (aspect kept by
default), corners, border, shadow, and a non-destructive `crop` (manual handles, or
**Recortar transparencia** / `image_trim` to cut the transparent margin).

## `group`

**Grupo.** Holds other elements that move, resize, duplicate and animate as one; an optional
frame and body, `stagger` between children's animations, and `clip` to clip the children to
the group's box (with `radius`).

## `text`

**Texto.** Text with font, size, weight, color or gradient, line height, letter spacing,
alignment inside its box, and glow. With a box width `w` it wraps at word boundaries
and aligns inside that width.

## `line`

**Línea.** A connector whose ends attach to elements so it follows them: curve (`bend`),
arrows, glow, and animated flow (light pulses, marching ants, comet).

## `particles`

**Partículas.** Points drifting inside a box and joined by lines when close (a
"constellation"): count, speed, direction, gravity, twinkle, drift, `seed`, per-particle
variation, point and link style, glow. Their motion loops seamlessly.

## `three`

**Objeto 3D.** A three.js shape rendered offscreen and composited into the canvas: shape,
object rotation, position and scale, `spin`, material, ambient and point light, camera.

## `polygon`

**Polígono.** A regular polygon with `rect`'s styling; `fit: "box"` stretches it to fill its
box.

## `star`

**Estrella.** A star with `rect`'s styling.

## `arrow`

**Flecha.** A block arrow pointing in a chosen direction, with `rect`'s styling.

## `badge`

**Insignia.** A pill with text and an optional icon: size, padding, fill, border and glow.

## `progress`

**Progreso.** A progress indicator (bar or ring styles) for a `value`, with track color,
thickness and an optional number.

## `counter`

**Contador.** A number that counts from `from` to `to` as `progress` goes 0 → 1, with
decimals and a thousands separator. A counter added by `element_add` or `scene_build` with no `progress`
of its own gets a 0 → 1 track over 1.5 s from the start of its shot (or of the scene),
capped by the shot's end.

## `bubble`

**Mensaje de chat.** A chat message bubble with author, avatar color, side (left or right)
and a typing effect (`typingSpeed`).

## `steps`

**Pasos.** A row or column of numbered steps joined by a line, with the `active` step
highlighted.

## `list`

**Lista.** A bulleted list whose items appear one by one (`reveal`), with bullet style,
spacing and color.

## `table`

**Tabla.** A table with a header row, striped rows and rows that appear one by one
(`reveal`).

## `code`

**Código.** A code block with syntax highlighting for a chosen language and theme, typed
in over time (`typed`).

## `chart`

**Gráfico.** A data chart (bars and other types, with a palette) that grows in with
`progress`; axis and donut `hole` options.

## `path`

**Trazado libre.** A free-form vector path made of one or more shapes: fill, border, glow,
draw-on (`progress`) and `morph` between its shapes; `mode: "layers"` draws every shape
at once instead (flat illustrations).

## `subtitles`

**Subtítulos.** Captions synced to the scene's speech cues, shown a few words at a time
(`wordsPerWindow`) with the spoken word highlighted, on an optional background box.

## `use`

**Símbolo.** An instance of a reusable symbol defined in the scene's `symbols`; it draws
the symbol's elements in its own box and takes its own animations.
