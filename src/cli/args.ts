/**
 * Command line arguments to tool input (008/D1): the top-level scalar fields of a tool's Zod
 * input become flags; anything nested goes through `--json`. The tool's own schema still
 * validates the result in `callTool`, so this only shapes the input and never checks it.
 */
import { parseArgs } from "node:util";
import { z } from "zod";
import type { Tool } from "../service/core/registry.ts";

/** One input field as the CLI sees it: a flag when every type it accepts is a scalar. */
export type Field = {
  name: string;
  types: string[];
  required: boolean;
  flag: boolean;
  description?: string;
};

type JsonSchema = {
  type?: string | string[];
  enum?: unknown[];
  anyOf?: JsonSchema[];
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
};

const SCALARS = new Set(["string", "number", "integer", "boolean"]);

/** The JSON types a property accepts; `[]` when it accepts anything (`unknown`). */
function typesOf(schema: JsonSchema): string[] {
  if (schema.anyOf) return [...new Set(schema.anyOf.flatMap(typesOf))];
  if (schema.type) return [schema.type].flat();
  if (schema.enum) return [...new Set(schema.enum.map((v) => typeof v))];
  return [];
}

/** The top-level fields of `tool`'s input, in schema order. */
export function fieldsOf(tool: Tool): Field[] {
  const schema = z.toJSONSchema(tool.input, {
    io: "input",
    unrepresentable: "any",
  }) as JsonSchema;
  const required = new Set(schema.required ?? []);
  return Object.entries(schema.properties ?? {}).map(([name, prop]) => {
    const types = typesOf(prop);
    return {
      name,
      types,
      required: required.has(name),
      flag: types.length > 0 && types.every((t) => SCALARS.has(t)),
      description: prop.description,
    };
  });
}

/** A flag's text as its field's type: a number when the field takes one and it reads as one. */
function coerce(value: string, types: string[]): unknown {
  const numeric = types.includes("number") || types.includes("integer");
  if (numeric && value.trim() !== "" && Number.isFinite(Number(value)))
    return Number(value);
  return value;
}

/** Arguments the CLI cannot read; the message (Spanish, A16) is shown as is. */
export class UsageError extends Error {}

/** `parseArgs`' English errors, said in Spanish (A16). */
function parseError(error: Error & { code?: string }): UsageError {
  const option = error.message.match(/'(-[^']*)'/)?.[1] ?? "";
  switch (error.code) {
    case "ERR_PARSE_ARGS_UNKNOWN_OPTION":
      return new UsageError(`Opción desconocida «${option}»; mira --help`);
    case "ERR_PARSE_ARGS_INVALID_OPTION_VALUE":
      return new UsageError(`Valor no válido para la opción «${option}»`);
    case "ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL":
      return new UsageError(
        "Argumento sin opción; los campos se dan como --campo valor",
      );
    default:
      return new UsageError(error.message);
  }
}

/** Reads `--json`'s source: a file path, or `-` for stdin. */
export type ReadSource = (source: string) => Promise<string>;

/** `--json`'s text: inline, `@file` or `-` (stdin), so no shell has to quote JSON. */
async function jsonText(value: string, read: ReadSource): Promise<string> {
  if (value === "-") return read("-");
  if (!value.startsWith("@")) return value;
  try {
    return await read(value.slice(1));
  } catch {
    throw new UsageError(`--json: no se puede leer «${value.slice(1)}»`);
  }
}

/**
 * The input for `tool` from `args`: `--json` first, then every flag over it. `help` is true
 * when `--help` was given.
 */
export async function inputOf(
  tool: Tool,
  args: string[],
  read: ReadSource,
): Promise<{ input: Record<string, unknown>; help: boolean }> {
  const fields = fieldsOf(tool).filter((f) => f.flag);
  const options: Record<
    string,
    { type: "string" | "boolean"; short?: string }
  > = {
    json: { type: "string" },
    help: { type: "boolean", short: "h" },
  };
  for (const f of fields)
    options[f.name] = {
      type: f.types.every((t) => t === "boolean") ? "boolean" : "string",
    };

  let values: Record<string, string | boolean | undefined>;
  try {
    ({ values } = parseArgs({ args, options, strict: true }));
  } catch (error) {
    throw parseError(error as Error);
  }
  if (values.help) return { input: {}, help: true };

  let input: Record<string, unknown> = {};
  if (typeof values.json === "string") {
    const text = await jsonText(values.json, read);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new UsageError(
        `--json: JSON no válido (${(error as Error).message})`,
      );
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      throw new UsageError("--json: se esperaba un objeto JSON");
    input = parsed as Record<string, unknown>;
  }
  for (const f of fields) {
    const v = values[f.name];
    if (v !== undefined)
      input[f.name] = typeof v === "string" ? coerce(v, f.types) : v;
  }
  return { input, help: false };
}
