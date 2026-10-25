/**
 * Projects as tools return them (064/D15): the stored `slug` is named `project`, the name
 * every tool input uses for it.
 */
import { ProjectManifestSchema, ProjectSlugSchema } from "../model/project.ts";

export const ToolProjectSchema = ProjectManifestSchema.omit({
  slug: true,
}).extend({ project: ProjectSlugSchema });

/** `value` with its `slug` key renamed to `project`. */
export function asToolProject<T extends { slug: string }>(
  value: T,
): Omit<T, "slug"> & { project: string } {
  const { slug, ...rest } = value;
  return { project: slug, ...rest };
}
