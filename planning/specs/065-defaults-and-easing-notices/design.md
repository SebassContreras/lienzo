# 065 — defaults-and-easing-notices — Design

## Approach

- D1@1 (implements R1): `scene_create` normalizes `data.background` before validating the scene. If `background` is a color string (`#...`, `rgb...`, `hsl...`) or preset name, or a partial object, it resolves against `defaults.background` using the existing `solid` trait applier and merge logic (matching `scene_build`), turning partial inputs into canonical `Background` objects.
  - _Trade-offs_: Callers can no longer use `scene_create` to strictly assert that all 9 background fields were supplied.
  - _Mitigation_: Invalid field types still fail validation via Zod; partial backgrounds match standard user expectations and tool parity.

- D2@1 (implements R2): When configuring defaults for a new scene (`scene_create` and the editor's `openBlankScene`), if `p.manifest.palette.background` is defined, the `solid` trait applier is used on the default background (`defaults.background.color = palette.background; gradient = false; dots = false; spotlight = 0`).
  - _Trade-offs_: New scenes in projects with custom palette backgrounds will no longer have the "Azul noche" dots or spotlight.
  - _Mitigation_: If no palette background is set, the default "Azul noche" background remains untouched. Users wanting dots can apply background presets.

- D3@1 (implements R3): In `src/components/counter/descriptor.ts`, default `suffix` to `""`.
  - _Trade-offs_: Any scene created outside version control expecting the implicit `+` default will now render without it.
  - _Mitigation_: Honest defaults (A23); prefixes/suffixes are explicitly added when desired.

- D4@1 (implements R4): Pure function `deadKeyframeEasingNotices(scene: Scene): SceneNotice[]` in `src/service/scene-notices.ts`. For every element and nested group, if any track's last keyframe (sorted by `t`) specifies an easing other than `"auto"` and `"linear"`, it returns a notice warning that the easing on the final keyframe is inoperative because easing applies to the segment starting at that keyframe.
  - _Trade-offs_: Extra check on scene validation and `keyframe_set`.
  - _Mitigation_: Fast in-memory walk; avoids user confusion coming from CSS/AE animation models.
