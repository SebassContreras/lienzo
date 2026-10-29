/**
 * Which code a running MCP server was started from (072/D1). A server runs the code it
 * started with, so after a pull or a rebuild a stale one reports fixed bugs as open; its
 * `instructions` name this build so a tester can compare it with `git rev-parse --short HEAD`
 * and with the time of the last `pnpm build:cli`.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
};

/** Whether `root`'s checkout has uncommitted changes; undefined when git cannot say. */
export function gitDirty(root: string): boolean | undefined {
  try {
    const out = execFileSync("git", ["status", "--porcelain"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.trim().length > 0;
  } catch {
    return undefined;
  }
}

/** `YYYY-MM-DD HH:MM`, local time. */
export function stamp(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
}

/** What the server says about itself: `ef608b8+dirty, built 2026-10-29 13:42` or, from source, `…, source started …`. */
export function buildLabel(root: string): string {
  const built =
    typeof __LIENZO_BUILD__ === "undefined" ? undefined : __LIENZO_BUILD__;
  const commit = built ? built.commit : gitCommit(root);
  const dirty = built ? built.dirty : commit ? gitDirty(root) : undefined;
  const id = `${commit ?? "desconocido"}${dirty ? "+dirty" : ""}`;
  return built
    ? `commit ${id}, built ${built.at}`
    : `commit ${id}, source started ${stamp()}`;
}

/** The short sha `root`'s git checkout is at, or undefined outside a checkout. */
export function gitCommit(root: string): string | undefined {
  const head = read(join(root, ".git", "HEAD"))?.trim();
  if (!head) return undefined;
  const ref = head.startsWith("ref: ") ? head.slice(5) : undefined;
  const sha = !ref
    ? head
    : (read(join(root, ".git", ref))?.trim() ??
      read(join(root, ".git", "packed-refs"))
        ?.split("\n")
        .find((line) => line.endsWith(` ${ref}`))
        ?.split(" ")[0]);
  return sha?.slice(0, 7);
}
