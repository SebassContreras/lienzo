import { z } from "zod";
import { removeJson } from "../../../presets/json-fs.ts";
import { animationsDir } from "../../project-files.ts";
import { PROJECT } from "../../project-scope.ts";
import { defineTool, fail } from "../../registry.ts";

export const animationDelete = defineTool({
  name: "animation_delete",
  description:
    "Delete an animation preset by file name (see animation_list) from the project's " +
    "presets/animations/ with `project`, else from the global presets/animations/. Scenes " +
    "that used it keep their copied values.",
  input: z.object({ name: z.string().min(1), project: PROJECT.optional() }),
  output: z.object({ ok: z.literal(true) }),
  async run({ name, project }, ctx) {
    if (!(await removeJson(await animationsDir(ctx, project), name)))
      fail("not_found", `No existe la animación «${name}»`, "name");
    return { ok: true as const };
  },
});
