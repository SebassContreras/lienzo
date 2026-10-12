/**
 * Plain `fs` operations on a folder of JSON files, one item per `<slug>.json` (007/D2). The
 * Vite middleware (`json-store.ts`) and the service store (`src/service/store.ts`) both use
 * them, so the editor and the tools read and write files the same way.
 */
import {
  access,
  mkdir,
  readdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { slugify } from "./slug.ts";

export type JsonItem = { name: string; data: unknown };

/** Why a rename was refused. */
export type RenameError = "empty name" | "not found" | "name taken";

const fileOf = (dir: string, name: string) =>
  join(dir, `${slugify(name)}.json`);

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const write = (path: string, data: unknown) =>
  writeFile(path, `${JSON.stringify(data, null, 2)}\n`);

/** Every `.json` file in `dir` (created when missing), by file name without extension. */
export async function listJson(dir: string): Promise<JsonItem[]> {
  await mkdir(dir, { recursive: true });
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  return Promise.all(
    files.map(async (f) => ({
      name: f.replace(/\.json$/, ""),
      data: JSON.parse(await readFile(join(dir, f), "utf8")),
    })),
  );
}

/** The item stored under `name`'s slug, or undefined when there is none. */
export async function readJson(
  dir: string,
  name: string,
): Promise<unknown | undefined> {
  const path = fileOf(dir, name);
  if (!(await exists(path))) return undefined;
  return JSON.parse(await readFile(path, "utf8"));
}

/** Writes `data` to `<slug of name>.json` and returns the slug. */
export async function writeJson(
  dir: string,
  name: string,
  data: unknown,
): Promise<string> {
  await mkdir(dir, { recursive: true });
  const slug = slugify(name);
  await write(join(dir, `${slug}.json`), data);
  return slug;
}

/** Removes `name`'s file; false when there was none. */
export async function removeJson(dir: string, name: string): Promise<boolean> {
  const path = fileOf(dir, name);
  if (!(await exists(path))) return false;
  await unlink(path);
  return true;
}

/** Moves `from`'s file to `to`'s slug; a stored `name` field becomes `to`. */
export async function renameJson(
  dir: string,
  from: string,
  to: string,
): Promise<{ name: string } | { error: RenameError }> {
  if (!to.trim()) return { error: "empty name" };
  const source = fileOf(dir, from);
  const target = fileOf(dir, to);
  if (!(await exists(source))) return { error: "not found" };
  if (source !== target && (await exists(target))) {
    return { error: "name taken" };
  }
  const data = JSON.parse(await readFile(source, "utf8"));
  if (data && typeof data.name === "string") data.name = to;
  await write(target, data);
  if (source !== target) await unlink(source);
  return { name: slugify(to) };
}
