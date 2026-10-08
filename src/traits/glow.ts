import { defineTrait } from "./trait.ts";

/** Neon glow: the border glow of a rectangle, the glow of a text, a line, an icon or particles. */
export const glow = defineTrait({
  id: "glow",
  label: "Brillo neón",
  params: { color: "#60a5fa", blur: 18, strength: 1 },
  apply: {
    shape: (el, p) => {
      el.borderGlow = { enabled: true, ...p };
    },
    text: (el, p) => {
      el.glow = { enabled: true, ...p };
    },
    line: (el, p) => {
      el.glow = { enabled: true, ...p };
    },
    icon: (el, p) => {
      el.glow = { enabled: true, ...p };
    },
    particles: (el, p) => {
      el.glow = { enabled: true, ...p };
    },
  },
});
