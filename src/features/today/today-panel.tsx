import Link from "next/link";
import { BookOpen, Check, ClipboardCheck, Dumbbell, Video, Wallet, type LucideIcon } from "lucide-react";
import { formatMoney } from "@/lib/utils/format";
import { Gauge } from "@/components/ui/gauge";
import { LogLearningButton } from "@/features/learning/log-learning";
import { AddExpenseButton } from "@/features/expenses/expense-dialog";
import { todayFlags } from "./flags";
import type { DashboardData } from "./queries";

function Row({ icon: Icon, tint, title, detail, done, action }: {
  icon: LucideIcon; tint: string; title: string; detail: string; done?: boolean; action?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tint}`}><Icon className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted">{detail}</div>
      </div>
      {done
        ? <span className="grid size-6 place-items-center rounded-full bg-foreground/10" role="img" aria-label="Done"><Check className="size-4" /></span>
        : action}
    </li>
  );
}

export function TodayPanel({ data, currency, categories, revisionCount, today, plan, expenseCategories }: {
  data: DashboardData; currency: string; categories: string[]; revisionCount: number; today: string;
  plan: { exercises: number; sets: number } | null; expenseCategories: string[];
}) {
  const t = data.today_;
  return (
    <section aria-labelledby="today-h" className="surface p-5 md:p-6">
      <h2 id="today-h" className="sr-only">Today</h2>
      <div className="flex flex-col items-center gap-6 md:flex-row">
        <Gauge segments={todayFlags(data)} />
        <ul className="w-full divide-y divide-border">
          <Row icon={Dumbbell} tint="bg-workout/15 text-workout" title="Workout" done={t.workout.done}
            detail={t.workout.done ? `Workout ${t.workout.label} completed`
              : plan ? `Workout ${t.workout.label}: ${plan.exercises} exercises, ${plan.sets} sets` : `Workout ${t.workout.label} is next`}
            action={<Link href={`/workout/log?label=${t.workout.label}`} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-card-2">Start</Link>} />
          <Row icon={BookOpen} tint="bg-learning/15 text-learning" title="Learning" done={t.learningDone}
            detail={t.learningDone ? "Session logged" : revisionCount > 0 ? `Not logged yet. ${revisionCount} to revise` : "Not logged yet"}
            action={<LogLearningButton categories={categories} today={today} variant="prompt" />} />
          <Row icon={Video} tint="bg-content/15 text-content" title="Content" done={t.reelPostedToday}
            detail={t.reelToday ? `Scheduled: ${t.reelToday.idea}` : "Nothing scheduled"}
            action={<Link href={t.reelToday ? `/content?item=${t.reelToday.id}` : "/content"} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-card-2">{t.reelToday ? "Open" : "Plan"}</Link>} />
          <Row icon={Wallet} tint="bg-money/15 text-money" title="Expenses" done={t.spentToday > 0}
            detail={`${formatMoney(t.spentToday, currency)} spent today`}
            action={<AddExpenseButton categories={expenseCategories} today={today} variant="prompt" />} />
          <Row icon={ClipboardCheck} tint="bg-personal/15 text-personal" title="Check-in" done={!!t.checkin}
            detail={t.checkin ? "Saved" : "Takes 15 seconds"} />
        </ul>
      </div>
    </section>
  );
}
