"use client";

import {
  CalendarDays,
  Flame,
  Flower2,
  Loader2,
  LogIn,
  Sparkles,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tulip } from "@/components/tulip";
import { Button, Field, inputCls } from "@/components/ui";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"form" | "demo" | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("form");
    try {
      await api(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(null);
    }
  }

  async function demo() {
    setError(null);
    setBusy("demo");
    try {
      await api("/api/auth/demo", { method: "POST" });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(null);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-petal-grid opacity-20" />
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-pink-300/20 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
            <Flower2 className="size-5" />
          </div>
          <p className="font-display text-2xl font-bold text-white">BloomU</p>
        </div>

        <div className="relative">
          <div className="flex items-end justify-center">
            <Tulip stage="bloom" className="w-64 drop-shadow-2xl" />
          </div>
          <h1 className="mt-6 text-center font-display text-5xl leading-tight font-black tracking-tight text-white">
            Your day,
            <br />
            in full bloom.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-pink-100">
            Plan meals, crush study goals, and beat deadlines — every habit you
            finish helps a little tulip grow.
          </p>
          <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3">
            {[
              { icon: Flame, label: "Calories & fuel" },
              { icon: TrendingUp, label: "Study streaks" },
              { icon: CalendarDays, label: "Deadlines" },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-2xl bg-white/12 p-3 text-center backdrop-blur-sm"
              >
                <f.icon className="mx-auto mb-1.5 size-5 text-white" />
                <p className="text-[11px] font-semibold text-pink-50">{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-center text-[11px] text-pink-200/80">
          Made for students who water their ambitions daily.
        </p>
      </div>

      {/* Form panel */}
      <div className="bg-petal-grid flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
            <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white">
              <Flower2 className="size-5" />
            </div>
            <p className="font-display text-2xl font-bold text-[#3f1d2e]">BloomU</p>
          </div>

          <div className="rounded-3xl border border-rose-100 bg-white p-7 shadow-[0_20px_60px_-20px_rgba(190,24,93,0.25)] sm:p-9">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#3f1d2e]">
              {mode === "login" ? "Welcome back" : "Plant your account"}
            </h2>
            <p className="mt-1 text-sm text-[#a86b80]">
              {mode === "login"
                ? "Your tulip missed you. Sign in to continue."
                : "One minute of setup, a semester of calm."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-rose-50 p-1">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={cn(
                    "rounded-full py-2 text-sm font-semibold transition-all",
                    mode === m
                      ? "bg-white text-rose-600 shadow-sm"
                      : "text-[#a86b80] hover:text-rose-500"
                  )}
                >
                  {m === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              {mode === "register" && (
                <Field label="Name">
                  <input
                    className={inputCls}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Maya Chen"
                    autoComplete="name"
                  />
                </Field>
              )}
              <Field label="Email">
                <input
                  className={inputCls}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  autoComplete="email"
                />
              </Field>
              <Field label="Password">
                <input
                  className={inputCls}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "6+ characters" : "••••••••"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </Field>

              {error && (
                <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={busy !== null}>
                {busy === "form" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : mode === "login" ? (
                  <LogIn className="size-4" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                {mode === "login" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-rose-100" />
              <span className="text-[11px] font-semibold tracking-widest text-[#c493a6] uppercase">
                or
              </span>
              <div className="h-px flex-1 bg-rose-100" />
            </div>

            <Button
              variant="soft"
              className="w-full"
              onClick={demo}
              disabled={busy !== null}
            >
              {busy === "demo" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4 text-rose-400" />
              )}
              Explore the demo — Maya&rsquo;s week
            </Button>
            <p className="mt-3 text-center text-[11px] text-[#c493a6]">
              Demo account comes pre-seeded with three weeks of realistic data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
