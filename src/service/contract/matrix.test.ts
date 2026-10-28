/**
 * Every shared rule in every writer (082/R6): each rule's broken content goes through each
 * scene writer's adapter and must fail with the rule's message. A cell with no plan needs a
 * stated reason, and a scene writer with no adapter needs one too.
 */
import { afterEach, describe, expect, it } from "vitest";
import { registry } from "../tools/index.ts";
import { type Sandbox, sandbox } from "./harness.ts";
import { RULES } from "./rules.ts";
import { NOT_CARRIED, NOT_WRITERS, WRITERS } from "./writers.ts";

const cells = RULES.flatMap((rule) =>
  WRITERS.map((writer) => ({
    rule,
    writer,
    plan: writer.plan(rule.violation),
  })),
);
const carried = cells.flatMap((c) => (c.plan ? [{ ...c, plan: c.plan }] : []));
const skipped = cells.filter((c) => !c.plan);

let box: Sandbox | undefined;
afterEach(async () => {
  await box?.ctx.dispose?.();
  box = undefined;
});

/** What a call answered: whether it refused the input, and the message it gave. */
function outcome(result: Awaited<ReturnType<typeof registry.call>>) {
  if (!result.ok) return { refused: true, message: result.error.message };
  const verdict = result.value as { valid?: boolean; message?: string };
  if (verdict.valid === false)
    return { refused: true, message: verdict.message ?? "" };
  return { refused: false, message: "" };
}

describe("a rule broken through a writer", () => {
  it.each(carried)(
    "is refused by $writer.id: $rule.id",
    async ({ rule, plan }) => {
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

      expect(outcome(result)).toEqual({
        refused: true,
        message: expect.stringMatching(rule.message),
      });
    },
  );
});

describe("the matrix", () => {
  it.each(skipped)(
    "says why $writer.id does not carry: $rule.id",
    ({ rule, writer }) => {
      expect(NOT_CARRIED[writer.id]?.[rule.id]).toBeTruthy();
    },
  );

  it("has no reason for a cell it runs", () => {
    const stale = carried.filter(
      ({ rule, writer }) => NOT_CARRIED[writer.id]?.[rule.id],
    );

    expect(stale.map(({ rule, writer }) => `${writer.id}: ${rule.id}`)).toEqual(
      [],
    );
  });

  it("names a writer and a rule that exist in every reason", () => {
    const writers = new Set(WRITERS.map((w) => w.id));
    const rules = new Set(RULES.map((r) => r.id));
    const unknown = Object.entries(NOT_CARRIED).flatMap(([writer, byRule]) => [
      ...(writers.has(writer) ? [] : [writer]),
      ...Object.keys(byRule).filter((rule) => !rules.has(rule)),
    ]);

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
});
