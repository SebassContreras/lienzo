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

export type StoreReply = { status: number; body: unknown };

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

/**
 * The JSON store behind `/api/presets` and `/api/scenes`, one file per item in `dir`:
 * GET                     -> [{ name, data }]
 * POST   ?name=x          -> writes <slug>.json
 * DELETE ?name=x          -> removes <slug>.json
 * POST   /rename?from=x&to=y -> moves the file; a stored `name` field becomes `y`
 */
export async function handleStore(
  dir: string,
  method: string,
  url: URL,
  body: () => Promise<string>,
): Promise<StoreReply> {
  await mkdir(dir, { recursive: true });
  const rest = url.pathname.replace(/^\/api\/\w+/, "");
  const q = url.searchParams;
  if (method === "GET" && rest === "") {
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
    const items = await Promise.all(
      files.map(async (f) => ({
        name: f.replace(/\.json$/, ""),
        data: JSON.parse(await readFile(join(dir, f), "utf8")),
      })),
    );
    return { status: 200, body: items };
  }
  if (method === "POST" && rest === "") {
    const name = slugify(q.get("name") ?? "untitled");
    const data = JSON.parse(await body());
    await writeFile(
      join(dir, `${name}.json`),
      `${JSON.stringify(data, null, 2)}\n`,
    );
    return { status: 200, body: { name } };
  }
  if (method === "DELETE" && rest === "") {
    const path = fileOf(dir, q.get("name") ?? "");
    if (!(await exists(path)))
      return { status: 404, body: { error: "not found" } };
    await unlink(path);
    return { status: 200, body: {} };
  }
  if (method === "POST" && rest === "/rename") {
    const from = fileOf(dir, q.get("from") ?? "");
    const toName = q.get("to") ?? "";
    const to = fileOf(dir, toName);
    if (!toName.trim()) return { status: 400, body: { error: "empty name" } };
    if (!(await exists(from)))
      return { status: 404, body: { error: "not found" } };
    if (from !== to && (await exists(to))) {
      return { status: 409, body: { error: "name taken" } };
    }
    const data = JSON.parse(await readFile(from, "utf8"));
    if (data && typeof data.name === "string") data.name = toName;
    await writeFile(to, `${JSON.stringify(data, null, 2)}\n`);
    if (from !== to) await unlink(from);
    return { status: 200, body: { name: slugify(toName) } };
  }
  return { status: 405, body: {} };
}
