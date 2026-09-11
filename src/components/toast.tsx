"use client";

import { CheckCircle2, AlertCircle, Flower2 } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type Toast = {
  id: number;
  message: string;
  kind: "success" | "error" | "bloom";
};

const ToastCtx = createContext<{
  toast: (message: string, kind?: Toast["kind"]) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, kind: Toast["kind"] = "success") => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, message, kind }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3800);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[90] flex w-[calc(100%-2rem)] max-w-sm flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "animate-toast-in pointer-events-auto flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md",
              t.kind === "error"
                ? "border-red-200 bg-red-50/95 text-red-700"
                : t.kind === "bloom"
                ? "border-pink-300 bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-300"
                : "border-rose-200 bg-white/95 text-[#3f1d2e] shadow-rose-200/60"
            )}
          >
            {t.kind === "error" ? (
              <AlertCircle className="size-4 shrink-0" />
            ) : t.kind === "bloom" ? (
              <Flower2 className="size-4 shrink-0" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-rose-500" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
