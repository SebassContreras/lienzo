/**
 * An image a tool returns (010/D3): the MCP server sends any result of this shape as image
 * content so the client sees it; the CLI prints it as JSON like any other result.
 */
import { z } from "zod";

export const ImageResult = z.object({
  image: z.object({ mimeType: z.literal("image/png"), data: z.base64() }),
});

export type ImageResult = z.infer<typeof ImageResult>;
