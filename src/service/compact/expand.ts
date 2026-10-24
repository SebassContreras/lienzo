/**
 * Pure scene expansion from compact representation (011/D2, D3, D4, D6, R1-R9).
 */

import type { AnimPreset } from "../../model/anim-preset.ts";
import type { CompactElement, CompactScene } from "../../model/compact.ts";
import {
  type Background,
  defaultBackground,
  defaultElement,
  defaultScene,
  type Element,
  newId,
  type Scene,
  SIZE_PRESETS,
} from "../../model/model.ts";
import type { PresetRecipe } from "../../model/preset.ts";
import { expandAnimPresets } from "../../presets/anim-presets.ts";
import {
  deepMerge,
  resolveBackground,
  resolvePreset,
} from "../../presets/resolve.ts";
import { resolveLineConnections } from "./connections.ts";
import {
  resolveAtPlacement,
  resolveFitCanvas,
  resolveOrigin,
} from "./layout.ts";
import { normalizeTracks } from "./tracks.ts";

type PresetResolver = (
  name: string,
) => Promise<PresetRecipe | undefined> | (PresetRecipe | undefined);

export type ExpandOptions = {
  findPreset?: PresetResolver;
  animLibrary?: readonly AnimPreset[];
};

/** Parses size specification (e.g. "1080x1080", "1920x1080", "story", or [w, h]) */
function resolveSceneDimensions(size?: string | [number, number]): {
  width: number;
  height: number;
} {
  if (Array.isArray(size)) {
    return { width: size[0], height: size[1] };
  }
  if (!size) {
    return { width: 1080, height: 1080 };
  }

  const dimMatch = size.match(/^(\d+)[x×](\d+)$/i);
  if (dimMatch) {
    return {
      width: Number.parseInt(dimMatch[1], 10),
      height: Number.parseInt(dimMatch[2], 10),
    };
  }

  const normalized = size.toLowerCase();
  const preset = SIZE_PRESETS.find((p) =>
    p.label.toLowerCase().includes(normalized),
  );
  if (preset) {
    return { width: preset.width, height: preset.height };
  }

  return { width: 1080, height: 1080 };
}

/** Resolves background from preset name or partial object */
async function resolveSceneBackground(
  bgInput: unknown,
  findPreset?: PresetResolver,
): Promise<Background> {
  const base = defaultBackground();
  if (!bgInput) return base;

  if (typeof bgInput === "string") {
    if (findPreset) {
      const recipe = await findPreset(bgInput);
      if (recipe && recipe.kind === "background") {
        const resolved = resolveBackground(recipe);
        if ("background" in resolved) return resolved.background;
      }
    }
    return base;
  }

  if (typeof bgInput === "object" && bgInput !== null) {
    deepMerge(
      base as unknown as Record<string, unknown>,
      bgInput as Record<string, unknown>,
    );
  }

  return base;
}

/** Normalizes anim shorthand: if a string or single kind is given, maps it to { in/loop: ... } */
function normalizeAnim(rawAnim: unknown): unknown {
  if (typeof rawAnim === "string") {
    const kind = rawAnim.toLowerCase();
    const LOOP_CANDIDATES = [
      "float",
      "pulse",
      "breathe",
      "spin",
      "bounce",
      "glow",
    ];
    if (LOOP_CANDIDATES.includes(kind)) {
      return {
        loop: { kind, amount: 12, cycles: 1, delay: 0 },
      };
    }
    return {
      in: { kind, amount: 12, delay: 0, from: "down" },
    };
  }

  if (typeof rawAnim === "object" && rawAnim !== null) {
    const animObj = { ...(rawAnim as Record<string, unknown>) };
    if (typeof animObj.in === "string") {
      animObj.in = { kind: animObj.in };
    }
    if (typeof animObj.loop === "string") {
      animObj.loop = { kind: animObj.loop };
    }
    if (typeof animObj.out === "string") {
      animObj.out = { kind: animObj.out };
    }
    return animObj;
  }

  return rawAnim;
}

/** Builds an element from preset or kind, applying deepMerge and children expansion */
async function buildElement(
  raw: CompactElement,
  findPreset?: PresetResolver,
): Promise<Element> {
  let element: Element;

  const rawPreset = raw.preset as string | undefined;
  const rawKind = raw.kind as Element["kind"] | undefined;

  if (rawPreset && findPreset) {
    const recipe = await findPreset(rawPreset);
    if (recipe) {
      const resolved = resolvePreset(recipe);
      if ("element" in resolved) {
        element = resolved.element;
      } else {
        throw new Error(`El preset «${rawPreset}» no es un elemento`);
      }
    } else {
      throw new Error(`No existe el preset «${rawPreset}»`);
    }
  } else if (rawKind) {
    element = defaultElement(rawKind);
  } else {
    throw new Error("El elemento compacto debe especificar 'kind' o 'preset'");
  }

  const {
    preset: _preset,
    kind: _kind,
    at,
    fit,
    origin,
    from,
    to,
    tracks,
    anim,
    animPreset,
    children,
    template,
    ...overrides
  } = raw as Record<string, unknown>;

  if (overrides.id) {
    element.id = String(overrides.id);
  }

  deepMerge(element as unknown as Record<string, unknown>, overrides);

  if (anim !== undefined) {
    const normalized = normalizeAnim(anim);
    if (
      typeof normalized === "object" &&
      normalized !== null &&
      typeof element.anim === "object" &&
      element.anim !== null
    ) {
      deepMerge(
        element.anim as unknown as Record<string, unknown>,
        normalized as Record<string, unknown>,
      );
    } else {
      (element as unknown as Record<string, unknown>).anim = normalized;
    }
  }

  if (animPreset !== undefined) {
    if (typeof animPreset === "string") {
      element.animPreset = { name: animPreset, start: 0 };
    } else if (typeof animPreset === "object" && animPreset !== null) {
      element.animPreset = animPreset as { name: string; start: number };
    }
  }

  if (tracks) {
    element.tracks = normalizeTracks(
      tracks as Record<string, import("./tracks.ts").CompactTrackInput>,
    );
  }

  if (origin !== undefined) {
    element.origin = resolveOrigin(
      origin as import("../../model/compact.ts").CompactOrigin,
    );
  }

  // Preserve placement hints for the post-layout pass
  if (at) (element as unknown as Record<string, unknown>).__at = at;
  if (fit) (element as unknown as Record<string, unknown>).__fit = fit;
  if (from) (element as unknown as Record<string, unknown>).from = from;
  if (to) (element as unknown as Record<string, unknown>).to = to;

  // Handle nested children for groups
  if (element.kind === "group" && Array.isArray(children)) {
    const builtChildren: Element[] = [];
    for (const child of children) {
      builtChildren.push(
        await buildElement(child as CompactElement, findPreset),
      );
    }
    element.children = builtChildren;
  }

  // Handle template for particles
  if (
    element.kind === "particles" &&
    template &&
    typeof template === "object"
  ) {
    element.template = await buildElement(
      template as CompactElement,
      findPreset,
    );
  }

  return element;
}

/**
 * Pure function: expands a CompactScene into a full canonical Scene.
 */
export async function expandScene(
  compact: CompactScene,
  options: ExpandOptions = {},
): Promise<Scene> {
  const scene = defaultScene();

  const dims = resolveSceneDimensions(
    compact.size as string | [number, number],
  );
  scene.width = compact.width ?? dims.width;
  scene.height = compact.height ?? dims.height;

  if (compact.duration !== undefined) scene.duration = compact.duration;
  if (compact.fps !== undefined) scene.fps = compact.fps;

  scene.background = await resolveSceneBackground(
    compact.background,
    options.findPreset,
  );

  const elements: Element[] = [];
  const seenIds = new Set<string>();

  for (const rawEl of compact.elements ?? []) {
    const el = await buildElement(rawEl, options.findPreset);

    if (rawEl.id) {
      if (seenIds.has(el.id)) {
        throw new Error(`ID duplicado «${el.id}» en la escena compacta`);
      }
      seenIds.add(el.id);
    } else if (!el.id) {
      el.id = newId();
    }

    elements.push(el);
  }

  // Post-layout pass: resolve fit and anchors
  for (const el of elements) {
    const mutable = el as unknown as Record<string, unknown>;
    if (mutable.__fit === "canvas") {
      resolveFitCanvas(el, scene);
      delete mutable.__fit;
    }
    if (mutable.__at) {
      resolveAtPlacement(
        el,
        mutable.__at as import("../../model/compact.ts").AtPlacement,
        scene,
      );
      delete mutable.__at;
    }
  }

  // Post-connections pass: resolve from / to
  resolveLineConnections(elements);

  scene.elements = elements;

  if (options.animLibrary && options.animLibrary.length > 0) {
    const { scene: expandedAnimScene } = expandAnimPresets(
      scene,
      options.animLibrary,
    );
    return expandedAnimScene;
  }

  return scene;
}
