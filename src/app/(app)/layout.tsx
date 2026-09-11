import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Shell } from "@/components/shell";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <Shell user={{ name: user.name, email: user.email }}>{children}</Shell>
  );
}
