
import { z } from "zod";

export const idSchema = z.string().min(1);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const booleanFlagSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

export const listDoubtsSchema = paginationSchema.extend({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  categorySlug: z.string().optional(),
  authorId: z.string().optional(),
  sort: z.enum(["recent", "helpful", "unanswered"]).optional(),
  mine: booleanFlagSchema,
  saved: booleanFlagSchema,
});

export const createDoubtSchema = z.object({
  title: z.string().trim().min(5).max(200),
  body: z.string().trim().min(1).max(10000),
  categoryId: z.string().min(1),
  referenceId: z.string().trim().optional(),
});

export const doubtPinSchema = z.object({
  isPinned: z.boolean(),
});

export const doubtResolvedSchema = z.object({
  isResolved: z.boolean(),
});

export type CreateDoubtFormInput = z.infer<
  typeof createDoubtSchema
>;

export type ListDoubtsQuery = z.infer<
  typeof listDoubtsSchema
>