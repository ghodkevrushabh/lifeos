import { z } from "zod";

export const learningSchema = z.object({
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  topic: z.string().trim().min(1, "What did you study?").max(160),
  category: z.string().trim().max(60),
  subtopic: z.string().trim().max(160),
  minutes: z.number({ required_error: "Enter minutes", invalid_type_error: "Enter minutes" })
    .int().min(1, "At least 1 minute").max(1440),
  confidence: z.number({ required_error: "Pick 1 to 10", invalid_type_error: "Pick 1 to 10" }).int().min(1).max(10),
  difficulty: z.number().int().min(1).max(5).optional(),
  what_learned: z.string().trim().max(2000),
  confused: z.string().trim().max(2000),
  notes: z.string().trim().max(2000),
  resources: z.string().trim().max(1000),
  next_action: z.string().trim().max(500),
  add_to_revision: z.boolean(),
});
export type LearningInput = z.infer<typeof learningSchema>;
