import { z } from "zod";
import { mapElementsDeep } from "../../model/element-walk.ts";
import { updateSiblings } from "../element-tree.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";
import { editScene, SceneResult } from "../scenes.ts";

export const elementRemove = defineTool({
  name: "element_remove",
  description:
    "Remove an element from a scene by `id` or `group/child` path (at root or inside nested groups).",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    id: z.string().min(1),
  }),
  output: SceneResult,
  run: async ({ scene, project, id }, ctx) =>
    editScene(await inProject(ctx, project), scene, (s) => {
      let removedId: string | undefined;
      const withoutTarget = updateSiblings(s.elements, id, (siblings, i) => {
        removedId = siblings[i]?.id;
        return siblings.filter((_, j) => j !== i);
      });
      return {
        ...s,
        elements: mapElementsDeep(withoutTarget, (el) => {
          const fx = (el as unknown as { effects?: { mask?: string } }).effects;
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
