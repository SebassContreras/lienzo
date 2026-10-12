import { createStore, type Store } from "./store.ts";

/**
 * What every tool runs against (007/D1): the repo root and the store over its files. Tests
 * pass a temp dir as the root; the renderer joins in 010.
 */
export type Ctx = {
  root: string;
  store: Store;
};

export const createCtx = (root: string): Ctx => ({
  root,
  store: createStore(root),
});
