/**
 * Rename and delete for a project's JSON folders (scenes, presets), over the same
 * `json-fs.ts` operations the editor's tabs reach through the dev server (062/D10).
 */
import { removeJson, renameJson } from "../presets/json-fs.ts";
import type { ProjectCtx } from "./ctx.ts";
import { fail } from "./registry.ts";

export type ProjectFolder = "scenes" | "presets";

export const folderOf = (ctx: ProjectCtx, folder: ProjectFolder): string =>
  ctx.projects.resolvePath(ctx.project, folder);

const RENAME_ERRORS = {
  "empty name": ["invalid_name", "El nombre nuevo está vacío", "to"],
  "not found": ["not_found", "No existe", "from"],
  "name taken": ["exists", "Ya existe", "to"],
} as const;

/** Renames `from` to `to` in `folder` and returns the new slug. */
export async function renameIn(
  ctx: ProjectCtx,
  folder: ProjectFolder,
  from: string,
  to: string,
): Promise<string> {
  const r = await renameJson(folderOf(ctx, folder), from, to);
  if ("error" in r) {
    const [code, message, path] = RENAME_ERRORS[r.error];
    fail(code, `${message} «${path === "from" ? from : to}»`, path);
  }
  return r.name;
}

/** Deletes `name` from `folder`; fails when it is not there. */
export async function removeIn(
  ctx: ProjectCtx,
  folder: ProjectFolder,
  name: string,
): Promise<void> {
  if (!(await removeJson(folderOf(ctx, folder), name)))
    fail("not_found", `No existe «${name}»`, "name");
}
