import { z } from "zod";
import { groupElements } from "../../engine/groups.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { openScene, SceneResult, saveScene } from "../scenes.ts";

export const elementGroup = defineTool({
  name: "element_group",
  description:
    "Put two or more top-level elements (by `id`) into one new group, as the editor's Ctrl+G " +
    "does: the group takes their bounding box and the topmost one's layer, and lines keep " +
    "their attachments. Returns the group's `id`.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    ids: z.array(z.string().min(1)).min(2),
  }),
  output: SceneResult.extend({ id: z.string() }),
  async run({ scene, project, ids }, ctx) {
    const pctx = await inProject(ctx, project);
    const current = await openScene(pctx, scene);
    const missing = ids.find(
      (id) => !current.elements.some((el) => el.id === id),
    );
    if (missing)
      fail(
        "not_found",
        `No hay un elemento de primer nivel «${missing}»`,
        "ids",
      );
    const { scene: grouped, group } = groupElements(current, ids);
    if (!group)
      fail("too_few", "Hacen falta al menos dos elementos distintos", "ids");
    return { ...(await saveScene(pctx, scene, grouped)), id: group.id };
  },
});
