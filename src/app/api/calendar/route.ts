import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { activities, meals, settings, studySessions, subjects } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { addDaysISO, fromISO, startOfWeekISO, toISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // YYYY-MM
  const base = /^\d{4}-\d{2}$/.test(month ?? "") ? `${month}-01` : toISO(new Date());

  const d0 = fromISO(base);
  const monthStart = toISO(new Date(d0.getFullYear(), d0.getMonth(), 1));
  const monthEnd = toISO(new Date(d0.getFullYear(), d0.getMonth() + 1, 0));
  const gridStart = startOfWeekISO(monthStart);
  let gridEnd = monthEnd;
  while ((fromISO(gridEnd).getDay() + 6) % 7 !== 6) {
    gridEnd = addDaysISO(gridEnd, 1);
  }

  const [settingsRow] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, user.id))
    .limit(1);

  const mealSums = await db
    .select({
      date: meals.date,
      calories: sql<number>`coalesce(sum(${meals.calories}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(meals)
    .where(and(eq(meals.userId, user.id), gte(meals.date, gridStart), lte(meals.date, gridEnd)))
    .groupBy(meals.date);

  const studySums = await db
    .select({
      date: studySessions.date,
      minutes: sql<number>`coalesce(sum(${studySessions.minutes}), 0)::int`,
    })
    .from(studySessions)
    .where(and(eq(studySessions.userId, user.id), gte(studySessions.date, gridStart), lte(studySessions.date, gridEnd)))
    .groupBy(studySessions.date);

  const actRows = await db
    .select({
      id: activities.id,
      title: activities.title,
      date: activities.date,
      type: activities.type,
      status: activities.status,
      priority: activities.priority,
      subjectName: subjects.name,
      subjectColor: subjects.color,
      estimateMinutes: activities.estimateMinutes,
    })
    .from(activities)
    .leftJoin(subjects, eq(subjects.id, activities.subjectId))
    .where(and(eq(activities.userId, user.id), gte(activities.date, gridStart), lte(activities.date, gridEnd)))
    .orderBy(asc(activities.date), asc(activities.createdAt));

  const days: Record<
    string,
    {
      calories: number;
      mealCount: number;
      studyMinutes: number;
      activities: typeof actRows;
    }
  > = {};
  for (let d = gridStart; d <= gridEnd; d = addDaysISO(d, 1)) {
    days[d] = { calories: 0, mealCount: 0, studyMinutes: 0, activities: [] };
  }
  for (const m of mealSums) {
    if (days[m.date]) {
      days[m.date].calories = m.calories;
      days[m.date].mealCount = m.count;
    }
  }
  for (const s of studySums) {
    if (days[s.date]) days[s.date].studyMinutes = s.minutes;
  }
  for (const a of actRows) {
    days[a.date]?.activities.push(a);
  }

  return Response.json({
    monthStart,
    monthEnd,
    gridStart,
    gridEnd,
    days,
    calorieGoal: settingsRow?.calorieGoal ?? 2200,
    studyGoalMinutes: settingsRow?.studyGoalMinutes ?? 120,
  });
}
