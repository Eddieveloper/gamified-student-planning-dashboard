"use client";

import {
  BookOpenText,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flower2,
  Flame,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast";
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Modal,
  Skeleton,
  inputCls,
} from "@/components/ui";
import { api } from "@/lib/client";
import {
  ACTIVITY_TYPES,
  activityTypeColor,
  addDaysISO,
  cn,
  fromISO,
  minutesToHM,
  MONTH_NAMES,
  prettyDate,
  todayISO,
  weekdayName,
} from "@/lib/utils";

type CalActivity = {
  id: string;
  title: string;
  date: string;
  type: string;
  status: string;
  priority: string;
  subjectName: string | null;
  subjectColor: string | null;
  estimateMinutes: number;
};

type CalDay = {
  calories: number;
  mealCount: number;
  studyMinutes: number;
  activities: CalActivity[];
};

type CalData = {
  monthStart: string;
  monthEnd: string;
  gridStart: string;
  gridEnd: string;
  days: Record<string, CalDay>;
  calorieGoal: number;
  studyGoalMinutes: number;
};

type Subject = { id: string; name: string; color: string };

export default function CalendarPage() {
  const { toast } = useToast();
  const [month, setMonth] = useState(() => todayISO().slice(0, 7));
  const [selected, setSelected] = useState(todayISO());
  const [data, setData] = useState<CalData | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modal, setModal] = useState<{
    open: boolean;
    editing: CalActivity | null;
  }>({ open: false, editing: null });

  const load = useCallback(async () => {
    try {
      const d = await api<CalData>(`/api/calendar?month=${month}`);
      setData(d);
    } catch {
      toast("Couldn't load calendar", "error");
    }
  }, [month, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api<{ subjects: Subject[] }>("/api/subjects")
      .then((d) => setSubjects(d.subjects))
      .catch(() => {});
  }, []);

  const gridDays = useMemo(() => {
    if (!data) return [];
    const out: string[] = [];
    for (let d = data.gridStart; d <= data.gridEnd; d = addDaysISO(d, 1)) out.push(d);
    return out;
  }, [data]);

  function shiftMonth(delta: number) {
    const [y, m] = month.split("-").map(Number);
    const next = new Date(y, m - 1 + delta, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  }

  async function toggleActivity(a: CalActivity) {
    if (!data) return;
    try {
      await api(`/api/activities/${a.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: a.status === "done" ? "pending" : "done" }),
      });
      load();
    } catch {
      toast("Couldn't update task", "error");
    }
  }

  async function removeActivity(id: string) {
    try {
      await api(`/api/activities/${id}`, { method: "DELETE" });
      toast("Activity deleted");
      load();
    } catch {
      toast("Couldn't delete", "error");
    }
  }

  const [y, m] = month.split("-").map(Number);
  const selectedDay = data?.days[selected];
  const t = todayISO();

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-widest text-rose-400 uppercase">Calendar</p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-[#3f1d2e] sm:text-4xl">
            {MONTH_NAMES[m - 1]} <span className="text-rose-400">{y}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="soft" size="sm" onClick={() => {
            setMonth(t.slice(0, 7));
            setSelected(t);
          }}>
            Today
          </Button>
          <IconButton title="Previous month" onClick={() => shiftMonth(-1)} className="bg-white ring-1 ring-rose-100">
            <ChevronLeft className="size-4.5" />
          </IconButton>
          <IconButton title="Next month" onClick={() => shiftMonth(1)} className="bg-white ring-1 ring-rose-100">
            <ChevronRight className="size-4.5" />
          </IconButton>
          <Button
            size="sm"
            onClick={() => setModal({ open: true, editing: null })}
          >
            <Plus className="size-4" /> Activity
          </Button>
        </div>
      </div>

      {!data ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-[560px]" />
          <Skeleton className="h-[400px]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
          {/* Month grid */}
          <Card className="p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1.5">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="pb-1 text-center text-[11px] font-bold tracking-wider text-[#c493a6] uppercase">
                  {d}
                </div>
              ))}
              {gridDays.map((iso) => {
                const day = data.days[iso];
                const inMonth = iso >= data.monthStart && iso <= data.monthEnd;
                const isToday = iso === t;
                const isSelected = iso === selected;
                const goalMet = day && day.studyMinutes >= data.studyGoalMinutes;
                return (
                  <button
                    key={iso}
                    onClick={() => setSelected(iso)}
                    className={cn(
                      "relative flex min-h-20 flex-col items-stretch gap-1 rounded-xl border p-1.5 text-left transition-all sm:min-h-24",
                      isSelected
                        ? "border-rose-400 bg-rose-50 shadow-[0_0_0_3px_rgba(251,113,133,0.15)]"
                        : "border-rose-100/70 bg-white hover:border-rose-200 hover:bg-rose-50/50",
                      !inMonth && "opacity-40"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-6 place-items-center self-start rounded-full text-xs font-bold",
                        isToday
                          ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white"
                          : "text-[#7c4a5e]"
                      )}
                    >
                      {fromISO(iso).getDate()}
                    </span>
                    {day && (day.activities.length > 0 || goalMet || day.calories > 0) && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 px-0.5">
                          {day.activities.slice(0, 4).map((a) => (
                            <span
                              key={a.id}
                              title={a.title}
                              className={cn("size-1.5 rounded-full", a.status === "done" && "opacity-30")}
                              style={{
                                background: a.subjectColor ?? activityTypeColor(a.type),
                              }}
                            />
                          ))}
                          {day.activities.length > 4 && (
                            <span className="text-[9px] font-bold text-[#c493a6]">
                              +{day.activities.length - 4}
                            </span>
                          )}
                          {goalMet && (
                            <Flower2 className="ml-auto size-3 text-rose-400" aria-label="Study goal met" />
                          )}
                        </div>
                        {day.calories > 0 && (
                          <span className="hidden items-center gap-0.5 px-0.5 text-[9px] font-semibold text-[#c493a6] sm:flex">
                            <Flame className="size-2.5 text-rose-300" />
                            {day.calories >= 1000 ? `${(day.calories / 1000).toFixed(1)}k` : day.calories}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Day panel */}
          <Card className="lg:sticky lg:top-6">
            <div className="border-b border-rose-50 px-5 pt-5 pb-4">
              <p className="text-xs font-bold tracking-widest text-rose-400 uppercase">
                {weekdayName(selected)}
              </p>
              <h2 className="mt-0.5 font-display text-xl font-bold text-[#3f1d2e]">
                {prettyDate(selected)}
              </h2>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-rose-50 px-2 py-2">
                  <BookOpenText className="mx-auto size-4 text-rose-400" />
                  <p className="mt-1 text-xs font-bold text-[#3f1d2e]">
                    {minutesToHM(selectedDay?.studyMinutes ?? 0)}
                  </p>
                  <p className="text-[9px] font-semibold text-[#c493a6] uppercase">focus</p>
                </div>
                <div className="rounded-2xl bg-rose-50 px-2 py-2">
                  <UtensilsCrossed className="mx-auto size-4 text-rose-400" />
                  <p className="mt-1 text-xs font-bold text-[#3f1d2e]">
                    {selectedDay?.calories ?? 0}
                  </p>
                  <p className="text-[9px] font-semibold text-[#c493a6] uppercase">kcal</p>
                </div>
                <div className="rounded-2xl bg-rose-50 px-2 py-2">
                  <ClipboardList className="mx-auto size-4 text-rose-400" />
                  <p className="mt-1 text-xs font-bold text-[#3f1d2e]">
                    {selectedDay?.activities.filter((a) => a.status === "done").length ?? 0}/
                    {selectedDay?.activities.length ?? 0}
                  </p>
                  <p className="text-[9px] font-semibold text-[#c493a6] uppercase">tasks</p>
                </div>
              </div>
            </div>

            <div className="px-3 py-3">
              {!selectedDay || selectedDay.activities.length === 0 ? (
                <EmptyState
                  compact
                  icon={<CalendarPlus className="size-6" />}
                  title="Nothing scheduled"
                  hint="Add an assignment, exam, or plan a study block."
                  action={
                    <Button size="sm" onClick={() => setModal({ open: true, editing: null })}>
                      <Plus className="size-4" /> Add activity
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-rose-50">
                  {selectedDay.activities.map((a) => (
                    <li key={a.id} className="group flex items-center gap-2.5 py-2.5">
                      <button
                        onClick={() => toggleActivity(a)}
                        aria-label="Toggle done"
                        className={cn(
                          "grid size-5.5 shrink-0 place-items-center rounded-full border-2 transition-all active:scale-90",
                          a.status === "done"
                            ? "border-transparent bg-gradient-to-br from-pink-500 to-rose-500 text-white"
                            : "border-rose-200 text-transparent hover:border-rose-400"
                        )}
                      >
                        <Check className="size-3" strokeWidth={4} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-semibold",
                            a.status === "done" ? "text-[#c493a6] line-through" : "text-[#3f1d2e]"
                          )}
                        >
                          {a.title}
                        </p>
                        <p className="text-[11px] text-[#c493a6] capitalize">
                          {a.type}
                          {a.subjectName ? ` · ${a.subjectName}` : ""} · ~{minutesToHM(a.estimateMinutes)}
                        </p>
                      </div>
                      {a.priority === "high" && a.status !== "done" && (
                        <span className="size-2 shrink-0 rounded-full bg-rose-500" title="High priority" />
                      )}
                      <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                        <IconButton title="Edit" onClick={() => setModal({ open: true, editing: a })}>
                          <Pencil className="size-3.5" />
                        </IconButton>
                        <IconButton title="Delete" onClick={() => removeActivity(a.id)}>
                          <Trash2 className="size-3.5" />
                        </IconButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {selectedDay && selectedDay.activities.length > 0 && (
                <Button
                  variant="soft"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setModal({ open: true, editing: null })}
                >
                  <Plus className="size-4" /> Add to this day
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      <ActivityModal
        open={modal.open}
        editing={modal.editing}
        defaultDate={selected}
        subjects={subjects}
        onClose={() => setModal({ open: false, editing: null })}
        onSaved={() => {
          setModal({ open: false, editing: null });
          load();
        }}
      />
    </div>
  );
}

function ActivityModal({
  open,
  editing,
  defaultDate,
  subjects,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: CalActivity | null;
  defaultDate: string;
  subjects: Subject[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [type, setType] = useState("task");
  const [priority, setPriority] = useState("medium");
  const [subjectId, setSubjectId] = useState("");
  const [estimate, setEstimate] = useState("60");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? "");
    setDate(editing?.date ?? defaultDate);
    setType(editing?.type ?? "task");
    setPriority(editing?.priority ?? "medium");
    setEstimate(String(editing?.estimateMinutes ?? 60));
    setSubjectId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, defaultDate]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        date,
        type,
        priority,
        subjectId: subjectId || null,
        estimateMinutes: Number(estimate) || 60,
      };
      if (editing) {
        await api(`/api/activities/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast("Activity updated");
      } else {
        await api("/api/activities", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast("Activity added");
      }
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't save", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit activity" : "New activity"}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Title">
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Problem set 7 — series"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input
              type="date"
              className={inputCls}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Time estimate (min)">
            <input
              className={inputCls}
              inputMode="numeric"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value.replace(/[^\d]/g, ""))}
            />
          </Field>
          <Field label="Type">
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
        </div>
        {subjects.length > 0 && (
          <Field label="Subject (optional)">
            <select className={inputCls} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">No subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !title.trim()}>
            {editing ? "Save changes" : "Add activity"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
