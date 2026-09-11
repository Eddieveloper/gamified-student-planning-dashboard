"use client";

import { useEffect } from "react";
import { minutesToHM, relativeDay, todayISO } from "@/lib/utils";

type OverviewPayload = {
  settings: {
    notificationsEnabled: boolean;
    reminderTime: string;
    studyGoalMinutes: number;
  };
  totals: { studyMinutes: number };
  activities: { id: string; title: string; date: string; status: string }[];
  overdue: { id: string; title: string; date: string }[];
};

function notifiedToday(key: string) {
  return localStorage.getItem(`bloomu:notif:${key}`) === todayISO();
}
function markNotified(key: string) {
  localStorage.setItem(`bloomu:notif:${key}`, todayISO());
}

async function check() {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  let data: OverviewPayload;
  try {
    const res = await fetch(`/api/overview?date=${todayISO()}`);
    if (!res.ok) return;
    data = await res.json();
  } catch {
    return;
  }

  if (!data.settings.notificationsEnabled) return;

  // 1. Due-today reminders (once per day)
  const dueToday = data.activities.filter((a) => a.status !== "done");
  if (dueToday.length > 0 && !notifiedToday("due-today")) {
    new Notification("BloomU — Today's plan", {
      body: `${dueToday.length} task${dueToday.length > 1 ? "s" : ""} on today's list, starting with “${dueToday[0].title}”.`,
      icon: "/favicon.ico",
      tag: "bloomu-due",
    });
    markNotified("due-today");
  }

  // 2. Overdue debt nudge (once per day)
  if (data.overdue.length > 0 && !notifiedToday("overdue")) {
    new Notification("BloomU — Debt collector (friendly!)", {
      body: `You have ${data.overdue.length} overdue task${data.overdue.length > 1 ? "s" : ""}: “${data.overdue[0].title}” (${relativeDay(data.overdue[0].date, todayISO())}). Clear it to lift your tulip.`,
      tag: "bloomu-overdue",
    });
    markNotified("overdue");
  }

  // 3. Evening study reminder at the configured time
  const now = new Date();
  const [hh, mm] = data.settings.reminderTime.split(":").map(Number);
  const reminder = new Date();
  reminder.setHours(hh, mm, 0, 0);
  if (
    now >= reminder &&
    data.totals.studyMinutes < data.settings.studyGoalMinutes &&
    !notifiedToday("study-reminder")
  ) {
    const left = data.settings.studyGoalMinutes - data.totals.studyMinutes;
    new Notification("BloomU — Study time", {
      body: `${minutesToHM(left)} of focus left to hit today's goal. Your tulip is waiting.`,
      tag: "bloomu-study",
    });
    markNotified("study-reminder");
  }
}

export function NotificationManager() {
  useEffect(() => {
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);
  return null;
}
