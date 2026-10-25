import { z } from "zod";
import type { Scene } from "../../model/model.ts";
import { availableFonts } from "../font-install.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";
import { sceneNotices } from "../scene-notices.ts";
import { prepareScene } from "../scenes.ts";
import { Verdict, verdictOf } from "../verdict.ts";

export const sceneValidate = defineTool({
  name: "scene_validate",
  description:
    "Check a whole scene without saving it, as the editor would open it (animation " +
    "presets it names must exist). Returns the first failing path. A valid scene can " +
    "still carry `notices`: e.g. a field the schema does not know (ignored, named by path), a text or subtitles font that is not installed in the " +
    "project (it would draw with a fallback; run font_install).",
  input: z.object({ scene: z.unknown(), project: PROJECT }),
  output: Verdict.extend({ notices: z.array(z.string()).optional() }),
  run: async ({ scene, project }, ctx) => {
    const projectCtx = await inProject(ctx, project);
    let prepared: { scene: Scene; notices: string[] } | undefined;
    const verdict = await verdictOf(async () => {
      prepared = await prepareScene(projectCtx, scene);
    });
    if (!prepared) return verdict;
    const fonts = await availableFonts(ctx.fonts, project);
    const notices = [
      ...prepared.notices,
      ...sceneNotices(
        scene,
        prepared.scene,
        fonts.map((f) => f.family),
      ).map((n) => n.message),
    ];
    return notices.length > 0 ? { ...verdict, notices } : verdict;
  },
});
