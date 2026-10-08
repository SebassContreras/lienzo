import { demoScene } from "../demo.ts";
import {
  ANIMS_BY_KIND,
  defaultElement,
  defaultScene,
  type Element,
  type ElementKind,
  type Scene,
} from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { BUILT_IN_RECIPES } from "../presets/recipes.ts";
import { resolveElement } from "../presets/resolve.ts";

const KINDS: ElementKind[] = [
  "rect",
  "ellipse",
  "icon",
  "image",
  "group",
  "text",
  "line",
  "particles",
];

/** Lays elements out on a grid so none of them share a box. */
function grid(elements: Element[]): Scene {
  elements.forEach((el, i) => {
    const x = (i % 6) * 180;
    const y = Math.floor(i / 6) * 180;
    if (el.kind === "line") {
      el.a = { ...el.a, x: el.a.x + x, y: el.a.y + y };
      el.b = { ...el.b, x: el.b.x + x, y: el.b.y + y };
    } else {
      el.x += x;
      el.y += y;
    }
  });
  return { ...defaultScene(), elements };
}

/** Every built-in element preset. */
function presetsScene(): Scene {
  return grid(
    BUILT_IN_RECIPES.map((r) => {
      const res = resolveElement(r as PresetRecipe);
      if ("error" in res) throw new Error(res.error);
      return res.element;
    }),
  );
}

/** Every kind with every animation it offers, plus the variants of its own options. */
function kindsScene(): Scene {
  const els: Element[] = [];
  for (const kind of KINDS) {
    for (const anim of ANIMS_BY_KIND[kind]) {
      const el = defaultElement(kind);
      el.anim = { kind: anim, amount: 20, cycles: 2, delay: 0.2 };
      if (el.kind === "group") {
        el.children = [defaultElement("rect"), defaultElement("text")];
        el.w = 200;
        el.cw = 100;
      }
      els.push(el);
    }
  }
  const rect = defaultElement("rect");
  if (rect.kind === "rect") {
    rect.border.style = "dashed";
    rect.border.flow = 3;
    rect.bgGlow.enabled = true;
    rect.label.text = "Hola\nmundo";
    rect.label.align = "left";
    rect.fill.gradient = false;
  }
  const ell = defaultElement("ellipse");
  if (ell.kind === "ellipse") {
    ell.border.style = "dotted";
    ell.label.text = "Elipse";
    ell.label.align = "right";
    ell.shadow.enabled = false;
  }
  const text = defaultElement("text");
  if (text.kind === "text") {
    text.gradient = true;
    text.italic = true;
    text.align = "center";
    text.text = "Uno\ndos tres";
    text.glow.enabled = true;
    text.glow.strength = 2;
  }
  const icon = defaultElement("icon");
  if (icon.kind === "icon") {
    icon.tile.enabled = false;
    icon.glow.enabled = true;
    icon.icon = "Rocket";
  }
  const image = defaultElement("image");
  if (image.kind === "image") {
    image.border.width = 3;
    image.shadow.enabled = true;
  }
  const particles = defaultElement("particles");
  if (particles.kind === "particles") particles.glow.enabled = true;
  els.push(rect, ell, text, icon, image, particles);
  for (const [flow, reverse] of [
    ["ants", false],
    ["comet", true],
    ["pulse", true],
    ["none", false],
  ] as const) {
    const line = defaultElement("line");
    if (line.kind === "line") {
      line.flow.kind = flow;
      line.flow.reverse = reverse;
      line.bend = 60;
      line.style = flow === "ants" ? "dashed" : "dotted";
      line.arrowStart = true;
    }
    els.push(line);
  }
  const scene = grid(els);
  // a line attached to a card and to an ellipse
  const link = defaultElement("line");
  if (link.kind === "line") {
    link.a = { x: 0, y: 0, attach: rect.id };
    link.b = { x: 0, y: 0, attach: ell.id };
  }
  scene.elements.push(link);
  return scene;
}

export function goldenScenes(): Record<string, Scene> {
  return {
    demo: demoScene(),
    presets: presetsScene(),
    kinds: kindsScene(),
  };
}
