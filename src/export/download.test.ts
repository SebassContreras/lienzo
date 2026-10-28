// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { download } from "./download.ts";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("download", () => {
  it("clicks a link to the blob under the file name, then frees the URL", () => {
    vi.useFakeTimers();
    URL.createObjectURL = vi.fn(() => "blob:fake");
    URL.revokeObjectURL = vi.fn();
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this);
    });

    download(new Blob(["x"]), "promo.png");

    expect(clicked).toHaveLength(1);
    expect(clicked[0].href).toBe("blob:fake");
    expect(clicked[0].download).toBe("promo.png");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake");
  });
});
