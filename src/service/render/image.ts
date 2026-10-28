/**
 * An image a tool returns (010/D3): the MCP server sends any result of this shape as image
 * content so the client sees it; the CLI prints it as JSON like any other result. `file` is
 * where the tool also saved it, when it did (058/D7).
 */
import { z } from "zod";

export const ImageResult = z.object({
  image: z.object({ mimeType: z.literal("image/png"), data: z.base64() }),
  file: z.string().optional(),
  notices: z.array(z.string()).optional(),
});

export type ImageResult = z.infer<typeof ImageResult>;
