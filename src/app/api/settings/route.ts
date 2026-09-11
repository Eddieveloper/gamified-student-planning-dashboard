import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, users } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function ensureSettings(userId: string) {
  await db
    .insert(settings)
    .values({ userId })
    .onConflictDoNothing({ target: settings.userId });
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1);
  return row;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const row = await ensureSettings(user.id);
  return Response.json({ settings: row, name: user.name });
}

export async function PATCH(req: Request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });

  await ensureSettings(user.id);

  const patch: Partial<typeof settings.$inferInsert> = {};
  if (body.calorieGoal !== undefined) {
    const c = Math.round(Number(body.calorieGoal));
    if (!Number.isFinite(c) || c < 800 || c > 6000)
      return Response.json(
        { error: "Calorie goal must be 800–6000." },
        { status: 400 }
      );
    patch.calorieGoal = c;
  }
  if (body.studyGoalMinutes !== undefined) {
    const m = Math.round(Number(body.studyGoalMinutes));
    if (!Number.isFinite(m) || m < 15 || m > 960)
      return Response.json(
        { error: "Study goal must be 15–960 minutes." },
        { status: 400 }
      );
    patch.studyGoalMinutes = m;
  }
  if (body.reminderTime !== undefined) {
    const t = String(body.reminderTime);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t))
      return Response.json({ error: "Invalid time." }, { status: 400 });
    patch.reminderTime = t;
  }
  if (body.notificationsEnabled !== undefined)
    patch.notificationsEnabled = Boolean(body.notificationsEnabled);

  if (Object.keys(patch).length) {
    patch.updatedAt = new Date();
    await db.update(settings).set(patch).where(eq(settings.userId, user.id));
  }

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name) await db.update(users).set({ name: name.slice(0, 80) }).where(eq(users.id, user.id));
  }

  const row = await ensureSettings(user.id);
  const [u] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  return Response.json({ settings: row, name: u?.name ?? user.name });
}
