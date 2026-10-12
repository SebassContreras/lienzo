import { z } from "zod";
import { defineTool } from "../registry.ts";
import { editScene, elementIndex, SceneResult } from "../scenes.ts";

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
    "Move an element in the layer order: `front` (drawn last, on top), `back`, one step " +
    "`forward` or `backward`, or to an index (0 = bottom).",
  input: z.object({
    scene: z.string().min(1),
    id: z.string().min(1),
    to: z.union([z.enum(STEPS), z.number().int().min(0)]),
  }),
  output: SceneResult,
  run: ({ scene, id, to }, ctx) =>
    editScene(ctx, scene, (s) => {
      const i = elementIndex(s, id);
      const elements = s.elements.filter((_, j) => j !== i);
      elements.splice(
        target(to, i, s.elements.length),
        0,
        s.elements[i] as (typeof elements)[number],
      );
      return { ...s, elements };
    }),
});
