import type { SubtitleCue } from "../../engine/subtitles/types.ts";
import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  align,
  anim,
  BOX_ANIMS,
  box,
  check,
  color,
  custom,
  elementOpacity,
  font,
  fraction,
  num,
  weight,
} from "../fields/index.ts";
import { drawSubtitles } from "./draw.ts";
import { subtitleCuesSchema } from "./schema.ts";

const C = { section: "Subtítulos" };
const S = { section: "Sincronización" };
const T = { section: "Tipografía" };
const K = { section: "Karaoke" };
const B = { section: "Fondo" };

const DEFAULT_CUES: SubtitleCue[] = [
  {
    id: "cue-1",
    start: 0,
    end: 2.5,
    text: "Subtítulos sincronizados con Lienzo",
    words: [
      { word: "Subtítulos", start: 0, end: 0.8 },
      { word: "sincronizados", start: 0.8, end: 1.6 },
      { word: "con", start: 1.6, end: 1.9 },
      { word: "Lienzo", start: 1.9, end: 2.5 },
    ],
  },
  {
    id: "cue-2",
    start: 2.5,
    end: 5,
    text: "¡Crea contenido viral fácilmente!",
    words: [
      { word: "¡Crea", start: 2.5, end: 3.1 },
      { word: "contenido", start: 3.1, end: 3.8 },
      { word: "viral", start: 3.8, end: 4.3 },
      { word: "fácilmente!", start: 4.3, end: 5 },
    ],
  },
];

const fields = {
  ...box(800, 160, { section: "Subtítulos", min: 100, max: 2000 }),
  opacity: elementOpacity("Subtítulos"),
  cues: custom("cues-editor", DEFAULT_CUES, subtitleCuesSchema, {
    label: "Cues",
    ...S,
  }),
  font: { ...font("Inter"), ...T },
  size: num(48, { label: "Tamaño", min: 14, max: 200, ...T }),
  weight: { ...weight(800), ...T },
  textColor: color("#ffffff", { label: "Texto", ...T }),
  align: { ...align("center"), ...T },
  maxWidth: num(800, { label: "Ancho máx.", min: 200, max: 2000, ...T }),
  lineHeight: num(1.2, {
    label: "Interlineado",
    min: 0.8,
    max: 2.5,
    step: 0.05,
    ...T,
  }),
  wordsPerWindow: num(4, { label: "Palabras/ventana", min: 1, max: 12, ...C }),

  highlightColor: color("#facc15", { label: "Color activo", ...K }),
  highlightScale: num(1.05, {
    label: "Escala activa",
    min: 1,
    max: 1.5,
    step: 0.01,
    ...K,
  }),

  background: check(true, { label: "Caja de fondo", ...B }),
  bgColor: color("#000000", { label: "Color fondo", ...B }),
  bgOpacity: fraction(0.7, { label: "Opacidad fondo", step: 0.05, ...B }),
  paddingX: num(20, { label: "Margen H", min: 0, max: 100, ...B }),
  paddingY: num(12, { label: "Margen V", min: 0, max: 100, ...B }),
  radius: num(12, { label: "Esquinas", min: 0, max: 60, ...B }),

  anim: anim(BOX_ANIMS),
};

export type SubtitlesEl = ElementOf<"subtitles", typeof fields>;

export const subtitles = defineComponent<SubtitlesEl>({
  kind: "subtitles",
  label: "Subtítulos",
  icon: "Captions",
  fields,
  sections: [
    { title: "Subtítulos" },
    { title: "Sincronización" },
    { title: "Tipografía" },
    { title: "Karaoke" },
    { title: "Fondo" },
    { title: "Animación" },
  ],
  anims: BOX_ANIMS,
  draw: drawSubtitles,
});
