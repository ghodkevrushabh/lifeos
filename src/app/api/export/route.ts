import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { toCsv } from "@/lib/utils/csv";

type Row = Record<string, unknown>;
type Client = Awaited<ReturnType<typeof createClient>>;

const DATASETS: Record<string, { columns: string[]; load: (s: Client) => Promise<Row[]> }> = {
  expenses: {
    columns: ["spent_on", "amount", "category", "description", "payment_method", "notes"],
    load: async (s) => (await fetchAll<Row>((f, t) => s.from("expenses").select("spent_on,amount,category,description,payment_method,notes").order("spent_on").order("id").range(f, t))).data ?? [],
  },
  learning: {
    columns: ["session_date", "topic", "category", "subtopic", "minutes", "confidence", "difficulty", "what_learned", "confused", "notes", "resources", "next_action"],
    load: async (s) => (await fetchAll<Row>((f, t) => s.from("learning_sessions").select("session_date,topic,category,subtopic,minutes,confidence,difficulty,what_learned,confused,notes,resources,next_action").order("session_date").order("id").range(f, t))).data ?? [],
  },
  workouts: {
    columns: ["session_date", "workout_label", "exercise_name", "set_number", "reps", "weight_kg", "seconds", "rpe"],
    load: async (s) => ((await fetchAll<Row>((f, t) => s.from("workout_sets").select("session_date,exercise_name,set_number,reps,weight_kg,seconds,rpe,workout_sessions(workout_label)").order("session_date").order("id").range(f, t))).data ?? [])
      .map(({ workout_sessions, ...r }) => ({ ...r, workout_label: (workout_sessions as { workout_label?: string } | null)?.workout_label ?? null })),
  },
  content: {
    columns: ["idea", "hook", "caption", "topic", "platform", "status", "planned_date", "published_date", "reference_url", "notes", "views", "likes", "comments", "shares", "saves", "followers_gained"],
    load: async (s) => ((await fetchAll<Row>((f, t) => s.from("content_items").select("idea,hook,caption,topic,platform,status,planned_date,published_date,reference_url,notes,content_metrics(views,likes,comments,shares,saves,followers_gained)").order("created_at").order("id").range(f, t))).data ?? [])
      .map(({ content_metrics, ...r }) => ({ ...r, ...((content_metrics as Row[] | null)?.[0] ?? {}) })),
  },
};

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type") ?? "";
  const format = req.nextUrl.searchParams.get("format") === "csv" ? "csv" : "json";
  const stamp = new Date().toISOString().slice(0, 10);
  const headers = (name: string, mime: string) => ({ "Content-Type": `${mime}; charset=utf-8`, "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" });

  if (type === "all") {
    if (format === "csv") return NextResponse.json({ error: "Use format=json for a full backup" }, { status: 400 });
    const entries = await Promise.all(Object.entries(DATASETS).map(async ([k, d]) => [k, await d.load(supabase)] as const));
    return new NextResponse(JSON.stringify({ exported_at: new Date().toISOString(), ...Object.fromEntries(entries) }, null, 2), { headers: headers(`lifeos-backup-${stamp}.json`, "application/json") });
  }
  const ds = DATASETS[type];
  if (!ds) return NextResponse.json({ error: "Unknown dataset" }, { status: 400 });
  const rows = await ds.load(supabase);
  return format === "csv"
    ? new NextResponse(toCsv(rows, ds.columns), { headers: headers(`lifeos-${type}-${stamp}.csv`, "text/csv") })
    : new NextResponse(JSON.stringify(rows, null, 2), { headers: headers(`lifeos-${type}-${stamp}.json`, "application/json") });
}
