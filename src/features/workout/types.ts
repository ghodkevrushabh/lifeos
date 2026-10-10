export type Exercise = {
  id: string; position: number; name: string; muscle_group: string | null; movement_type: string | null;
  sets: number; target_reps: number | null; target_seconds: number | null; rest_seconds: number;
  difficulty: number | null; equipment: string | null; notes: string | null; instructions: string | null;
};
export type Program = { id: string; label: "A" | "B"; name: string; workout_exercises: Exercise[] };
