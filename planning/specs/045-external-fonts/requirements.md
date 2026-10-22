# 045 — external-fonts — Requirements

Only the bundled `@fontsource` fonts (A12) can be used. Users need their own fonts, globally or
per project, without committing them, and a way to fetch them from inside the app.

- R1@1: A git-ignored `fonts/` folder at the repo root holds global fonts (ttf, otf, woff, woff2) available in every project.
- R2@1: `projects/<slug>/fonts/` holds fonts available only in that project; a project font with the same family name overrides a global one.
- R3@1: Every available font (bundled, global, active project) appears in the inspector's font pickers, grouped by origin, and renders in the preview and in every export (PNG, GIF, MP4, headless CLI/MCP).
- R4@1: From the app the user can upload a font file, choosing global or project scope.
- R5@1: From the app the user can search Google Fonts by family, pick weights and download them into global or project scope.
- R6@1: A scene that names an unavailable font falls back to the default font and the editor reports which family is missing.
