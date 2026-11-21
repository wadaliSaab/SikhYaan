
import { z } from "zod";

const blockSchema = z
  .object({
    id: z.string(),
    type: z.enum(["TEXT", "IMAGE", "PDF", "GALLERY"]).optional(),
    title: z.string().nullable().optional(),
    content: z.string().nullable().optional(),
    mediaId: z.string().nullable().optional(),
    gallery: z.array(z.string()).optional(),
  })
  .refine((b) => !b.id.startsWith("tmp-") || b.type, {
    message: "type is required for a new block",
  });

export const saveContentSchema = z
  .object({
    id: z.string().optional(),
    referenceId: z.string().optional(),
    title: z.string().min(1).optional(),
    summary: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(),
    heroMediaId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),

    blocks: z
      .object({
        updates: z.array(blockSchema).default([]),
        removed: z.array(z.string()).default([]),
        order: z.array(z.string()).optional(),
      })
      .optional(),

    homePlacement: z
      .object({
        homeSectionId: z.string(),
        layout: z.enum(["GRID", "LIST", "FEATURE"]),
        itemVariant: z.enum([
          "IMAGE_CARD",
          "IMAGE_CARD_LARGE",
          "COMPACT_CARD",
          "PDF_CARD",
        ]),
        mediaRatio: z.enum(["SQUARE", "LANDSCAPE", "PORTRAIT"]),
        sortOrder: z.number().int().optional(),
      })
      .optional(),

    newChildren: z
      .array(
        z.object({
          title: z.string().min(1),
          referenceId: z.string().min(1),
          sortOrder: z.number().int().optional(),
        }),
      )
      .optional(),
  })
  .refine((d) => d.id || (d.title && d.referenceId), {
    message: "title and referenceId are required for new content",
  });

export type SaveContentInput = z.infer<typeof saveContentSchema>;