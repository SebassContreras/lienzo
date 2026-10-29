/**
 * A notice is said once: a write that leaves content as it was never repeats the notice about
 * it, whatever that content is (an element, one of its tracks, a shot). For each notice rule,
 * the broken content is written, and then writes that do not touch it must stay quiet about it.
 * QA reports kept finding the same repeat one level down (an element, a shot, a track), so the
 * check runs over every notice rule, not over the cases found.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { registry } from "../tools/index.ts";
import { type Sandbox, sandbox } from "./harness.ts";
import { RULES, type Violation } from "./rules.ts";
import { type Call, WRITERS } from "./writers.ts";

vi.setConfig({ testTimeout: 30_000 });

/** The writers that save the scene they write, in the order a violation is given to them. */
const SAVING = ["scene_create", "element_add", "shot_set", "keyframe_set"];

const noticeCases = RULES.filter((rule) => rule.outcome === "notice").flatMap(
  (rule) =>
    rule.violations.flatMap((violation) => {
      const writer = SAVING.map((id) => WRITERS.find((w) => w.id === id)).find(
        (w) =>
          w?.handles.some((content) => violation[content] !== undefined) &&
          w.plan(violation),
      );
      const plan = writer?.plan(violation);
      return plan
        ? [
            [
              `${rule.id} — ${violation.label}`,
              { rule, violation, plan },
            ] as const,
          ]
        : [];
    }),
);

/** The id of the element a violation puts the broken content on, if any. */
const ownerOf = (v: Violation) =>
  v.elements?.at(-1)?.id ?? (v.keyframe ? "k" : undefined);

let box: Sandbox | undefined;
afterEach(async () => {
  await box?.ctx.dispose?.();
  box = undefined;
});

describe("a notice already given", () => {
  it("has a case for every notice rule", () => {
    const covered = new Set(noticeCases.map(([, c]) => c.rule.id));
    const missing = RULES.filter(
      (r) => r.outcome === "notice" && !covered.has(r.id),
    ).map((r) => r.id);
    expect(missing).toEqual([]);
  });

  it.each(noticeCases)(
    "is not repeated by writes that leave it: %s",
    async (_t, c) => {
      box = await sandbox();
      const ctx = box.ctx;
      const run = (call: Call) =>
        registry.call(call.tool, { project: "p", ...call.input }, ctx);
      for (const step of c.plan.arrange)
        expect(await run(step), step.tool).toMatchObject({ ok: true });
      const first = await run(c.plan.call);
      expect(first, "the write that breaks the rule").toMatchObject({
        ok: true,
      });
      const scene = String(c.plan.call.input.scene);

      const owner = ownerOf(c.violation);
      const lastShot = c.violation.shotContent?.at(-1);
      const quiet: Call[] = [
        {
          tool: "element_add",
          input: { scene, kind: "rect", patch: { id: "zz" } },
        },
        {
          tool: "element_update",
          input: { scene, id: "zz", patch: { opacity: 0.9 } },
        },
        {
          tool: "keyframe_set",
          input: { scene, id: "zz", path: "x", t: 0, value: 1 },
        },
        { tool: "background_set", input: { scene, patch: { spotlight: 0.2 } } },
        { tool: "shot_set", input: { scene, id: "zzs", start: 4.2, end: 4.8 } },
        { tool: "scene_update", input: { scene, patch: { fps: 24 } } },
        // the element that holds the broken content, changed in a field that has nothing to do with it
        ...(owner
          ? [
              {
                tool: "element_update",
                input: { scene, id: owner, patch: { opacity: 0.9 } },
              },
              {
                tool: "keyframe_set",
                input: { scene, id: owner, path: "opacity", t: 0, value: 0.5 },
              },
            ]
          : []),
        // the shot that holds it, renamed
        ...(lastShot
          ? [
              {
                tool: "shot_set",
                input: { scene, ...lastShot, name: "otro nombre" },
              },
            ]
          : []),
      ];

      for (const call of quiet) {
        const result = await run(call);
        expect(
          result,
          `${call.tool} ${JSON.stringify(call.input)}`,
        ).toMatchObject({
          ok: true,
        });
        const notices = (
          (result as { value: { notices?: string[] } }).value.notices ?? []
        ).join("\n");
        expect(notices, `${call.tool} repeats a notice`).not.toMatch(
          c.rule.message,
        );
      }
    },
  );
});
