# 045 — external-fonts — Design

## Approach

- D1@2 (implements R1, R2): `fonts/` (repo root, git-ignored, with a `.gitkeep`) and `projects/<slug>/fonts/` (made on first write). Family and weight come from the file name `Family-Weight.ext` split on the last `-` (`Montserrat-700.woff2`; a name with no numeric suffix is weight 400), parsed by a pure `parseFontFile` in `src/model/font-files.ts`, so no extra manifest is needed.
- D2@1 (implements R1, R2, R3): Endpoints `GET /api/fonts` (global list), `GET /api/fonts/<file>` and `GET /api/projects/<slug>/fonts[/<file>]`; a pure `resolveFonts(bundled, global, project)` merges them with project-over-global precedence.
- D3@1 (implements R3, R6): `src/engine/fonts.ts` registers each resolved font with `FontFace` + `document.fonts.add` when the project changes and before export; the `?render` route awaits the same loader, so headless export uses the same files. Missing families are reported via `setStatus`.
- D4@1 (implements R3): The font field editor lists `Incluidas`, `Globales` and `Proyecto` groups from `resolveFonts`; `BrandFontSchema` families resolve against the same list.
- D5@2 (implements R4): `src/service/font-store.ts` (fs only: list, read, write by scope) is the one place that writes font files. `POST /api/fonts/upload?scope=global|project&project=&family=&weight=&ext=` accepts ttf/otf/woff/woff2 (max 20 MB) and calls it; the route lives in `src/service/font-middleware.ts` and holds no other logic.
- D6@2 (implements R5): `src/service/google-fonts.ts` is the adapter to Google Fonts: a pure `parseGoogleCss(css)` (the `latin` woff2 `src` URL per weight) and `downloadGoogleFont(family, weights, fetch)` with `fetch` injected; it asks `https://fonts.googleapis.com/css2?family=…:wght@…` with a modern browser user agent so the API answers woff2. `installGoogleFont` saves the files through the font store (D5). The `font_install` and `font_list` tools (A20) and `POST /api/fonts/google` are thin callers of it; a "Fuentes" dialog in the brand manager offers family, weights and scope.

## Deliverables

- `.gitignore`, `fonts/.gitkeep`
- `src/service/font-store.ts` (+ tests), middleware routes, `font_install` / `font_list` tools
- `src/engine/fonts.ts`, grouped font picker, "Fuentes" dialog

## Trade-offs

- File-name metadata (D1). Pros: no manifest to keep in sync; dropping a file in the folder is enough. Cons: italics and odd names are not described. Mitigation: split on the last `-`, default weight 400; italics are out of scope until needed (YAGNI).
- Project over global by family (D2). Pros: a project can pin its own cut of a font. Cons: the same family name can look different across projects. Mitigation: the picker shows the origin group of each family.
- Loading fonts in the page, also on `?render` (D3). Pros: preview and export use the same files (A3). Cons: export waits for the font files. Mitigation: `FontFace` loads are cached per page and only the active project's fonts are loaded.
- Google Fonts download (D6). Pros: thousands of families without leaving the app. Cons: needs the network and depends on an undocumented choice of format by user agent; licences vary. Mitigation: download is explicit and saved to disk, then works offline (A12@2); the adapter is the one place to change if Google changes; the files stay git-ignored, so nothing is redistributed by the repo (Google Fonts families are under OFL/Apache, which allow local use and embedding).
- No `font_upload` tool. Pros: the CLI already copies files into `fonts/`; a base64 tool would add nothing (YAGNI). Cons: MCP agents cannot upload binary fonts. Mitigation: `font_install` covers the common case.
