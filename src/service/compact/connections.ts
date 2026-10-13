/**
 * Line connections resolution for compact scenes (011/D4, T005).
 * Resolves `from` and `to` target ids into line element endpoint attachments.
 */

import type { LineEl } from "../../components/line/descriptor.ts";
import type { Element } from "../../model/model.ts";

export function resolveLineConnections(elements: Element[]): void {
  for (const el of elements) {
    if (el.kind === "line") {
      const lineEl = el as LineEl & { from?: string; to?: string };
      if (lineEl.from) {
        lineEl.a = {
          ...lineEl.a,
          attach: lineEl.from,
        };
        delete lineEl.from;
      }
      if (lineEl.to) {
        lineEl.b = {
          ...lineEl.b,
          attach: lineEl.to,
        };
        delete lineEl.to;
      }
    }
  }
}
