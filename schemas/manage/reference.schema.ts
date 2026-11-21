import { z } from "zod";

export const referenceIdSchema = z.object({
  title: z.string().trim().min(1),
  parentId: z.string().optional(), 
  id: z.string().optional(), 
});