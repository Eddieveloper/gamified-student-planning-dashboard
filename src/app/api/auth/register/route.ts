import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });

  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");

  if (!name || name.length > 80)
    return Response.json({ error: "Please enter your name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return Response.json({ error: "Please enter a valid email." }, { status: 400 });
  if (password.length < 6)
    return Response.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );

  const exists = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (exists[0])
    return Response.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );

  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash: hashPassword(password) })
    .returning({ id: users.id, name: users.name, email: users.email });

  await db.insert(settings).values({ userId: user.id });
  await createSession(user.id);

  return Response.json({ user }, { status: 201 });
}
