import { z } from "zod";
import { ProjectSlugSchema } from "../../model/project.ts";
import { defineTool, fail } from "../registry.ts";

export const projectDelete = defineTool({
  name: "project_delete",
  description: "Delete an existing project workspace cleanly from projects/<slug>/.",
  input: z.object({
    slug: ProjectSlugSchema,
  }),
  output: z.object({
    ok: z.boolean(),
    slug: z.string(),
  }),
  async run({ slug }, ctx) {
    try {
      const deleted = await ctx.projects.delete(slug);
      if (!deleted) {
        fail("not_found", `No existe el proyecto «${slug}»`, "slug");
      }
      return { ok: true, slug };
    } catch (error) {
      if (error instanceof Error && error.message.includes("No existe el proyecto")) {
        fail("not_found", error.message, "slug");
      }
      fail("delete_failed", String(error instanceof Error ? error.message : error), "slug");
    }
  },
});
