import { z } from "zod";

const intOrNull = (max: number) => z.number().int().min(0).max(max).nullable();

export const workoutSaveSchema = z.object({
  label: z.enum(["A", "B"]),
  program_id: z.string().uuid().nullable(),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().trim().max(1000),
  sets: z.array(z.object({
    exercise_id: z.string().uuid().nullable(),
    exercise_name: z.string().min(1).max(80),
    set_number: z.number().int().min(1).max(20),
    reps: intOrNull(1000), seconds: intOrNull(7200),
    weight_kg: z.number().min(0).max(1000).nullable(),
    rpe: z.number().min(1).max(10).nullable(),
  })).min(1, "Log at least one set").max(200),
});
export type WorkoutSaveInput = z.infer<typeof workoutSaveSchema>;

const n = (msg: string) => ({ required_error: msg, invalid_type_error: msg });
export const exerciseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  muscle_group: z.string().trim().max(60),
  movement_type: z.string().trim().max(60),
  equipment: z.string().trim().max(80),
  sets: z.number(n("How many sets?")).int().min(1).max(10),
  mode: z.enum(["reps", "seconds"]),
  target: z.number(n("Set a target")).int().min(1).max(600),
  rest_seconds: z.number(n("Rest time?")).int().min(0).max(600),
  difficulty: z.number().int().min(1).max(5).optional(),
  notes: z.string().trim().max(500),
  instructions: z.string().trim().max(2000),
});
export type ExerciseInput = z.infer<typeof exerciseSchema>;
