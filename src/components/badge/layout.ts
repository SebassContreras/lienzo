import { textLayout } from "../../engine/geometry.ts";
import type { BadgeEl } from "./descriptor.ts";

export type BadgeLayout = {
  w: number;
  h: number;
  /** Where the icon and the text start, from the badge's left edge. */
  iconX: number;
  textX: number;
  iconSize: number;
};

/** The badge's size and the place of its content, all following from its text and size. */
export function badgeLayout(el: BadgeEl): BadgeLayout {
  const padX = el.size * el.padding;
  const padY = padX * 0.6;
  const iconSize = el.showIcon ? el.size * 1.1 : 0;
  const gap = el.showIcon && el.text ? el.size * 0.4 : 0;
  const textW = el.text ? textLayout({ ...el, lineHeight: 1 }).w : 0;
  return {
    w: padX * 2 + iconSize + gap + textW,
    h: el.size * 1.2 + padY * 2,
    iconX: padX,
    textX: padX + iconSize + gap,
    iconSize,
  };
}
