import { expect, it } from "vitest";
import { z } from "zod";
import { flatIssues } from "./zod-issues.ts";
import { useSpanish } from "./zod-locale.ts";

const Schema = z.object({
  v: z.union([z.object({ a: z.number() }), z.array(z.string())]),
});

it("flattens a failed union after the locale changed since the first call", () => {
  z.config(z.locales.en());
  flatIssues(Schema.safeParse({ v: 1 }).error?.issues ?? []);
  useSpanish();
  const issues = Schema.safeParse({ v: { a: "x" } }).error?.issues ?? [];
  expect(flatIssues(issues)[0]?.path).toEqual(["v", "a"]);
});

it("answers in Spanish after useSpanish whatever locale was set before", () => {
  z.config(z.locales.en());
  useSpanish();
  expect(z.number().min(1).safeParse(0).error?.issues[0]?.message).toMatch(
    /Demasiado pequeño/,
  );
});
