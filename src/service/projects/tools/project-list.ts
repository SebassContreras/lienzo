import { z } from "zod";
import { defineTool } from "../../core/registry.ts";
import { asToolProject } from "../project-result.ts";

const ProjectSummarySchema = z.object({
  project: z.string(),
  name: z.string(),
  description: z.string().optional(),
  palettePrimary: z.string(),
  updatedAt: z.string().optional(),
});

export const projectList = defineTool({
  name: "project_list",
  effects: [],
  description:
    "List all existing project workspaces with summary brand metadata.",
  input: z.object({}),
  output: z.array(ProjectSummarySchema),
  async run(_input, ctx) {
    return (await ctx.projects.list()).map(asToolProject);
  },
});
