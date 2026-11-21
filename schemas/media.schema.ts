import { z } from "zod";

export const uploadUrlSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

export const confirmUploadSchema = z.object({
  fileKey: z.string().startsWith("media/"),
  fileName: z.string().min(1),
});