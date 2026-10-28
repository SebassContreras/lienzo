/**
 * What an input means beyond the keys it writes (068/D2), applied to an element built from
 * a kind's defaults once the input is merged in: a fill given only a color is flat, and a
 * group sized by hand lays its children out in its own pixels, and an icon sized by hand
 * pads its tile in proportion to its size.
 */
import type { Element } from "../../model/model.ts";

type Obj = Record<string, unknown>;

const GRADIENT_KEYS = ["gradient", "color2", "type", "stops"];

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Turns off `gradient` in every fill of `target` whose `input` sets a color and nothing of a gradient. */
function flatFills(target: Obj, input: Obj): void {
  for (const [key, value] of Object.entries(input)) {
    const into = target[key];
    if (!isObj(value) || !isObj(into)) continue;
    if (
      typeof into.gradient === "boolean" &&
      "color" in value &&
      !GRADIENT_KEYS.some((k) => k in value)
    )
      into.gradient = false;
    flatFills(into, value);
  }
}

/** The padding of the default 120 px icon, 28 px, as a share of its shorter side (080/D18). */
const ICON_PADDING = 28 / 120;

export function applyImplied(el: Element, input: Obj): void {
  flatFills(el as unknown as Obj, input);
  if (
    el.kind === "icon" &&
    ("w" in input || "h" in input) &&
    !(isObj(input.tile) && "padding" in input.tile)
  )
    el.tile.padding = Math.round(Math.min(el.w, el.h) * ICON_PADDING);
  if (el.kind === "group") {
    if (!("cw" in input) && "w" in input) el.cw = el.w;
    if (!("ch" in input) && "h" in input) el.ch = el.h;
  }
}
