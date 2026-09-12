import { db } from "@/db";
import { settings, users } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error || !data.user)
    return Response.json({ error: error?.message ?? "Unable to create account." }, { status: 400 });

  const [user] = await db
    .insert(users)
    .values({ id: data.user.id, email, name })
    .onConflictDoUpdate({ target: users.id, set: { email, name } })
    .returning({ id: users.id, name: users.name, email: users.email });
  await db.insert(settings).values({ userId: user.id }).onConflictDoNothing();

  return Response.json(
    { user, needsEmailConfirmation: !data.session },
    { status: 201 }
  );
}
