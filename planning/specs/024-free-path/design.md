# 024 — free-path — Design

## Approach

- D1@2 (implements R1, R4): A `path` descriptor in `src/components/path/` stores `shapes: string[]` (SVG `d` strings) and a shared view box, drawn with `Path2D` scaled from the view box to the element box; a `.svg` import keeps every path of the file as one shape; a single-shape path draws its `d` directly with no morph work.
- D2@1 (implements R2): The reveal is an ordinary animatable `progress` field (as in 017/D2) drawn with a dash offset over the path length, measured once per shape and cached.
- D3@1 (implements R3): Presets are recipes (A19) in `presets/built-in/`.
- D4@1 (implements R5, R10): SVG parsing and normalisation (relative to absolute, arcs and quadratics to cubics, shorthand expanded) go through `src/engine/path/parse.ts`, a small adapter over the MIT `svgpath` library (A18), so the rest of the code sees only `Subpath = Cubic[]` and the library stays swappable; invalid input throws an error naming the shape.
- D5@1 (implements R5, R6, R8): `src/engine/path/morph-prep.ts` is pure: it flattens each subpath and resamples it by arc length to a common point count, normalises winding, pairs subpaths of the two shapes by area and centroid, collapses unpaired subpaths to their partner's centroid, and rotates each start index to the one with the least summed distance.
- D6@1 (implements R4, R7, R8): `src/engine/path/morph.ts` is pure: given prepared pairs and a `morph` value it picks the two neighbouring shapes, eases between them and returns the points; colours and opacity interpolate with the same eased fraction.
- D7@1 (implements R9): Prepared pairs are cached by the hash of the two `d` strings (like 014's sprite cache); a frame only interpolates arrays.

## Deliverables

`src/components/path/`, `src/engine/path/` (`parse.ts`, `morph-prep.ts`, `morph.ts`), the `svgpath` dependency, built-in presets (an icon outline drawing on, a shape morphing loop).

## Sequencing

Parser adapter → descriptor and drawing → draw-on → morph preparation → morph → cache → presets → tests.
