import { and, asc, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  meals,
  settings,
  studySessions,
  subjects,
  users,
} from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { computeTulip } from "@/lib/tulip";
import { addDaysISO, todayISO, toISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const date = url.searchParams.get("date") || todayISO();

  const [settingsRow] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, user.id))
    .limit(1);
  const calorieGoal = settingsRow?.calorieGoal ?? 2200;
  const studyGoalMinutes = settingsRow?.studyGoalMinutes ?? 120;

  const subjectRows = await db
    .select({ id: subjects.id, name: subjects.name, color: subjects.color, code: subjects.code })
    .from(subjects)
    .where(eq(subjects.userId, user.id))
    .orderBy(asc(subjects.name));

  const mealRows = await db
    .select()
    .from(meals)
    .where(and(eq(meals.userId, user.id), eq(meals.date, date)))
    .orderBy(asc(meals.createdAt));

  const studyRows = await db
    .select({
      id: studySessions.id,
      minutes: studySessions.minutes,
      note: studySessions.note,
      date: studySessions.date,
      subjectId: studySessions.subjectId,
      subjectName: subjects.name,
      subjectColor: subjects.color,
      createdAt: studySessions.createdAt,
    })
    .from(studySessions)
    .leftJoin(subjects, eq(subjects.id, studySessions.subjectId))
    .where(and(eq(studySessions.userId, user.id), eq(studySessions.date, date)))
    .orderBy(asc(studySessions.createdAt));

  const activityRows = await db
    .select({
      id: activities.id,
      title: activities.title,
      date: activities.date,
      type: activities.type,
      status: activities.status,
      priority: activities.priority,
      estimateMinutes: activities.estimateMinutes,
      subjectId: activities.subjectId,
      subjectName: subjects.name,
      subjectColor: subjects.color,
    })
    .from(activities)
    .leftJoin(subjects, eq(subjects.id, activities.subjectId))
    .where(and(eq(activities.userId, user.id), eq(activities.date, date)))
    .orderBy(asc(activities.status), asc(activities.createdAt));

  const overdueRows = await db
    .select({
      id: activities.id,
      title: activities.title,
      date: activities.date,
      type: activities.type,
      status: activities.status,
      priority: activities.priority,
      estimateMinutes: activities.estimateMinutes,
      subjectId: activities.subjectId,
      subjectName: subjects.name,
      subjectColor: subjects.color,
    })
    .from(activities)
    .leftJoin(subjects, eq(subjects.id, activities.subjectId))
    .where(
      and(
        eq(activities.userId, user.id),
        lt(activities.date, date),
        ne(activities.status, "done")
      )
    )
    .orderBy(asc(activities.date));

  // Study debt: goal shortfall over recent days (bounded by account age)
  const debtStart = addDaysISO(date, -13);
  const [accountRow] = await db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const accountStartISO = accountRow ? toISO(new Date(accountRow.createdAt)) : date;

  const recentStudy = await db
    .select({ date: studySessions.date, minutes: studySessions.minutes })
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, user.id),
        gte(studySessions.date, debtStart),
        lt(studySessions.date, date)
      )
    );

  const perDay = new Map<string, number>();
  for (const row of recentStudy) {
    perDay.set(row.date, (perDay.get(row.date) ?? 0) + row.minutes);
  }
  let studyDebtMinutes = 0;
  let missedStudyDays = 0;
  for (let i = 13; i >= 1; i--) {
    const d = addDaysISO(date, -i);
    if (d < accountStartISO) continue;
    const total = perDay.get(d) ?? 0;
    if (total < studyGoalMinutes) {
      missedStudyDays++;
      studyDebtMinutes += studyGoalMinutes - total;
    }
  }

  // Cap study debt at three days' worth of goal — motivating, not crushing
  studyDebtMinutes = Math.min(studyDebtMinutes, studyGoalMinutes * 3);

  const overdueMinutes = overdueRows.reduce(
    (sum, a) => sum + a.estimateMinutes,
    0
  );

  const calories = mealRows.reduce((s, m) => s + m.calories, 0);
  const protein = mealRows.reduce((s, m) => s + m.protein, 0);
  const studyMinutes = studyRows.reduce((s, r) => s + r.minutes, 0);
  const activitiesTotal = activityRows.length;
  const activitiesDone = activityRows.filter((a) => a.status === "done").length;

  const tulip = computeTulip({
    studyMinutes,
    studyGoalMinutes,
    mealCount: mealRows.length,
    calories,
    calorieGoal,
    activitiesTotal,
    activitiesDone,
  });

  return Response.json({
    date,
    serverToday: toISO(new Date()),
    settings: {
      calorieGoal,
      studyGoalMinutes,
      reminderTime: settingsRow?.reminderTime ?? "18:00",
      notificationsEnabled: settingsRow?.notificationsEnabled ?? false,
    },
    subjects: subjectRows,
    meals: mealRows,
    study: studyRows,
    activities: activityRows,
    overdue: overdueRows,
    totals: { calories, protein, studyMinutes, activitiesDone, activitiesTotal },
    tulip,
    debt: {
      overdueCount: overdueRows.length,
      overdueMinutes,
      missedStudyDays,
      studyDebtMinutes,
      totalMinutes: studyDebtMinutes + overdueMinutes,
    },
  });
}
