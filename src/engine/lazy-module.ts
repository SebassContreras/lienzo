/**
 * A module imported on first use (066/D7). Drawing is synchronous, so it asks `get()`, which
 * starts the import and returns undefined until it is there; exports await `load()` first.
 * A failed import is tried again on the next call.
 */
export function lazyModule<M>(importer: () => Promise<M>) {
  let value: M | undefined;
  let loading: Promise<M> | undefined;

  function load(): Promise<M> {
    loading ??= importer().then(
      (m) => {
        value = m;
        return m;
      },
      (error: unknown) => {
        loading = undefined;
        throw error;
      },
    );
    return loading;
  }

  function get(): M | undefined {
    if (value === undefined) load().catch(() => {});
    return value;
  }

  return { load, get };
}
