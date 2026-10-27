# 065 — defaults-and-easing-notices

## Goal
User feedback showed friction in tool ergonomics and defaults: `scene_create` rejects partial backgrounds, new scenes ignore project palette background colors, `counter` defaults to an unrequested `+` suffix, and keyframes with easings at the end of a track silently have no effect.

## Requirements
- R1: `scene_create` accepts a partial background (a color string or an object with any subset of fields) and merges it onto the resolved base background instead of failing with missing required field errors.
- R2: A new scene inheriting project defaults (`scene_create` without a custom background and `openBlankScene` in the editor) uses the project palette's background color as a solid background (no unwanted gradient or dots) when `palette.background` is configured.
- R3: The `counter` component descriptor defaults to `suffix: ""` (clean number) instead of `"+"`.
- R4: An easing specified on the last keyframe of any element track emits an explanatory notice in `scene_validate`, `scene_build`, `keyframe_set` and inspector review explaining that easings in Lienzo apply to the segment leading to the next keyframe.

## Design
### Approach

- D1 (R1): `scene_create` normalizes `data.background` before validating the scene. If `background` is a color string (`#...`, `rgb...`, `hsl...`) or preset name, or a partial object, it resolves against `defaults.background` using the existing `solid` trait applier and merge logic (matching `scene_build`), turning partial inputs into canonical `Background` objects.
  - _Trade-offs_: Callers can no longer use `scene_create` to strictly assert that all 9 background fields were supplied.
  - _Mitigation_: Invalid field types still fail validation via Zod; partial backgrounds match standard user expectations and tool parity.

- D2 (R2): When configuring defaults for a new scene (`scene_create` and the editor's `openBlankScene`), if `p.manifest.palette.background` is defined, the `solid` trait applier is used on the default background (`defaults.background.color = palette.background; gradient = false; dots = false; spotlight = 0`).
  - _Trade-offs_: New scenes in projects with custom palette backgrounds will no longer have the "Azul noche" dots or spotlight.
  - _Mitigation_: If no palette background is set, the default "Azul noche" background remains untouched. Users wanting dots can apply background presets.

- D3 (R3): In `src/components/counter/descriptor.ts`, default `suffix` to `""`.
  - _Trade-offs_: Any scene created outside version control expecting the implicit `+` default will now render without it.
  - _Mitigation_: Honest defaults (A23); prefixes/suffixes are explicitly added when desired.

- D4 (R4): Pure function `deadKeyframeEasingNotices(scene: Scene): SceneNotice[]` in `src/service/scene-notices.ts`. For every element and nested group, if any track's last keyframe (sorted by `t`) specifies an easing other than `"auto"` and `"linear"`, it returns a notice warning that the easing on the final keyframe is inoperative because easing applies to the segment starting at that keyframe.
  - _Trade-offs_: Extra check on scene validation and `keyframe_set`.
  - _Mitigation_: Fast in-memory walk; avoids user confusion coming from CSS/AE animation models.

## Tasks
- [ ] 065/T001 [agent] Tests: partial background and palette background in `scene_create` — covers R1, R2
- [ ] 065/T002 [agent] Support partial backgrounds and solid palette background in `scene_create` and editor — covers D1, D2
- [ ] 065/T003 [agent] Test and descriptor update for clean `counter` suffix default (`""`) — covers R3, D3
- [ ] 065/T004 [agent] Tests: dead keyframe easing notices in validation and `keyframe_set` — covers R4
- [ ] 065/T005 [agent] Implement `deadKeyframeEasingNotices`, connect to `sceneNotices`, `keyframe_set`, and docs — covers D4
- [ ] 065/T006 [agent] Verification, typecheck and test suite run — covers R1, R2, R3, R4
