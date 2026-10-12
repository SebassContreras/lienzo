/** Help text generated from the registry (008/D2): the tool list, and each tool's fields. */
import type { Registry, Tool } from "../service/registry.ts";
import { type Field, fieldsOf } from "./args.ts";

const JSON_ARG = "[--json '<object>' | --json @file | --json -]";

/** Every tool with the first sentence of its description. */
export function registryHelp(registry: Registry): string {
  const width = Math.max(...registry.tools.map((t) => t.name.length));
  return [
    `Usage: pnpm lienzo <tool> [--<field> <value> ...] ${JSON_ARG}`,
    "",
    "Tools:",
    ...registry.tools.map(
      (t) =>
        `  ${t.name.padEnd(width)}  ${t.description.split(/(?<=\.)\s+(?=[A-Z])/)[0]}`,
    ),
    "",
    "Run `pnpm lienzo <tool> --help` for a tool's fields.",
  ].join("\n");
}

function fieldLine(f: Field, prefix: string): string {
  const type = f.types.length ? f.types.join(" | ") : "any";
  const notes = [f.required ? "required" : "", f.description ?? ""]
    .filter(Boolean)
    .join(", ");
  return `  ${prefix}${f.name} <${type}>${notes ? `  ${notes}` : ""}`;
}

/** One tool: its description and every field; fields that are not scalars go in `--json`. */
export function toolHelp(tool: Tool): string {
  const fields = fieldsOf(tool);
  const flags = fields.filter((f) => f.flag);
  const nested = fields.filter((f) => !f.flag);
  return [
    `Usage: pnpm lienzo ${tool.name} [flags] ${JSON_ARG}`,
    "",
    tool.description,
    "",
    "Flags:",
    ...(flags.length ? flags.map((f) => fieldLine(f, "--")) : ["  (none)"]),
    ...(nested.length
      ? ["", "Only in --json:", ...nested.map((f) => fieldLine(f, ""))]
      : []),
    "",
    "Flags override the same field in --json. The result is JSON on stdout.",
  ].join("\n");
}
