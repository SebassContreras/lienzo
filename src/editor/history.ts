import { useCallback, useReducer, useRef } from "react";

/** Undo and redo stacks of whole snapshots; the present lives outside. */
export type History<T> = { past: T[]; future: T[] };

/** Most undo states kept; the oldest is dropped first (R6). */
export const HISTORY_CAP = 75;

export const emptyHistory = <T>(): History<T> => ({ past: [], future: [] });

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

/** Records `present` as an undo step; skipped when equal to the top. Clears redo. */
export function push<T>(
  h: History<T>,
  present: T,
  cap = HISTORY_CAP,
): History<T> {
  const top = h.past.at(-1);
  if (top !== undefined && same(top, present)) return h;
  return {
    past: [...h.past, structuredClone(present)].slice(-cap),
    future: [],
  };
}

/** Steps back: the new history and the restored state, or undefined when empty. */
export function undo<T>(
  h: History<T>,
  present: T,
): [History<T>, T] | undefined {
  const prev = h.past.at(-1);
  if (prev === undefined) return undefined;
  return [{ past: h.past.slice(0, -1), future: [...h.future, present] }, prev];
}

/** Steps forward: the mirror of `undo`. */
export function redo<T>(
  h: History<T>,
  present: T,
): [History<T>, T] | undefined {
  const next = h.future.at(-1);
  if (next === undefined) return undefined;
  return [{ past: [...h.past, present], future: h.future.slice(0, -1) }, next];
}

/**
 * The pure history around a value read with `get` and written with `set`;
 * `checkpoint` is called before a change starts, once per gesture.
 */
export function useHistory<T>(get: () => T, set: (value: T) => void) {
  const history = useRef<History<T>>(emptyHistory<T>());
  const [, rerender] = useReducer((x: number) => x + 1, 0);

  const commit = useCallback((h: History<T>) => {
    if (h === history.current) return;
    history.current = h;
    rerender();
  }, []);

  const checkpoint = useCallback(
    () => commit(push(history.current, get())),
    [commit, get],
  );

  const step = useCallback(
    (move: typeof undo<T>) => {
      const result = move(history.current, get());
      if (!result) return;
      commit(result[0]);
      set(result[1]);
    },
    [commit, get, set],
  );

  return {
    checkpoint,
    undo: useCallback(() => step(undo), [step]),
    redo: useCallback(() => step(redo), [step]),
    /** The current undo history, to put back later with `reset` (062/D4). */
    snapshot: useCallback(() => history.current, []),
    reset: commit,
    canUndo: history.current.past.length > 0,
    canRedo: history.current.future.length > 0,
  };
}
