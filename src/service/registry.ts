/**
 * The tool registry (A20, 007/D1): every operation outside the editor is one tool with a
 * `snake_case` name, an English description for the model, Zod input and output, and
 * `run(input, ctx)`. The CLI (008) and the MCP server (009) only list and call these.
 */
import type { z } from "zod";
import type { Ctx } from "./ctx.ts";

/** What a failed call reports: `path` names the failing input or scene path ("" for none). */
export type ToolError = { code: string; message: string; path: string };

type ToolResult<O> = { ok: true; value: O } | { ok: false; error: ToolError };

export type Tool<
  I extends z.ZodType = z.ZodType,
  O extends z.ZodType = z.ZodType,
> = {
  name: string;
  description: string;
  input: I;
  output: O;
  run(input: z.output<I>, ctx: Ctx): Promise<z.input<O>>;
};

/** Thrown by a tool's `run` to fail with a `ToolError`; `callTool` turns it into a result. */
export class ToolFailure extends Error {
  constructor(readonly error: ToolError) {
    super(error.message);
  }
}

/** Fails the running tool. Messages are Spanish (A16). */
export function fail(code: string, message: string, path = ""): never {
  throw new ToolFailure({ code, message, path });
}

const NAME = /^[a-z]+(_[a-z]+)+$/;

/** A tool, checked to have a noun_verb `snake_case` name. */
export function defineTool<I extends z.ZodType, O extends z.ZodType>(
  tool: Tool<I, O>,
): Tool<I, O> {
  if (!NAME.test(tool.name)) throw new Error(`bad tool name ${tool.name}`);
  return tool;
}

/**
 * Runs `tool` on `input`: the input is parsed first, a `ToolFailure` becomes an error result,
 * and the output is parsed so callers only ever see what the schema promises.
 */
async function callTool(
  tool: Tool,
  input: unknown,
  ctx: Ctx,
): Promise<ToolResult<unknown>> {
  const parsed = tool.input.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: parsed.error.issues
          .map((i) => `${i.path.join(".") || "(entrada)"}: ${i.message}`)
          .join("\n"),
        path: issue?.path.map(String).join(".") ?? "",
      },
    };
  }
  try {
    const value = tool.output.parse(await tool.run(parsed.data, ctx));
    return { ok: true, value };
  } catch (error) {
    if (error instanceof ToolFailure) return { ok: false, error: error.error };
    throw error;
  }
}

export type Registry = {
  /** Every tool, in registration order. */
  readonly tools: readonly Tool[];
  get(name: string): Tool | undefined;
  call(name: string, input: unknown, ctx: Ctx): Promise<ToolResult<unknown>>;
};

/** A registry over `tools`; two tools with one name are a programming error. */
export function createRegistry(tools: readonly Tool[]): Registry {
  const byName = new Map<string, Tool>();
  for (const t of tools) {
    if (byName.has(t.name)) throw new Error(`duplicate tool ${t.name}`);
    byName.set(t.name, t);
  }
  return {
    tools,
    get: (name) => byName.get(name),
    call: async (name, input, ctx) => {
      const tool = byName.get(name);
      if (!tool) {
        return {
          ok: false,
          error: {
            code: "unknown_tool",
            message: `No existe la herramienta «${name}»`,
            path: "",
          },
        };
      }
      return callTool(tool, input, ctx);
    },
  };
}
