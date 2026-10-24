/**
 * Writing a rendered file into the project's exports/ (046/D2, 058/D6): the one place that
 * keeps `out` inside `projects/<slug>/exports/` and gives it the real format's extension.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import type { ProjectCtx } from "./ctx.ts";
import { fail } from "./registry.ts";

/** Writes `bytes` to `out` (default `<name>.<ext>`) inside exports/ and returns its path. */
export async function writeExport(
  ctx: ProjectCtx,
  out: string,
  bytes: Uint8Array,
  ext: string,
): Promise<string> {
  const exportsDir = join(ctx.root, "projects", ctx.project, "exports");
  const target = resolve(exportsDir, out).replace(/\.\w+$/, `.${ext}`);
  const inside = relative(exportsDir, target);
  if (!inside || inside.startsWith("..") || isAbsolute(inside))
    fail(
      "out_of_project",
      `«${out}» queda fuera de projects/${ctx.project}/exports/`,
      "out",
    );
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return target;
}
