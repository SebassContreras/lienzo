/**
 * The tool registry (A20, 007/D1): every operation outside the editor is one tool with a
 * `snake_case` name, an English description for the model, Zod input and output, and
 * `run(input, ctx)`. The CLI (008) and the MCP server (009) only list and call these.
 */
import type { z } from "zod";
import { ignoredFields, ignoredNotice } from "../model/ignored.ts";
import type { Ctx } from "./ctx.ts";

/** One problem with an input: the path it is at and what is wrong. */
export type Problem = { path: string; message: string };

/**
 * What a failed call reports: `path` names the failing input or scene path ("" for none);
 * `errors`, when a check found several problems, lists each one (074/D9).
 */
export type ToolError = {
  code: string;
  message: string;
  path: string;
  errors?: Problem[];
};

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

const line = ({ path, message }: Problem) =>
  path ? `${path}: ${message}` : message;

/** Fails with every problem in `problems` (at least one): the first one's path, all listed. */
export function failAll(code: string, problems: readonly Problem[]): never {
  const [first] = problems;
  throw new ToolFailure({
    code,
    message: problems.map(line).join("\n"),
    path: first?.path ?? "",
    errors: [...problems],
  });
}

/** The problems `check` fails with, or none: each ToolFailure becomes its `errors` (or itself). */
export function problemsOf(check: () => void):
  | {
      code: string;
      problems: Problem[];
    }
  | undefined {
  try {
    check();
    return undefined;
  } catch (error) {
    if (!(error instanceof ToolFailure)) throw error;
    const { code, path, message, errors } = error.error;
    return { code, problems: errors ?? [{ path, message }] };
  }
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
 * The input keys the schema dropped, put first in the output's `notices` when its schema has
 * them, even if this call had none, so a misspelled field is never lost silently (063/D5, 067/D3).
 */
function withIgnored(
  tool: Tool,
  value: unknown,
  input: unknown,
  parsed: unknown,
): unknown {
  const shape = (tool.output as { shape?: Record<string, unknown> }).shape;
  if (!shape || !("notices" in shape)) return value;
  const ignored = ignoredFields(input, parsed).map(ignoredNotice);
  if (ignored.length === 0) return value;
  const notices = (value as { notices?: string[] }).notices ?? [];
  return { ...(value as object), notices: [...ignored, ...notices] };
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
    return { ok: true, value: withIgnored(tool, value, input, parsed.data) };
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
