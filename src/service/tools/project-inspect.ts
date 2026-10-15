import { z } from "zod";
import { ProjectManifestSchema, ProjectSlugSchema } from "../../model/project.ts";
import { defineTool, fail } from "../registry.ts";

export const ProjectDetailsSchema = z.object({
  manifest: ProjectManifestSchema,
  assets: z.array(z.string()),
  presets: z.array(z.string()),
  scenes: z.array(z.string()),
});

export const projectInspect = defineTool({
  name: "project_inspect",
  description:
    "Inspect a project workspace: returns full manifest, brand guide, and inventory of " +
    "local assets, presets, and scenes.",
  input: z.object({
    slug: ProjectSlugSchema,
  }),
  output: ProjectDetailsSchema,
  async run({ slug }, ctx) {
    try {
      const details = await ctx.projects.get(slug);
      if (!details) {
        fail("not_found", `No existe el proyecto «${slug}»`, "slug");
      }
      return details;
    } catch (error) {
      if (error instanceof Error && error.message.includes("No existe el proyecto")) {
        fail("not_found", error.message, "slug");
      }
      fail("inspect_failed", String(error instanceof Error ? error.message : error), "slug");
    }
  },
});
