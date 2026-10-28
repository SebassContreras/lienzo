/**
 * What every tool does with an input that breaks its schema, derived from the schema itself
 * (082/R5): it fails as `invalid_input` at the key that is wrong, in Spanish, lists every wrong
 * key, and leaves the project as it was. And what it does with any input of the right types:
 * it answers, it never throws.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registry } from "../tools/index.ts";
import { type Sandbox, sandbox, snapshot } from "./harness.ts";
import {
  baseInput,
  inputSchemaOf,
  invalidVariants,
  structuredKeys,
} from "./inputs.ts";

const ENGLISH =
  /\b(Invalid input|Invalid option|Expected|Required|Too small|Too big|Unrecognized key|received)\b/;
/** A key the sandbox gives its real project, so the schema's types are met and the call goes on. */
const FIXED = { project: "p" };

const tools = registry.tools.map((tool) => {
  const schema = inputSchemaOf(tool.input);
  const base = baseInput(schema, FIXED);
  return {
    name: tool.name,
    schema,
    base,
    variants: invalidVariants(schema, base),
  };
});

let shared: Sandbox;
beforeAll(async () => {
  shared = await sandbox();
});
afterAll(() => shared.ctx.dispose?.());

describe.each(tools)(
  "$name given an input that breaks its schema",
  ({ name, variants }) => {
    it.each(variants.map((v) => [v.label, v] as const))(
      "fails when %s",
      async (_label, variant) => {
        const before = await snapshot(shared.root);

        const result = await registry.call(name, variant.input, shared.ctx);

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error.code).toBe("invalid_input");
        expect(variant.paths).toContain(result.error.path.split(".")[0]);
        expect(result.error.message).not.toMatch(ENGLISH);
        for (const path of variant.paths)
          expect(result.error.message).toContain(`${path}:`);
        expect(await snapshot(shared.root)).toBe(before);
      },
    );
  },
);

describe.each(tools)(
  "$name given an input of the right types",
  ({ name, base, schema }) => {
    it("answers with a result or a failure of the documented shape, and never throws", async () => {
      const own = await sandbox();

      const result = await registry.call(name, base, own.ctx);
      await own.ctx.dispose?.();

      if (result.ok) return;
      expect(result.error).toEqual({
        code: expect.any(String),
        message: expect.any(String),
        path: expect.any(String),
        ...(result.error.errors ? { errors: expect.any(Array) } : {}),
      });
      expect(result.error.message).not.toMatch(ENGLISH);
    });

    it.each(structuredKeys(schema))(
      "reads %s sent as a JSON string like the object itself",
      async (key) => {
        const [plain, text] = [await sandbox(), await sandbox()];

        const given = await registry.call(name, base, plain.ctx);
        const asString = await registry.call(
          name,
          { ...base, [key]: JSON.stringify(base[key]) },
          text.ctx,
        );
        await Promise.all([plain.ctx.dispose?.(), text.ctx.dispose?.()]);

        expect(asString).toEqual(given);
      },
    );
  },
);
