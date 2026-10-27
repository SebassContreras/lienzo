/**
 * Which commit a running MCP server was started from (072/D1). A server runs the code it
 * started with, so after a pull a stale one reports fixed bugs as open; its `instructions`
 * name this commit so a tester can compare it with `git rev-parse --short HEAD`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
};

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
