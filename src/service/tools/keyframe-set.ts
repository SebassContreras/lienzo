import { z } from "zod";
import { EasingSchema } from "../../engine/easing.ts";
import { withKeyframe } from "../../engine/tracks.ts";
import {
  TrackRepeatSchema,
  trackEntry,
  trackKeys,
  trackRepeat,
  trackUntil,
} from "../../model/track.ts";
import { updateElement } from "../element-tree.ts";
import { checkKeyframe, checkTrackPath } from "../elements.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { editScene, SceneResult } from "../scenes.ts";

export const keyframeSet = defineTool({
  name: "keyframe_set",
  description:
    "Set a keyframe or configure loop options on an element's track (at root or inside nested " +
    "groups, by `id` or `group/child` path): `path` is an animatable field path or channel of " +
    "its kind (see component_list, e.g. `x`, `fill.color`, `@rotate`, `@scale`), `t` seconds " +
    "within the scene (scene time, also for an element bound to a shot; its tracks move with " +
    "the shot when it changes, see shot_set), `value` a number or a color. A keyframe already at `t` is replaced. " +
    "`easing` (default `auto`) shapes the segment to the next keyframe (`step` / `hold` holds " +
    "the value until the next keyframe); an unknown easing fails, listing the names. `repeat` (`none` | `loop` | `pingpong`) and `until` " +
    "(seconds, or `null` to clear) set or clear track looping.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    id: z.string().min(1),
    path: z.string().min(1),
    t: z.number().min(0).optional(),
    value: z.union([z.number(), z.string()]).optional(),
    easing: EasingSchema.optional(),
    repeat: TrackRepeatSchema.optional(),
    until: z.number().min(0).nullable().optional(),
  }),
  output: SceneResult,
  run: async (
    { scene, project, id, path, t, value, easing, repeat, until },
    ctx,
  ) =>
    editScene(await inProject(ctx, project), scene, (s) => ({
      ...s,
      elements: updateElement(s.elements, id, (el) => {
        const hasT = t !== undefined;
        const hasValue = value !== undefined;
        if (hasT !== hasValue) {
          fail(
            "invalid_input",
            "Debes indicar tanto 't' como 'value' para fijar un keyframe",
            hasT ? "value" : "t",
          );
        }
        const prev = el.tracks?.[path];
        let keys = [...trackKeys(prev)];
        if (hasT && hasValue) {
          checkKeyframe(el.kind, path, value);
          if (t > s.duration)
            fail("invalid_time", `t pasa la duración (${s.duration}s)`, "t");
          keys = withKeyframe(keys, {
            t,
            value,
            easing: easing ?? "auto",
          });
        } else {
          checkTrackPath(el.kind, path);
          if (repeat === undefined && until === undefined) {
            fail(
              "invalid_input",
              "Debes indicar un keyframe ('t' y 'value') o 'repeat'/'until'",
              "t",
            );
          }
          if (!prev || keys.length === 0) {
            fail("not_found", `No hay pista de keyframes en «${path}»`, "path");
          }
        }
        const nextRepeat = repeat ?? trackRepeat(prev);
        const nextUntil =
          until === null ? undefined : (until ?? trackUntil(prev));
        return {
          ...el,
          tracks: {
            ...el.tracks,
            [path]: trackEntry(keys, nextRepeat, nextUntil),
          },
        };
      }),
    })),
});
