import { expect, it } from "vitest";
import { createElement } from "../../components/index.ts";
import { patchNotices } from "../elements.ts";

it("notes unknown keys and an id or kind that does not change (069/D7)", () => {
  const el = { ...createElement("rect"), id: "r" };
  const notices = patchNotices(el, { kind: "text", id: "r", foo: 1, w: 10 });
  expect(notices).toHaveLength(2);
  expect(notices[0]).toContain("«kind»");
  expect(notices[1]).toContain("patch.foo");
});
