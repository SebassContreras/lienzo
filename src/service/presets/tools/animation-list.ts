import { z } from "zod";
import { parseAnimPreset } from "../../../model/anim-preset.ts";
import { listJson } from "../../../presets/json-fs.ts";
import { PROJECT } from "../../project-scope.ts";
import { animationsDir } from "../../projects/project-files.ts";
import { defineTool } from "../../registry.ts";

export const animationList = defineTool({
  name: "animation_list",
  description:
    "List the animation presets (the editor's animation library) with their file name, name, " +
    "category and `source`: the global ones, and with `project` that project's own too; files " +
    "that fail the schema are left out. Use a name as an element's `animPreset`.",
  input: z.object({ project: PROJECT.optional() }),
  output: z.object({
    animations: z.array(
      z.object({
        file: z.string(),
        name: z.string(),
        category: z.string().optional(),
        source: z.enum(["global", "project"]),
      }),
    ),
  }),
  async run({ project }, ctx) {
    const from = async (source: "global" | "project", dir: string) =>
      (await listJson(dir)).flatMap((item) => {
        const parsed = parseAnimPreset(item.data);
        if (!parsed.ok) return [];
        const { name, category } = parsed.value;
        return [
          { file: item.name, name, ...(category ? { category } : {}), source },
        ];
      });
    return {
      animations: [
        ...(project
          ? await from("project", await animationsDir(ctx, project))
          : []),
        ...(await from("global", await animationsDir(ctx, undefined))),
      ],
    };
  },
});
