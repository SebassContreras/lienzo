/**
 * Zod's own validation messages in Spanish (078/D5), as every other message the tools and
 * the editor show (A16). Imported first by the schema modules every entry loads; zod applies
 * the locale when it parses, so loading it once is enough.
 */
import { z } from "zod";

z.config(z.locales.es());
