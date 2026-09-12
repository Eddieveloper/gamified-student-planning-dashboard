import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, data.user.id))
    .limit(1);
  return rows[0] ?? {
    id: data.user.id,
    email: data.user.email,
    name: String(data.user.user_metadata?.name ?? data.user.email.split("@")[0]),
  };
}
