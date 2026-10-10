export type CalendarEvent = {
  id: string; title: string; description: string | null;
  category: "workout" | "learning" | "content" | "personal" | "work" | "other";
  event_date: string; start_time: string | null; end_time: string | null;
};
export type CalendarItem = {
  id: string; kind: "event" | "content" | "workout" | "learning";
  title: string; date: string; time: string | null;
  category: CalendarEvent["category"]; href?: string; event?: CalendarEvent;
};
export type View = "month" | "week" | "day";
