/**
 * Zod's own validation messages in Spanish (078/D5), as every other message the tools and
 * the editor show (A16). Imported first by the schema modules every entry loads; zod applies
 * the locale when it parses. `setSpanishLocale` sets it again: a long-running server called it
 * before every tool call (081/D1) so a later import cannot leave another locale active.
 */
import { z } from "zod";

export const setSpanishLocale = () => z.config(z.locales.es());

setSpanishLocale();
