# 003 — presets-scenes — Design

## Approach

- D1@2 (implements R1, R3): The middleware gains `DELETE /api/presets|scenes?name=x` and `POST /api/presets|scenes/rename?from=x&to=y`; the library, for element presets and background presets alike, and a scenes dialog show actions per item (rename, overwrite, duplicate, delete).
- D2@2 (implements R2): `PresetRecipe` (004) gains an optional `category`; the library renders one section per category plus a name filter.
- D3@2 (implements R3): Scene thumbnails are drawn client-side with `drawScene` into a small canvas once the scene's images are decoded, at a moment entry animations are over (t = 1.5 s, or the loop's end if shorter), as library thumbnails are.
- D4@2 (implements R4, R5): Export downloads the JSON; import reads the file and validates it with Zod schemas in `src/model/schema.ts` — `Scene` with every element kind (groups recursive) and `PresetRecipe` (element or background kind, traits by id with parameters, `set`, group children in their compact form; the recipe must also resolve without error) — and only then saves it through the middleware; validation errors name the failing path. Zod is added as a dependency (MIT, A18).

## Deliverables

Middleware routes, library and scenes dialog UI, `src/model/schema.ts`.

## Sequencing

Schema → middleware routes → library actions → categories and filter → scenes dialog →
import/export.
