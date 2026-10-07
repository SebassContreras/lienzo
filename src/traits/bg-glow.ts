import { defineTrait } from "./trait.ts";

/** A soft light behind a rectangle's whole shape. */
export const bgGlow = defineTrait({
  id: "bg-glow",
  label: "Brillo de fondo",
  params: { color: "#2563eb", blur: 40, strength: 1 },
  apply: {
    shape: (el, p) => {
      el.bgGlow = { enabled: true, ...p };
    },
  },
});
