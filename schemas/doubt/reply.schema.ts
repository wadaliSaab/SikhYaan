
import { z } from "zod";

export const replyIdSchema = z.string().min(1);

export const listRepliesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  parentReplyId: z.string().min(1).optional(),
});

export const createReplySchema = z.object({
  doubtId: z.string().min(1),
  body: z.string().trim().min(1).max(5000),
  replyToId: z.string().min(1).nullish(),
});

export const replyPinSchema = z.object({
  isPinned: z.boolean(),
});

export type CreateReplyInput = z.infer<
  typeof createReplySchema
>;

export type ListRepliesQuery = z.infer<
  typeof listRepliesSchema
>;