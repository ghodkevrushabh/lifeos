import { BarChart3, BookOpen, CalendarDays, Dumbbell, LayoutDashboard, NotebookPen, Settings, Video, Wallet, type LucideIcon } from "lucide-react";

// `tint` is the domain color: the same hue is used for that domain everywhere in the app.
export type NavItem = { href: string; label: string; icon: LucideIcon; mobile: boolean; tint: string };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard, mobile: true, tint: "text-foreground" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, mobile: true, tint: "text-work" },
  { href: "/learning", label: "Learning", icon: BookOpen, mobile: true, tint: "text-learning" },
  { href: "/workout", label: "Workout", icon: Dumbbell, mobile: true, tint: "text-workout" },
  { href: "/expenses", label: "Expenses", icon: Wallet, mobile: true, tint: "text-money" },
  { href: "/content", label: "Content", icon: Video, mobile: false, tint: "text-content" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, mobile: false, tint: "text-muted" },
  { href: "/review", label: "Review", icon: NotebookPen, mobile: false, tint: "text-personal" },
  { href: "/settings", label: "Settings", icon: Settings, mobile: false, tint: "text-muted" },
];
