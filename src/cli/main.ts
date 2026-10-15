/**
 * `pnpm lienzo` (008): a thin adapter over the tool registry (A20) that holds no tool logic.
 * The result is JSON on stdout; an error is JSON `{ code, message, path }` on stderr with
 * exit code 1.
 */
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { text } from "node:stream/consumers";
import { serveStdio } from "../mcp/server.ts";
import { type Ctx, createCtx } from "../service/ctx.ts";
import type { Registry } from "../service/registry.ts";
import { registry } from "../service/tools/index.ts";
import { findAppRoot } from "../service/root.ts";
import { inputOf, type ReadSource, UsageError } from "./args.ts";
import { registryHelp, toolHelp } from "./help.ts";

/** What `run` writes to and reads from; tests pass their own. */
export type Io = {
  stdout(text: string): void;
  stderr(text: string): void;
  /** `--json`'s source: a file path, or `-` for stdin. */
  read: ReadSource;
};

const errorJson = (code: string, message: string) =>
  JSON.stringify({ code, message, path: "" });

/** Runs one command line (the arguments after the script) and returns the exit code. */
export async function run(
  argv: string[],
  io: Io,
  ctx: Ctx,
  tools: Registry = registry,
): Promise<number> {
  const [name, ...args] = argv;
  if (name === undefined || name === "--help" || name === "-h") {
    io.stdout(registryHelp(tools));
    return name === undefined ? 1 : 0;
  }
  if (name === "mcp") {
    // 009/D2: serves until the client closes stdin; the protocol owns stdout from here.
    await serveStdio(tools, ctx);
    return 0;
  }
  const tool = tools.get(name);
  if (!tool) {
    io.stderr(
      errorJson(
        "unknown_tool",
        `No existe la herramienta «${name}»; mira --help`,
      ),
    );
    return 1;
  }
  let input: Record<string, unknown>;
  try {
    const parsed = await inputOf(tool, args, io.read);
    if (parsed.help) {
      io.stdout(toolHelp(tool));
      return 0;
    }
    input = parsed.input;
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    io.stderr(errorJson("usage", error.message));
    return 1;
  }
  const result = await tools.call(name, input, ctx);
  if (!result.ok) {
    io.stderr(JSON.stringify(result.error));
    return 1;
  }
  io.stdout(JSON.stringify(result.value, null, 2));
  return 0;
}

if (import.meta.main) {
  const root = findAppRoot(import.meta.dirname);
  const io: Io = {
    stdout: (t) => process.stdout.write(`${t}\n`),
    stderr: (t) => process.stderr.write(`${t}\n`),
    // pnpm runs scripts from the repo root; INIT_CWD is where the user typed the command.
    read: (source) =>
      source === "-"
        ? text(process.stdin)
        : readFile(resolve(process.env.INIT_CWD ?? ".", source), "utf8"),
  };
  const ctx = createCtx(root);
  try {
    process.exitCode = await run(process.argv.slice(2), io, ctx);
  } catch (error) {
    io.stderr(errorJson("internal", String(error)));
    process.exitCode = 1;
  } finally {
    // 010/D4: a renderer left open would keep this process alive.
    await ctx.dispose();
  }
}
