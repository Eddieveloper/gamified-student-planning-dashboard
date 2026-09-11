import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { meals } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

async function owned(id: string, userId: string) {
  const rows = await db
    .select({ id: meals.id })
    .from(meals)
    .where(and(eq(meals.id, id), eq(meals.userId, userId)))
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

  const patch: Partial<typeof meals.$inferInsert> = {};
  if (body.name !== undefined) patch.name = String(body.name).slice(0, 160);
  if (body.calories !== undefined) {
    const c = Math.round(Number(body.calories));
    if (!Number.isFinite(c) || c < 0 || c > 10000)
      return Response.json({ error: "Invalid calories" }, { status: 400 });
    patch.calories = c;
  }
  if (body.protein !== undefined)
    patch.protein = Math.max(0, Math.min(500, Math.round(Number(body.protein) || 0)));
  if (body.mealType !== undefined)
    patch.mealType = ["breakfast", "lunch", "dinner", "snack"].includes(body.mealType)
      ? body.mealType
      : "snack";
  if (body.date !== undefined) patch.date = String(body.date);

  const [row] = await db.update(meals).set(patch).where(eq(meals.id, id)).returning();
  return Response.json({ meal: row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await owned(id, user.id)))
    return Response.json({ error: "Not found" }, { status: 404 });
  await db.delete(meals).where(eq(meals.id, id));
  return Response.json({ ok: true });
}
