import { z } from "zod";
import { defineTool } from "../registry.ts";
import { editScene, elementIndex, SceneResult } from "../scenes.ts";

export const elementRemove = defineTool({
  name: "element_remove",
  description: "Remove an element from a scene by id.",
  input: z.object({ scene: z.string().min(1), id: z.string().min(1) }),
  output: SceneResult,
  run: ({ scene, id }, ctx) =>
    editScene(ctx, scene, (s) => {
      const i = elementIndex(s, id);
      return { ...s, elements: s.elements.filter((_, j) => j !== i) };
    }),
});
