/**
 * The whole lucide icon set (~900 kB). Imported only through `iconSet` in `icon-shapes.ts`, so
 * it stays out of the startup bundle (066/D5).
 */
import { icons } from "lucide";
import type { IconNode } from "./icon-shapes.ts";

/** Every lucide icon name, PascalCase, sorted. */
export const ICON_NAMES: string[] = Object.keys(icons).sort();

export function iconNode(name: string): IconNode | undefined {
  return Object.hasOwn(icons, name)
    ? (icons[name as keyof typeof icons] as unknown as IconNode)
    : undefined;
}
