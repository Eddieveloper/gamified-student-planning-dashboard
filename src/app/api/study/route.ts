import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studySessions, subjects } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || todayISO();
  const rows = await db
    .select({
      id: studySessions.id,
      minutes: studySessions.minutes,
      note: studySessions.note,
      date: studySessions.date,
      subjectId: studySessions.subjectId,
      subjectName: subjects.name,
      subjectColor: subjects.color,
    })
    .from(studySessions)
    .leftJoin(subjects, eq(subjects.id, studySessions.subjectId))
    .where(and(eq(studySessions.userId, user.id), eq(studySessions.date, date)))
    .orderBy(asc(studySessions.createdAt));
  return Response.json({ sessions: rows });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });

  const minutes = Math.round(Number(body.minutes));
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 900)
    return Response.json(
      { error: "Minutes must be between 1 and 900." },
      { status: 400 }
    );

  const [row] = await db
    .insert(studySessions)
    .values({
      userId: user.id,
      subjectId: body.subjectId ? String(body.subjectId) : null,
      minutes,
      note: String(body.note ?? "").slice(0, 400),
      date: body.date ? String(body.date) : todayISO(),
    })
    .returning();

  return Response.json({ session: row }, { status: 201 });
}
