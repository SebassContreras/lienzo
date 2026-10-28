/**
 * Zod issues as the tools report them (080/D1). A union that fails reports one generic
 * «Entrada inválida» with each branch's issues inside; when exactly one branch got the right
 * type (its issues are all below the root), those issues are the real ones, so they replace
 * the union's, under its path. Pure; plain issue objects in and out.
 */
import { z } from "zod";

type Issue = z.core.$ZodIssue;

/** Whether a branch's issues say the value was not even of that branch's type. */
const wrongType = (branch: readonly Issue[]) =>
  branch.some((i) => i.path.length === 0 && i.code === "invalid_type");

/** Zod's own message for a failed union in the active locale (not cached: the locale can change, 081/D1). */
const genericUnion = () =>
  z.union([z.string(), z.number()]).safeParse(null).error?.issues[0]?.message;

/** `issues` with every union failure that one branch explains replaced by that branch's. */
export function flatIssues(issues: readonly Issue[]): Issue[] {
  return issues.flatMap((issue) => {
    if (issue.code !== "invalid_union" || issue.message !== genericUnion())
      return [issue];
    const fitting = issue.errors.filter((branch) => !wrongType(branch));
    const only = fitting.length === 1 ? fitting[0] : undefined;
    if (!only) return [issue];
    return flatIssues(only).map((i) => ({
      ...i,
      path: [...issue.path, ...i.path],
    }));
  });
}
