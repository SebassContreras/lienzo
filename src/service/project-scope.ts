import type { Ctx } from "./ctx.ts";
import { fail } from "./registry.ts";
import type { Store } from "./store.ts";

export const DEFAULT_PROJECT_SLUG = "mi-proyecto";

export interface ResolvedProjectScope {
  slug: string;
  store: Store;
  effectiveCtx: Ctx;
}

/**
 * Resolves the target project scope (D3, R3).
 * Falls back to DEFAULT_PROJECT_SLUG ("mi-proyecto") when no project is specified.
 * Ensures the target project exists on disk, returning an effective Ctx with a scoped Store.
 */
export async function resolveProjectScope(
  ctx: Ctx,
  project?: string,
): Promise<ResolvedProjectScope> {
  const slug =
    project && project.trim().length > 0
      ? project.trim()
      : DEFAULT_PROJECT_SLUG;

  if (!ctx.projects) {
    return {
      slug,
      store: ctx.store,
      effectiveCtx: ctx,
    };
  }

  let projectDetails = await ctx.projects.get(slug);

  if (!projectDetails && slug === DEFAULT_PROJECT_SLUG) {
    try {
      await ctx.projects.create(DEFAULT_PROJECT_SLUG, {
        name: "Mi Proyecto",
        description: "Espacio de trabajo principal y predeterminado",
        palette: {
          primary: "#3B82F6",
          custom: [],
          background: "#0B0F19",
          surface: "#1E293B",
          text: "#F8FAFC",
          accent: "#F59E0B",
        },
        canvas: {
          width: 1080,
          height: 1080,
          fps: 30,
          duration: 4,
        },
        fonts: [],
      });
      projectDetails = await ctx.projects.get(slug);
    } catch {
      // Ignore if concurrent creation
    }
  }

  if (!projectDetails) {
    fail("project_not_found", `No existe el proyecto «${slug}»`, "project");
  }

  const store = await ctx.projects.projectStore(slug);
  const effectiveCtx: Ctx = {
    ...ctx,
    store,
  };

  return {
    slug,
    store,
    effectiveCtx,
  };
}
