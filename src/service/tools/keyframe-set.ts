import { z } from "zod";
import { EasingSchema } from "../../engine/easing.ts";
import { withKeyframe } from "../../engine/tracks.ts";
import { checkKeyframe } from "../elements.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { editScene, elementIndex, SceneResult } from "../scenes.ts";

export const keyframeSet = defineTool({
  name: "keyframe_set",
  description:
    "Set a keyframe on an element: `path` is an animatable field path or channel of its " +
    "kind (see component_list, e.g. `x`, `fill.color`, `@rotate`, `@scale`), `t` seconds " +
    "within the scene, `value` a number or a color. A keyframe already at `t` is " +
    "replaced. `easing` (default `auto`) shapes the segment to the next keyframe.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    id: z.string().min(1),
    path: z.string().min(1),
    t: z.number().min(0),
    value: z.union([z.number(), z.string()]),
    easing: EasingSchema.optional(),
  }),
  output: SceneResult,
  run: async ({ scene, project, id, path, t, value, easing }, ctx) =>
    editScene(await inProject(ctx, project), scene, (s) => {
      const i = elementIndex(s, id);
      const el = s.elements[i] as (typeof s.elements)[number];
      checkKeyframe(el.kind, path, value);
      if (t > s.duration)
        fail("invalid_time", `t pasa la duración (${s.duration}s)`, "t");
      const keys = withKeyframe(el.tracks?.[path] ?? [], {
        t,
        value,
        easing: easing ?? "auto",
      });
      const out = { ...el, tracks: { ...el.tracks, [path]: keys } };
      return { ...s, elements: s.elements.map((e, j) => (j === i ? out : e)) };
    }),
});
