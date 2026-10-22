import { z } from "zod";
import { centerOn } from "../../engine/geometry.ts";
import type { Element } from "../../model/model.ts";
import { COORDINATES, patched } from "../elements.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";
import { editScene, elementIndex, SceneResult } from "../scenes.ts";

export const elementUpdate = defineTool({
  name: "element_update",
  description:
    "Change an element with a partial patch, deep-merged: objects merge key by key, " +
    "anything else (arrays, tracks' keyframe lists) is replaced. id and kind never change. " +
    "The result is checked against the kind's fields. `at` re-centres the patched element " +
    "on a point and wins over an `x`/`y` in the patch. " +
    COORDINATES,
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    id: z.string().min(1),
    patch: z.record(z.string(), z.unknown()),
    at: z.object({ x: z.number(), y: z.number() }).optional(),
  }),
  output: SceneResult,
  run: async ({ scene, project, id, patch, at }, ctx) =>
    editScene(await inProject(ctx, project), scene, (s) => {
      const i = elementIndex(s, id);
      return {
        ...s,
        elements: s.elements.map((el, j) =>
          j === i ? recentred(patched(el, patch), at) : el,
        ),
      };
    }),
});

const recentred = (el: Element, at?: { x: number; y: number }) =>
  at ? centerOn(el, at.x, at.y) : el;
