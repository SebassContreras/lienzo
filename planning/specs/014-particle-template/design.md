# 014 — particle-template — Design

## Approach

- D1@2 (implements R1, R4): The particles descriptor gains `template: Element | null` (`null` keeps today's dot); the template is stored as a copy whose ids stay local (they never enter the scene's `byId`), its own animation and position are ignored, and the schema rejects a particles element inside it.
- D2@2 (implements R2): Per-point variation lives in a `variation` field group (`sizeMin`, `sizeMax`, `rotation`, `spin`, `opacityMin`, `opacityMax`, `hueShift`), derived from the seed, nothing random at draw time; spin uses whole turns per loop (A6).
- ~~D3@1 (implements R3): The template is edited in an isolated editor mode: the same stage on a temporary scene holding only the template.~~ retired 2026-10-10 → D6
- D4@1 (implements R6): Presets are recipes (A19) with a template.
- D5@1 (implements R1, R2, R5): The template is drawn once through `drawElements` into an offscreen sprite at the largest size in the range, glow included, plus one sprite per hue-shift variant (at most 6); each point is a `drawImage` with translate, rotate, scale and `globalAlpha`. Sprites are cached by a hash of the template JSON and the variation's hue settings.
- D6@1 (implements R3): An element's context menu and the particles inspector offer "Usar como partícula", which copies the selected element into `template` and removes it from the canvas; "Editar partícula" puts the template back on the canvas, centred on the field, selected.
- D7@1 (implements R1): With a template set, the inspector hides the "Puntos" section and the dot glow.

## Deliverables

Particles descriptor fields, sprite cache and draw changes, "Usar como partícula" and
"Editar partícula" actions, presets.
