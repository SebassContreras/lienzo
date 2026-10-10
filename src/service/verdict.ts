import { z } from "zod";
import { ToolFailure } from "./registry.ts";

/** What a `*_validate` tool answers: valid, or the first failing path and every message. */
export const Verdict = z.object({
  valid: z.boolean(),
  message: z.string().optional(),
  path: z.string().optional(),
});

export type Verdict = z.infer<typeof Verdict>;

/** Runs a check that fails with a `ToolFailure` and reports it as a verdict instead. */
export async function verdictOf(check: () => unknown): Promise<Verdict> {
  try {
    await check();
    return { valid: true };
  } catch (error) {
    if (!(error instanceof ToolFailure)) throw error;
    return {
      valid: false,
      message: error.error.message,
      path: error.error.path,
    };
  }
}
