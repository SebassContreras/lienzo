/** The largest scene a tool or the editor accepts (081/D5): 8K a side, 60 fps, ten minutes. */
import { z } from "zod";

export const MAX_SIDE = 7680;
export const MAX_FPS = 60;
export const MAX_DURATION = 600;

export const side = () => z.number().positive().max(MAX_SIDE);
export const fpsValue = () => z.number().positive().max(MAX_FPS);
export const durationValue = () => z.number().positive().max(MAX_DURATION);
