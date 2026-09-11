import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { studySessions } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

async function owned(id: string, userId: string) {
  const rows = await db
    .select({ id: studySessions.id })
    .from(studySessions)
    .where(and(eq(studySessions.id, id), eq(studySessions.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await owned(id, user.id)))
    return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });

  const patch: Partial<typeof studySessions.$inferInsert> = {};
  if (body.minutes !== undefined) {
    const m = Math.round(Number(body.minutes));
    if (!Number.isFinite(m) || m < 1 || m > 900)
      return Response.json({ error: "Invalid minutes" }, { status: 400 });
    patch.minutes = m;
  }
  if (body.note !== undefined) patch.note = String(body.note).slice(0, 400);
  if (body.subjectId !== undefined)
    patch.subjectId = body.subjectId ? String(body.subjectId) : null;
  if (body.date !== undefined) patch.date = String(body.date);

  const [row] = await db
    .update(studySessions)
    .set(patch)
    .where(eq(studySessions.id, id))
    .returning();
  return Response.json({ session: row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await owned(id, user.id)))
    return Response.json({ error: "Not found" }, { status: 404 });
  await db.delete(studySessions).where(eq(studySessions.id, id));
  return Response.json({ ok: true });
}
