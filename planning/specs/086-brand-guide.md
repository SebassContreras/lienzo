# 086 — brand-guide

## Goal
A project is the single owner of its brand: next to palette, fonts and canvas it keeps a written
brand guide (tone, audience, mandatory text, claim rules, preferred style). `project_inspect`
returns all of it, plus what is wrong with the brand fonts, and a video's assets stay apart from
the brand's. Consumers such as Animator read the brand and never keep a second copy.
Verification: `project_update` with `guide` and then `project_inspect` on a test project returns
the same text; `scene_generate_speech` writes into the scene's folder; `pnpm test` and
`pnpm typecheck` pass.

## Context (audit of 2026-10-31, project `ringana`)
- `project_inspect` and `project_create` say they handle a "brand guide", and `PRODUCT.md` §4
  promises one, but the manifest (`ProjectConfigSchema`, `src/model/project.ts`) only has name,
  description, palette, fonts and canvas. Tone, audience, disclaimers and claim rules have nowhere
  to live, so they ended up inside one video's brief in Animator.
- `projects/ringana/project.json` has `"fonts": []` although `Montserrat-500.ttf` and
  `Montserrat-800.ttf` are installed in `projects/ringana/fonts/`. Nothing reports the gap.
- `scene_generate_speech` (`saveAudioAsset`, `src/service/speech/asset-store.ts`) writes every clip
  to the root of `assets/` with a hash name. `ringana` holds 16 `.mp3` files: 6 are used by both
  `omega` and `omega-v2` and 10 are used by no scene. Nobody can tell brand assets from a video's
  assets, or one video's clips from another's.
- The `ringana` manifest holds video data as brand data: `description: "RINGANA BEYOND omega reel"`,
  `canvas.duration: 24`, and a palette taken from the omega video's sea, algae, drop and capsule
  rather than from RINGANA's identity.

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | The guide is one Markdown file, not a schema of tone/audience fields; no new tool. |
| 2 SRP | `project.json` keeps machine values (palette, fonts, canvas); `brand.md` keeps prose. |
| 3 DRY by composition | Speech output reuses `asset_add`'s `folder` rule (`safeAssetPath`). |
| 4 Service layer / DIP | The guide is read and written through `ProjectStore`, like the manifest. |
| 6, 7 Tests | Table-driven partitions for guide text, folder values and font declaration states. |
| 8 Stack standards | Spanish notices, `snake_case` error codes, English docs. |
| 9 Research | Folder convention follows the existing `asset_rename` subfolder support (044/D2). |
| 10 Trade-offs | Each decision lists pros, cons and mitigation. |

## Requirements
- R1: A project has an optional brand guide, Markdown text up to 20 000 characters. `project_create`
  and `project_update` accept `guide` (a string writes it; `null` deletes it; leaving it out keeps
  it) and `project_inspect` returns `guide` (the text, or `null` when there is none).
  Partitions: absent, empty string (treated as delete), normal text, exactly 20 000 characters,
  20 001 characters (`guide_too_long`), non-string (schema error).
- R2: `project_inspect` returns `notices` about brand fonts: a family declared in `manifest.fonts`
  with no installed file for one of its weights, and an installed project font family that
  `manifest.fonts` does not declare. Partitions: declared and installed, declared not installed,
  installed not declared, neither, a weight missing from a declared family.
- R3: `scene_generate_speech` saves its clips in `assets/<folder>/`; `folder` is optional and
  defaults to `voice/<scene>`. It reuses `asset_add`'s folder validation (`invalid_folder`).
  The `src` it returns and writes into `audioTracks` include the folder.
- R4: The `ringana` project is clean: the manifest describes the brand, not a video; canvas
  defaults are the brand's usual format; the Montserrat weights are declared as brand fonts; the
  palette is RINGANA's; a brand guide holds what the omega brief had to carry; voice clips live
  under `voice/<scene>/`; clips no scene uses are deleted after the user confirms the list.
- R5: The asset folder convention is documented: `brand/` for the brand's own files (logos,
  images, jingles), `voice/<scene>/` for generated speech, `<scene>/` for any other file a single
  scene uses.
- R6: `README.md`, `docs/`, the `lienzo-usage` skill, `ARCHITECTURE.md` (A7 and the project layout)
  and the descriptions of `project_create`, `project_update`, `project_inspect` and
  `scene_generate_speech` describe R1–R3 and R5.

## Design
- D1 (R1): The guide is a file, `projects/<project>/brand.md`, read and written by `ProjectStore`
  (`get` adds `guide`; a new `writeGuide(slug, text | null)`), not a field inside `project.json`.
  `ToolProjectSchema` stays as it is; `project_inspect` adds `guide` beside `manifest`. Limit and
  error code: `guide_too_long` at more than 20 000 characters. _(source: `ARCHITECTURE.md` A7,
  "files are easy to inspect, copy and version")_
  - _Pros_: long prose stays readable and diffable; the editor or any text editor can open it.
  - _Cons_: one more file per project; a write touches two files when both change.
  - _Mitigation_: `project_update` writes the guide first and the manifest second, and fails
    before writing anything if either input is invalid.
- D2 (R2): A pure function `brandFontNotices(declared, installed)` in
  `src/service/projects/` compares `manifest.fonts` (family + weights) with `ctx.fonts.list(project)`
  (family + weight per file) and returns Spanish notices naming family and weight. It runs only in
  `project_inspect` (read side); `project_update` keeps its existing "not installed" notice.
  - _Pros_: the gap seen in `ringana` is reported on every read, with no new tool.
  - _Cons_: a project that installs fonts only for one scene gets an "installed not declared" notice.
  - _Mitigation_: the notice is informational and says how to declare the font
    (`project_update` → `fonts`).
- D3 (R3): `saveAudioAsset` takes a `folder` segment list already checked by `safeAssetPath`;
  `scene_generate_speech` gets an optional `folder` input with default `voice/<scene>`.
  Content-hash file names stay. _(source: 044/D2 `safeAssetPath`, `asset_add` `folder`)_
  - _Pros_: each video's clips are separate from the brand and from other videos; the same rule as
    `asset_add`.
  - _Cons_: two scenes that share a clip each get their own copy.
  - _Mitigation_: clips are small (≤ 1 MB each); a shared clip can be moved to a common folder with
    `asset_rename`, which rewrites every scene.
- D4 (R4): The `ringana` cleanup uses the public tools only (`project_update`, `asset_rename`,
  `asset_delete`), so the scenes are rewritten by the same code paths users get. The 6 clips used
  by `omega` and `omega-v2` move to `voice/omega-v2/` (the scene in use) with `asset_rename`; `omega`
  then points at the same paths, which `asset_rename` already rewrites. The 10 unused clips are
  listed for the user and deleted only after confirmation. The brand palette and any logo file come
  from the user (`[human]`), because the current palette is the omega video's, not RINGANA's.
  - _Pros_: no hand-edited JSON; the cleanup exercises R3's folder layout on real data.
  - _Cons_: `projects/ringana/` is git-ignored (A7), so the cleanup leaves no diff to review.
  - _Mitigation_: the task report lists every rename and delete; versioning brand data is an idea
    in the roadmap.
- D5 (R5, R6): The convention lives in the `lienzo-usage` skill and `ARCHITECTURE.md` A7 only; no
  tool enforces it. _(KISS: one consumer today, Animator)_
  - _Pros_: no new validation or error codes.
  - _Cons_: a caller can still put a scene file in `brand/`.
  - _Mitigation_: `asset_rename` fixes misplaced files without breaking scenes.
- D6 (R4): `ringana`'s default duration is 20 s, inside the 15–30 s band where short-form video
  completes best. RINGANA's reels explain a product and carry claims and a disclaimer, so they
  aim at completion, not raw reach. Completion falls as length grows: Reels reach about 78 % at
  15 s in a 50-Reel test, and on TikTok 21–34 s averages 62 % vs 48 % over 60 s. Reach and
  engagement peak at 45–60 s for brand Reels, so the guide names that band as a deliberate choice.
  Instagram says there is no single ideal length. The default is only a starting value: each
  brief sets its own duration. _(sources, mostly vendor studies, so directional:
  https://www.bytecap.io/research/best-instagram-reels-length,
  https://creatorhouse.app/blog/instagram-reel-length-2026-test,
  https://www.opus.pro/blog/tiktok-length-format-retention-data,
  https://www.fanpagekarma.com/insights/optimal-tiktok-video-length/,
  https://buffer.com/resources/instagram-reels-length)_
  - _Pros_: the default sits where the data agrees for explanatory content, with room for a
    hook, 3–5 beats and the disclaimer hold (`craft.md`: 20–30 s → 5–8 shots).
  - _Cons_: the sources are vendor studies that cite each other, with no official platform number.
  - _Mitigation_: it is a default, not a rule; the guide states both bands, and each video's
    real retention can retune it.

## Tasks
- [ ] 086/T001 [agent] `ProjectStore`: read `brand.md` into `get(...).guide` and add `writeGuide(slug, text | null)` (empty string deletes) — covers R1, D1
- [ ] 086/T002 [agent] `project_create` and `project_update`: optional `guide` input (string / `null` / absent), `guide_too_long` over 20 000 characters, validate both inputs before writing — covers R1, D1
- [ ] 086/T003 [agent] `project_inspect`: return `guide` (`null` when missing) — covers R1, D1
- [ ] 086/T004 [agent] Table test (`test.each`) for the R1 partitions across create, update and inspect — covers R1
- [ ] 086/T005 [agent] Pure `brandFontNotices(declared, installed)` and its use in `project_inspect` `notices` — covers R2, D2
- [ ] 086/T006 [agent] Table test (`test.each`) of `brandFontNotices` for the R2 partitions — covers R2
- [ ] 086/T007 [agent] `saveAudioAsset` takes a checked folder; `scene_generate_speech` gets optional `folder`, default `voice/<scene>`, `invalid_folder` through `safeAssetPath` — covers R3, D3
- [ ] 086/T008 [agent] Table test (`test.each`) of speech output paths: default folder, custom nested folder, invalid folder (`..`, empty segment, leading `/`); returned `src` and `audioTracks` include the folder — covers R3
- [ ] 086/T009 [agent] Update `README.md`, `docs/`, the `lienzo-usage` skill and the four tool descriptions for the guide, the font notices, the speech folder and the folder convention — covers R5, R6, D5
- [ ] 086/T010 [agent] Update `ARCHITECTURE.md` A7 and the project layout (`brand.md`, asset folders) and log the change in `CHANGES.md` — covers R6
- [ ] 086/T011 [human] Give the RINGANA brand palette (hex per role) and any official logo file, or the page to take them from — covers R4
- [ ] 086/T012 [agent] `ringana`: `project_update` with a brand description, canvas defaults 1080×1920 / 30 fps / 20 s, fonts Montserrat heading 800 and body 500, and the T011 palette — covers R4, D4, D6
- [ ] 086/T013 [agent] `ringana`: write `brand.md` from the omega brief (audience, tone, on-screen language English, "RINGANA BEYOND omega" naming, the food-supplement disclaimer, attributing RINGANA's own study, text-only brand mark until a logo exists, preferred style "Bright science", reel length 15–30 s by default and 45–60 s only when reach is the goal, never over 90 s) and show it to the user before saving — covers R4, D4, D6
- [ ] 086/T014 [agent] `ringana`: move the 6 clips used by `omega`/`omega-v2` to `voice/omega-v2/` with `asset_rename` and list the 10 clips no scene uses — covers R4, D4
- [ ] 086/T015 [human] Confirm which of the 10 unused clips to delete — covers R4
- [ ] 086/T016 [agent] Delete the confirmed clips with `asset_delete`; Verify: `project_inspect` on `ringana` shows the guide, no font notices, and only `voice/omega-v2/` audio — covers R4, D4
