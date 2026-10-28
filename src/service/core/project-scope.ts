import { ProjectSlugSchema } from "../../model/project.ts";
import type { Ctx, ProjectCtx } from "./ctx.ts";
import { fail } from "./registry.ts";

/** The `project` input of every tool that touches scenes, assets or exports (046/D1). */
export const PROJECT = ProjectSlugSchema.describe(
  "Project id (`project` in project_list); scenes, assets and exports live in projects/<project>/",
);

/**
 * `ctx` scoped to project `slug` (040/D3, 046/D1): its store reads the project's scenes and
 * presets. A project that does not exist fails on `project`; there is no default project.
 */
export async function inProject(ctx: Ctx, slug: string): Promise<ProjectCtx> {
  if (!(await ctx.projects.get(slug)))
    fail("project_not_found", `No existe el proyecto «${slug}»`, "project");
  return {
    ...ctx,
    store: await ctx.projects.projectStore(slug),
    project: slug,
  };
}
