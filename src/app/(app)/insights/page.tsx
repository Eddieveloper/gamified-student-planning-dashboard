"use client";

import {
  BarChart3,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Flame,
  Leaf,
  ListChecks,
  PieChart,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AreaLine, Donut, WeeklyBars } from "@/components/charts";
import { useToast } from "@/components/toast";
import { Badge, Button, Card, CardHeader, EmptyState, IconButton, Skeleton } from "@/components/ui";
import { api } from "@/lib/client";
import {
  addDaysISO,
  cn,
  minutesToHM,
  prettyDate,
  startOfWeekISO,
  todayISO,
} from "@/lib/utils";

type Insights = {
  monday: string;
  sunday: string;
  today: string;
  calorieGoal: number;
  studyGoalMinutes: number;
  days: {
    date: string;
    studyMinutes: number;
    calories: number;
    mealCount: number;
    activitiesDone: number;
    activitiesTotal: number;
  }[];
  subjectTotals: { subjectId: string | null; name: string; color: string; minutes: number }[];
  streak: number;
  totals: {
    studyMinutes: number;
    avgCalories: number;
    activitiesDone: number;
    activitiesTotal: number;
    completionRate: number | null;
    bestDay: string | null;
  };
};

export default function InsightsPage() {
  const { toast } = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState<Insights | null>(null);

  const weekAnchor = addDaysISO(todayISO(), weekOffset * 7);
  const monday = startOfWeekISO(weekAnchor);

  const load = useCallback(async () => {
    try {
      setData(await api<Insights>(`/api/insights?week=${monday}`));
    } catch {
      toast("Couldn't load insights", "error");
    }
  }, [monday, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const noStudy = data && data.totals.studyMinutes === 0;
  const noMeals = data && data.days.every((d) => d.mealCount === 0);

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-widest text-rose-400 uppercase">Insights</p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-[#3f1d2e] sm:text-4xl">
            Week in review
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            title="Previous week"
            onClick={() => setWeekOffset((o) => o - 1)}
            className="bg-white ring-1 ring-rose-100"
          >
            <ChevronLeft className="size-4.5" />
          </IconButton>
          <Badge className="bg-white px-3 py-1.5 text-[#7c4a5e] ring-1 ring-rose-100">
            {prettyDate(data?.monday ?? monday).replace(/, \d{4}$/, "")} –{" "}
            {prettyDate(data?.sunday ?? addDaysISO(monday, 6)).replace(/, \d{4}$/, "")}
          </Badge>
          <IconButton
            title="Next week"
            onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
            disabled={weekOffset >= 0}
            className="bg-white ring-1 ring-rose-100"
          >
            <ChevronRight className="size-4.5" />
          </IconButton>
          {weekOffset !== 0 && (
            <Button variant="soft" size="sm" onClick={() => setWeekOffset(0)}>
              This week
            </Button>
          )}
        </div>
      </div>

      {!data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              icon={<BookOpenText className="size-5" />}
              label="Total focus"
              value={minutesToHM(data.totals.studyMinutes)}
              sub={
                data.totals.bestDay
                  ? `Best: ${prettyDate(data.totals.bestDay).split(",")[0]}`
                  : "Log a session to start"
              }
            />
            <StatTile
              icon={<Flame className="size-5" />}
              label="Avg calories"
              value={data.totals.avgCalories ? `${data.totals.avgCalories}` : "—"}
              sub={`Goal ${data.calorieGoal} kcal`}
            />
            <StatTile
              icon={<ListChecks className="size-5" />}
              label="Tasks completed"
              value={
                data.totals.completionRate === null
                  ? "—"
                  : `${data.totals.completionRate}%`
              }
              sub={
                data.totals.activitiesTotal
                  ? `${data.totals.activitiesDone} of ${data.totals.activitiesTotal} tasks`
                  : "No tasks this week"
              }
            />
            <StatTile
              icon={<Flower2 className="size-5" />}
              label="Study streak"
              value={`${data.streak} day${data.streak === 1 ? "" : "s"}`}
              sub={
                data.streak >= 7
                  ? "Greenhouse energy"
                  : data.streak >= 3
                  ? "Roots taking hold"
                  : "Keep watering"
              }
              highlight={data.streak >= 3}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Study bars */}
            <Card>
              <CardHeader
                icon={<BarChart3 className="size-5" />}
                title="Focus time"
                subtitle={`Daily goal ${minutesToHM(data.studyGoalMinutes)} — dashed line`}
              />
              <div className="px-5 pb-5 sm:px-6">
                {noStudy ? (
                  <EmptyState
                    compact
                    icon={<Leaf className="size-6" />}
                    title="No focus logged this week"
                    hint="Head to Overview and log a session — the bars will spring up here."
                  />
                ) : (
                  <WeeklyBars
                    goal={data.studyGoalMinutes}
                    data={data.days.map((d) => ({
                      date: d.date,
                      value: d.studyMinutes,
                      isToday: d.date === data.today,
                    }))}
                  />
                )}
              </div>
            </Card>

            {/* Calories line */}
            <Card>
              <CardHeader
                icon={<Flame className="size-5" />}
                title="Fuel intake"
                subtitle={`Daily goal ${data.calorieGoal} kcal — dashed line`}
              />
              <div className="px-5 pb-5 sm:px-6">
                {noMeals ? (
                  <EmptyState
                    compact
                    icon={<Leaf className="size-6" />}
                    title="No meals logged this week"
                    hint="Log your meals on the Overview page to draw this curve."
                  />
                ) : (
                  <AreaLine
                    goal={data.calorieGoal}
                    data={data.days.map((d) => ({
                      date: d.date,
                      value: d.mealCount > 0 ? d.calories : null,
                      isToday: d.date === data.today,
                    }))}
                    formatLabel={(p) =>
                      `${prettyDate(p.date)}: ${p.value ?? 0} kcal`
                    }
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Donut */}
          <Card>
            <CardHeader
              icon={<PieChart className="size-5" />}
              title="Subject distribution"
              subtitle="Where this week's focus went"
            />
            <div className="px-5 pb-6 sm:px-6">
              {data.subjectTotals.length === 0 ? (
                <EmptyState
                  compact
                  icon={<PieChart className="size-6" />}
                  title="Nothing to slice yet"
                  hint="Study sessions tagged with subjects build this donut."
                />
              ) : (
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
                  <Donut
                    segments={data.subjectTotals.map((s) => ({
                      label: s.name,
                      value: s.minutes,
                      color: s.color,
                    }))}
                    centerTop={minutesToHM(data.totals.studyMinutes)}
                    centerBottom="this week"
                  />
                  <ul className="w-full max-w-xs space-y-2.5">
                    {data.subjectTotals.map((s) => {
                      const pct = data.totals.studyMinutes
                        ? Math.round((s.minutes / data.totals.studyMinutes) * 100)
                        : 0;
                      return (
                        <li key={s.name} className="flex items-center gap-3">
                          <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ background: s.color }}
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#3f1d2e]">
                            {s.name}
                          </span>
                          <span className="text-xs font-bold text-[#a86b80]">
                            {minutesToHM(s.minutes)}
                          </span>
                          <span className="w-9 text-right text-xs font-bold text-rose-500">
                            {pct}%
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {data.streak >= 5 && (
            <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-pink-500 to-rose-500 p-5 text-white shadow-[0_10px_30px_-10px_rgba(236,72,153,0.6)]">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20">
                <Trophy className="size-6" />
              </div>
              <div>
                <p className="font-display text-lg font-bold">
                  {data.streak}-day streak — you&rsquo;re unstoppable
                </p>
                <p className="text-xs text-pink-100">
                  Five or more days of hitting your study goal. The whole garden is jealous.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn("p-4", highlight && "bg-gradient-to-br from-rose-50 to-pink-50")}>
      <div className="flex items-center gap-2 text-rose-400">{icon}</div>
      <p className="mt-2 text-[11px] font-bold tracking-wider text-[#c493a6] uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-display text-2xl font-black text-[#3f1d2e]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[#a86b80]">{sub}</p>
    </Card>
  );
}
