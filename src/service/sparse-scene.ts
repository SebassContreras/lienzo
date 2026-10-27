/**
 * A scene as `scene_get` returns it by default (074/D12): each element as its `id`, `kind`
 * and only the fields that differ from its kind's default (children and symbols alike), so
 * reading a scene does not cost ~40 lines per element. `scene_create` and `scene_validate`
 * fill the rest back in (`withElementDefaults`). Pure.
 */
import { defaultElement, type Element, type Scene } from "../model/model.ts";
import { deepDiff } from "../presets/diff.ts";

function sparse(el: Element): Record<string, unknown> {
  const { id, kind, ...fields } = el as Element & { children?: Element[] };
  const { children, ...own } = fields as typeof fields & {
    children?: Element[];
  };
  const { id: _id, kind: _kind, ...base } = defaultElement(kind);
  return {
    id,
    kind,
    ...((deepDiff(own, base) as object | undefined) ?? {}),
    ...(children ? { children: children.map(sparse) } : {}),
  };
}

export function sparseScene(scene: Scene): Record<string, unknown> {
  return {
    ...scene,
    elements: scene.elements.map(sparse),
    ...(scene.symbols
      ? {
          symbols: Object.fromEntries(
            Object.entries(scene.symbols).map(([name, s]) => [
              name,
              { ...s, children: s.children.map(sparse) },
            ]),
          ),
        }
      : {}),
  };
}
