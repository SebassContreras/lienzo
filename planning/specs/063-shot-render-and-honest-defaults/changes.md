# 063 — shot-render-and-honest-defaults — Changes

## 2026-10-25 — Built; design wording matched to the code
Why: building 063 confirmed the text cause (no global `require` in an ES module), placed the
ignored-field notices in the tool registry (tool inputs are parsed before `run`), and made the
shared notice list a pure function instead of a composition over `prepareScene`.
- D2@1, D3@1, D5@1, D7@1 reworded (meaning unchanged; reviewed with `trace review`)
- Tasks: T001–T018 done

## 2026-10-25 — Asset paths under a project named `assets`
Why: `assetSegments` matched the first `/assets/` in a reference, so a project whose slug is `assets` was mistaken for the folder (found while building D6).
- ADDED R11@1
- ADDED D10@1
- Tasks: T019, T020
