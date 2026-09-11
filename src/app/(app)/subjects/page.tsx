"use client";

import {
  BookMarked,
  CalendarRange,
  GraduationCap,
  Pencil,
  Plus,
  Sprout,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Modal,
  ProgressBar,
  Skeleton,
  inputCls,
} from "@/components/ui";
import { api } from "@/lib/client";
import {
  cn,
  minutesToHM,
  prettyDate,
  relativeDay,
  SUBJECT_COLORS,
  todayISO,
} from "@/lib/utils";

type Subject = {
  id: string;
  name: string;
  code: string;
  color: string;
  instructor: string;
  credits: number;
  weeklyTargetMinutes: number;
  examDate: string | null;
  notes: string;
  weekMinutes: number;
  totalMinutes: number;
  totalSessions: number;
  pendingCount: number;
};

export default function SubjectsPage() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [modal, setModal] = useState<{ open: boolean; editing: Subject | null }>({
    open: false,
    editing: null,
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<{ subjects: Subject[] }>("/api/subjects");
      setSubjects(d.subjects);
    } catch {
      toast("Couldn't load subjects", "error");
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete((c) => (c === id ? null : c)), 3000);
      return;
    }
    try {
      await api(`/api/subjects/${id}`, { method: "DELETE" });
      toast("Subject removed");
      setConfirmDelete(null);
      load();
    } catch {
      toast("Couldn't delete subject", "error");
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-widest text-rose-400 uppercase">Subjects</p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-[#3f1d2e] sm:text-4xl">
            Your courseload
          </h1>
        </div>
        <Button onClick={() => setModal({ open: true, editing: null })}>
          <Plus className="size-4" /> New subject
        </Button>
      </div>

      {!subjects ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : subjects.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Sprout className="size-6" />}
            title="Plant your first subject"
            hint="Add the courses you're taking this semester — BloomU will track weekly focus targets, exams and pending work for each."
            action={
              <Button onClick={() => setModal({ open: true, editing: null })}>
                <Plus className="size-4" /> Add a subject
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s) => {
            const ratio = s.weeklyTargetMinutes
              ? s.weekMinutes / s.weeklyTargetMinutes
              : 0;
            const examSoon =
              s.examDate && s.examDate >= todayISO();
            return (
              <Card key={s.id} className="group relative overflow-hidden p-5">
                <div
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: s.color }}
                />
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="grid size-11 place-items-center rounded-2xl text-white shadow-sm"
                      style={{ background: s.color }}
                    >
                      <GraduationCap className="size-5" />
                    </div>
                    <div>
                      <p className="font-display text-lg leading-tight font-bold text-[#3f1d2e]">
                        {s.name}
                      </p>
                      <p className="text-[11px] font-semibold tracking-wide text-[#c493a6] uppercase">
                        {s.code || "—"} · {s.credits} credits
                      </p>
                    </div>
                  </div>
                  <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                    <IconButton
                      title="Edit subject"
                      onClick={() => setModal({ open: true, editing: s })}
                    >
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton
                      title={confirmDelete === s.id ? "Click again to confirm" : "Delete subject"}
                      onClick={() => remove(s.id)}
                      className={cn(confirmDelete === s.id && "bg-red-50 text-red-500 opacity-100")}
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </div>

                {s.instructor && (
                  <p className="mt-3 text-xs text-[#a86b80]">{s.instructor}</p>
                )}

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-semibold text-[#7c4a5e]">
                      Weekly focus{" "}
                      <span className="text-[#c493a6]">
                        {minutesToHM(s.weekMinutes)} / {minutesToHM(s.weeklyTargetMinutes)}
                      </span>
                    </p>
                    <span className="text-xs font-bold" style={{ color: s.color }}>
                      {Math.round(ratio * 100)}%
                    </span>
                  </div>
                  <ProgressBar ratio={ratio} className="mt-1.5" />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="bg-rose-50 text-[#7c4a5e] ring-1 ring-rose-100">
                    <BookMarked className="size-3" />
                    {minutesToHM(s.totalMinutes)} all-time · {s.totalSessions} sessions
                  </Badge>
                  {s.pendingCount > 0 && (
                    <Badge className="bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                      {s.pendingCount} pending
                    </Badge>
                  )}
                  {s.examDate && (
                    <Badge
                      className={cn(
                        "ring-1",
                        examSoon
                          ? "bg-rose-100 text-rose-700 ring-rose-200"
                          : "bg-rose-50 text-[#a86b80] ring-rose-100"
                      )}
                    >
                      <CalendarRange className="size-3" />
                      Exam {relativeDay(s.examDate, todayISO())} ·{" "}
                      {prettyDate(s.examDate).replace(/, \d{4}$/, "")}
                    </Badge>
                  )}
                </div>

                {s.notes && (
                  <p className="mt-3 line-clamp-2 rounded-2xl bg-[#fff8fb] px-3 py-2 text-[11px] leading-relaxed text-[#a86b80] italic">
                    {s.notes}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <SubjectModal
        open={modal.open}
        editing={modal.editing}
        onClose={() => setModal({ open: false, editing: null })}
        onSaved={() => {
          setModal({ open: false, editing: null });
          load();
        }}
      />
    </div>
  );
}

function SubjectModal({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Subject | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [instructor, setInstructor] = useState("");
  const [credits, setCredits] = useState("3");
  const [weeklyHours, setWeeklyHours] = useState("3");
  const [examDate, setExamDate] = useState("");
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setCode(editing?.code ?? "");
    setInstructor(editing?.instructor ?? "");
    setCredits(String(editing?.credits ?? 3));
    setWeeklyHours(String((editing?.weeklyTargetMinutes ?? 180) / 60));
    setExamDate(editing?.examDate ?? "");
    setColor(editing?.color ?? SUBJECT_COLORS[0]);
    setNotes(editing?.notes ?? "");
  }, [open, editing]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        instructor: instructor.trim(),
        credits: Number(credits) || 3,
        weeklyTargetMinutes: Math.round((Number(weeklyHours) || 0) * 60),
        examDate: examDate || null,
        color,
        notes: notes.trim(),
      };
      if (editing) {
        await api(`/api/subjects/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast("Subject updated");
      } else {
        await api("/api/subjects", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast(`“${payload.name}” planted!`);
      }
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't save", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit subject" : "New subject"}
      wide
    >
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Subject name" className="col-span-2 sm:col-span-1">
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organic Chemistry"
              autoFocus
            />
          </Field>
          <Field label="Course code">
            <input
              className={inputCls}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="CHEM 210"
            />
          </Field>
          <Field label="Instructor">
            <input
              className={inputCls}
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              placeholder="Prof. Alvarez"
            />
          </Field>
          <Field label="Exam date (optional)">
            <input
              type="date"
              className={inputCls}
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </Field>
          <Field label="Credits">
            <input
              className={inputCls}
              inputMode="numeric"
              value={credits}
              onChange={(e) => setCredits(e.target.value.replace(/[^\d]/g, ""))}
            />
          </Field>
          <Field label="Weekly focus target (hours)">
            <input
              className={inputCls}
              inputMode="decimal"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value.replace(/[^\d.]/g, ""))}
            />
          </Field>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold tracking-wide text-[#7c4a5e] uppercase">
            Color
          </span>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className={cn(
                  "size-8 rounded-full transition-all hover:scale-110",
                  color === c && "ring-2 ring-[#3f1d2e] ring-offset-2 ring-offset-white"
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <Field label="Notes (optional)">
          <textarea
            className={cn(inputCls, "min-h-20 resize-none")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Office hours, grading quirks, reminders…"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {editing ? "Save changes" : "Add subject"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
