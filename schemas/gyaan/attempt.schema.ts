import { z } from "zod";

import { idSchema, paginationSchema } from "@/schemas/doubt/doubt.schema";

export { idSchema };


export const answerSchema = z.object({
  order: z.number().int().min(1),
  selectedOptionIndex: z.number().int().min(0).nullish(),
  answerText: z.string().trim().max(500).nullish(),
});


export const saveAnswerSchema = answerSchema;


export const submitAttemptSchema = z.object({
  answers: z.array(answerSchema).max(100).optional(),
});


export const listMyAttemptsSchema = paginationSchema.extend({
  testId: z.string().min(1).optional(),
});

export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type ListMyAttemptsQuery = z.infer<typeof listMyAttemptsSchema>;