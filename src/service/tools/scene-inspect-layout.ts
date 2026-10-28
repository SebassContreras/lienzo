import { z } from "zod";
import { withElementDefaults } from "../../model/fill-defaults.ts";
import type { ProjectCtx } from "../ctx.ts";
import { measureInstalledFonts } from "../fonts/font-install.ts";
import { inspectLayout, layoutBoxes } from "../layout.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { assertTimeWithin } from "../render/render-target.ts";
import { sceneFromData } from "../scenes/scene-defaults.ts";
import { checkScene, openScene } from "../scenes/scenes.ts";

/**
 * `data` as a scene, the project's canvas for what it leaves out and partial elements filled
 * (080/D2), so `scene_get`'s sparse result goes in as it is. Only the schema is checked: an
 * unknown shot or symbol is what the diagnostics report.
 */
async function sceneOf(ctx: ProjectCtx, data: unknown) {
  const whole =
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? await sceneFromData(ctx, data as Record<string, unknown>)
      : data;
  return checkScene(withElementDefaults(whole), "data", data);
}

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
    "Analyse layout and spatial diagnostics of a scene at given times (default: start, middle " +
    "and end of loop): `text_overlap`, `shape_overlap` (shapes stacked on each other; a " +
    "clearly smaller box inside a bigger one is not reported), `out_of_bounds`, `text_overflow` (text a component draws outside its own box: a bubble's " +
    "text past its height, code past its right edge, a steps label outside it), " +
    "`dangling_attachment` (a line end on a missing id), `low_contrast` / " +
    "`unverifiable_contrast`, `missing_symbol` and `unknown_shot`, counting only the elements " +
    "whose shot is on screen at that time. Pass a saved scene name in `scene` or a scene object in `data` " +
    "(as scene_get returns it: missing scene fields take the project's canvas and an " +
    "element's missing fields its kind's defaults). " +
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
    if (saved !== undefined && data !== undefined)
      fail("invalid_input", "Pasa `scene` o `data`, no ambos", "data");
    const projectCtx = await inProject(ctx, project);
    await measureInstalledFonts(ctx.fonts, project);
    const scene =
      data !== undefined
        ? await sceneOf(projectCtx, data)
        : saved
          ? await openScene(projectCtx, saved)
          : fail(
              "invalid_input",
              "Debe proporcionar el nombre de una escena guardada ('scene') o una escena completa ('data')",
              "scene",
            );
    for (const [i, t] of (times ?? []).entries())
      assertTimeWithin(scene, t, `times.${i}`);
    return {
      diagnostics: inspectLayout(scene, times),
      boxes: layoutBoxes(scene, times),
    };
  },
});
