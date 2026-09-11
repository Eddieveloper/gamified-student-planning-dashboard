import { and, asc, eq, gte, lt, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { activities, subjects } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

const baseSelect = {
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
  completedAt: activities.completedAt,
  createdAt: activities.createdAt,
};

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const date = url.searchParams.get("date");

  const conds = [eq(activities.userId, user.id)];
  if (date) conds.push(eq(activities.date, date));
  if (from) conds.push(gte(activities.date, from));
  if (to) conds.push(lte(activities.date, to));
  if (url.searchParams.get("overdue") === "1") {
    conds.push(lt(activities.date, todayISO()), ne(activities.status, "done"));
  }

  const rows = await db
    .select(baseSelect)
    .from(activities)
    .leftJoin(subjects, eq(subjects.id, activities.subjectId))
    .where(and(...conds))
    .orderBy(asc(activities.date), asc(activities.createdAt))
    .limit(400);

  return Response.json({ activities: rows });
}

const TYPES = ["assignment", "exam", "study", "task", "event"];
const PRIORITIES = ["low", "medium", "high"];

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });

  const title = String(body.title ?? "").trim();
  if (!title)
    return Response.json({ error: "Title is required." }, { status: 400 });

  const [row] = await db
    .insert(activities)
    .values({
      userId: user.id,
      title: title.slice(0, 180),
      date: body.date ? String(body.date) : todayISO(),
      type: TYPES.includes(body.type) ? body.type : "task",
      priority: PRIORITIES.includes(body.priority) ? body.priority : "medium",
      subjectId: body.subjectId ? String(body.subjectId) : null,
      estimateMinutes: Math.max(
        5,
        Math.min(1200, Math.round(Number(body.estimateMinutes) || 60))
      ),
    })
    .returning();

  return Response.json({ activity: row }, { status: 201 });
}
