import { describe, expect, it } from "vitest";
import { emptyHistory, HISTORY_CAP, push, redo, undo } from "./history.ts";

describe("history", () => {
  it("pushes copies and skips a state equal to the top", () => {
    const state = { n: 1 };
    let h = push(emptyHistory<{ n: number }>(), state);
    state.n = 2;
    expect(h.past).toEqual([{ n: 1 }]);
    const same = push(h, { n: 1 });
    expect(same).toBe(h);
    h = push(h, { n: 2 });
    expect(h.past).toHaveLength(2);
  });

  it("undoes and redoes", () => {
    const h = push(emptyHistory<number>(), 1);
    const back = undo(h, 2);
    expect(back?.[1]).toBe(1);
    expect(back?.[0]).toEqual({ past: [], future: [2] });
    const forward = back && redo(back[0], 1);
    expect(forward?.[1]).toBe(2);
    expect(forward?.[0]).toEqual({ past: [1], future: [] });
  });

  it("returns undefined with nothing to undo or redo", () => {
    expect(undo(emptyHistory<number>(), 0)).toBeUndefined();
    expect(redo(emptyHistory<number>(), 0)).toBeUndefined();
  });

  it("caps the stack, dropping the oldest", () => {
    let h = emptyHistory<number>();
    for (let i = 0; i < HISTORY_CAP + 5; i++) h = push(h, i);
    expect(h.past).toHaveLength(HISTORY_CAP);
    expect(h.past[0]).toBe(5);
  });

  it("clears redo on a new change", () => {
    const h = push(emptyHistory<number>(), 1);
    const back = undo(h, 2);
    expect(back?.[0].future).toEqual([2]);
    expect(back && push(back[0], 1).future).toEqual([]);
  });
});
