import { ensureDemoSeed } from "@/lib/seed-demo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await ensureDemoSeed();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: "demo@bloomu.app",
    password: "tulip1234",
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ user });
}
