# 045 — external-fonts — Design

## Approach

- D1@1 (implements R1, R2): `fonts/` (repo root, git-ignored, with a `.gitkeep`) and `projects/<slug>/fonts/` (created with the project). Family and weight come from the file name `Family-Weight.ext` (e.g. `Montserrat-700.woff2`), so no extra manifest is needed.
- D2@1 (implements R1, R2, R3): Endpoints `GET /api/fonts` (global list), `GET /api/fonts/<file>` and `GET /api/projects/<slug>/fonts[/<file>]`; a pure `resolveFonts(bundled, global, project)` merges them with project-over-global precedence.
- D3@1 (implements R3, R6): `src/engine/fonts.ts` registers each resolved font with `FontFace` + `document.fonts.add` when the project changes and before export; the `?render` route awaits the same loader, so headless export uses the same files. Missing families are reported via `setStatus`.
- D4@1 (implements R3): The font field editor lists `Incluidas`, `Globales` and `Proyecto` groups from `resolveFonts`; `BrandFontSchema` families resolve against the same list.
- D5@1 (implements R4): `POST /api/fonts?scope=global|project&slug=&name=` accepts ttf/otf/woff/woff2 (max 20 MB) and writes `Family-Weight.ext`.
- D6@1 (implements R5): `POST /api/fonts/google { family, weights, scope, slug }` fetches `https://fonts.googleapis.com/css2?family=...` server side with a woff2 user agent, downloads the `latin` woff2 files and saves them as in D1. A "Fuentes" dialog in the brand manager offers search, weights and scope. Also exposed as `font_install` / `font_list` tools in `src/service/` (A20).

## Deliverables

- `.gitignore`, `fonts/.gitkeep`
- `src/service/font-store.ts` (+ tests), middleware routes, `font_install` / `font_list` tools
- `src/engine/fonts.ts`, grouped font picker, "Fuentes" dialog
