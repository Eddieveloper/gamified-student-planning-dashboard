"use client";

import { X } from "lucide-react";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-rose-100/90 bg-white shadow-[0_2px_24px_-8px_rgba(190,24,93,0.12)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-1 sm:px-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="grid size-10 place-items-center rounded-2xl bg-rose-50 text-rose-500">
            {icon}
          </div>
        )}
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#3f1d2e]">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-[#a86b80]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

type ButtonVariant = "primary" | "soft" | "ghost" | "danger";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-200 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]";
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-[0_6px_18px_-6px_rgba(236,72,153,0.55)] hover:shadow-[0_8px_24px_-6px_rgba(236,72,153,0.7)] hover:brightness-105",
    soft: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100",
    ghost: "text-[#a86b80] hover:bg-rose-50 hover:text-rose-600",
    danger: "bg-white text-rose-600 border border-rose-200 hover:bg-rose-50",
  };
  const sizes = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4.5 py-2.5" };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  className,
  title,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      title={title}
      aria-label={title}
      className={cn(
        "grid size-8 place-items-center rounded-full text-[#c493a6] transition-all hover:bg-rose-50 hover:text-rose-500 active:scale-90 disabled:opacity-40 disabled:pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export const inputCls =
  "w-full rounded-2xl border border-rose-100 bg-[#fff8fb] px-3.5 py-2.5 text-sm text-[#3f1d2e] placeholder:text-[#cf9fb1] focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-[#7c4a5e] uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#3f1d2e]/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          "w-full animate-fade-up rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl shadow-rose-200/60",
          wide ? "max-w-xl" : "max-w-md"
        )}
        role="dialog"
        aria-modal
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-[#3f1d2e]">
            {title}
          </h3>
          <IconButton onClick={onClose} title="Close">
            <X className="size-4" />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
  compact,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6" : "py-12"
      )}
    >
      <div className="mb-3 grid size-14 place-items-center rounded-full bg-gradient-to-br from-rose-100 to-pink-50 text-rose-400">
        {icon}
      </div>
      <p className="font-display text-base font-semibold text-[#3f1d2e]">
        {title}
      </p>
      {hint && (
        <p className="mt-1 max-w-58 text-xs leading-relaxed text-[#a86b80]">
          {hint}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-2xl", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin text-rose-400", className ?? "size-5")}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ProgressBar({
  ratio,
  className,
  barClassName,
}: {
  ratio: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-rose-100/80", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500 transition-[width] duration-700 ease-out",
          barClassName
        )}
        style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }}
      />
    </div>
  );
}
