/**
 * The replay corpus (082/D7): every case of a QA report as data, `{ setup, call, expect }`.
 * One runner serves the Vitest suite and `pnpm replay`, which runs it in a fresh process, so a
 * report of a bug that is "still open" is checked against the code at `HEAD`, never against a
 * long-running MCP server that started on an older commit.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Ctx } from "../core/ctx.ts";
import { registry } from "../tools/index.ts";

export type Call = { tool: string; input: Record<string, unknown> };

/** What a case must see. Each field given is checked; a regex is the source of a RegExp. */
export type Expect = {
  /**
   * Whether the tool answers with a result; `false` (an error) unless the case says so. A
   * validator that finds problems answers `ok: true` with `valid: false`.
   */
  ok?: boolean;
  code?: string;
  path?: string;
  /** The error message, or a validator's `message`. */
  message?: string;
  /** For a validator: its `valid`. */
  valid?: boolean;
  /** Each regex must match some notice. */
  notices?: string[];
  /** No notice matches any of these. */
  noNotices?: string[];
  /** At least this many problems listed, one per line of the message. */
  problems?: number;
};

export type Case = {
  id: string;
  /** Where it came from: a report and its number, or a spec. */
  source: string;
  setup?: Call[];
  call: Call;
  expect: Expect;
};

/** Every `corpus/*.json`, in file order. */
export function loadCorpus(dir = join(import.meta.dirname, "corpus")): Case[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .flatMap(
      (file) => JSON.parse(readFileSync(join(dir, file), "utf8")) as Case[],
    );
}

const withProject = (call: Call) => ({ project: "p", ...call.input });

/** Runs one case against `ctx`; the list of what did not hold, empty when it passed. */
export async function runCase(ctx: Ctx, c: Case): Promise<string[]> {
  for (const step of c.setup ?? []) {
    const done = await registry.call(step.tool, withProject(step), ctx);
    if (!done.ok) return [`setup ${step.tool} failed: ${done.error.message}`];
  }
  const result = await registry.call(c.call.tool, withProject(c.call), ctx);
  const want = c.expect;
  const problems: string[] = [];
  const value = result.ok
    ? (result.value as {
        valid?: boolean;
        message?: string;
        notices?: string[];
      })
    : undefined;
  const message = result.ok ? (value?.message ?? "") : result.error.message;
  const notices = value?.notices ?? [];

  if (result.ok !== (want.ok ?? false))
    problems.push(
      result.ok ? "answered with a result" : "answered with an error",
    );
  if (want.code !== undefined && (result.ok || result.error.code !== want.code))
    problems.push(
      `code ${result.ok ? "(none)" : result.error.code}, wanted ${want.code}`,
    );
  if (want.path !== undefined && (result.ok || result.error.path !== want.path))
    problems.push(
      `path ${result.ok ? "(none)" : result.error.path}, wanted ${want.path}`,
    );
  if (want.valid !== undefined && value?.valid !== want.valid)
    problems.push(`valid ${value?.valid}, wanted ${want.valid}`);
  if (want.message !== undefined && !new RegExp(want.message).test(message))
    problems.push(`message «${message}» does not match ${want.message}`);
  for (const re of want.notices ?? [])
    if (!notices.some((n) => new RegExp(re).test(n)))
      problems.push(
        `no notice matches ${re} (notices: ${JSON.stringify(notices)})`,
      );
  for (const re of want.noNotices ?? [])
    if (notices.some((n) => new RegExp(re).test(n)))
      problems.push(`a notice matches ${re}`);
  if (want.problems !== undefined && message.split("\n").length < want.problems)
    problems.push(
      `${message.split("\n").length} problems listed, wanted ${want.problems}`,
    );
  return problems;
}
