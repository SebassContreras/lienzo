import type { UseEl } from "../components/use/descriptor.ts";
import { instantiateSymbolElements } from "../components/use/draw.ts";
import { animate } from "../engine/animate.ts";
import {
  contrastRatio,
  parseColor,
  relativeLuminance,
  suggestAccessibleColor,
  toHex,
} from "../engine/color.ts";
import { type Box, boxesTouch, boxOf, placeChild } from "../engine/geometry.ts";
import { resolveLine } from "../engine/lines.ts";
import { isElementActiveInShot, shotBox } from "../engine/shots.ts";
import { widthIsEstimated } from "../engine/text-measure.ts";
import type {
  Element,
  GroupEl,
  LineEl,
  Scene,
  TextEl,
} from "../model/model.ts";
import { resolveBackdropUnder } from "./contrast.ts";
import { measureStyleOf } from "./font-check.ts";
import { round2 } from "./round.ts";
import { textExtentsOf } from "./text-extents.ts";

export type LayoutDiagnostic = {
  code:
    | "text_overlap"
    | "shape_overlap"
    | "out_of_bounds"
    | "dangling_attachment"
    | "text_overflow"
    | "low_contrast"
    | "unverifiable_contrast"
    | "missing_symbol"
    | "unknown_shot";
  elementId: string;
  shot?: string;
  t: number;
  message: string;
  ratio?: number;
  required?: number;
  fg?: string;
  bg?: string;
  suggestion?: string;
};

/** Flattened element with its effective placement on canvas coordinates */
export type PlacedElement = {
  el: Element;
  box: Box;
  parentGroup?: GroupEl;
  /** The `use` whose symbol this element is an instance of (080/D11): content it holds. */
  heldBy?: Element;
  alpha: number;
};

/** Whether `item` stands on the canvas itself: not in a group, not inside a `use`. */
const topLevel = (item: PlacedElement) => !item.parentGroup && !item.heldBy;

/**
 * Returns elements placed in canvas space at time `t`.
 * Groups are expanded so their children are positioned relative to the canvas.
 */
function placedElementsAt(scene: Scene, t: number): PlacedElement[] {
  // First, map of all elements animated at time t for line resolution
  const animatedById = new Map<string, Element>();

  function indexAnimated(elements: Element[], parentGroup?: GroupEl) {
    for (const raw of elements) {
      const now = animate(raw, t, scene);
      const placed = parentGroup ? placeChild(now.el, parentGroup) : now.el;
      animatedById.set(placed.id, placed);
      if (placed.kind === "group") {
        indexAnimated(placed.children, placed);
      }
    }
  }
  indexAnimated(scene.elements);

  const result: PlacedElement[] = [];

  /**
   * `view` is where the top-level element holding these ones puts a box on screen (its shot's
   * camera and transition); top-level elements take their own (067/D2).
   */
  function collect(
    elements: Element[],
    parentGroup?: GroupEl,
    parentAlpha = 1,
    parentView?: (box: Box) => Box,
    heldBy?: Element,
  ) {
    for (const raw of elements) {
      const view = parentView ?? ((box: Box) => shotBox(box, raw, scene, t));
      if (raw.hidden) continue;
      if (!isElementActiveInShot(raw, t, scene.shots, scene.duration)) continue;

      // Skip elements that have not yet entered (before in.delay) or have exited (after out.delay + out.duration) (055/R5)
      const anim = raw.anim;
      if (anim) {
        if (
          anim.in &&
          anim.in.kind !== "none" &&
          anim.in.delay > 0 &&
          t < anim.in.delay
        ) {
          continue;
        }
        if (
          anim.out &&
          anim.out.kind !== "none" &&
          t >= anim.out.delay + anim.out.duration
        ) {
          continue;
        }
      }

      const now = animate(raw, t, scene);
      const placed = parentGroup ? placeChild(now.el, parentGroup) : now.el;
      const elOpacity =
        typeof (now.el as unknown as { opacity?: unknown }).opacity === "number"
          ? (now.el as unknown as { opacity: number }).opacity
          : 1;

      // An element explicitly set to opacity: 0 is skipped (055/R5)
      if (elOpacity <= 0) continue;

      const effectiveAlpha =
        parentAlpha * (now.transform.alpha ?? 1) * elOpacity;

      if (effectiveAlpha <= 0 && (!anim || anim.in?.kind === "none")) continue;

      let effectiveBox: Box;
      if (placed.kind === "line") {
        const resolved = resolveLine(placed, animatedById);
        const minX = Math.min(resolved.a.x, resolved.b.x);
        const minY = Math.min(resolved.a.y, resolved.b.y);
        effectiveBox = {
          x: minX + (now.transform.dx ?? 0),
          y: minY + (now.transform.dy ?? 0),
          w: Math.abs(resolved.a.x - resolved.b.x),
          h: Math.abs(resolved.a.y - resolved.b.y),
        };
      } else {
        const baseBox = boxOf(placed);
        const scaleX = now.transform.scale * (now.transform.scaleX ?? 1);
        const scaleY = now.transform.scale * (now.transform.scaleY ?? 1);
        effectiveBox = {
          x: baseBox.x + (now.transform.dx ?? 0),
          y: baseBox.y + (now.transform.dy ?? 0),
          w: baseBox.w * scaleX,
          h: baseBox.h * scaleY,
        };
      }

      result.push({
        el: placed,
        box: view(effectiveBox),
        parentGroup,
        ...(heldBy ? { heldBy } : {}),
        alpha: effectiveAlpha,
      });

      if (raw.kind === "group") {
        collect(raw.children, placed as GroupEl, effectiveAlpha, view, heldBy);
      } else if (raw.kind === "use") {
        const useEl = raw as UseEl;
        const sym = scene.symbols ? scene.symbols[useEl.symbol] : undefined;
        if (sym) {
          const targetW = useEl.w || 1;
          const targetH = useEl.h || 1;
          const scaleX = targetW / (sym.w || targetW);
          const scaleY = targetH / (sym.h || targetH);
          const instances = instantiateSymbolElements(
            sym.children,
            useEl.overrides,
          );
          // Scale and translate instances relative to the use element's box
          const scaledInstances = instances.map((child) => {
            const childBox = boxOf(child);
            return {
              ...child,
              x: effectiveBox.x + childBox.x * scaleX,
              y: effectiveBox.y + childBox.y * scaleY,
              w: childBox.w * scaleX,
              h: childBox.h * scaleY,
            } as Element;
          });
          collect(
            scaledInstances,
            parentGroup,
            effectiveAlpha,
            view,
            heldBy ?? raw,
          );
        }
      }
    }
  }

  collect(scene.elements);
  return withChildBoxes(result);
}

const union = (a: Box, b: Box): Box => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    w: Math.max(a.x + a.w, b.x + b.w) - x,
    h: Math.max(a.y + a.h, b.y + b.h) - y,
  };
};

/**
 * `placed` with each unclipped group's box grown to hold its children where they are at that
 * `t`, so a child animated out of the group still counts for `out_of_bounds` (072/D5). A
 * clipped group draws nothing outside its own box, so it keeps it. Children follow their
 * group in `placed`, so walking backwards grows inner groups before the groups holding them.
 */
function withChildBoxes(placed: PlacedElement[]): PlacedElement[] {
  const boxes = new Map(placed.map((item) => [item.el, item.box]));
  for (const item of [...placed].reverse()) {
    const group = item.parentGroup;
    if (!group || group.clip) continue;
    const own = boxes.get(group);
    const child = boxes.get(item.el);
    if (own && child) boxes.set(group, union(own, child));
  }
  return placed.map((item) => ({
    ...item,
    box: boxes.get(item.el) ?? item.box,
  }));
}

/**
 * Checks a line element for attachments to nonexistent IDs at time `t`.
 */
function checkAttachments(
  line: LineEl,
  t: number,
  allIds: Set<string>,
): LayoutDiagnostic[] {
  const diagnostics: LayoutDiagnostic[] = [];
  if (line.a.attach && !allIds.has(line.a.attach)) {
    diagnostics.push({
      code: "dangling_attachment",
      elementId: line.id,
      t,
      message: `El extremo inicial está conectado al id inexistente «${line.a.attach}»`,
    });
  }
  if (line.b.attach && !allIds.has(line.b.attach)) {
    diagnostics.push({
      code: "dangling_attachment",
      elementId: line.id,
      t,
      message: `El extremo final está conectado al id inexistente «${line.b.attach}»`,
    });
  }
  return diagnostics;
}

/**
 * Checks if a box exceeds the scene bounds at time `t`.
 */
function checkOutOfBounds(
  id: string,
  box: Box,
  scene: Scene,
  t: number,
): LayoutDiagnostic | undefined {
  const tol = 0.5; // pixel tolerance for floating point calculations
  if (
    box.x < -tol ||
    box.y < -tol ||
    box.x + box.w > scene.width + tol ||
    box.y + box.h > scene.height + tol
  ) {
    return {
      code: "out_of_bounds",
      elementId: id,
      t,
      message: `El elemento excede los límites del lienzo (${scene.width}x${scene.height})`,
    };
  }
  return undefined;
}

/**
 * WCAG 2.2 required contrast threshold:
 * 3.0:1 for large text (>= 24px, or >= 18.66px and bold >= 700), else 4.5:1.
 */
export function requiredContrastRatio(size: number, weight: number): number {
  const isBold = weight >= 700;
  const isLarge = size >= 24 || (size >= 18.66 && isBold);
  return isLarge ? 3.0 : 4.5;
}

/**
 * Checks contrast for a text item against what is drawn under it (R5, R6, R7, R8, R9, R11).
 */
function checkTextContrast(
  item: PlacedElement,
  itemIndex: number,
  placed: PlacedElement[],
  scene: Scene,
  t: number,
): LayoutDiagnostic | undefined {
  const textEl = item.el as TextEl;

  // Effective text opacity (item.alpha already factors in element opacity, transform alpha, and ancestor groups)
  const effectiveAlpha = item.alpha;

  // If text is fully invisible (e.g. during fade-in delay or exit), contrast is not checked
  if (effectiveAlpha <= 0.01) return undefined;

  const required = requiredContrastRatio(textEl.size, textEl.weight);

  // Check text fill color
  const fillRgba = parseColor(textEl.color);
  fillRgba[3] *= effectiveAlpha;
  const fillLum = relativeLuminance(fillRgba[0], fillRgba[1], fillRgba[2]);

  // Optional text stroke (R9)
  const rawText = textEl as unknown as {
    stroke?: string;
    strokeWidth?: number;
    strokeColor?: string;
  };
  const strokeColor = rawText.strokeColor ?? rawText.stroke;
  const hasStroke =
    typeof strokeColor === "string" && (rawText.strokeWidth ?? 0) > 0;

  const backdrop = resolveBackdropUnder(
    item.box,
    itemIndex,
    placed,
    scene,
    fillLum,
  );

  if (backdrop.kind === "unverifiable") {
    return {
      code: "unverifiable_contrast",
      elementId: textEl.id,
      t,
      message: `Contraste no verificable: ${backdrop.reason}`,
    };
  }

  const bgRgb = backdrop.rgb;
  const bgLum = relativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);
  const fillRatio = contrastRatio(fillLum, bgLum);

  let bestRatio = fillRatio;
  let bestFgHex = toHex(fillRgba[0], fillRgba[1], fillRgba[2]);

  if (hasStroke && strokeColor) {
    const strokeRgba = parseColor(strokeColor);
    strokeRgba[3] *= effectiveAlpha;
    const strokeLum = relativeLuminance(
      strokeRgba[0],
      strokeRgba[1],
      strokeRgba[2],
    );
    const strokeRatio = contrastRatio(strokeLum, bgLum);
    if (strokeRatio > bestRatio) {
      bestRatio = strokeRatio;
      bestFgHex = toHex(strokeRgba[0], strokeRgba[1], strokeRgba[2]);
    }
  }

  if (bestRatio < required) {
    const suggestion = suggestAccessibleColor(textEl.color, bgRgb, required);
    return {
      code: "low_contrast",
      elementId: textEl.id,
      t,
      message: `Contraste insuficiente (${bestRatio.toFixed(2)}:1 < ${required}:1) sobre fondo ${backdrop.hex}`,
      ratio: Number(bestRatio.toFixed(2)),
      required,
      fg: bestFgHex,
      bg: backdrop.hex,
      suggestion,
    };
  }

  return undefined;
}

/**
 * Default inspection times: loop start (0), middle, and end (scene.duration).
 */
/** Kinds `shape_overlap` leaves out: text has its own check, lines and groups have no body. */
const NOT_SHAPES = new Set(["text", "line", "group"]);

/** A held box this much of its holder's area or more is stacked on it, not held by it (072/D2). */
const HELD_AREA = 0.9;

const area = (b: Box) => b.w * b.h;

const contains = (outer: Box, inner: Box) =>
  area(inner) < HELD_AREA * area(outer) &&
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.w <= outer.x + outer.w &&
  inner.y + inner.h <= outer.y + outer.h;

/**
 * Whether two boxes cover half or more of the smaller one while neither clearly holds the other,
 * as unplaced elements stacked at the centre do; a card under its content is held (071/D4),
 * two boxes of (almost) the same size are not (072/D2).
 */
export function shapesStack(a: Box, b: Box): boolean {
  if (contains(a, b) || contains(b, a)) return false;
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (w <= 0 || h <= 0) return false;
  return w * h >= 0.5 * Math.min(area(a), area(b));
}

/** Kinds whose text is not checked against their box: text sizes its own box, the others hold elements. */
const NO_EXTENT_CHECK = new Set(["text", "group", "use"]);

/** The first text `el` draws past its own box by more than a pixel, if any. */
function textOutsideBox(
  el: Element,
  scene: Scene,
  t: number,
): string | undefined {
  const own = boxOf(el);
  return textExtentsOf(el, scene, t).find(
    ({ box }) =>
      box.x < own.x - 1 ||
      box.y < own.y - 1 ||
      box.x + box.w > own.x + own.w + 1 ||
      box.y + box.h > own.y + own.h + 1,
  )?.text;
}

function defaultInspectionTimes(duration: number): number[] {
  if (duration <= 0) return [0];
  const half = duration / 2;
  return Array.from(new Set([0, half, duration])).sort((a, b) => a - b);
}

/**
 * Pure layout inspection (D1, R2, D5, D6). Analyzes element boxes and contrast at given times:
 * - text overlaps
 * - shapes stacked on each other (071/D4)
 * - elements outside the canvas bounds
 * - line ends attached to ids that do not exist
 * - elements bound to a shot that does not exist
 * - low contrast text and unverifiable backdrops
 */
export function inspectLayout(
  scene: Scene,
  times: number[] = defaultInspectionTimes(scene.duration),
): LayoutDiagnostic[] {
  const diagnostics: LayoutDiagnostic[] = [];

  // Collect all known element IDs in the scene (including within groups)
  const allIds = new Set<string>();
  function registerIds(elements: Element[]) {
    for (const el of elements) {
      allIds.add(el.id);
      if (el.kind === "group") registerIds(el.children);
    }
  }
  registerIds(scene.elements);

  for (const t of times) {
    const placed = placedElementsAt(scene, t);

    // 0. Check missing symbols on `use` elements
    for (const item of placed) {
      if (item.el.kind === "use") {
        const useEl = item.el as UseEl;
        const exists = Boolean(scene.symbols?.[useEl.symbol]);
        if (!exists) {
          diagnostics.push({
            code: "missing_symbol",
            elementId: useEl.id,
            t,
            message: useEl.symbol
              ? `El símbolo «${useEl.symbol}» no existe en la escena`
              : "La instancia «use» no tiene ningún símbolo especificado",
          });
        }
      }
    }

    // 1. Check dangling attachments on lines
    for (const item of placed) {
      if (item.el.kind === "line") {
        diagnostics.push(...checkAttachments(item.el, t, allIds));
      }
    }

    // 2. Check out of canvas bounds for top-level placed elements
    for (const item of placed) {
      if (topLevel(item)) {
        const oob = checkOutOfBounds(item.el.id, item.box, scene, t);
        if (oob) diagnostics.push(oob);
      }
    }

    // 3. Check overlapping text
    const textItems = placed.filter((item) => item.el.kind === "text");
    for (let i = 0; i < textItems.length; i++) {
      for (let j = i + 1; j < textItems.length; j++) {
        const a = textItems[i];
        const b = textItems[j];
        if (!a || !b) continue;
        if (boxesTouch(a.box, b.box)) {
          diagnostics.push({
            code: "text_overlap",
            elementId: a.el.id,
            t,
            message: `El texto se solapa con el elemento de texto «${b.el.id}»`,
          });
        }
      }
    }

    // 3b. Check shapes stacked on each other (071/D4)
    const shapes = placed.filter(
      (item) => topLevel(item) && !NOT_SHAPES.has(item.el.kind),
    );
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const a = shapes[i];
        const b = shapes[j];
        if (!a || !b || !shapesStack(a.box, b.box)) continue;
        diagnostics.push({
          code: "shape_overlap",
          elementId: a.el.id,
          t,
          message: `Se superpone con «${b.el.id}» en más de la mitad del menor, sin que uno contenga al otro`,
        });
      }
    }

    // 3c. Check the text a kind draws stays inside its own box (080/D15)
    for (const item of placed) {
      if (item.heldBy || NO_EXTENT_CHECK.has(item.el.kind)) continue;
      const out = textOutsideBox(item.el, scene, t);
      if (out)
        diagnostics.push({
          code: "text_overflow",
          elementId: item.el.id,
          t,
          message: `El texto «${out}» queda fuera de la caja del elemento: se corta o se sale de ella`,
        });
    }

    // 4. Check contrast for each text item (D5, D6)
    for (let i = 0; i < placed.length; i++) {
      const item = placed[i];
      if (item && item.el.kind === "text") {
        const contrastDiag = checkTextContrast(item, i, placed, scene, t);
        if (contrastDiag) diagnostics.push(contrastDiag);
      }
    }
  }

  // Tag every diagnostic with element's shot if present (055/D5)
  const elementById = new Map<string, Element>();
  function indexAll(elements: Element[]) {
    for (const el of elements) {
      elementById.set(el.id, el);
      if (el.kind === "group") indexAll(el.children);
    }
  }
  indexAll(scene.elements);

  // An element bound to a shot the scene lacks is never drawn (069/D4)
  const shotIds = new Set((scene.shots ?? []).map((sh) => sh.id));
  for (const el of elementById.values()) {
    if (el.shot && !shotIds.has(el.shot))
      diagnostics.push({
        code: "unknown_shot",
        elementId: el.id,
        t: 0,
        message: `Está ligado a la toma «${el.shot}», que no existe, así que no se dibuja nunca`,
      });
  }

  return diagnostics.map((d) => {
    const el = elementById.get(d.elementId);
    return el?.shot ? { ...d, shot: el.shot } : d;
  });
}

export type LayoutBox = Box & { id: string; t: number; estimated?: true };

/**
 * A text or subtitles whose width is the fallback estimate, or a group holding one at any
 * depth, so its box is approximate (064/D3).
 */
function hasEstimatedWidth(el: Element): boolean {
  if (el.kind === "group") return el.children.some(hasEstimatedWidth);
  return (
    (el.kind === "text" || el.kind === "subtitles") &&
    widthIsEstimated(measureStyleOf(el))
  );
}

/**
 * The drawn box of every top-level element at each time, so an agent can
 * verify where its elements landed (023/D1).
 */
export function layoutBoxes(
  scene: Scene,
  times: number[] = defaultInspectionTimes(scene.duration),
): LayoutBox[] {
  return times.flatMap((t) =>
    placedElementsAt(scene, t)
      .filter(topLevel)
      .map(({ el, box }) => ({
        id: el.id,
        t,
        x: round2(box.x),
        y: round2(box.y),
        w: round2(box.w),
        h: round2(box.h),
        ...(hasEstimatedWidth(el) ? { estimated: true as const } : {}),
      })),
  );
}
