import { z } from "zod";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";
import { editScene, elementIndex, SceneResult } from "../scenes.ts";

export const elementRemove = defineTool({
  name: "element_remove",
  description: "Remove an element from a scene by id.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    id: z.string().min(1),
  }),
  output: SceneResult,
  run: async ({ scene, project, id }, ctx) =>
    editScene(await inProject(ctx, project), scene, (s) => {
      const i = elementIndex(s, id);
      const removedId = s.elements[i]?.id;
      return {
        ...s,
        elements: s.elements
          .filter((_, j) => j !== i)
          .map((el) => {
            const fx = (el as unknown as { effects?: { mask?: string } })
              .effects;
            if (fx && fx.mask === removedId) {
              return {
                ...el,
                effects: { ...fx, mask: "" },
              } as typeof el;
            }
            return el;
          }),
      };
    }),
});
