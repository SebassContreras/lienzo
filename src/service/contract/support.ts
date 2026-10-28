/**
 * What a tool's own tests start from (082/D10): the project `p` with scene `s` (a shot `s1` and a
 * rect `r`) in a temp dir, new for each test, and the calls and matchers those tests share.
 */
import { beforeEach, expect } from "vitest";
import type { Ctx } from "../core/ctx.ts";
import { registry } from "../tools/index.ts";
import { sandbox } from "./harness.ts";

/** Registers the per-test setup in the calling file and returns what its tests use. */
export function toolSuite() {
  let current: Ctx;
  const call = (name: string, input: Record<string, unknown>) =>
    registry.call(name, { project: "p", ...input }, current);

  beforeEach(async () => {
    current = (await sandbox()).ctx;
    await call("shot_set", { scene: "s", id: "s1", start: 0, end: 2 });
    await call("element_add", {
      scene: "s",
      kind: "rect",
      patch: { id: "r" },
    });
  });

  return { call, ctx: () => current };
}

/** A call that fails with a message matching `message`. */
export const fails = (message: RegExp) => ({
  ok: false,
  error: { message: expect.stringMatching(message) },
});

/** A validator's answer: a result that says the scene is not valid, with a message. */
export const invalid = (message: RegExp) => ({
  ok: true,
  value: { valid: false, message: expect.stringMatching(message) },
});
