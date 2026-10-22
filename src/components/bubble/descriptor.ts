import { defineComponent, type ElementOf } from "../descriptor.ts";
import {
  anim,
  BOX_ANIMS,
  box,
  check,
  color,
  font,
  num,
  type Parent,
  select,
  shadow,
  softShadow,
  text,
} from "../fields/index.ts";
import { drawBubble } from "./draw.ts";

type Side = "left" | "right";

const M = { section: "Mensaje" };
const A = { section: "Autor" };
const S = { section: "Estilo" };
const typing = (p: Parent) => p.typing === true;

/**
 * A chat message: a round avatar with initials beside a bubble holding the author and the
 * text, or three bouncing dots while `typing`.
 */
const fields = {
  ...box(560, 150, { section: "Mensaje", min: 60, max: 1600 }),
  text: text("¿Cómo conecto mi app a un servidor MCP?", {
    label: "Texto",
    multiline: true,
    visible: (p: Parent) => !typing(p),
    ...M,
  }),
  typing: check(false, { label: "Escribiendo…", ...M }),
  /** Bounces of the typing dots per loop, rounded to whole cycles (A6). */
  typingSpeed: num(4, {
    label: "Rebotes por ciclo",
    min: 1,
    max: 20,
    int: true,
    visible: typing,
    ...M,
  }),
  side: select(
    [
      ["left", "Izquierda"],
      ["right", "Derecha"],
    ] as const satisfies readonly (readonly [Side, string])[],
    "left",
    { label: "Lado", ...M },
  ),
  author: text("Ana", { label: "Autor", ...A }),
  showAvatar: check(true, { label: "Avatar", ...A }),
  /** The avatar's letters; the author's initials when empty. */
  initials: text("", { label: "Iniciales", ...A }),
  avatarColor: color("#7c3aed", { label: "Color del avatar", ...A }),
  font: { ...font("Inter"), ...S },
  size: num(26, { label: "Tamaño del texto", min: 8, max: 120, ...S }),
  color: color("#f8fafc", { label: "Color del texto", ...S }),
  authorColor: color("#93c5fd", { label: "Color del autor", ...S }),
  bubbleColor: color("#1e293b", { label: "Color de la burbuja", ...S }),
  radius: num(28, { label: "Esquinas", max: 200, ...S }),
  shadow: shadow(softShadow(true)),
  anim: anim(BOX_ANIMS),
};

export type BubbleEl = ElementOf<"bubble", typeof fields>;

export const bubble = defineComponent<BubbleEl>({
  kind: "bubble",
  label: "Mensaje de chat",
  icon: "MessageCircle",
  fields,
  sections: [
    { title: "Mensaje" },
    { title: "Autor" },
    { title: "Estilo" },
    { title: "Sombra", open: false },
    { title: "Animación" },
  ],
  anims: BOX_ANIMS,
  draw: drawBubble,
});
