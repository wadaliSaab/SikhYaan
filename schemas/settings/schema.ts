import { z } from "zod";


export const markReadSchema = z.object({
  id: z.string().min(1).optional(),
  scope: z.enum(["general", "all"]).optional(),
});

export const memberActionSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["suspend", "restore", "remove"]),
});

export const decideRequestSchema = z.object({
  id: z.string().min(1),
  approve: z.boolean(),
  note: z.string().trim().max(300).optional(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(200),
});