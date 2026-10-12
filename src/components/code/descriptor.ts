import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  anim,
  BOX_ANIMS,
  box,
  check,
  num,
  select,
  text,
} from "../fields/index.ts";
import { drawCode } from "./draw.ts";
import { THEMES, type Theme } from "./themes.ts";
import { LANGUAGES } from "./tokenize.ts";

const C = { section: "Código" };
const S = { section: "Estilo" };

/**
 * Code with syntax highlighting. `typed` (0–1) is how much of it has been typed; it is a
 * plain number field, so keyframes type it in (017/D2).
 */
const fields = {
  ...box(620, 260, { section: "Código", min: 40, max: 3000 }),
  code: text(
    'async function main() {\n  const res = await fetch("/api");\n  return res.json(); // listo\n}',
    { label: "Código", multiline: true, ...C },
  ),
  language: select(LANGUAGES, "js", { label: "Lenguaje", ...C }),
  typed: num(1, {
    label: "Escrito",
    max: 1,
    step: 0.01,
    bounds: [0, 1],
    ...C,
  }),
  cursor: check(true, { label: "Cursor mientras escribe", ...C }),
  theme: select(
    Object.entries(THEMES).map(([k, t]) => [k as Theme, t.label] as const),
    "night",
    { label: "Tema", ...S },
  ),
  lineNumbers: check(true, { label: "Números de línea", ...S }),
  size: num(20, { label: "Tamaño", min: 6, max: 80, ...S }),
  radius: num(16, { label: "Esquinas", max: 60, ...S }),
  pad: num(24, { label: "Margen", max: 120, ...S }),
  anim: anim(BOX_ANIMS),
};

export type CodeEl = ElementOf<"code", typeof fields>;

export const code = defineComponent<CodeEl>({
  kind: "code",
  label: "Código",
  icon: "Code",
  fields,
  sections: [{ title: "Código" }, { title: "Estilo" }, { title: "Animación" }],
  anims: BOX_ANIMS,
  draw: drawCode,
});
