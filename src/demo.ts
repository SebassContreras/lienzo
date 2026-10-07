import {
  defaultLine,
  defaultRect,
  defaultScene,
  defaultText,
  type Element,
  type LineEl,
  type RectEl,
  type Scene,
} from "./model/model.ts";
import { BUILT_IN_RECIPES } from "./presets/recipes.ts";
import { resolveElement } from "./presets/resolve.ts";

function fromPreset(name: string): Element {
  const recipe = BUILT_IN_RECIPES.find((r) => r.name === name);
  if (!recipe) throw new Error(`unknown preset ${name}`);
  const resolved = resolveElement(recipe);
  if ("error" in resolved) throw new Error(resolved.error);
  return resolved.element;
}

function card(
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  patch?: (el: RectEl) => void,
): RectEl {
  const el = defaultRect();
  Object.assign(el, { name: text.replace(/\n.*/s, ""), x, y, w, h });
  el.label.text = text;
  patch?.(el);
  return el;
}

function connect(
  from: Element,
  to: Element,
  patch?: (el: LineEl) => void,
): LineEl {
  const el = defaultLine();
  el.name = `${from.name} → ${to.name}`;
  el.a = { x: 0, y: 0, attach: from.id };
  el.b = { x: 0, y: 0, attach: to.id };
  patch?.(el);
  return el;
}

/** The scene shown on first load: how an agent reaches tools through MCP. */
export function demoScene(): Scene {
  const scene = defaultScene();

  const pill = fromPreset("Pill") as RectEl;
  Object.assign(pill, { x: 90, y: 90 });

  const title = defaultText();
  Object.assign(title, {
    name: "Título",
    text: "Cómo un agente usa",
    x: 90,
    y: 190,
    size: 66,
  });
  const title2 = defaultText();
  Object.assign(title2, {
    name: "Título degradado",
    text: "herramientas vía MCP.",
    x: 90,
    y: 268,
    size: 66,
    gradient: true,
    color: "#3b82f6",
    color2: "#22d3ee",
  });
  const body = defaultText();
  Object.assign(body, {
    name: "Párrafo",
    text: "El host habla con el servidor MCP, que expone\ntools, datos y prompts en un mismo protocolo.",
    x: 90,
    y: 370,
    size: 28,
    weight: 400,
    color: "#cbd5e1",
    lineHeight: 1.4,
  });

  const host = card("🤖 Host\nAgente", 90, 560, 240, 150, (el) => {
    el.fill.color = "#1e1b4b";
    el.border.color = "#8b5cf6";
    el.borderGlow = { enabled: true, color: "#8b5cf6", blur: 18, strength: 1 };
    el.anim = { kind: "float", amount: 8, cycles: 1, delay: 0.5 };
  });
  const server = card("MCP\nServer", 420, 560, 240, 150, (el) => {
    el.label.size = 34;
    el.label.weight = 800;
    el.bgGlow = { enabled: true, color: "#1d4ed8", blur: 60, strength: 1 };
    el.borderGlow = { enabled: true, color: "#60a5fa", blur: 18, strength: 2 };
    el.anim = { kind: "breathe", amount: 60, cycles: 2, delay: 0 };
  });
  const tool = (text: string, y: number, color: string, delay: number) =>
    card(text, 770, y, 220, 96, (el) => {
      el.label.size = 26;
      el.fill = {
        ...el.fill,
        color: "#ffffff",
        color2: color,
        angle: 135,
        opacity: 0.08,
      };
      el.border = { ...el.border, width: 1.5, color, opacity: 0.7 };
      el.borderGlow = { enabled: true, color, blur: 12, strength: 1 };
      el.anim = { kind: "float", amount: 6, cycles: 1, delay };
    });
  const tools = tool("🛠  Tools", 470, "#22d3ee", 0);
  const data = tool("🗄  Datos", 587, "#4ade80", 1);
  const prompts = tool("📄  Prompts", 704, "#f472b6", 2);

  const hostToServer = connect(host, server, (el) => {
    el.arrowStart = true;
    el.color = "#8b5cf6";
    el.glow.color = "#8b5cf6";
    el.flow = { ...el.flow, color: "#c4b5fd", count: 3, speed: 2 };
  });
  const toTools = connect(server, tools, (el) => {
    el.bend = -40;
    el.color = "#22d3ee";
    el.glow.color = "#22d3ee";
    el.flow = {
      ...el.flow,
      kind: "comet",
      color: "#a5f3fc",
      speed: 2,
      size: 5,
    };
  });
  const toData = connect(server, data, (el) => {
    el.color = "#4ade80";
    el.glow.color = "#4ade80";
    el.flow = {
      ...el.flow,
      kind: "ants",
      color: "#86efac",
      speed: 10,
      size: 4,
    };
  });
  const toPrompts = connect(server, prompts, (el) => {
    el.bend = 40;
    el.color = "#f472b6";
    el.glow.color = "#f472b6";
    el.flow = { ...el.flow, color: "#fbcfe8", count: 2, speed: 2 };
  });

  const note = defaultText();
  Object.assign(note, {
    name: "Manuscrito",
    text: "un protocolo,\ninfinitas herramientas ✨",
    x: 110,
    y: 780,
    size: 44,
    weight: 700,
    font: "Caveat",
    color: "#60a5fa",
    anim: { kind: "fade-in", amount: 0, cycles: 1, delay: 0.6 },
  });
  const cta = fromPreset("Botón CTA") as RectEl;
  Object.assign(cta, { x: 770, y: 930 });

  scene.elements = [
    pill,
    title,
    title2,
    body,
    hostToServer,
    toTools,
    toData,
    toPrompts,
    host,
    server,
    tools,
    data,
    prompts,
    note,
    cta,
  ];
  return scene;
}
