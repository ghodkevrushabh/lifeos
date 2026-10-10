import { z } from "zod";

export const EVENT_CATEGORIES = ["workout", "learning", "content", "personal", "work", "other"] as const;
const time = z.string().regex(/^(\d{2}:\d{2})?$/, "Use HH:MM");

export const eventSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    category: z.enum(EVENT_CATEGORIES),
    event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
    start_time: time,
    end_time: time,
    description: z.string().trim().max(1000),
  })
  .superRefine((v, ctx) => {
    if (v.end_time && !v.start_time) ctx.addIssue({ code: "custom", path: ["start_time"], message: "Add a start time" });
    if (v.end_time && v.start_time && v.end_time < v.start_time)
      ctx.addIssue({ code: "custom", path: ["end_time"], message: "End must be after start" });
  });
export type EventInput = z.infer<typeof eventSchema>;
