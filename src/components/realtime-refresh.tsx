"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TABLES = ["calendar_events", "expenses", "learning_sessions", "workout_sessions", "content_items", "daily_checkins", "revision_items", "workout_sets"];

/** Re-runs server components when any of the user's rows change (RLS limits what is received). */
export function RealtimeRefresh() {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => { clearTimeout(timer); timer = setTimeout(() => router.refresh(), 300); };
    const channel = supabase.channel("lifeos-changes");
    TABLES.forEach((table) => channel.on("postgres_changes", { event: "*", schema: "public", table }, refresh));
    channel.subscribe();
    return () => { clearTimeout(timer); supabase.removeChannel(channel); };
  }, [router]);
  return null;
}
