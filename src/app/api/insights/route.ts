import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { activities, meals, settings, studySessions, subjects } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { addDaysISO, startOfWeekISO, todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const weekParam = url.searchParams.get("week");
  const monday = startOfWeekISO(weekParam ?? todayISO());
  const sunday = addDaysISO(monday, 6);
  const today = todayISO();

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
    .where(and(eq(meals.userId, user.id), gte(meals.date, monday), lte(meals.date, sunday)))
    .groupBy(meals.date);

  const studyRows = await db
    .select({
      date: studySessions.date,
      minutes: studySessions.minutes,
      subjectId: studySessions.subjectId,
      subjectName: subjects.name,
      subjectColor: subjects.color,
    })
    .from(studySessions)
    .leftJoin(subjects, eq(subjects.id, studySessions.subjectId))
    .where(and(eq(studySessions.userId, user.id), gte(studySessions.date, monday), lte(studySessions.date, sunday)));

  const actRows = await db
    .select({ date: activities.date, status: activities.status })
    .from(activities)
    .where(and(eq(activities.userId, user.id), gte(activities.date, monday), lte(activities.date, sunday)));

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDaysISO(monday, i);
    return {
      date,
      studyMinutes: 0,
      calories: 0,
      mealCount: 0,
      activitiesDone: 0,
      activitiesTotal: 0,
    };
  });
  const byDate = new Map(days.map((d) => [d.date, d]));

  for (const m of mealSums) {
    const day = byDate.get(m.date);
    if (day) {
      day.calories = m.calories;
      day.mealCount = m.count;
    }
  }
  for (const s of studyRows) {
    const day = byDate.get(s.date);
    if (day) day.studyMinutes += s.minutes;
  }
  for (const a of actRows) {
    const day = byDate.get(a.date);
    if (day) {
      day.activitiesTotal++;
      if (a.status === "done") day.activitiesDone++;
    }
  }

  // Subject distribution for the week
  const subjectMap = new Map<
    string,
    { subjectId: string | null; name: string; color: string; minutes: number }
  >();
  for (const s of studyRows) {
    const key = s.subjectId ?? "none";
    const cur =
      subjectMap.get(key) ??
      {
        subjectId: s.subjectId,
        name: s.subjectName ?? "Untracked",
        color: s.subjectColor ?? "#f9a8d4",
        minutes: 0,
      };
    cur.minutes += s.minutes;
    subjectMap.set(key, cur);
  }
  const subjectTotals = [...subjectMap.values()].sort(
    (a, b) => b.minutes - a.minutes
  );

  // Streak: consecutive goal-met days ending today (or yesterday)
  const streakStart = addDaysISO(today, -60);
  const recentSums = await db
    .select({
      date: studySessions.date,
      minutes: sql<number>`coalesce(sum(${studySessions.minutes}), 0)::int`,
    })
    .from(studySessions)
    .where(and(eq(studySessions.userId, user.id), gte(studySessions.date, streakStart)))
    .groupBy(studySessions.date);
  const met = new Map(
    recentSums.map((r) => [r.date, r.minutes >= studyGoalMinutes])
  );
  let streak = 0;
  let cursor = today;
  if (!met.get(cursor)) cursor = addDaysISO(cursor, -1); // today still in progress
  while (met.get(cursor)) {
    streak++;
    cursor = addDaysISO(cursor, -1);
  }

  const totalStudy = days.reduce((s, d) => s + d.studyMinutes, 0);
  const loggedDays = days.filter((d) => d.mealCount > 0);
  const avgCalories = loggedDays.length
    ? Math.round(days.reduce((s, d) => s + d.calories, 0) / loggedDays.length)
    : 0;
  const totalActs = days.reduce((s, d) => s + d.activitiesTotal, 0);
  const doneActs = days.reduce((s, d) => s + d.activitiesDone, 0);
  const best = days.reduce(
    (acc, d) => (d.studyMinutes > acc.studyMinutes ? d : acc),
    days[0]
  );

  return Response.json({
    monday,
    sunday,
    today,
    calorieGoal,
    studyGoalMinutes,
    days,
    subjectTotals,
    streak,
    totals: {
      studyMinutes: totalStudy,
      avgCalories,
      activitiesDone: doneActs,
      activitiesTotal: totalActs,
      completionRate: totalActs ? Math.round((doneActs / totalActs) * 100) : null,
      bestDay: best.studyMinutes > 0 ? best.date : null,
    },
  });
}
