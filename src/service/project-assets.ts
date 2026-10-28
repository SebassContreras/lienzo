/**
 * Renaming and deleting project assets (063/D6), shared by the `asset_rename` and
 * `asset_delete` tools and the editor's assets tab, so both keep scenes in step the same way.
 */
import { mkdir, rename, rm, stat } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { normalizeExtension } from "./asset-helpers.ts";
import { safeAssetPath } from "./asset-path.ts";
import { renameAssetRefs, usesAsset } from "./asset-refs.ts";
import type { ProjectStore } from "./project-store.ts";
import { fail } from "./registry.ts";

const exists = (path: string) =>
  stat(path).then(
    () => true,
    () => false,
  );

/** `path` as a safe path under `assets/`, or a failure naming `field`. */
function checked(path: string, field: string): string {
  const safe = safeAssetPath(path.split("/"));
  if (safe === undefined)
    fail("invalid_path", `Ruta no válida «${path}»`, field);
  return safe;
}

/** The scenes of project `slug` that reference the asset at `path`, by name. */
export async function assetUsers(
  projects: ProjectStore,
  slug: string,
  path: string,
): Promise<string[]> {
  const scenes = await (await projects.projectStore(slug)).scenes();
  return scenes.filter((s) => usesAsset(s.data, path)).map((s) => s.name);
}

/**
 * Moves asset `from` to `to` (subfolders allowed) and rewrites every scene that references
 * it. Scenes are written first and the file moves last, so rerunning after a crash finishes
 * the job instead of leaving references split.
 */
export async function renameAsset(
  projects: ProjectStore,
  slug: string,
  from: string,
  to: string,
): Promise<{ path: string; scenes: string[] }> {
  const src = checked(from, "from");
  const dst = checked(to, "to");
  if (normalizeExtension(extname(src)) !== normalizeExtension(extname(dst)))
    fail(
      "asset_type_changed",
      `«${dst}» cambia el tipo de «${src}» (${extname(src) || "sin extensión"}); conserva la extensión`,
      "to",
    );
  const base = projects.resolvePath(slug, "assets");
  if (await exists(join(base, dst)))
    fail("exists", `Ya existe el recurso «${dst}»`, "to");
  const fileThere = await exists(join(base, src));
  const store = await projects.projectStore(slug);
  const changed: string[] = [];
  for (const scene of await store.scenes()) {
    if (!usesAsset(scene.data, src)) continue;
    await store.writeScene(scene.name, renameAssetRefs(scene.data, src, dst));
    changed.push(scene.name);
  }
  if (!fileThere && changed.length === 0)
    fail("not_found", `No existe el recurso «${src}»`, "from");
  if (fileThere) {
    await mkdir(dirname(join(base, dst)), { recursive: true });
    await rename(join(base, src), join(base, dst));
  }
  return { path: dst, scenes: changed };
}

/** Deletes asset `path`; while a scene references it, refuses unless `force` is set. */
export async function deleteAsset(
  projects: ProjectStore,
  slug: string,
  path: string,
  force = false,
): Promise<{ path: string; usedBy: string[] }> {
  const safe = checked(path, "path");
  const file = join(projects.resolvePath(slug, "assets"), safe);
  if (!(await exists(file)))
    fail("not_found", `No existe el recurso «${safe}»`, "path");
  const usedBy = await assetUsers(projects, slug, safe);
  if (usedBy.length > 0 && !force)
    fail("in_use", `«${safe}» se usa en: ${usedBy.join(", ")}`, "path");
  await rm(file);
  return { path: safe, usedBy };
}
