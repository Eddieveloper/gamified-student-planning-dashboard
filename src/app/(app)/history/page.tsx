"use client";

import {
  BookOpenText,
  CalendarClock,
  CheckCheck,
  ClipboardList,
  Drama,
  Flower2,
  Flame,
  Hourglass,
  ScrollText,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ProgressBar,
  Skeleton,
} from "@/components/ui";
import { api } from "@/lib/client";
import {
  cn,
  minutesToHM,
  prettyDate,
  relativeDay,
  toISO,
} from "@/lib/utils";

type HistoryDay = {
  date: string;
  calories: number;
  mealCount: number;
  studyMinutes: number;
  studySessions: number;
  activitiesDone: number;
  activitiesTotal: number;
  goalMet: boolean;
};

type Overdue = {
  id: string;
  title: string;
  date: string;
  type: string;
  priority: string;
  estimateMinutes: number;
  subjectName: string | null;
  subjectColor: string | null;
};

type HistoryData = {
  today: string;
  calorieGoal: number;
  studyGoalMinutes: number;
  days: HistoryDay[];
  overdue: Overdue[];
  debt: {
    studyDebtMinutes: number;
    overdueMinutes: number;
    overdueCount: number;
    totalMinutes: number;
  };
};

export default function HistoryPage() {
  const { toast } = useToast();
  const [data, setData] = useState<HistoryData | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api<HistoryData>("/api/history"));
    } catch {
      toast("Couldn't load history", "error");
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function markDone(id: string, title: string) {
    try {
      await api(`/api/activities/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "done" }),
      });
      toast(`“${title}” cleared — debt shrinking!`);
      load();
    } catch {
      toast("Couldn't update", "error");
    }
  }

  async function moveToToday(id: string) {
    try {
      await api(`/api/activities/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ date: toISO(new Date()) }),
      });
      toast("Rescheduled to today");
      load();
    } catch {
      toast("Couldn't reschedule", "error");
    }
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const hasAnyData = data.days.some(
    (d) => d.mealCount > 0 || d.studyMinutes > 0 || d.activitiesTotal > 0
  );

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-rose-400 uppercase">History</p>
        <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-[#3f1d2e] sm:text-4xl">
          The last three weeks
        </h1>
      </div>

      {/* Debt card */}
      <Card className="overflow-hidden">
        <div
          className={cn(
            "p-5 sm:p-6",
            data.debt.totalMinutes > 0
              ? "bg-gradient-to-r from-rose-500/95 to-pink-500/95 text-white"
              : "bg-gradient-to-r from-emerald-50 to-rose-50"
          )}
        >
          <div className="flex flex-wrap items-center gap-4">
            <div
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-2xl",
                data.debt.totalMinutes > 0 ? "bg-white/20" : "bg-white text-emerald-500 shadow-sm"
              )}
            >
              {data.debt.totalMinutes > 0 ? (
                <Hourglass className="size-6" />
              ) : (
                <CheckCheck className="size-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {data.debt.totalMinutes > 0 ? (
                <>
                  <p className="font-display text-2xl font-black">
                    You owe {minutesToHM(data.debt.totalMinutes)}
                  </p>
                  <p className="mt-0.5 text-xs text-pink-100">
                    {data.debt.studyDebtMinutes > 0 &&
                      `${minutesToHM(data.debt.studyDebtMinutes)} study shortfall (past 2 weeks)`}
                    {data.debt.studyDebtMinutes > 0 && data.debt.overdueMinutes > 0 && " · "}
                    {data.debt.overdueMinutes > 0 &&
                      `${minutesToHM(data.debt.overdueMinutes)} across ${data.debt.overdueCount} overdue task${data.debt.overdueCount > 1 ? "s" : ""}`}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl font-black text-[#3f1d2e]">
                    Debt-free — immaculate
                  </p>
                  <p className="mt-0.5 text-xs text-[#a86b80]">
                    No overdue tasks and no study shortfall. Your tulip approves.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {data.overdue.length > 0 && (
          <div className="px-4 pb-4 sm:px-5">
            <p className="px-1 pt-4 pb-1 text-xs font-bold tracking-widest text-[#c493a6] uppercase">
              Overdue — clear these to pay down debt
            </p>
            <ul className="divide-y divide-rose-50">
              {data.overdue.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: a.subjectColor ?? "#f9a8d4" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#3f1d2e]">{a.title}</p>
                    <p className="text-[11px] text-rose-500">
                      {relativeDay(a.date, data.today)} · ~{minutesToHM(a.estimateMinutes)}
                      {a.subjectName ? ` · ${a.subjectName}` : ""}
                    </p>
                  </div>
                  {a.priority === "high" && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                      HIGH
                    </span>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="soft" onClick={() => moveToToday(a.id)}>
                      <CalendarClock className="size-3.5" /> Today
                    </Button>
                    <Button size="sm" onClick={() => markDone(a.id, a.title)}>
                      <CheckCheck className="size-3.5" /> Done
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader
          icon={<ScrollText className="size-5" />}
          title="Daily timeline"
          subtitle="Focus, fuel and tasks for the last 21 days"
        />
        {!hasAnyData ? (
          <EmptyState
            icon={<Drama className="size-6" />}
            title="Your history will grow here"
            hint="Log meals and study sessions and each day gets a row — like rings on a tree."
          />
        ) : (
          <ul className="divide-y divide-rose-50 px-2 pb-3 sm:px-4">
            {data.days.map((d) => {
              const isToday = d.date === data.today;
              return (
                <li
                  key={d.date}
                  className={cn(
                    "flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl px-3 py-3.5 transition-colors hover:bg-rose-50/60",
                    isToday && "bg-rose-50/80"
                  )}
                >
                  <div className="w-36 shrink-0">
                    <p className="text-sm font-bold text-[#3f1d2e]">
                      {relativeDay(d.date, data.today)}
                    </p>
                    <p className="text-[11px] text-[#c493a6]">{prettyDate(d.date)}</p>
                  </div>

                  <div className="flex min-w-40 flex-1 items-center gap-2">
                    <BookOpenText className="size-4 shrink-0 text-rose-300" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-[#7c4a5e]">
                          {minutesToHM(d.studyMinutes)}
                          <span className="font-normal text-[#c493a6]">
                            {" "}/ {minutesToHM(data.studyGoalMinutes)}
                          </span>
                        </span>
                        {d.goalMet && <Flower2 className="size-3.5 text-rose-500" />}
                      </div>
                      <ProgressBar
                        ratio={d.studyMinutes / data.studyGoalMinutes}
                        className="mt-1 h-1.5"
                        barClassName={d.goalMet ? undefined : "from-rose-300 to-pink-300"}
                      />
                    </div>
                  </div>

                  <div className="flex w-36 items-center gap-2">
                    <Flame className="size-4 shrink-0 text-rose-300" />
                    {d.mealCount > 0 ? (
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[#7c4a5e]">
                          {d.calories} kcal
                          <span className="font-normal text-[#c493a6]"> · {d.mealCount} meals</span>
                        </p>
                        <ProgressBar
                          ratio={Math.min(1.1, d.calories / data.calorieGoal)}
                          className="mt-1 h-1.5"
                          barClassName={
                            d.calories > data.calorieGoal * 1.05
                              ? "from-orange-400 to-red-400"
                              : undefined
                          }
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#d8b3c2] italic">no meals</span>
                    )}
                  </div>

                  <div className="ml-auto flex w-24 items-center justify-end gap-1.5 text-xs font-semibold text-[#7c4a5e]">
                    <ClipboardList className="size-4 text-rose-300" />
                    {d.activitiesTotal > 0 ? (
                      `${d.activitiesDone}/${d.activitiesTotal} tasks`
                    ) : (
                      <span className="text-[#d8b3c2] italic">—</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
