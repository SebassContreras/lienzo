import { z } from "zod";
import { ungroupElement } from "../../engine/groups.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { openScene, SceneResult, saveScene } from "../scenes/scenes.ts";

export const elementUngroup = defineTool({
  name: "element_ungroup",
  description:
    "Replace a top-level group (by `id`) with its children placed where they are drawn, as " +
    "the editor's Ctrl+Shift+G does; the group's own animation is dropped and its shot goes to " +
    "each child that has none, so element_group then element_ungroup gives back the scene " +
    "when the grouped elements were next to each other in the layer order. " +
    "Returns the children's `ids`.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    id: z.string().min(1),
  }),
  output: SceneResult.extend({ ids: z.array(z.string()) }),
  async run({ scene, project, id }, ctx) {
    const pctx = await inProject(ctx, project);
    const current = await openScene(pctx, scene);
    const target = current.elements.find((el) => el.id === id);
    if (target?.kind !== "group")
      fail("not_a_group", `«${id}» no es un grupo de primer nivel`, "id");
    const { scene: flat, ids } = ungroupElement(current, id);
    return { ...(await saveScene(pctx, scene, flat, current)), ids };
  },
});
