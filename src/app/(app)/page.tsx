"use client";

import {
  ArrowRight,
  BookOpenText,
  Check,
  CheckCircle2,
  ClipboardList,
  Drama,
  Flame,
  Hourglass,
  ListChecks,
  Plus,
  Timer,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Ring } from "@/components/charts";
import { useToast } from "@/components/toast";
import { Tulip } from "@/components/tulip";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  IconButton,
  ProgressBar,
  Skeleton,
  inputCls,
} from "@/components/ui";
import { api } from "@/lib/client";
import { STAGE_META, type TulipResult } from "@/lib/tulip";
import { MEAL_TYPES, minutesToHM, prettyDate, todayISO, cn } from "@/lib/utils";

type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  mealType: string;
};
type Study = {
  id: string;
  minutes: number;
  note: string;
  subjectId: string | null;
  subjectName: string | null;
  subjectColor: string | null;
};
type Activity = {
  id: string;
  title: string;
  date: string;
  type: string;
  status: string;
  priority: string;
  estimateMinutes: number;
  subjectName: string | null;
  subjectColor: string | null;
};
type Subject = { id: string; name: string; color: string; code: string };

type Overview = {
  date: string;
  settings: { calorieGoal: number; studyGoalMinutes: number };
  subjects: Subject[];
  meals: Meal[];
  study: Study[];
  activities: Activity[];
  overdue: Activity[];
  totals: {
    calories: number;
    protein: number;
    studyMinutes: number;
    activitiesDone: number;
    activitiesTotal: number;
  };
  tulip: TulipResult;
  debt: {
    overdueCount: number;
    overdueMinutes: number;
    missedStudyDays: number;
    studyDebtMinutes: number;
    totalMinutes: number;
  };
};

const MEAL_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export default function OverviewPage() {
  const { toast } = useToast();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prevStage = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<Overview>(`/api/overview?date=${todayISO()}`);
      setData((prev) => {
        if (prevStage.current && prevStage.current !== "bloom" && d.tulip.stage === "bloom" && prev) {
          toast("Your tulip is in full bloom! Beautiful day.", "bloom");
        }
        prevStage.current = d.tulip.stage;
        return d;
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !data) {
    return (
      <Card>
        <EmptyState
          icon={<Drama className="size-6" />}
          title="Couldn't load your day"
          hint={error}
          action={<Button onClick={() => load()}>Try again</Button>}
        />
      </Card>
    );
  }

  if (!data) return <OverviewSkeleton />;

  const { tulip, totals, settings } = data;
  const calorieRatio = totals.calories / settings.calorieGoal;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const tasksLeft = data.activities.filter((a) => a.status !== "done").length;

  return (
    <div className="animate-fade-up space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-widest text-rose-400 uppercase">
            {prettyDate(data.date)}
          </p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-[#3f1d2e] sm:text-4xl">
            {greeting} — let&rsquo;s make it bloom
          </h1>
        </div>
        <Badge className="bg-white text-[#a86b80] ring-1 ring-rose-100">
          <ListChecks className="size-3.5 text-rose-400" />
          {tasksLeft === 0
            ? "All clear for today"
            : `${tasksLeft} task${tasksLeft > 1 ? "s" : ""} left today`}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Tulip card */}
        <Card className="relative overflow-hidden xl:row-span-2">
          <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-pink-100/70 blur-3xl" />
          <CardHeader
            icon={<Flame className="size-5" />}
            title="Daily tulip"
            subtitle="Grows as you complete your plan"
            action={
              <Badge className="bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                {tulip.percent}%
              </Badge>
            }
          />
          <div className="px-6 pb-6">
            <div className="mx-auto max-w-55">
              <Tulip stage={tulip.stage} className="w-full" />
            </div>
            <div className="mt-2 text-center">
              <p className="font-display text-lg font-bold text-[#3f1d2e]">
                {STAGE_META[tulip.stage].title}
              </p>
              <p className="mt-0.5 text-xs text-[#a86b80]">
                {STAGE_META[tulip.stage].hint}
              </p>
            </div>
            <ProgressBar ratio={tulip.percent / 100} className="mt-4" />
            <div className="mt-4 space-y-2">
              {tulip.tasks.map((t) => {
                const full = t.earned >= t.points;
                return (
                  <div
                    key={t.key}
                    className="flex items-center gap-2.5 rounded-2xl border border-rose-50 bg-[#fff8fb] px-3 py-2"
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full",
                        full
                          ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white"
                          : "border border-dashed border-rose-200 text-transparent"
                      )}
                    >
                      <Check className="size-3.5" />
                    </span>
                    <p className="flex-1 text-xs font-medium text-[#7c4a5e]">{t.label}</p>
                    <span
                      className={cn(
                        "text-[11px] font-bold",
                        full ? "text-rose-500" : "text-[#c493a6]"
                      )}
                    >
                      {t.earned}/{t.points}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Right column */}
        <div className="space-y-6 xl:col-span-2">
          {/* Stat tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="flex items-center gap-4 p-4">
              <Ring ratio={calorieRatio} size={86} stroke={9}>
                <div>
                  <p className="text-base leading-none font-bold text-[#3f1d2e]">
                    {totals.calories}
                  </p>
                  <p className="text-[9px] font-semibold tracking-wide text-[#c493a6] uppercase">
                    kcal
                  </p>
                </div>
              </Ring>
              <div>
                <p className="text-xs font-bold tracking-wide text-[#c493a6] uppercase">Fuel</p>
                <p className="mt-0.5 text-sm font-bold text-[#3f1d2e]">
                  {Math.max(0, settings.calorieGoal - totals.calories)} kcal left
                </p>
                <p className="mt-0.5 text-[11px] text-[#a86b80]">
                  {totals.protein}g protein · of {settings.calorieGoal}
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-4">
              <div className="grid shrink-0 place-items-center">
                <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100/60">
                  <Timer className="size-7 text-rose-400" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold tracking-wide text-[#c493a6] uppercase">Focus</p>
                <p className="mt-0.5 text-sm font-bold text-[#3f1d2e]">
                  {minutesToHM(totals.studyMinutes)}{" "}
                  <span className="font-medium text-[#a86b80]">
                    / {minutesToHM(settings.studyGoalMinutes)}
                  </span>
                </p>
                <ProgressBar
                  ratio={totals.studyMinutes / settings.studyGoalMinutes}
                  className="mt-1.5 h-1.5"
                />
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-4">
              <div className="grid shrink-0 place-items-center">
                <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100/60">
                  <ClipboardList className="size-7 text-rose-400" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold tracking-wide text-[#c493a6] uppercase">Day plan</p>
                <p className="mt-0.5 text-sm font-bold text-[#3f1d2e]">
                  {totals.activitiesDone}/{totals.activitiesTotal} done
                </p>
                <ProgressBar
                  ratio={
                    totals.activitiesTotal
                      ? totals.activitiesDone / totals.activitiesTotal
                      : 1
                  }
                  className="mt-1.5 h-1.5"
                />
              </div>
            </Card>
          </div>

          {/* Debt banner */}
          {data.debt.totalMinutes > 0 && (
            <Link
              href="/history"
              className="group flex flex-wrap items-center gap-4 rounded-3xl bg-gradient-to-r from-rose-500 to-pink-500 p-4 text-white shadow-[0_10px_30px_-10px_rgba(225,29,72,0.5)] transition-all hover:shadow-[0_14px_36px_-10px_rgba(225,29,72,0.65)]"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/20">
                <Hourglass className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  Debt alert: you owe {minutesToHM(data.debt.totalMinutes)}
                </p>
                <p className="text-xs text-pink-100">
                  {data.debt.studyDebtMinutes > 0 &&
                    `${minutesToHM(data.debt.studyDebtMinutes)} study shortfall`}
                  {data.debt.studyDebtMinutes > 0 && data.debt.overdueCount > 0 && " + "}
                  {data.debt.overdueCount > 0 &&
                    `${data.debt.overdueCount} overdue task${data.debt.overdueCount > 1 ? "s" : ""}`}
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold transition-transform group-hover:translate-x-1">
                Catch up <ArrowRight className="size-4" />
              </span>
            </Link>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <MealsCard data={data} onChanged={load} />
            <StudyCard data={data} onChanged={load} />
          </div>

          <ActivitiesCard data={data} onChanged={load} />
        </div>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-9 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Skeleton className="h-[560px] xl:row-span-2" />
        <div className="space-y-6 xl:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
          <Skeleton className="h-56" />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Meals ---------------- */

function MealsCard({ data, onChanged }: { data: Overview; onChanged: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [mealType, setMealType] = useState("snack");
  const [adding, setAdding] = useState(false);

  const order = ["breakfast", "lunch", "dinner", "snack"];
  const meals = [...data.meals].sort(
    (a, b) => order.indexOf(a.mealType) - order.indexOf(b.mealType)
  );

  async function addMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !calories) return;
    setAdding(true);
    try {
      await api("/api/meals", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          calories: Number(calories),
          protein: protein ? Number(protein) : 0,
          mealType,
          date: data.date,
        }),
      });
      setName("");
      setCalories("");
      setProtein("");
      toast("Meal logged — tulip watered!");
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add", "error");
    } finally {
      setAdding(false);
    }
  }

  async function removeMeal(id: string) {
    try {
      await api(`/api/meals/${id}`, { method: "DELETE" });
      onChanged();
    } catch {
      toast("Couldn't delete meal", "error");
    }
  }

  return (
    <Card>
      <CardHeader
        icon={<UtensilsCrossed className="size-5" />}
        title="Today's fuel"
        subtitle={`${data.meals.length} logged · ${data.totals.calories} kcal`}
      />
      <div className="px-4 pb-4 sm:px-5">
        {meals.length === 0 ? (
          <EmptyState
            compact
            icon={<UtensilsCrossed className="size-6" />}
            title="Nothing logged yet"
            hint="Breakfast is brain food — log your first meal."
          />
        ) : (
          <ul className="mt-2 divide-y divide-rose-50">
            {meals.map((m) => (
              <li key={m.id} className="group flex items-center gap-3 py-2.5">
                <Badge className="w-20 shrink-0 justify-center bg-rose-50 text-rose-500">
                  {MEAL_LABEL[m.mealType] ?? "Snack"}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#3f1d2e]">{m.name}</p>
                  <p className="text-[11px] text-[#c493a6]">
                    {m.calories} kcal{m.protein > 0 ? ` · ${m.protein}g protein` : ""}
                  </p>
                </div>
                <IconButton
                  title="Delete meal"
                  onClick={() => removeMeal(m.id)}
                  className="opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={addMeal}
          className="mt-3 space-y-2 rounded-2xl border border-rose-100 bg-[#fff8fb] p-3"
        >
          <div className="flex gap-2">
            <input
              className={cn(inputCls, "flex-1")}
              placeholder="Add a meal…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              className={cn(inputCls, "w-28 shrink-0")}
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
            >
              {MEAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              className={cn(inputCls, "w-24")}
              placeholder="kcal"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value.replace(/[^\d]/g, ""))}
            />
            <input
              className={cn(inputCls, "w-24")}
              placeholder="protein g"
              inputMode="numeric"
              value={protein}
              onChange={(e) => setProtein(e.target.value.replace(/[^\d]/g, ""))}
            />
            <Button
              type="submit"
              size="sm"
              className="ml-auto"
              disabled={adding || !name.trim() || !calories}
            >
              <Plus className="size-4" /> Log
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}

/* ---------------- Study ---------------- */

function StudyCard({ data, onChanged }: { data: Overview; onChanged: () => void }) {
  const { toast } = useToast();
  const [subjectId, setSubjectId] = useState("");
  const [minutes, setMinutes] = useState("45");
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);

  async function addSession(e: React.FormEvent) {
    e.preventDefault();
    if (!minutes) return;
    setAdding(true);
    try {
      await api("/api/study", {
        method: "POST",
        body: JSON.stringify({
          subjectId: subjectId || null,
          minutes: Number(minutes),
          note: note.trim(),
          date: data.date,
        }),
      });
      setNote("");
      toast(`+${minutesToHM(Number(minutes))} of focus`);
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add", "error");
    } finally {
      setAdding(false);
    }
  }

  async function removeSession(id: string) {
    try {
      await api(`/api/study/${id}`, { method: "DELETE" });
      onChanged();
    } catch {
      toast("Couldn't delete session", "error");
    }
  }

  return (
    <Card>
      <CardHeader
        icon={<BookOpenText className="size-5" />}
        title="Focus sessions"
        subtitle={`${minutesToHM(data.totals.studyMinutes)} of ${minutesToHM(data.settings.studyGoalMinutes)} today`}
      />
      <div className="px-4 pb-4 sm:px-5">
        {data.study.length === 0 ? (
          <EmptyState
            compact
            icon={<BookOpenText className="size-6" />}
            title="No sessions yet"
            hint="Even one 25-minute pomodoro moves the needle."
          />
        ) : (
          <ul className="mt-2 divide-y divide-rose-50">
            {data.study.map((s) => (
              <li key={s.id} className="group flex items-center gap-3 py-2.5">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: s.subjectColor ?? "#f9a8d4" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#3f1d2e]">
                    {s.subjectName ?? "Untracked"}
                  </p>
                  {s.note && <p className="truncate text-[11px] text-[#c493a6]">{s.note}</p>}
                </div>
                <Badge className="bg-rose-50 text-rose-600">{minutesToHM(s.minutes)}</Badge>
                <IconButton
                  title="Delete session"
                  onClick={() => removeSession(s.id)}
                  className="opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={addSession}
          className="mt-3 space-y-2 rounded-2xl border border-rose-100 bg-[#fff8fb] p-3"
        >
          <div className="flex gap-2">
            {data.subjects.length > 0 ? (
              <select
                className={cn(inputCls, "flex-1")}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">Untracked study</option>
                {data.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <Link
                href="/subjects"
                className="flex flex-1 items-center rounded-2xl border border-dashed border-rose-200 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50"
              >
                + Add a subject first
              </Link>
            )}
            <input
              className={cn(inputCls, "w-20 shrink-0")}
              placeholder="min"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.replace(/[^\d]/g, ""))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[25, 45, 60, 90].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutes(String(m))}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-bold transition-all",
                  minutes === String(m)
                    ? "bg-rose-500 text-white"
                    : "bg-white text-[#a86b80] ring-1 ring-rose-100 hover:text-rose-500"
                )}
              >
                {m}m
              </button>
            ))}
            <input
              className={cn(inputCls, "min-w-0 flex-1")}
              placeholder="Note (optional)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={adding || !minutes}>
              <Plus className="size-4" /> Log
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}

/* ---------------- Activities ---------------- */

function ActivitiesCard({ data, onChanged }: { data: Overview; onChanged: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("task");
  const [adding, setAdding] = useState(false);

  async function toggle(a: Activity) {
    const next = a.status === "done" ? "pending" : "done";
    try {
      await api(`/api/activities/${a.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      if (next === "done") toast("Nice — one petal closer.");
      onChanged();
    } catch {
      toast("Couldn't update task", "error");
    }
  }

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      await api("/api/activities", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), type, date: data.date }),
      });
      setTitle("");
      toast("Added to today's plan");
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add", "error");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Card>
      <CardHeader
        icon={<CheckCircle2 className="size-5" />}
        title="Today's plan"
        subtitle={
          data.overdue.length > 0
            ? `${data.overdue.length} overdue · see History to catch up`
            : "Everything due today"
        }
        action={
          <Link
            href="/calendar"
            className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600"
          >
            Plan ahead <ArrowRight className="size-3.5" />
          </Link>
        }
      />
      <div className="px-4 pb-4 sm:px-5">
        {data.activities.length === 0 ? (
          <EmptyState
            compact
            icon={<CheckCircle2 className="size-6" />}
            title="A clean slate"
            hint="Nothing due today — add a task or enjoy the calm."
          />
        ) : (
          <ul className="mt-2 divide-y divide-rose-50">
            {data.activities.map((a) => (
              <li key={a.id} className="group flex items-center gap-3 py-2.5">
                <button
                  onClick={() => toggle(a)}
                  aria-label={a.status === "done" ? "Mark as pending" : "Mark as done"}
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all active:scale-90",
                    a.status === "done"
                      ? "border-transparent bg-gradient-to-br from-pink-500 to-rose-500 text-white"
                      : "border-rose-200 text-transparent hover:border-rose-400"
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3.5} />
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-semibold",
                      a.status === "done"
                        ? "text-[#c493a6] line-through decoration-rose-300"
                        : "text-[#3f1d2e]"
                    )}
                  >
                    {a.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    {a.subjectName && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold"
                        style={{ color: a.subjectColor ?? "#c493a6" }}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ background: a.subjectColor ?? "#f9a8d4" }}
                        />
                        {a.subjectName}
                      </span>
                    )}
                    <span className="text-[11px] text-[#c493a6] capitalize">
                      {a.type} · ~{minutesToHM(a.estimateMinutes)}
                    </span>
                  </div>
                </div>
                {a.priority === "high" && a.status !== "done" && (
                  <Badge className="bg-rose-100 text-rose-600">High</Badge>
                )}
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={quickAdd}
          className="mt-3 flex gap-2 rounded-2xl border border-rose-100 bg-[#fff8fb] p-3"
        >
          <input
            className={cn(inputCls, "flex-1")}
            placeholder="Quick-add a task for today…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className={cn(inputCls, "w-30 shrink-0")}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="task">Task</option>
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
            <option value="study">Study</option>
            <option value="event">Event</option>
          </select>
          <Button type="submit" size="sm" disabled={adding || !title.trim()}>
            <Plus className="size-4" />
            Add
          </Button>
        </form>
      </div>
    </Card>
  );
}
