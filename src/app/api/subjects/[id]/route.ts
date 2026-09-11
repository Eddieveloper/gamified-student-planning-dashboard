import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

async function owned(id: string, userId: string) {
  const rows = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.id, id), eq(subjects.userId, userId)))
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

  const patch: Partial<typeof subjects.$inferInsert> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return Response.json({ error: "Name required" }, { status: 400 });
    patch.name = name.slice(0, 120);
  }
  if (body.code !== undefined) patch.code = String(body.code).slice(0, 32);
  if (body.color !== undefined) patch.color = String(body.color).slice(0, 16);
  if (body.instructor !== undefined)
    patch.instructor = String(body.instructor).slice(0, 120);
  if (body.credits !== undefined)
    patch.credits = Math.max(0, Math.min(30, Number(body.credits) || 0));
  if (body.weeklyTargetMinutes !== undefined)
    patch.weeklyTargetMinutes = Math.max(
      0,
      Math.min(5000, Number(body.weeklyTargetMinutes) || 0)
    );
  if (body.examDate !== undefined)
    patch.examDate = body.examDate ? String(body.examDate) : null;
  if (body.notes !== undefined) patch.notes = String(body.notes).slice(0, 2000);

  const [row] = await db
    .update(subjects)
    .set(patch)
    .where(eq(subjects.id, id))
    .returning();
  return Response.json({ subject: row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await owned(id, user.id)))
    return Response.json({ error: "Not found" }, { status: 404 });
  await db.delete(subjects).where(eq(subjects.id, id));
  return Response.json({ ok: true });
}
