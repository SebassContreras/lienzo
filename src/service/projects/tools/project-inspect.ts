import { z } from "zod";
import { ProjectSlugSchema } from "../../../model/project.ts";
import { listJson } from "../../../presets/json-fs.ts";
import { defineTool, fail } from "../../core/registry.ts";
import { projectFontNotices } from "../../fonts/font-install.ts";
import { animationsDir } from "../project-files.ts";
import { asToolProject, ToolProjectSchema } from "../project-result.ts";

const ProjectDetailsSchema = z.object({
  manifest: ToolProjectSchema,
  guide: z.string().nullable(),
  assets: z.array(z.string()),
  presets: z.array(z.string()),
  animations: z.array(z.string()),
  fonts: z.array(z.string()),
  scenes: z.array(z.string()),
  notices: z.array(z.string()),
});

export const projectInspect = defineTool({
  name: "project_inspect",
  effects: [],
  description:
    "Inspect a project workspace: returns the full manifest, the written brand guide " +
    "(`guide`, brand.md; `null` when there is none), and the inventory of local assets, " +
    "presets, animation presets, fonts and scenes. `notices` names what is wrong with the " +
    "brand fonts: a declared family or weight not installed (run font_install) and a family " +
    "installed in the project but not declared (add it with project_update `fonts`).",
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
        notices: await projectFontNotices(
          ctx.fonts,
          project,
          details.manifest.fonts,
        ),
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
