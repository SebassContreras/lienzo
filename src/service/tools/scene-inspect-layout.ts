import { z } from "zod";
import { inspectLayout, layoutBoxes } from "../layout.ts";
import { defineTool, fail } from "../registry.ts";
import { checkScene, openScene } from "../scenes.ts";

const DiagnosticSchema = z.object({
  code: z.string(),
  elementId: z.string(),
  t: z.number(),
  message: stringSchema(),
  ratio: z.number().optional(),
  required: z.number().optional(),
  fg: z.string().optional(),
  bg: z.string().optional(),
  suggestion: z.string().optional(),
});

const BoxSchema = z.object({
  id: z.string(),
  t: z.number(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

function stringSchema() {
  return z.string();
}

export const sceneInspectLayout = defineTool({
  name: "scene_inspect_layout",
  description:
    "Analyse layout and spatial diagnostics of a scene (text overlaps, elements " +
    "outside canvas bounds, line attachments to missing IDs, and contrast issues) at given " +
    "times (default: start, middle and end of loop). Input can be a scene object or saved scene name. " +
    "Also returns `boxes`: the drawn box (top-left `x, y`, `w`, `h`) of every top-level " +
    "element at each time, to verify placement (e.g. centred when x + w/2 = width/2).",
  input: z.object({
    scene: z.unknown().optional(),
    name: z.string().optional(),
    times: z.array(z.number().min(0)).optional(),
  }),
  output: z.object({
    diagnostics: z.array(DiagnosticSchema),
    boxes: z.array(BoxSchema),
  }),
  async run({ scene: sceneInput, name, times }, ctx) {
    let scene = sceneInput
      ? checkScene(sceneInput)
      : name
        ? await openScene(ctx, name)
        : undefined;

    if (!scene) {
      if (typeof sceneInput === "string") {
        scene = await openScene(ctx, sceneInput);
      } else {
        fail(
          "invalid_input",
          "Debe proporcionar una escena ('scene') o el nombre de una escena guardada ('name')",
          "scene",
        );
      }
    }

    return {
      diagnostics: inspectLayout(scene, times),
      boxes: layoutBoxes(scene, times),
    };
  },
});
