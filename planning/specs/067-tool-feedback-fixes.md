# 067 — tool-feedback-fixes

## Goal
Building scenes through the tools left six open points. Each was reproduced with a failing test before any change. Five were real: a radial fill on a circle never reaches its last color; `scene_inspect_layout` ignores the shot camera; a misspelled field gives no hint of the right name (and in `scene_validate`'s compact form, no notice at all); a missing font draws in the browser's serif; fonts installed with `font_install` are never measured. The sixth, the `weight: 800` default of new texts, is not a defect: Inter 800 is loaded in the page (`main.tsx`) and measured in Node, so it is left as it is. When this spec is done, the first five behave as below and each has a regression test.

## Requirements
- R1: A radial fill on an ellipse, polygon or star ends its gradient on the shape's edge, so its last color shows; rectangles and other shapes keep the farthest corner (059/D5).
- R2: `scene_inspect_layout` checks and returns every box as its shot's camera and transition put it on screen.
- R3: An ignored input key names the field it most likely meant (`fontSize` → `size`, `colr` → `color`), and `scene_validate` reports ignored compact keys even when it has no other notice.
- R4: Text in a family the page lacks draws in Inter, then any sans-serif, never the browser's default serif.
- R5: Text in a font installed in `fonts/` or the project's `fonts/` is measured with that font's glyphs, and `font_install` stores Google fonts in a format Node can read.

## Design
### Approach

- D1 (R1): `fillGradient` takes a `reach`: `"corner"` (default, the box's farthest corner) or `"edge"` (`max(w, h) / 2`). `drawShape` passes it through; ellipse, polygon and star, inscribed in their box, pass `"edge"`.
  - _Trade-offs_: Existing circles with a radial fill look more contrasted. On a long ellipse the gradient, being circular, reaches the far ends but not the near sides.
  - _Mitigation_: It is the look a user asking for `color2` expects; a rectangle keeps the CSS-like corner, so cards do not change.

- D2 (R2): `cameraBox` in `src/engine/shots.ts` is the pure counterpart of `applyCameraTransform`, and `shotBox` composes it as `withShotView` draws (camera, then the transition's scale and slide). `placedElementsAt` passes each top-level element's view down to its group children and symbol instances, so every box is the one on screen.
  - _Trade-offs_: `boxes` change for shot-bound elements under a camera; a caller reading them as scene coordinates sees screen ones.
  - _Mitigation_: The tool's purpose is what the viewer sees; elements with no shot or no camera keep the same box.

- D3 (R3): `ignoredFields` (`src/model/ignored.ts`) returns each dropped key with a suggestion picked by `closestKey`: a known key it ends or starts with (CSS names: `fontSize`), else one within a Levenshtein distance of a third of its length (typos). Known keys are the object's own plus, for an element, every field of its kind, since a compact element holds only what it sets. A small pure function, no dependency. The registry adds ignored-key notices whenever a tool's output declares `notices`, not only when the tool already returned some.
  - _Trade-offs_: A suggestion can be wrong for a key that only resembles a field.
  - _Mitigation_: It is phrased as a question and the key is still named; no suggestion is given past the distance limit.

- D4 (R4): `fontStringOf` (`text-measure.ts`) writes `"Family", "Inter", sans-serif`, and `fontString` in `geometry.ts` reuses it instead of a copy.
  - _Trade-offs_: Render goldens change (every canvas `font` string), and a family that used to fall to serif now looks different.
  - _Mitigation_: The goldens were checked to change only because of this string (they pass with it reverted) and were re-recorded; the missing-font notice still names the family.

- D5 (R5): `setInstalledFonts` (`text-measure.ts`) parses installed font files with opentype.js and replaces the previous set; `loadFontSync` uses them for families no bundled package has. `measureInstalledFonts` (`font-install.ts`) reads the global then the project's files from the font store and is called by `scene_build`, `scene_validate` and `scene_inspect_layout`. opentype.js cannot read woff2, and Google's css2 API sends woff2 only to browsers; without a user agent it sends ttf, so `font_install` now stores ttf.
  - _Trade-offs_: ttf files are about twice the size of woff2. woff2 files installed before, or uploaded by hand, stay estimated. Fonts are re-read on each of those three tool calls.
  - _Mitigation_: Files are local; reinstalling a family with `font_install` gives the ttf, and the estimate notice already says how to check. A woff2 decoder (`woff2-encoder`, MIT) was considered and left out until a hand-uploaded woff2 needs measuring (YAGNI).

## Tasks
- [x] 067/T001 [agent] Table-driven regression tests in `src/service/tools/feedback.test.ts` using `test.each` covering input partitions for R1–R5: radial gradient edge stops, shot camera layout boxes, Levenshtein field suggestions, font stack fallback, and installed font metrics — covers R1, R2, R3, R4, R5
- [x] 067/T002 [agent] Radial reach for inscribed shapes — covers D1
- [x] 067/T003 [agent] Shot camera in layout boxes — covers D2
- [x] 067/T004 [agent] Field suggestions and compact notices in `scene_validate` — covers D3
- [x] 067/T005 [agent] Inter fallback in the canvas font; goldens re-recorded — covers D4
- [x] 067/T006 [agent] Installed font metrics and ttf from Google — covers D5
- [x] 067/T007 [agent] Verify: typecheck, lint, tests, a rendered preview of a radial circle and a missing font — covers R1, R4
      verified: typecheck, lint and tests (bdabc0c), then the lienzo MCP tools — radial ellipse reaches the edge, zoomed shot boxes match the preview, fontSize/colr suggest size/color, a missing font draws in Inter with a notice, Bebas Neue centers to the pixel; found that family/fontFamily had no suggestion and a missing font was measured with an estimate (fixed in 9292fd4)
