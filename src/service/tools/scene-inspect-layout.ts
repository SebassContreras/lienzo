import { z } from "zod";
import { measureInstalledFonts } from "../font-install.ts";
import { inspectLayout, layoutBoxes } from "../layout.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { checkScene, openScene } from "../scenes.ts";

const DiagnosticSchema = z.object({
  code: z.string(),
  elementId: z.string(),
  shot: z.string().optional(),
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
  estimated: z.literal(true).optional(),
});

function stringSchema() {
  return z.string();
}

export const sceneInspectLayout = defineTool({
  name: "scene_inspect_layout",
  description:
    "Analyse layout and spatial diagnostics of a scene (text overlaps, elements " +
    "outside canvas bounds, line attachments to missing IDs, and contrast issues) at given " +
    "times (default: start, middle and end of loop). Pass a saved scene name in `scene` or a whole scene object in `data`. " +
    "Also returns `boxes`: the drawn box (top-left `x, y`, `w`, `h`) of every top-level " +
    "element at each time, as its shot's camera and transition show it on screen, to verify " +
    "placement (e.g. centred when x + w/2 = width/2). A box marked " +
    "`estimated: true` (a text or subtitles, or a group holding one) uses a font with no metrics here, so its width is approximate: check it with scene_preview.",
  input: z.object({
    scene: z.string().min(1).optional(),
    data: z.unknown().optional(),
    project: PROJECT,
    times: z.array(z.number().min(0)).optional(),
  }),
  output: z.object({
    diagnostics: z.array(DiagnosticSchema),
    boxes: z.array(BoxSchema),
  }),
  async run({ scene: saved, data, project, times }, ctx) {
    const projectCtx = await inProject(ctx, project);
    await measureInstalledFonts(ctx.fonts, project);
    const scene =
      data !== undefined
        ? checkScene(data)
        : saved
          ? await openScene(projectCtx, saved)
          : fail(
              "invalid_input",
              "Debe proporcionar el nombre de una escena guardada ('scene') o una escena completa ('data')",
              "scene",
            );
    return {
      diagnostics: inspectLayout(scene, times),
      boxes: layoutBoxes(scene, times),
    };
  },
});
