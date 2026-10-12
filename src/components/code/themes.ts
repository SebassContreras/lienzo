import type { TokenType } from "./tokenize.ts";

export type Theme = "night" | "dracula" | "light";

export type ThemeColors = {
  label: string;
  background: string;
  gutter: string;
  tokens: Record<TokenType, string>;
};

/** Colour themes for code blocks. */
export const THEMES: Record<Theme, ThemeColors> = {
  night: {
    label: "Noche",
    background: "#0b1220",
    gutter: "#475569",
    tokens: {
      plain: "#e2e8f0",
      comment: "#64748b",
      string: "#a5d6a7",
      keyword: "#c084fc",
      number: "#fbbf24",
      function: "#60a5fa",
      type: "#22d3ee",
      punctuation: "#94a3b8",
    },
  },
  dracula: {
    label: "Drácula",
    background: "#282a36",
    gutter: "#6272a4",
    tokens: {
      plain: "#f8f8f2",
      comment: "#6272a4",
      string: "#f1fa8c",
      keyword: "#ff79c6",
      number: "#bd93f9",
      function: "#50fa7b",
      type: "#8be9fd",
      punctuation: "#f8f8f2",
    },
  },
  light: {
    label: "Claro",
    background: "#f8fafc",
    gutter: "#94a3b8",
    tokens: {
      plain: "#1e293b",
      comment: "#94a3b8",
      string: "#15803d",
      keyword: "#7c3aed",
      number: "#b45309",
      function: "#2563eb",
      type: "#0891b2",
      punctuation: "#475569",
    },
  },
};
