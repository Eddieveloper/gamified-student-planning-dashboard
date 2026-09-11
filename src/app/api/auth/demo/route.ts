import { createSession } from "@/lib/auth";
import { ensureDemoSeed } from "@/lib/seed-demo";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await ensureDemoSeed();
  await createSession(user.id);
  return Response.json({ user });
}
