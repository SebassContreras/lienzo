/**
 * The tool registry (A20, 007/D1): every operation outside the editor is one tool with a
 * `snake_case` name, an English description for the model, Zod input and output, and
 * `run(input, ctx)`. The CLI (008) and the MCP server (009) only list and call these.
 */

import type { z } from "zod";
import { idPath } from "../model/id-path.ts";
import { ignoredFields, ignoredNotice } from "../model/ignored.ts";
import { flatIssues } from "../model/zod-issues.ts";
import { setSpanishLocale } from "../model/zod-locale.ts";
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

/**
 * `error` with every path renamed by `rename` (078/D4): its `path`, each of its `errors` and
 * the message lines built from them, so a caller re-roots a failure at its own input
 * (`compact.…`, `patch.…`) the same way everywhere.
 */
export function remapFailure(
  error: ToolError,
  rename: (path: string) => string,
): ToolError {
  if (!error.errors) return { ...error, path: rename(error.path) };
  const errors = error.errors.map((p) => ({
    path: rename(p.path),
    message: p.message,
  }));
  return {
    code: error.code,
    message: errors.map(line).join("\n"),
    path: errors[0]?.path ?? "",
    errors,
  };
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
/** `param.rest` with `rest` named as `idPath` names it inside the parameter's value. */
function byId(input: unknown, path: string): string {
  const [param, ...rest] = path.split(".");
  if (!param || rest.length === 0) return path;
  const value = (input as Record<string, unknown> | undefined)?.[param];
  return `${param}.${idPath(value, rest.join("."))}`;
}

function withIgnored(
  tool: Tool,
  value: unknown,
  input: unknown,
  parsed: unknown,
): unknown {
  const shape = (tool.output as { shape?: Record<string, unknown> }).shape;
  if (!shape || !("notices" in shape)) return value;
  // an element named as errors name it, by the id the input gave (080/D6)
  const ignored = ignoredFields(input, parsed).map((f) =>
    ignoredNotice({ ...f, path: byId(input, f.path) }),
  );
  if (ignored.length === 0) return value;
  const notices = (value as { notices?: string[] }).notices ?? [];
  return { ...(value as object), notices: [...ignored, ...notices] };
}

const quoted = (keys: readonly string[]) =>
  keys.map((k) => `«${k}»`).join(", ");

/**
 * Where the keys of a failing `input` belong (076/D2): top-level keys the tool does not take,
 * and, when an object parameter is missing, the guess that they go inside it. Empty when
 * every key is the tool's.
 */
export function misplacedHint(
  tool: Pick<Tool, "name" | "input">,
  input: unknown,
  issues: readonly z.core.$ZodIssue[],
): string {
  const shape = (tool.input as { shape?: Record<string, unknown> }).shape;
  if (!shape || typeof input !== "object" || input === null) return "";
  const given = input as Record<string, unknown>;
  const foreign = Object.keys(given).filter((k) => !(k in shape));
  if (foreign.length === 0) return "";
  const missing = issues
    .filter(
      (i) =>
        i.code === "invalid_type" &&
        i.expected === "object" &&
        i.path.length === 1 &&
        given[String(i.path[0])] === undefined,
    )
    .map((i) => String(i.path[0]));
  const verb = foreign.length > 1 ? "no son parámetros" : "no es un parámetro";
  return missing.length > 0
    ? `${quoted(foreign)} ${verb} de ${tool.name}: ¿van dentro de ${quoted(missing)}?`
    : `${quoted(foreign)} ${verb} de ${tool.name} (parámetros: ${quoted(Object.keys(shape))})`;
}

const JSON_TYPES = new Set(["object", "record", "array"]);

/**
 * `input` with each top-level argument that should be an object or array but came as a string
 * holding one (`patch: "{\"w\": 1}"`) parsed (078/D9): several MCP clients send object
 * arguments that way. Anything else stays as given, and the result is parsed by the schema
 * again, so it is never looser than one parse of the real value.
 */
export function jsonArgs(
  input: unknown,
  issues: readonly z.core.$ZodIssue[],
): unknown {
  if (typeof input !== "object" || input === null) return input;
  const given = input as Record<string, unknown>;
  const read: Record<string, unknown> = {};
  for (const i of issues) {
    const key = String(i.path[0]);
    const value = given[key];
    if (
      i.path.length !== 1 ||
      i.code !== "invalid_type" ||
      !JSON_TYPES.has(i.expected) ||
      typeof value !== "string"
    )
      continue;
    try {
      const parsed: unknown = JSON.parse(value);
      const isArray = Array.isArray(parsed);
      const fits = i.expected === "array" ? isArray : !isArray;
      if (fits && typeof parsed === "object" && parsed !== null)
        read[key] = parsed;
    } catch {
      // not JSON: the schema's own error stands
    }
  }
  return Object.keys(read).length > 0 ? { ...given, ...read } : input;
}

/**
 * Runs `tool` on `input`: the input is parsed first, a `ToolFailure` becomes an error result,
 * and the output is parsed so callers only ever see what the schema promises.
 */
async function callTool(
  tool: Tool,
  given: unknown,
  ctx: Ctx,
): Promise<ToolResult<unknown>> {
  setSpanishLocale();
  const first = tool.input.safeParse(given);
  const input = first.success ? given : jsonArgs(given, first.error.issues);
  const parsed = input === given ? first : tool.input.safeParse(input);
  if (!parsed.success) {
    const issues = flatIssues(parsed.error.issues);
    const issue = issues[0];
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: [
          ...issues.map(
            (i) => `${i.path.join(".") || "(entrada)"}: ${i.message}`,
          ),
          misplacedHint(tool, input, issues),
        ]
          .filter(Boolean)
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
