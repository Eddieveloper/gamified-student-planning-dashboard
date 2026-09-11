import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

async function owned(id: string, userId: string) {
  const rows = await db
    .select({ id: activities.id })
    .from(activities)
    .where(and(eq(activities.id, id), eq(activities.userId, userId)))
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

  const patch: Partial<typeof activities.$inferInsert> = {};
  if (body.title !== undefined) {
    const t = String(body.title).trim();
    if (!t) return Response.json({ error: "Title required" }, { status: 400 });
    patch.title = t.slice(0, 180);
  }
  if (body.date !== undefined) patch.date = String(body.date);
  if (body.type !== undefined && ["assignment", "exam", "study", "task", "event"].includes(body.type))
    patch.type = body.type;
  if (body.priority !== undefined && ["low", "medium", "high"].includes(body.priority))
    patch.priority = body.priority;
  if (body.subjectId !== undefined)
    patch.subjectId = body.subjectId ? String(body.subjectId) : null;
  if (body.estimateMinutes !== undefined)
    patch.estimateMinutes = Math.max(
      5,
      Math.min(1200, Math.round(Number(body.estimateMinutes) || 60))
    );
  if (body.status !== undefined) {
    const done = body.status === "done";
    patch.status = done ? "done" : "pending";
    patch.completedAt = done ? new Date() : null;
  }

  const [row] = await db
    .update(activities)
    .set(patch)
    .where(eq(activities.id, id))
    .returning();
  return Response.json({ activity: row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await owned(id, user.id)))
    return Response.json({ error: "Not found" }, { status: 404 });
  await db.delete(activities).where(eq(activities.id, id));
  return Response.json({ ok: true });
}
