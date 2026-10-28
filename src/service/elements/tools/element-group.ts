import { z } from "zod";
import { groupElements } from "../../../engine/groups.ts";
import { inProject, PROJECT } from "../../project-scope.ts";
import { defineTool, fail, failAll } from "../../registry.ts";
import { allElements } from "../../scenes/scene-changes.ts";
import { openScene, SceneResult, saveScene } from "../../scenes/scenes.ts";

export const elementGroup = defineTool({
  name: "element_group",
  description:
    "Put two or more top-level elements (by `id`) into one new group, as the editor's Ctrl+G " +
    "does: the group takes their bounding box and the topmost one's layer, and lines keep " +
    "their attachments. Elements of one shot make a group of that shot; elements of different " +
    "shots make a group of none (with a notice). `id` names the group (else one is generated). " +
    "The members keep their own draw order, whatever order `ids` has; a non-member that was " +
    "between two members ends below the group. " +
    "Fails listing every id that is not a top-level element. Returns the group's `id`.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    ids: z.array(z.string().min(1)).min(2),
    id: z.string().min(1).optional(),
  }),
  output: SceneResult.extend({ id: z.string() }),
  async run({ scene, project, ids, id }, ctx) {
    const pctx = await inProject(ctx, project);
    const current = await openScene(pctx, scene);
    // every id that cannot be grouped, each saying why (074/D10)
    const all = allElements(current);
    const problems = ids.flatMap((member, i) => {
      if (current.elements.some((el) => el.id === member)) return [];
      const parent = all.find(
        (el) => el.kind === "group" && el.children.some((c) => c.id === member),
      );
      return [
        {
          path: `ids.${i}`,
          message: parent
            ? `«${member}» está dentro del grupo «${parent.id}»; desagrúpalo antes (element_ungroup)`
            : member.includes("/")
              ? `«${member}» es la ruta de un hijo: element_group solo agrupa elementos de primer nivel (usa su id)`
              : `No hay un elemento «${member}»`,
        },
      ];
    });
    if (problems.length > 0) failAll("not_found", problems);
    if (id && all.some((el) => el.id === id))
      fail("duplicate_id", `Ya hay un elemento «${id}»`, "id");
    const { scene: saved, group, mixedShots } = groupElements(current, ids, id);
    if (!group)
      fail("too_few", "Hacen falta al menos dos elementos distintos", "ids");
    const notices = mixedShots
      ? [
          `Los elementos son de tomas distintas (${mixedShots.map((s) => s || "sin toma").join(", ")}): el grupo no queda en ninguna; cada hijo solo se ve en su toma, sin su transición ni su cámara, y en el orden de capas del grupo, así que un hijo puede quedar tapado por otro`,
        ]
      : [];
    const result = await saveScene(pctx, scene, saved, current);
    return {
      ...result,
      notices: [...notices, ...result.notices],
      id: group.id,
    };
  },
});
