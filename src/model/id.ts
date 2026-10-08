/** A short random id for a new element. */
export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}
