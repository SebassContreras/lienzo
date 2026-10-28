/**
 * Every shared rule in every writer (082/R6): each rule's broken content goes through each
 * scene writer's adapter and must be refused, or accepted with a notice, as the rule says,
 * with the rule's message. A cell the writer handles but cannot carry needs a stated reason,
 * and a scene writer with no adapter needs one too.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { registry } from "../tools/index.ts";
import { type Sandbox, sandbox } from "./harness.ts";
import { RULES } from "./rules.ts";
import { cellKey, NOT_CARRIED, NOT_WRITERS, WRITERS } from "./writers.ts";

// a sandbox copies the built-in presets; the first one of a run is slow on a busy machine
vi.setConfig({ testTimeout: 30_000 });

const cells = RULES.flatMap((rule) =>
  rule.violations.flatMap((violation) =>
    WRITERS.filter((writer) =>
      writer.handles.some((content) => violation[content] !== undefined),
    ).map((writer) => ({
      rule,
      violation,
      writer,
      cell: `${rule.id} — ${violation.label}`,
      plan: writer.plan(violation),
    })),
  ),
);
const carried = cells.flatMap((c) =>
  c.plan
    ? [[`${c.writer.id} answers: ${c.cell}`, { ...c, plan: c.plan }] as const]
    : [],
);
const dropped = cells
  .filter((c) => !c.plan)
  .map((c) => [`${c.writer.id} cannot carry: ${c.cell}`, c] as const);

let box: Sandbox | undefined;
afterEach(async () => {
  await box?.ctx.dispose?.();
  box = undefined;
});

/** What a call answered: whether it refused the input, its message and its notices. */
function outcome(result: Awaited<ReturnType<typeof registry.call>>) {
  if (!result.ok)
    return { refused: true, message: result.error.message, notices: "" };
  const value = result.value as {
    valid?: boolean;
    message?: string;
    notices?: string[];
  };
  return {
    refused: value.valid === false,
    message: value.message ?? "",
    notices: (value.notices ?? []).join("\n"),
  };
}

describe("a rule broken through a writer", () => {
  it.each(carried)("%s", async (_title, { rule, plan }) => {
    box = await sandbox();
    for (const step of plan.arrange) {
      const set = await registry.call(
        step.tool,
        { project: "p", ...step.input },
        box.ctx,
      );
      expect(set, `setting up with ${step.tool}`).toMatchObject({ ok: true });
    }

    const result = await registry.call(
      plan.call.tool,
      { project: "p", ...plan.call.input },
      box.ctx,
    );

    const answer = outcome(result);
    expect(answer.refused, JSON.stringify(result)).toBe(
      rule.outcome === "refused",
    );
    expect(
      rule.outcome === "refused" ? answer.message : answer.notices,
    ).toMatch(rule.message);
  });
});

describe("the matrix", () => {
  it.each(dropped)("says why %s", (_title, { rule, violation, writer }) => {
    expect(NOT_CARRIED[writer.id]?.[cellKey(rule, violation)]).toBeTruthy();
  });

  it("has no reason for a cell it runs", () => {
    const stale = carried
      .map(([, cell]) => cell)
      .filter(
        ({ rule, violation, writer }) =>
          NOT_CARRIED[writer.id]?.[cellKey(rule, violation)],
      );

    expect(stale.map(({ writer, cell }) => `${writer.id}: ${cell}`)).toEqual(
      [],
    );
  });

  it("names a writer and a cell that exist in every reason", () => {
    const writers = new Set(WRITERS.map((w) => w.id));
    const known = new Set(cells.map((c) => `${c.writer.id}|${c.cell}`));
    const unknown = Object.entries(NOT_CARRIED).flatMap(([writer, byCell]) =>
      Object.keys(byCell)
        .filter(
          (cell) => !writers.has(writer) || !known.has(`${writer}|${cell}`),
        )
        .map((cell) => `${writer}: ${cell}`),
    );

    expect(unknown).toEqual([]);
  });

  it("knows every tool that saves a scene, as a writer or with a reason", () => {
    const writerTools = new Set(WRITERS.map((w) => w.tool));
    const unknown = registry.tools
      .filter((tool) => tool.effects.includes("scene"))
      .map((tool) => tool.name)
      .filter((name) => !writerTools.has(name) && !NOT_WRITERS[name]);

    expect(unknown).toEqual([]);
  });

  it("keeps no reason for a tool that is a writer or that does not exist", () => {
    const writerTools = new Set(WRITERS.map((w) => w.tool));
    const names = new Set(registry.tools.map((tool) => tool.name));
    const stale = Object.keys(NOT_WRITERS).filter(
      (name) => writerTools.has(name) || !names.has(name),
    );

    expect(stale).toEqual([]);
  });

  it("gives every rule at least one writer", () => {
    const unrun = RULES.flatMap((rule) =>
      rule.violations
        .filter((v) => !cells.some((c) => c.violation === v))
        .map((v) => `${rule.id} — ${v.label}`),
    );

    expect(unrun).toEqual([]);
  });
});
