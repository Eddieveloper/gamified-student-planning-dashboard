import { and, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { activities, studySessions, subjects } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { addDaysISO, todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function withStats(userId: string) {
  const weekStart = addDaysISO(todayISO(), -6);

  const rows = await db
    .select()
    .from(subjects)
    .where(eq(subjects.userId, userId))
    .orderBy(subjects.name);

  const weekSums = await db
    .select({
      subjectId: studySessions.subjectId,
      total: sql<number>`coalesce(sum(${studySessions.minutes}), 0)::int`,
    })
    .from(studySessions)
    .where(and(eq(studySessions.userId, userId), gte(studySessions.date, weekStart)))
    .groupBy(studySessions.subjectId);

  const allSums = await db
    .select({
      subjectId: studySessions.subjectId,
      total: sql<number>`coalesce(sum(${studySessions.minutes}), 0)::int`,
      sessions: sql<number>`count(*)::int`,
    })
    .from(studySessions)
    .where(eq(studySessions.userId, userId))
    .groupBy(studySessions.subjectId);

  const pending = await db
    .select({
      subjectId: activities.subjectId,
      total: sql<number>`count(*)::int`,
    })
    .from(activities)
    .where(and(eq(activities.userId, userId), ne(activities.status, "done")))
    .groupBy(activities.subjectId);

  const weekMap = new Map(weekSums.map((r) => [r.subjectId, r.total]));
  const allMap = new Map(allSums.map((r) => [r.subjectId, r]));
  const pendingMap = new Map(pending.map((r) => [r.subjectId, r.total]));

  return rows.map((s) => ({
    ...s,
    weekMinutes: weekMap.get(s.id) ?? 0,
    totalMinutes: allMap.get(s.id)?.total ?? 0,
    totalSessions: allMap.get(s.id)?.sessions ?? 0,
    pendingCount: pendingMap.get(s.id) ?? 0,
  }));
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ subjects: await withStats(user.id) });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });

  const name = String(body.name ?? "").trim();
  if (!name)
    return Response.json({ error: "Subject name is required." }, { status: 400 });

  const [row] = await db
    .insert(subjects)
    .values({
      userId: user.id,
      name: name.slice(0, 120),
      code: String(body.code ?? "").slice(0, 32),
      color: String(body.color ?? "#f472b6").slice(0, 16),
      instructor: String(body.instructor ?? "").slice(0, 120),
      credits: Math.max(0, Math.min(30, Number(body.credits) || 3)),
      weeklyTargetMinutes: Math.max(
        0,
        Math.min(5000, Number(body.weeklyTargetMinutes) || 180)
      ),
      examDate: body.examDate ? String(body.examDate) : null,
      notes: String(body.notes ?? "").slice(0, 2000),
    })
    .returning();

  return Response.json({ subject: row }, { status: 201 });
}
