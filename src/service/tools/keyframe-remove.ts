import { z } from "zod";
import { keyframeAt, withoutKeyframe } from "../../engine/tracks.ts";
import {
  trackEntry,
  trackKeys,
  trackRepeat,
  trackUntil,
} from "../../model/track.ts";
import { updateElement } from "../element-tree.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { editScene, SceneResult } from "../scenes.ts";

export const keyframeRemove = defineTool({
  name: "keyframe_remove",
  description:
    "Remove an element's keyframe on `path` at time `t` (by `id` or `group/child` path); " +
    "a track left empty is removed.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    id: z.string().min(1),
    path: z.string().min(1),
    t: z.number().min(0),
  }),
  output: SceneResult,
  run: async ({ scene, project, id, path, t }, ctx) =>
    editScene(await inProject(ctx, project), scene, (s) => ({
      ...s,
      elements: updateElement(s.elements, id, (el) => {
        const { [path]: track, ...rest } = el.tracks ?? {};
        const keys = trackKeys(track);
        const k = keyframeAt(keys, t);
        if (k < 0)
          fail(
            "not_found",
            keys.length > 0
              ? `No hay keyframe en ${t}s en «${path}» (hay en: ${keys.map((key) => `${key.t}s`).join(", ")})`
              : `«${id}» no tiene pista «${path}» (pistas: ${Object.keys(el.tracks ?? {}).join(", ") || "ninguna"})`,
            "t",
          );
        const left = withoutKeyframe(keys, k);
        const tracks = left.length
          ? {
              ...rest,
              [path]: trackEntry(left, trackRepeat(track), trackUntil(track)),
            }
          : rest;
        const { tracks: _, ...bare } = el;
        return (
          Object.keys(tracks).length ? { ...bare, tracks } : bare
        ) as typeof el;
      }),
    })),
});
