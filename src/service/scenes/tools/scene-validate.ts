import { z } from "zod";
import { CompactSceneInputSchema } from "../../../model/compact.ts";
import type { Scene } from "../../../model/model.ts";
import { buildCompact } from "../../compact/build-compact.ts";
import { inProject, PROJECT } from "../../core/project-scope.ts";
import { defineTool, fail } from "../../core/registry.ts";
import { Verdict, verdictOf } from "../../core/verdict.ts";
import {
  availableFonts,
  measureInstalledFonts,
} from "../../fonts/font-install.ts";
import { sceneFromData } from "../scene-defaults.ts";
import { sceneNotices } from "../scene-notices.ts";
import { resourceNotices } from "../scene-resources.ts";
import { prepareScene } from "../scenes.ts";

export const sceneValidate = defineTool({
  name: "scene_validate",
  description:
    "Check a whole scene without saving it, as the editor would open it (animation " +
    "presets it names must exist, shots must end within the scene and not overlap, and the " +
    "shots, icons, line targets and symbols an element names must exist; values must fit their " +
    "fields, such as every opacity in 0–1). Returns every problem in `errors` (the first " +
    "one also in `path`/`message`); paths name an element by the `id` you gave, else by its index. A valid scene can " +
    "still carry `notices`: e.g. a field the schema does not know (ignored, named by path), a text or subtitles font that is not installed in the " +
    "project (it would draw with a fallback; run font_install) or a weight its family lacks (the notice names the weight drawn), an easing on a track's last keyframe (it shapes nothing), or a text whose width is " +
    "estimated because its font has no metrics here (check it with scene_preview). " +
    "Pass either `data` (a scene as scene_get returns it; missing scene fields take the project's " +
    "canvas and an element's missing fields its kind's defaults) or `compact` (the compact form scene_build takes, " +
    "checked as scene_build would build it, with the same notices).",
  input: z.object({
    data: z.unknown().optional(),
    compact: CompactSceneInputSchema.optional(),
    project: PROJECT,
  }),
  output: Verdict.extend({ notices: z.array(z.string()).optional() }),
  run: async ({ data, compact, project }, ctx) => {
    const projectCtx = await inProject(ctx, project);
    const fonts = await availableFonts(ctx.fonts, project);
    await measureInstalledFonts(ctx.fonts, project);
    if (compact !== undefined) {
      let built: { notices: string[] } | undefined;
      const verdict = await verdictOf(async () => {
        if (data !== undefined)
          fail("invalid_input", "Pasa `data` o `compact`, no ambos", "compact");
        built = await buildCompact(projectCtx, compact, fonts);
      });
      return built && built.notices.length > 0
        ? { ...verdict, notices: built.notices }
        : verdict;
    }
    let prepared: { scene: Scene; notices: string[] } | undefined;
    const verdict = await verdictOf(async () => {
      if (data === undefined)
        fail("invalid_input", "Falta `data` o `compact`", "compact");
      const whole =
        typeof data === "object" && data !== null && !Array.isArray(data)
          ? await sceneFromData(projectCtx, data as Record<string, unknown>)
          : data;
      prepared = await prepareScene(projectCtx, whole, undefined, data);
    });
    if (!prepared) return verdict;
    const notices = [
      ...prepared.notices,
      ...sceneNotices(data, prepared.scene, fonts).map((n) => n.message),
      ...(await resourceNotices(projectCtx, prepared.scene)),
    ];
    return notices.length > 0 ? { ...verdict, notices } : verdict;
  },
});
