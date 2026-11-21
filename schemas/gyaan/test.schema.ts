import { z } from "zod";

import {
  idSchema,
  paginationSchema,
  booleanFlagSchema,
} from "@/schemas/doubt/doubt.schema";

export { idSchema };


export const QUESTION_TYPES = ["MCQ", "FILL", "IMAGE"] as const;
export const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const TEST_SORTS = ["latest", "popular"] as const;

export const MAX_QUESTIONS = 100;
export const MAX_QUESTION_IMAGE_SIZE = 5 * 1024 * 1024; 
export const QUESTION_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const questionTypeSchema = z.enum(QUESTION_TYPES);
export const difficultySchema = z.enum(DIFFICULTIES);



const questionBase = {
  id: z.string().optional(),         
  keepImage: z.boolean().optional(), 
  text: z.string().trim().min(1).max(2000),
  marks: z.number().int().min(1).max(100).optional(),
};

const mcqQuestionSchema = z.object({
  ...questionBase,
  type: z.literal("MCQ"),
  options: z.array(z.string().trim().min(1)).min(2).max(6),
  correctOptionIndex: z.number().int().min(0),
});

const fillQuestionSchema = z.object({
  ...questionBase,
  type: z.literal("FILL"),
  correctAnswer: z.string().trim().min(1).max(500),
});

const imageQuestionSchema = z.object({
  ...questionBase,
  type: z.literal("IMAGE"),
  correctAnswer: z.string().trim().min(1).max(500),
});

export const createQuestionSchema = z
  .discriminatedUnion("type", [mcqQuestionSchema, fillQuestionSchema, imageQuestionSchema])
  .superRefine((q, ctx) => {
    if (q.type === "MCQ" && q.correctOptionIndex >= q.options.length) {
      ctx.addIssue({
        code: "custom",
        path: ["correctOptionIndex"],
        message: "Select the correct option",
      });
    }
  });


const detailFields = {
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().max(1000).nullish(),
  category: z.string().trim().min(2).max(50),
  difficulty: difficultySchema,
  durationMinutes: z.number().int().min(1).max(600),
};

export const createTestSchema = z.object({
  title: detailFields.title,
  description: detailFields.description,
  category: detailFields.category,
  difficulty: detailFields.difficulty.optional(),
  durationMinutes: detailFields.durationMinutes,
  questions: z.array(createQuestionSchema).min(1).max(MAX_QUESTIONS),
  publish: z.boolean().optional(),
});

export const updateTestDetailsSchema = z
  .object({
    title: detailFields.title.optional(),
    description: detailFields.description,
    category: detailFields.category.optional(),
    difficulty: detailFields.difficulty.optional(),
    durationMinutes: detailFields.durationMinutes.optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Nothing to update",
  });

export const testPublishSchema = z.object({
  isPublished: z.boolean(),
});

// ---------- List ----------

export const listTestsSchema = paginationSchema.extend({
  search: z.string().optional(),
  category: z.string().optional(),
  difficulty: difficultySchema.optional(),
  authorId: z.string().optional(),
  sort: z.enum(TEST_SORTS).optional(),
  mine: booleanFlagSchema,
});

// ---------- Types ----------

export type CreateQuestionFormInput = z.infer<typeof createQuestionSchema>;
export type CreateTestFormInput = z.infer<typeof createTestSchema>;
export type UpdateTestDetailsInput = z.infer<typeof updateTestDetailsSchema>;
export type ListTestsQuery = z.infer<typeof listTestsSchema>;