# 086 — brand-guide

## Goal
A project is the single owner of its brand: next to palette, fonts and canvas it keeps a written
brand guide (tone, audience, mandatory text, claim rules, preferred style). `project_inspect`
returns all of it, plus what is wrong with the brand fonts, and a video's assets stay apart from
the brand's. Consumers such as Animator read the brand and never keep a second copy.
R4 applies R1–R3 to `ringana`; it changes data, not code.
Verification: `project_update` with `guide` and then `project_inspect` on a test project returns
the same text; `scene_generate_speech` writes into `voice/<scene>/`; `pnpm test` and
`pnpm typecheck` pass.

## Context (audit of 2026-10-31, project `ringana`)
- `project_inspect` and `project_create` say they handle a "brand guide", and `PRODUCT.md` §4
  promises one, but the manifest (`ProjectConfigSchema`, `src/model/project.ts`) only has name,
  description, palette, fonts and canvas. Tone, audience, disclaimers and claim rules have nowhere
  to live, so they ended up inside one video's brief in Animator.
- `projects/ringana/project.json` has `"fonts": []` although `Montserrat-500.ttf` and
  `Montserrat-800.ttf` are installed in `projects/ringana/fonts/`. Nothing reports the gap:
  `project_update` checks only the fonts passed to it (`missingFontNotice`,
  `missingBrandWeightNotices`, `src/service/fonts/font-check.ts`) and `project_inspect` checks none.
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
| 1 KISS / YAGNI | The guide is one Markdown file, not a schema of tone/audience fields; no new tool; speech gets no `folder` input, since no caller needs one (Animator 011 uses only `asTrack` and `startOffset`). |
| 2 SRP | `project.json` keeps machine values (palette, fonts, canvas); `brand.md` keeps prose. `ProjectStore` stores the guide; the tools decide what a value means. |
| 3 DRY by composition | `brandFontNotices` composes the existing `missingFontNotice` and `missingBrandWeightNotices`, and both `project_update` and `project_inspect` call it. |
| 4 Service layer / DIP | The guide is read and written through `ProjectStore`, like the manifest; speech resolves its folder with `ProjectStore.resolvePath`, like `asset_add`. |
| 5 Pure functions | `guideValue(input)` (`""` → `null`, length check) and `brandFontNotices` are pure; I/O stays in `ProjectStore` and the font store. |
| 6, 7 Tests | Table-driven partitions and invariants for the guide, the font notices and the speech paths; schema-type errors are left to the schema-derived `inputs.test.ts`. |
| 8 Stack standards | Spanish notices, `snake_case` error codes, English docs; docs travel with each behavior task. |
| 9 Research | Prior decisions cited (044/D2, 070/D2, 081/D8, 074/D6); D6 cites the reel-length sources. |
| 10 Trade-offs | Each decision lists pros, cons and mitigation. |

## Requirements
- R1: A project has an optional brand guide, Markdown text up to 20 000 UTF-16 code units
  (`string.length`). `project_create` and `project_update` accept `guide`: a non-empty string
  writes it as given (a whitespace-only string included); `""` and `null` delete it; leaving it
  out keeps it. `project_create` and `project_update` return `guide` as stored, and
  `project_inspect` returns `guide` (the text, or `null` when there is none).
  Partitions: absent, `null`, `""`, whitespace only, normal text, 19 999, exactly 20 000 and
  20 001 code units (`guide_too_long`), 20 000 code units including non-BMP characters (emoji).
  Invariants: (a) round-trip: `project_inspect` returns exactly the text written, line endings
  included; (b) leaving `guide` out never changes `brand.md`; (c) a call with any invalid input
  writes neither `brand.md` nor `project.json` (compound partition: a guide too long together
  with an invalid `palette`); (d) `project_create` with `guide: null` or `""` creates no `brand.md`.
- R2: `project_inspect` and `project_update` return the same `notices` about brand fonts for the
  same project state: a family declared in `manifest.fonts` with no installed file, a declared
  weight with no installed file, and a family installed in the project's own `fonts/` that
  `manifest.fonts` does not declare.
  Partitions: declared and installed, declared not installed, installed not declared, neither,
  a declared weight not installed, an installed weight not declared for a declared family (no
  notice), a family that differs only in letter case, a bundled font not declared (no notice).
  Invariant: each notice names the family and, for weights, the missing weights.
- R3: `scene_generate_speech` saves its clips in `assets/voice/<scene>/`, where `<scene>` is the
  scene's stored name (a slug, so always a valid asset segment: `slugify`, 074/D6). The `assetId`
  it returns, and writes into `scene.audio` (default) or the new `audioTracks` entry
  (`asTrack: true`), includes the folder.
  Partitions: `asTrack` absent / `true`; scene name given as stored / given in a form that folds
  (`Caja Ámbar` → `voice/caja-ambar/`).
  Invariants: every `assetId` written resolves to a file under `assets/voice/<scene>/`; the same
  script and voice for the same scene yield the same path and one file.
- R4: The `ringana` project is clean: the manifest's `description` names the brand and no video;
  `canvas` is 1080×1920 / 30 fps / 20 s (D6); `fonts` declares Montserrat 800 (heading) and 500
  (body); `palette` equals the values given in T010; `brand.md` contains every item listed in
  T012 and was approved in T013; every audio file is under `voice/<scene>/` and is used by a
  scene; clips no scene uses are deleted after the user confirms the list.
- R5: The asset folder convention is documented: `brand/` for the brand's own files (logos,
  images, jingles), `voice/<scene>/` for generated speech, `<scene>/` for any other file a single
  scene uses. A clip lives in the `voice/<scene>/` of one scene that uses it; other scenes may
  reference it there. Invariant: every file under `voice/<scene>/` is used by `<scene>`.
- R6: `README.md`, the `lienzo-usage` skill, `ARCHITECTURE.md` (A7 and the project layout) and the
  descriptions of `project_create`, `project_update`, `project_inspect` and
  `scene_generate_speech` describe R1–R3 and R5.

## Design
- D1 (R1): The guide is a file, `projects/<project>/brand.md`, read and written by `ProjectStore`
  (`get` adds `guide`; a new `writeGuide(slug, text | null)`, where `null` removes the file), not a
  field inside `project.json`. `ProjectStore` applies no content rules; a pure `guideValue(input)`
  in the project tools maps `""` to `null` and fails with `guide_too_long` over 20 000 code units.
  `ToolProjectSchema` stays as it is; `project_inspect` adds `guide` beside `manifest`.
  The limit is about twice the whole omega-v2 brief (10 292 characters), whose brand part is a
  fraction of it, and small enough to return in one `project_inspect` call.
  _(source: `ARCHITECTURE.md` A7, "files are easy to inspect, copy and version")_
  - _Pros_: long prose stays readable and diffable; the editor or any text editor can open it.
  - _Cons_: one more file per project; a write touches two files when both change.
  - _Mitigation_: `project_update` validates every input before writing anything, then writes
    the guide first and the manifest second. Residual risk: an I/O failure after `brand.md` is
    written leaves the new guide with the old manifest; the error says which file was written,
    and repeating the call converges.
- D2 (R2): A pure function `brandFontNotices(declared, available, own)` in
  `src/service/fonts/font-check.ts` composes `missingFontNotice` (declared, not installed) and
  `missingBrandWeightNotices` (declared weight missing) and adds the one new class, an installed
  project family not declared. `available` is every face the project can use
  (`availableFonts`, bundled and global included) and `own` the files in
  `projects/<project>/fonts/`, so bundled fonts never produce an "installed not declared"
  notice; `projectFontNotices` (`font-install.ts`) reads both from the font store. `project_update` replaces its inline
  notice code with it and `project_inspect` adds it to `notices`, so one rule has one place (075).
  _(source: 070/D2 `missingFontNotice`, 081/D8 `missingBrandWeightNotices`)_
  - _Pros_: the gap seen in `ringana` is reported on every read and write, with no new tool and
    no second copy of the rule.
  - _Cons_: a project that installs fonts only for one scene gets an "installed not declared" notice.
  - _Mitigation_: the notice is informational and says how to declare the font
    (`project_update` → `fonts`).
- D3 (R3): `saveAudioAsset(dir, bytes, format)` receives the target directory; the tool resolves
  it with `ctx.projects.resolvePath(project, "assets")` plus `voice/<scene>`, as `asset_add`
  resolves its folder. Content-hash file names stay. There is no `folder` input: no caller needs
  one, and a clip is moved with `asset_rename` when it must live elsewhere.
  _(source: 044/D2 `safeAssetPath`, `asset_add` `folder`; Animator 011/D8)_
  - _Pros_: each video's clips are separate from the brand and from other videos; no new
    validation or error code.
  - _Cons_: two scenes that generate the same clip each get their own copy; clips generated
    before this spec stay at the root of `assets/`.
  - _Mitigation_: clips are small (the largest in `ringana` is 199 KB, most are under 55 KB); a
    scene may reference another scene's clip (R5), and `asset_rename` moves old clips and rewrites
    every scene (D4 does so for `ringana`).
- D4 (R4): The `ringana` cleanup uses the public tools only (`project_update`, `asset_rename`,
  `asset_delete`), so the scenes are rewritten by the same code paths users get. The 6 clips used
  by `omega` and `omega-v2` move to `voice/omega-v2/` (the scene in use) with `asset_rename`; `omega`
  keeps referencing them there (R5), and `asset_rename` already rewrites both scenes. The 10 unused
  clips are listed for the user and deleted only after confirmation. The brand palette and any
  logo file come from the user (`[human]`), because the current palette is the omega video's, not
  RINGANA's.
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
  Buffer reports Instagram's head, Adam Mosseri, saying there is no single "perfect" length (a
  paraphrase with no primary source). The default is only a starting value: each brief sets its
  own duration. _(sources, mostly vendor studies, so directional:
  https://www.bytecap.io/research/best-instagram-reels-length,
  https://creatorhouse.app/blog/instagram-reel-length-2026-test,
  https://www.opus.pro/blog/tiktok-length-format-retention-data,
  https://www.fanpagekarma.com/insights/optimal-tiktok-video-length/,
  https://buffer.com/resources/instagram-reels-length)_
  - _Pros_: the default sits where the data agrees for explanatory content, with room for a
    hook, 3–5 beats and the disclaimer hold (Animator
    `skills/lienzo-storyboard/references/craft.md`: 20–30 s → 5–8 shots).
  - _Cons_: the sources are vendor studies that cite each other, with no official platform number.
  - _Mitigation_: it is a default, not a rule; the guide states both bands, and each video's
    real retention can retune it.

## Tasks
- [x] 086/T001 [agent] `ProjectStore`: read `brand.md` into `get(...).guide` (`null` when missing) and add `writeGuide(slug, text | null)` (`null` removes the file); it applies no content rules — covers R1, D1
- [x] 086/T002 [agent] Pure `guideValue(input)` (`""` → `null`, `guide_too_long` over 20 000 code units); `project_create` and `project_update` take optional `guide`, validate every input before writing, write guide then manifest, and return `guide`; update both tool descriptions, `README.md` and the `lienzo-usage` skill — covers R1, R6, D1
- [x] 086/T003 [agent] `project_inspect`: return `guide` (`null` when missing); update its description, `README.md` and the `lienzo-usage` skill — covers R1, R6, D1
- [x] 086/T004 [agent] Table test (`test.each`) in `guide.test.ts` (beside `guide.ts`), real `ProjectStore` on a temp dir, no mocks: rows absent / `null` / `""` / whitespace only / normal / 19 999 / 20 000 / 20 001 / non-BMP at the limit, across create, update and inspect; asserts the R1 invariants: round-trip, absent keeps, an invalid call writes nothing (compound row: long guide + invalid palette), create with `null` or `""` makes no file. Schema-type errors stay in `inputs.test.ts` — covers R1
- [x] 086/T005 [agent] `brandFontNotices` in `font-check.ts`, composed from `missingFontNotice` and `missingBrandWeightNotices` plus the "installed not declared" class over the project's own faces; `project_update` replaces its inline notice code with it and `project_inspect` adds it to `notices`; update both tool descriptions, `README.md` and the `lienzo-usage` skill — covers R2, R6, D2
- [x] 086/T006 [agent] Table test (`test.each`) in `font-check.test.ts`: declared & installed, declared not installed, installed not declared, neither, declared weight missing, installed weight not declared, case-only difference, bundled not declared; asserts each notice names the family and missing weights; one row runs `project_update` and `project_inspect` on the same state and expects equal notices — covers R2
- [x] 086/T007 [agent] `saveAudioAsset(dir, bytes, format)`; `scene_generate_speech` resolves `assets/voice/<scene>/` with `ctx.projects.resolvePath` and the scene's stored name; update its description, `README.md` and the `lienzo-usage` skill — covers R3, R6, D3
- [x] 086/T008 [agent] Table test (`test.each`) of speech output paths, with only the injected `TtsService` stubbed: rows `asTrack` absent / `true`, scene name as stored / folded (`Caja Ámbar`); in `speech-folder.test.ts`; asserts the `assetId` returned and written into `scene.audio` or `audioTracks` includes `voice/<scene>/` and resolve to a file, and that the same script twice yields one path and one file — covers R3
- [x] 086/T009 [agent] Update `ARCHITECTURE.md` A7 and the project layout (`brand.md`, the asset folder convention) and the convention section of the `lienzo-usage` skill; log the change in `CHANGES.md` — covers R5, R6, D5
- [ ] 086/T010 [human] Give the RINGANA brand palette (hex per role) and any official logo file, or the page to take them from — covers R4
- [ ] 086/T011 [agent] `ringana`: `project_update` with a brand description, canvas defaults 1080×1920 / 30 fps / 20 s, fonts Montserrat heading 800 and body 500, and the T010 palette — covers R4, D4, D6
- [ ] 086/T012 [agent] `ringana`: draft `brand.md` from the omega brief (audience, tone, on-screen language English, "RINGANA BEYOND omega" naming, the food-supplement disclaimer, attributing RINGANA's own study, text-only brand mark until a logo exists, preferred style "Bright science", reel length 15–30 s by default and 45–60 s only when reach is the goal, never over 90 s) and show it to the user — covers R4, D4, D6
- [ ] 086/T013 [human] Approve or correct the T012 draft — covers R4
- [ ] 086/T014 [agent] `ringana`: save the approved guide with `project_update` → `guide` — covers R4, D4
- [ ] 086/T015 [agent] `ringana`: move the 6 clips used by `omega`/`omega-v2` to `voice/omega-v2/` with `asset_rename` and list the 10 clips no scene uses — covers R4, R5, D4
- [ ] 086/T016 [human] Confirm which of the 10 unused clips to delete — covers R4
- [ ] 086/T017 [agent] Delete the clips confirmed in T016 with `asset_delete` — covers R4, D4
- [ ] 086/T018 [agent] Verify: `project_inspect` on `ringana` shows the guide, no font notices and only `voice/omega-v2/` audio; `pnpm test` and `pnpm typecheck` pass — covers Goal, R4
