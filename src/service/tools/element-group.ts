import { z } from "zod";
import { groupElements } from "../../engine/groups.ts";
import type { Element } from "../../model/model.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { openScene, SceneResult, saveScene } from "../scenes.ts";

export const elementGroup = defineTool({
  name: "element_group",
  description:
    "Put two or more top-level elements (by `id`) into one new group, as the editor's Ctrl+G " +
    "does: the group takes their bounding box and the topmost one's layer, and lines keep " +
    "their attachments. Elements of one shot make a group of that shot; elements of different " +
    "shots make a group of none (with a notice). Returns the group's `id`.",
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
    // shots act on top-level elements: one shared shot moves to the group (069/D13)
    const shots = [...new Set(group.children.map((c) => c.shot ?? ""))];
    const notices: string[] = [];
    let saved = grouped;
    if (shots.length === 1 && shots[0]) {
      const shot = shots[0];
      saved = {
        ...grouped,
        elements: grouped.elements.map((el) =>
          el.id === group.id && el.kind === "group"
            ? {
                ...el,
                shot,
                children: el.children.map(({ shot: _s, ...c }) => c as Element),
              }
            : el,
        ),
      };
    } else if (shots.length > 1)
      notices.push(
        `Los elementos son de tomas distintas (${shots.map((s) => s || "sin toma").join(", ")}): el grupo no queda en ninguna; cada hijo solo se ve en su toma, sin su transición ni su cámara, y en el orden de capas del grupo, así que un hijo puede quedar tapado por otro`,
      );
    const result = await saveScene(pctx, scene, saved, current);
    return {
      ...result,
      notices: [...notices, ...result.notices],
      id: group.id,
    };
  },
});
