import { describe, expect, it } from "vitest";
import { slugify } from "./slug.ts";

describe("slugify", () => {
  it("keeps names safe as file names", () => {
    expect(slugify("../../etc/passwd")).toBe("etc-passwd");
    expect(slugify("mi_preset-2")).toBe("mi_preset-2");
  });

  it("folds accented letters instead of dropping them", () => {
    expect(slugify("Caja Ámbar")).toBe("caja-ambar");
  });

  it("never returns an empty name", () => {
    expect(slugify("!!!")).toBe("untitled");
  });
});
