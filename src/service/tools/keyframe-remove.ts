import { z } from "zod";
import { keyframeAt, withoutKeyframe } from "../../engine/tracks.ts";
import { defineTool, fail } from "../registry.ts";
import { editScene, elementIndex, SceneResult } from "../scenes.ts";

export const keyframeRemove = defineTool({
  name: "keyframe_remove",
  description:
    "Remove an element's keyframe on `path` at time `t`; a track left empty is removed.",
  input: z.object({
    scene: z.string().min(1),
    id: z.string().min(1),
    path: z.string().min(1),
    t: z.number().min(0),
  }),
  output: SceneResult,
  run: ({ scene, id, path, t }, ctx) =>
    editScene(ctx, scene, (s) => {
      const i = elementIndex(s, id);
      const el = s.elements[i] as (typeof s.elements)[number];
      const { [path]: keys = [], ...rest } = el.tracks ?? {};
      const k = keyframeAt(keys, t);
      if (k < 0) fail("not_found", `No hay keyframe en ${t}s`, "t");
      const left = withoutKeyframe(keys, k);
      const tracks = left.length ? { ...rest, [path]: left } : rest;
      const { tracks: _, ...bare } = el;
      const out = Object.keys(tracks).length ? { ...bare, tracks } : bare;
      return {
        ...s,
        elements: s.elements.map((e, j) => (j === i ? (out as typeof el) : e)),
      };
    }),
});
