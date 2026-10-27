/**
 * Rename and delete for a project's JSON folders (scenes, presets), over the same
 * `json-fs.ts` operations the editor's tabs reach through the dev server (062/D10).
 */
import { join } from "node:path";
import { removeJson, renameJson } from "../presets/json-fs.ts";
import type { Ctx, ProjectCtx } from "./ctx.ts";
import { inProject } from "./project-scope.ts";
import { fail } from "./registry.ts";

export type ProjectFolder = "scenes" | "presets";

export const folderOf = (ctx: ProjectCtx, folder: ProjectFolder): string =>
  ctx.projects.resolvePath(ctx.project, folder);

const RENAME_ERRORS = {
  "empty name": ["invalid_name", "El nombre nuevo está vacío", "to"],
  "not found": ["not_found", "No existe", "from"],
  "name taken": ["exists", "Ya existe", "to"],
} as const;

/**
 * Where animation presets are written (069/D6): the project's `presets/animations/` when
 * `project` is given, else the global `presets/animations/`.
 */
export async function animationsDir(
  ctx: Ctx,
  project: string | undefined,
): Promise<string> {
  return project
    ? join(folderOf(await inProject(ctx, project), "presets"), "animations")
    : join(ctx.root, "presets", "animations");
}

/** A notice when `given` was stored under another name, `stored` (069/D13). */
export function storedAsNotice(given: string, stored: string): string[] {
  return given === stored
    ? []
    : [
        `Se guardó como «${stored}»: los nombres se guardan en minúsculas, con guiones y sin rutas`,
      ];
}

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
