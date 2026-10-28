/**
 * Writing a rendered file into the project's exports/ (046/D2, 058/D6): the one place that
 * keeps `out` inside `projects/<slug>/exports/` and gives it the real format's extension.
 */
import { mkdir, writeFile } from "node:fs/promises";
import {
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import type { ProjectCtx } from "../core/ctx.ts";
import { fail } from "../core/registry.ts";

/** The notice for a file saved under another extension than `out` asked for (069/R18, 081/D10). */
export const extensionNotice = (
  out: string,
  target: string,
): string | undefined =>
  extname(out).toLowerCase() === extname(target).toLowerCase()
    ? undefined
    : `Se guardó como «${target}»: la extensión sigue al formato real`;

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
