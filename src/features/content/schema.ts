import { z } from "zod";

export const STATUSES = ["idea", "planned", "scripted", "recorded", "editing", "ready", "posted"] as const;
export type Status = (typeof STATUSES)[number];

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date").or(z.literal(""));
const url = z.string().trim().max(500).refine((v) => v === "" || /^https?:\/\//.test(v), "Must start with http:// or https://");
const metric = z.number().int().min(0).max(1_000_000_000).optional();

export const contentSchema = z.object({
  idea: z.string().trim().min(1, "What is the idea?").max(200),
  hook: z.string().trim().max(300),
  caption: z.string().trim().max(2200),
  topic: z.string().trim().max(80),
  platform: z.string().trim().max(40),
  status: z.enum(STATUSES),
  planned_date: date,
  published_date: date,
  reference_url: url,
  thumbnail_url: url,
  notes: z.string().trim().max(1000),
  views: metric, likes: metric, comments: metric, shares: metric, saves: metric,
  followers_gained: z.number().int().min(-1_000_000).max(1_000_000_000).optional(),
});
export type ContentInput = z.infer<typeof contentSchema>;

export const scheduleSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  interval_days: z.number().int().min(1).max(30),
});
