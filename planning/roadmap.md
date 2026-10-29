# Roadmap

Specs in order. `Status` is written by the pre-commit hook from each spec's checkboxes. Specs 001–064 not listed were finished under the old spectrace format (one folder per spec); they live in git history.

| ID  | Spec | Status | Depends on |
|-----|------|--------|------------|
| 050 | joint-mode | done | — |
| 065 | defaults-and-easing-notices | done | — |
| 066 | lazy-vendor-chunks | done        | — |
| 067 | tool-feedback-fixes | done | — |
| 068 | qa-feedback-fixes | done        | — |
| 069 | qa-suite-fixes | done        | — |
| 070 | qa-suite-audit | done        | 069 |
| 071 | qa-round-3-fixes | done        | 069 |
| 072 | qa-round-4-fixes | done        | 071 |
| 073 | qa-round-5-fixes | done | 072 |
| 074 | qa-round-6-root-causes | done        | 073 |
| 075 | shot-timing-and-full-validation | done        | 074 |
| 076 | bundle-root-and-input-hints | done        | 075 |
| 077 | docs-and-descriptions-audit | done        | 076 |
| 078 | qa-round-7-fixes | done        | 077 |
| 079 | descriptions-after-078 | done        | 078 |
| 080 | qa-round-8-every-writer | done        | 079 |
| 081 | qa-round-9-input-gaps | done        | 080 |
| 082 | test-suite-rewrite | done        | 081 |
| 083 | one-validate-verdict | done        | 082 |
| 084 | id-charset | done        | 082 |

## Ideas

Anything worth doing later. (The two earlier ideas are specs 083 and 084.)

- `shape_overlap` fires only when two boxes cover half of the smaller one (`shapesStack`), so
  two composites (chart, table, steps, list) that overlap by a third pass clean though their
  text collides. Decide whether a composite kind gets a lower threshold, or the check also
  compares what each draws (`text-extents.ts`). (QA 2026-10-29)
- `scene_inspect_layout` boxes at t=0 are `w: 0` / `h: 0` for an `in` animation that starts at
  scale 0, which reads as a layout fault. Mark the box as animating, or also return its resting
  box. (QA 2026-10-29)
- A gap between two shots (a part of the scene no shot owns) gives no notice; it may be wanted
  (a still background) or a slip. Decide whether it is noticed, or only listed by
  `scene_inspect_layout`. (QA 2026-10-29)
- The notice about a shot's tracks that `shot_set remove` moves names the group, not the
  child whose keys were cut at the scene's start (a key placed before its shot's start).
  (QA 2026-10-29)
- An `animPreset` whose animation the library no longer has must not block edits: a write that did
  not set it ignores the name, and `animPreset: null` clears it (`checkAnimPresets` fails any
  changed element today, so after `animation_delete` the element cannot be edited). (QA 2026-10-29)
- An `animPreset` on an element that already animates copies nothing and says nothing: give it
  a notice (`expandAnimPresets` skips it by design, 019/D10). (QA 2026-10-29)
- `lineShotNotices` reports a line with no shot only when its ends sit in different shots; a line
  between two elements of the same shot is also drawn, with loose ends, in every other one.
  (QA 2026-10-29)
- `keyframe_set`, `element_group` and `font_install` stop at the first semantic problem of an
  input; the closed list asks for every one, as the schema-level checks give. (QA 2026-10-29)
- Smaller: `scene_update` with an invalid `duration` also lists each shot as ending after it; and
  `scene_generate_speech` with `provider: "custom"` and no `baseUrl` should ask for it instead of
  trying `localhost:8880`. (QA 2026-10-29)
