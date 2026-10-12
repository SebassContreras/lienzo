import { z } from "zod";
import { patched } from "../elements.ts";
import { defineTool } from "../registry.ts";
import { editScene, elementIndex, SceneResult } from "../scenes.ts";

export const elementUpdate = defineTool({
  name: "element_update",
  description:
    "Change an element with a partial patch, deep-merged: objects merge key by key, " +
    "anything else (arrays, tracks' keyframe lists) is replaced. id and kind never change. " +
    "The result is checked against the kind's fields.",
  input: z.object({
    scene: z.string().min(1),
    id: z.string().min(1),
    patch: z.record(z.string(), z.unknown()),
  }),
  output: SceneResult,
  run: ({ scene, id, patch }, ctx) =>
    editScene(ctx, scene, (s) => {
      const i = elementIndex(s, id);
      return {
        ...s,
        elements: s.elements.map((el, j) =>
          j === i ? patched(el, patch) : el,
        ),
      };
    }),
});
