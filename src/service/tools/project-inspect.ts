import { z } from "zod";
import {
  ProjectManifestSchema,
  ProjectSlugSchema,
} from "../../model/project.ts";
import { defineTool, fail } from "../registry.ts";

const ProjectDetailsSchema = z.object({
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
    project: ProjectSlugSchema,
  }),
  output: ProjectDetailsSchema,
  async run({ project }, ctx) {
    try {
      const details = await ctx.projects.get(project);
      if (!details) {
        fail("not_found", `No existe el proyecto «${project}»`, "project");
      }
      return details;
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
