import { z } from "zod";
import { ProjectSlugSchema } from "../../../model/project.ts";
import { defineTool, fail } from "../../core/registry.ts";

export const projectDelete = defineTool({
  name: "project_delete",
  effects: ["project"],
  description:
    "Delete an existing project workspace cleanly from projects/<project>/.",
  input: z.object({
    project: ProjectSlugSchema,
  }),
  output: z.object({
    ok: z.boolean(),
    project: z.string(),
  }),
  async run({ project }, ctx) {
    try {
      const deleted = await ctx.projects.delete(project);
      if (!deleted) {
        fail("not_found", `No existe el proyecto «${project}»`, "project");
      }
      return { ok: true, project };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("No existe el proyecto")
      ) {
        fail("not_found", error.message, "project");
      }
      fail(
        "delete_failed",
        String(error instanceof Error ? error.message : error),
        "project",
      );
    }
  },
});
