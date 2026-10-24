import { z } from "zod";
import { updateSiblings } from "../element-tree.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";
import { editScene, SceneResult } from "../scenes.ts";

const STEPS = ["front", "back", "forward", "backward"] as const;

/** Where `to` puts an element now at `i` among `n` (later elements draw on top). */
function target(to: (typeof STEPS)[number] | number, i: number, n: number) {
  if (typeof to === "number") return Math.min(to, n - 1);
  if (to === "front") return n - 1;
  if (to === "back") return 0;
  return Math.max(0, Math.min(n - 1, i + (to === "forward" ? 1 : -1)));
}

export const elementMove = defineTool({
  name: "element_move",
  description:
    "Move an element (at root or inside a group, by `id` or `group/child` path) in its sibling " +
    "layer order: `front` (drawn last, on top), `back`, one step `forward` or `backward`, or to " +
    "an index (0 = bottom).",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    id: z.string().min(1),
    to: z.union([z.enum(STEPS), z.number().int().min(0)]),
  }),
  output: SceneResult,
  run: async ({ scene, project, id, to }, ctx) =>
    editScene(await inProject(ctx, project), scene, (s) => ({
      ...s,
      elements: updateSiblings(s.elements, id, (siblings, i) => {
        const next = siblings.filter((_, j) => j !== i);
        next.splice(
          target(to, i, siblings.length),
          0,
          siblings[i] as (typeof next)[number],
        );
        return next;
      }),
    })),
});
