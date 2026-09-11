import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { meals } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || todayISO();
  const rows = await db
    .select()
    .from(meals)
    .where(and(eq(meals.userId, user.id), eq(meals.date, date)))
    .orderBy(asc(meals.createdAt));
  return Response.json({ meals: rows });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });

  const name = String(body.name ?? "").trim();
  const calories = Math.round(Number(body.calories));
  if (!name)
    return Response.json({ error: "Meal name is required." }, { status: 400 });
  if (!Number.isFinite(calories) || calories < 0 || calories > 10000)
    return Response.json(
      { error: "Calories must be between 0 and 10000." },
      { status: 400 }
    );

  const type = ["breakfast", "lunch", "dinner", "snack"].includes(body.mealType)
    ? body.mealType
    : "snack";

  const [row] = await db
    .insert(meals)
    .values({
      userId: user.id,
      name: name.slice(0, 160),
      calories,
      protein: Math.max(0, Math.min(500, Math.round(Number(body.protein) || 0))),
      mealType: type,
      date: body.date ? String(body.date) : todayISO(),
    })
    .returning();

  return Response.json({ meal: row }, { status: 201 });
}
