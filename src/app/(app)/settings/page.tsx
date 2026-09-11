"use client";

import {
  Bell,
  BellOff,
  BellRing,
  Flame,
  LogOut,
  Settings2,
  Timer,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import {
  Button,
  Card,
  CardHeader,
  Field,
  Skeleton,
  inputCls,
} from "@/components/ui";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

type Settings = {
  calorieGoal: number;
  studyGoalMinutes: number;
  reminderTime: string;
  notificationsEnabled: boolean;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [name, setName] = useState("");
  const [hours, setHours] = useState("2");
  const [kcal, setKcal] = useState("2200");
  const [reminder, setReminder] = useState("18:00");
  const [perm, setPerm] = useState<string>("default");
  const [savingGoals, setSavingGoals] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<{ settings: Settings; name: string }>("/api/settings");
      setSettings(d.settings);
      setName(d.name);
      setKcal(String(d.settings.calorieGoal));
      setHours(String(d.settings.studyGoalMinutes / 60));
      setReminder(d.settings.reminderTime);
    } catch {
      toast("Couldn't load settings", "error");
    }
  }, [toast]);

  useEffect(() => {
    load();
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
  }, [load]);

  async function saveGoals(e: React.FormEvent) {
    e.preventDefault();
    setSavingGoals(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          calorieGoal: Number(kcal),
          studyGoalMinutes: Math.round(Number(hours) * 60),
          reminderTime: reminder,
        }),
      });
      toast("Goals updated — your tulip recalibrated");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't save", "error");
    } finally {
      setSavingGoals(false);
    }
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      toast("Profile updated");
      router.refresh();
    } catch {
      toast("Couldn't save", "error");
    } finally {
      setSavingName(false);
    }
  }

  async function toggleNotifications() {
    if (!settings) return;
    if (!settings.notificationsEnabled) {
      if (typeof Notification === "undefined") {
        toast("This browser doesn't support notifications", "error");
        return;
      }
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission();
        setPerm(result);
        if (result === "denied") {
          toast("Notifications blocked — allow them in your browser settings", "error");
          return;
        }
      } else if (Notification.permission === "denied") {
        toast("Notifications are blocked in browser settings", "error");
        return;
      }
    }
    const next = !settings.notificationsEnabled;
    setSettings({ ...settings, notificationsEnabled: next });
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ notificationsEnabled: next }),
      });
      toast(next ? "Reminders on — we'll nudge you gently" : "Reminders off");
    } catch {
      setSettings({ ...settings, notificationsEnabled: !next });
      toast("Couldn't update setting", "error");
    }
  }

  function testNotification() {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      toast("Enable notifications first", "error");
      return;
    }
    new Notification("BloomU — It works!", {
      body: "Gentle nudges about deadlines, debt and study goals will land here.",
      tag: "bloomu-test",
    });
    toast("Test notification sent");
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-rose-400 uppercase">Settings</p>
        <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-[#3f1d2e] sm:text-4xl">
          Tend the greenhouse
        </h1>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader
          icon={<UserRound className="size-5" />}
          title="Profile"
          subtitle="How BloomU greets you"
        />
        <form onSubmit={saveName} className="flex items-end gap-3 px-5 pb-5 sm:px-6">
          <Field label="Display name" className="flex-1">
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </Field>
          <Button type="submit" variant="soft" disabled={savingName || !name.trim()}>
            Save
          </Button>
        </form>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader
          icon={<Settings2 className="size-5" />}
          title="Daily goals"
          subtitle="These feed the tulip's growth formula"
        />
        <form onSubmit={saveGoals} className="space-y-4 px-5 pb-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Calorie goal (kcal)">
              <div className="relative">
                <Flame className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-rose-300" />
                <input
                  className={cn(inputCls, "pl-9")}
                  inputMode="numeric"
                  value={kcal}
                  onChange={(e) => setKcal(e.target.value.replace(/[^\d]/g, ""))}
                />
              </div>
            </Field>
            <Field label="Study goal (hours / day)">
              <div className="relative">
                <Timer className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-rose-300" />
                <input
                  className={cn(inputCls, "pl-9")}
                  inputMode="decimal"
                  value={hours}
                  onChange={(e) => setHours(e.target.value.replace(/[^\d.]/g, ""))}
                />
              </div>
            </Field>
          </div>
          <Field label="Evening reminder time">
            <input
              type="time"
              className={cn(inputCls, "w-40")}
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={savingGoals}>
              Save goals
            </Button>
          </div>
        </form>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader
          icon={settings.notificationsEnabled ? <BellRing className="size-5" /> : <Bell className="size-5" />}
          title="Browser notifications"
          subtitle="Deadline nudges, debt alerts, and evening study reminders"
        />
        <div className="space-y-4 px-5 pb-5 sm:px-6">
          <button
            onClick={toggleNotifications}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all",
              settings.notificationsEnabled
                ? "border-rose-200 bg-rose-50"
                : "border-rose-100 bg-[#fff8fb] hover:border-rose-200"
            )}
          >
            <div className="flex items-center gap-3">
              {settings.notificationsEnabled ? (
                <BellRing className="size-5 text-rose-500" />
              ) : (
                <BellOff className="size-5 text-[#c493a6]" />
              )}
              <div>
                <p className="text-sm font-bold text-[#3f1d2e]">
                  {settings.notificationsEnabled ? "Reminders are on" : "Reminders are off"}
                </p>
                <p className="text-xs text-[#a86b80]">
                  {perm === "denied"
                    ? "Blocked by your browser — check site permissions"
                    : "We'll never send more than a few per day"}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                settings.notificationsEnabled ? "bg-gradient-to-r from-pink-500 to-rose-500" : "bg-rose-100"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 size-5 rounded-full bg-white shadow transition-all",
                  settings.notificationsEnabled ? "left-6" : "left-1"
                )}
              />
            </span>
          </button>
          <div className="flex justify-end">
            <Button variant="soft" size="sm" onClick={testNotification}>
              Send a test notification
            </Button>
          </div>
        </div>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader
          icon={<LogOut className="size-5" />}
          title="Account"
          subtitle="Signed in on this device"
        />
        <div className="flex items-center justify-between px-5 pb-5 sm:px-6">
          <p className="text-xs text-[#a86b80]">
            Your data lives in your own garden — safe and private.
          </p>
          <Button variant="danger" size="sm" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}
