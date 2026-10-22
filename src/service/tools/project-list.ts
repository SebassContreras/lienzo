import { z } from "zod";
import { defineTool } from "../registry.ts";

export const ProjectSummarySchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  palettePrimary: z.string(),
  updatedAt: z.string().optional(),
});

export const projectList = defineTool({
  name: "project_list",
  description:
    "List all existing project workspaces with summary brand metadata.",
  input: z.object({}),
  output: z.array(ProjectSummarySchema),
  async run(_input, ctx) {
    return ctx.projects.list();
  },
});
