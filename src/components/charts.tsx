"use client";

import { cn, DAY_LETTERS, minutesToHM } from "@/lib/utils";

export function Ring({
  ratio,
  size = 132,
  stroke = 11,
  children,
  gradientId = "ringGrad",
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
  gradientId?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1.15, ratio);
  const dash = Math.min(1, clamped) * c;
  const over = ratio > 1.05;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={over ? "#f87171" : "#f9a8d4"} />
            <stop offset="100%" stopColor={over ? "#e11d48" : "#ec4899"} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#fce7f0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export type BarDatum = {
  date: string;
  value: number;
  isToday: boolean;
};

export function WeeklyBars({
  data,
  goal,
  format = (v: number) => minutesToHM(v),
}: {
  data: BarDatum[];
  goal: number;
  format?: (v: number) => string;
}) {
  const max = Math.max(goal * 1.25, ...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height: 190 }}>
      {data.map((d, i) => {
        const h = Math.max(3, (d.value / max) * 148);
        const met = d.value >= goal;
        return (
          <div key={d.date} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div className="pointer-events-none absolute -top-1 rounded-lg bg-[#3f1d2e] px-2 py-1 text-[10px] font-semibold whitespace-nowrap text-white opacity-0 shadow-lg transition-all group-hover:-top-3 group-hover:opacity-100">
              {format(d.value)}
            </div>
            <div className="relative flex w-full flex-1 items-end justify-center">
              {/* goal marker */}
              <div
                className="absolute right-0 left-0 border-t-2 border-dashed border-rose-300/70"
                style={{ bottom: `${(goal / max) * 148}px` }}
              />
              <div
                className={cn(
                  "w-full max-w-10 rounded-t-xl transition-all duration-500 group-hover:brightness-110",
                  met
                    ? "bg-gradient-to-t from-rose-500 to-pink-400 shadow-[0_4px_14px_-4px_rgba(236,72,153,0.6)]"
                    : d.value > 0
                    ? "bg-gradient-to-t from-rose-300 to-pink-200"
                    : "bg-rose-100",
                  d.isToday && "ring-2 ring-pink-400 ring-offset-2 ring-offset-white"
                )}
                style={{ height: h, transitionDelay: `${i * 40}ms` }}
              />
            </div>
            <span
              className={cn(
                "text-[11px] font-semibold",
                d.isToday ? "text-rose-600" : "text-[#c493a6]"
              )}
            >
              {DAY_LETTERS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export type LineDatum = {
  date: string;
  value: number | null;
  isToday: boolean;
};

export function AreaLine({
  data,
  goal,
  formatLabel,
}: {
  data: LineDatum[];
  goal: number;
  formatLabel: (d: LineDatum) => string;
}) {
  const W = 560;
  const H = 170;
  const PAD = 10;
  const values = data.map((d) => d.value ?? 0);
  const max = Math.max(goal * 1.2, ...values, 1);
  const stepX = (W - PAD * 2) / (data.length - 1);
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const x = (i: number) => PAD + i * stepX;

  const pts = data.map((d, i) => ({ ...d, i, px: x(i), py: d.value === null ? null : y(d.value) }));

  let linePath = "";
  let drawing = false;
  for (const p of pts) {
    if (p.py === null) {
      drawing = false;
      continue;
    }
    linePath += drawing ? ` L${p.px},${p.py}` : `M${p.px},${p.py}`;
    drawing = true;
  }

  // area: same path closed along bottom
  let areaPath = "";
  drawing = false;
  let segStart = 0;
  for (const p of pts) {
    if (p.py === null) {
      if (drawing) areaPath += ` L${x(p.i - 1)},${H - PAD} L${segStart},${H - PAD} Z`;
      drawing = false;
      continue;
    }
    if (!drawing) segStart = p.px;
    areaPath += drawing ? ` L${p.px},${p.py}` : `M${p.px},${p.py}`;
    drawing = true;
  }
  if (drawing) areaPath += ` L${x(pts.length - 1)},${H - PAD} L${segStart},${H - PAD} Z`;

  const goalY = y(goal);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 170 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>
        <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="#fce7f0" strokeWidth="1.5" />
        <line x1={PAD} x2={W - PAD} y1={goalY} y2={goalY} stroke="#fb7185" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.8" />
        {areaPath && <path d={areaPath} fill="url(#areaFill)" />}
        {linePath && (
          <path d={linePath} fill="none" stroke="url(#lineStroke)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {pts.map((p) =>
          p.py === null ? null : (
            <circle
              key={p.date}
              cx={p.px}
              cy={p.py}
              r={p.isToday ? 5 : 3.5}
              fill="#fff"
              stroke="#ec4899"
              strokeWidth="2.5"
            >
              <title>{formatLabel(p)}</title>
            </circle>
          )
        )}
      </svg>
      <div className="mt-1 flex justify-between px-1">
        {pts.map((p, i) => (
          <span key={p.date} className={cn("w-0 text-[11px] font-semibold", p.isToday ? "text-rose-600" : "text-[#c493a6]")}>
            {DAY_LETTERS[i]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Donut({
  segments,
  size = 168,
  stroke = 22,
  centerTop,
  centerBottom,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  stroke?: number;
  centerTop: string;
  centerBottom: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#fdf0f5" strokeWidth={stroke} fill="none" />
        {segments
          .filter((s) => s.value > 0)
          .map((s) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={s.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${Math.max(0, len - 2)} ${c - len + 2}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-700"
              >
                <title>{`${s.label}: ${minutesToHM(s.value)}`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-2xl font-bold text-[#3f1d2e]">{centerTop}</p>
          <p className="text-[11px] font-semibold tracking-wide text-[#a86b80] uppercase">{centerBottom}</p>
        </div>
      </div>
    </div>
  );
}
