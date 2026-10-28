import { z } from "zod";
import { ProjectSlugSchema } from "../../../model/project.ts";
import { listJson } from "../../../presets/json-fs.ts";
import { defineTool, fail } from "../../core/registry.ts";
import { animationsDir } from "../project-files.ts";
import { asToolProject, ToolProjectSchema } from "../project-result.ts";

const ProjectDetailsSchema = z.object({
  manifest: ToolProjectSchema,
  assets: z.array(z.string()),
  presets: z.array(z.string()),
  animations: z.array(z.string()),
  fonts: z.array(z.string()),
  scenes: z.array(z.string()),
});

export const projectInspect = defineTool({
  name: "project_inspect",
  effects: [],
  description:
    "Inspect a project workspace: returns full manifest, brand guide, and inventory of " +
    "local assets, presets, animation presets, fonts and scenes.",
  input: z.object({
    project: ProjectSlugSchema,
  }),
  output: ProjectDetailsSchema,
  async run({ project }, ctx) {
    try {
      const details = await ctx.projects.get(project);
      if (!details) {
        fail("not_found", `No existe el proyecto «${project}»`, "project");
      }
      const bare = (names: readonly string[]) =>
        names.map((n) => n.replace(/\.json$/i, ""));
      return {
        ...details,
        scenes: bare(details.scenes),
        presets: bare(details.presets),
        manifest: asToolProject(details.manifest),
        animations: (await listJson(await animationsDir(ctx, project))).map(
          (item) => item.name,
        ),
        fonts: (await ctx.fonts.list(project)).map((f) => f.file),
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("No existe el proyecto")
      ) {
        fail("not_found", error.message, "project");
      }
      fail(
        "inspect_failed",
        String(error instanceof Error ? error.message : error),
        "project",
      );
    }
  },
});
