import { and, asc, eq, gte, lt, lte, ne, sql } from "drizzle-orm";
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
import { addDaysISO, todayISO, toISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayISO();
  const start = addDaysISO(today, -20); // last 21 days incl. today

  const [settingsRow] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, user.id))
    .limit(1);
  const calorieGoal = settingsRow?.calorieGoal ?? 2200;
  const studyGoalMinutes = settingsRow?.studyGoalMinutes ?? 120;

  const mealSums = await db
    .select({
      date: meals.date,
      calories: sql<number>`coalesce(sum(${meals.calories}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(meals)
    .where(and(eq(meals.userId, user.id), gte(meals.date, start), lte(meals.date, today)))
    .groupBy(meals.date);

  const studySums = await db
    .select({
      date: studySessions.date,
      minutes: sql<number>`coalesce(sum(${studySessions.minutes}), 0)::int`,
      sessions: sql<number>`count(*)::int`,
    })
    .from(studySessions)
    .where(and(eq(studySessions.userId, user.id), gte(studySessions.date, start), lte(studySessions.date, today)))
    .groupBy(studySessions.date);

  const actRows = await db
    .select({ date: activities.date, status: activities.status })
    .from(activities)
    .where(and(eq(activities.userId, user.id), gte(activities.date, start), lte(activities.date, today)));

  const mealMap = new Map(mealSums.map((r) => [r.date, r]));
  const studyMap = new Map(studySums.map((r) => [r.date, r]));
  const actByDate = new Map<string, { done: number; total: number }>();
  for (const a of actRows) {
    const cur = actByDate.get(a.date) ?? { done: 0, total: 0 };
    cur.total++;
    if (a.status === "done") cur.done++;
    actByDate.set(a.date, cur);
  }

  const days = Array.from({ length: 21 }, (_, i) => {
    const date = addDaysISO(start, i);
    const acts = actByDate.get(date) ?? { done: 0, total: 0 };
    const studyMinutes = studyMap.get(date)?.minutes ?? 0;
    return {
      date,
      calories: mealMap.get(date)?.calories ?? 0,
      mealCount: mealMap.get(date)?.count ?? 0,
      studyMinutes,
      studySessions: studyMap.get(date)?.sessions ?? 0,
      activitiesDone: acts.done,
      activitiesTotal: acts.total,
      goalMet: studyMinutes >= studyGoalMinutes,
    };
  }).reverse();

  const overdue = await db
    .select({
      id: activities.id,
      title: activities.title,
      date: activities.date,
      type: activities.type,
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
        lt(activities.date, today),
        ne(activities.status, "done")
      )
    )
    .orderBy(asc(activities.date));

  // Recent individual log entries for the timeline
  const recentMeals = await db
    .select()
    .from(meals)
    .where(and(eq(meals.userId, user.id), gte(meals.date, addDaysISO(today, -6))))
    .orderBy(asc(meals.date));

  const [accountRow] = await db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const accountStartISO = accountRow ? toISO(new Date(accountRow.createdAt)) : today;

  let studyDebtMinutes = 0;
  for (const d of days) {
    if (d.date === today || d.date < accountStartISO) continue;
    studyDebtMinutes += Math.max(0, studyGoalMinutes - d.studyMinutes);
  }
  studyDebtMinutes = Math.min(studyDebtMinutes, studyGoalMinutes * 3);
  const overdueMinutes = overdue.reduce((s, a) => s + a.estimateMinutes, 0);

  return Response.json({
    today,
    calorieGoal,
    studyGoalMinutes,
    days,
    overdue,
    recentMeals,
    debt: {
      studyDebtMinutes,
      overdueMinutes,
      overdueCount: overdue.length,
      totalMinutes: studyDebtMinutes + overdueMinutes,
    },
  });
}
