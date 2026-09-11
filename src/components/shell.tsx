"use client";

import {
  BarChart3,
  CalendarDays,
  Flower2,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { NotificationManager } from "@/components/notification-manager";
import { ToastProvider, useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/history", label: "History", icon: History },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/subjects", label: "Subjects", icon: GraduationCap },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-[0_6px_16px_-6px_rgba(236,72,153,0.7)]">
        <Flower2 className="size-5" />
      </div>
      <div>
        <p className="font-display text-xl leading-none font-bold tracking-tight text-[#3f1d2e]">
          BloomU
        </p>
        <p className="text-[10px] font-semibold tracking-widest text-[#c493a6] uppercase">
          Day planner
        </p>
      </div>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200",
              active
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_8px_20px_-8px_rgba(236,72,153,0.7)]"
                : "text-[#7c4a5e] hover:bg-rose-100/70 hover:text-rose-600"
            )}
          >
            <item.icon
              className={cn(
                "size-4.5 transition-transform group-hover:scale-110",
                active ? "text-white" : "text-rose-400"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast("Signed out. See you soon!");
      router.replace("/login");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white/70 p-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-sm font-bold text-white">
        {user.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#3f1d2e]">{user.name}</p>
        <p className="truncate text-[11px] text-[#c493a6]">{user.email}</p>
      </div>
      <button
        onClick={signOut}
        disabled={busy}
        title="Sign out"
        aria-label="Sign out"
        className="grid size-8 shrink-0 place-items-center rounded-full text-[#c493a6] transition-all hover:bg-rose-100 hover:text-rose-600 active:scale-90 disabled:opacity-40"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

export function Shell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <ToastProvider>
      <NotificationManager />
      <div className="min-h-screen bg-[#fff5f8]">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r border-rose-100/80 bg-white/60 px-5 py-6 backdrop-blur-xl lg:flex">
          <Logo />
          <div className="flex-1 overflow-y-auto">
            <NavLinks />
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100/60 p-3.5 text-center">
            <Flower2 className="mx-auto mb-1 size-5 text-rose-400" />
            <p className="text-[11px] leading-snug font-medium text-[#a86b80]">
              Feed your tulip every day — it blooms when your plan does.
            </p>
          </div>
          <UserCard user={user} />
        </aside>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-rose-100/80 bg-[#fff5f8]/85 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Logo />
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid size-10 place-items-center rounded-full bg-white text-rose-500 shadow-sm ring-1 ring-rose-100 active:scale-95"
          >
            <Menu className="size-5" />
          </button>
        </header>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-[#3f1d2e]/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="animate-fade-up absolute inset-y-0 left-0 flex w-72 flex-col gap-6 bg-white px-5 py-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <Logo />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="grid size-9 place-items-center rounded-full bg-rose-50 text-rose-500"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <UserCard user={user} />
            </div>
          </div>
        )}

        <main className="bg-petal-grid min-h-screen lg:pl-64">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
