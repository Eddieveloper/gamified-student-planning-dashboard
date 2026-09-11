export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/** Local timezone-safe YYYY-MM-DD */
export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysISO(iso: string, days: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** Monday-first start of week */
export function startOfWeekISO(iso: string): string {
  const d = fromISO(iso);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return toISO(d);
}

export function diffDays(aISO: string, bISO: string): number {
  const ms = fromISO(bISO).getTime() - fromISO(aISO).getTime();
  return Math.round(ms / 86400000);
}

export const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
export const DAY_NAMES_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export function prettyDate(iso: string): string {
  const d = fromISO(iso);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function weekdayName(iso: string): string {
  const d = fromISO(iso);
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()];
}

export function minutesToHM(min: number): string {
  if (min <= 0) return "0m";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function relativeDay(iso: string, today: string): string {
  const diff = diffDays(iso, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `in ${diff} days`;
  return `${-diff} days ago`;
}

export const SUBJECT_COLORS = [
  "#f472b6", // pink
  "#fb7185", // rose
  "#e879f9", // fuchsia
  "#c084fc", // purple
  "#fda4af", // soft rose
  "#f9a8d4", // soft pink
  "#fb923c", // warm orange accent
  "#a3e635", // leaf green accent
];

export const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
] as const;

export const ACTIVITY_TYPES = [
  { value: "assignment", label: "Assignment" },
  { value: "exam", label: "Exam" },
  { value: "study", label: "Study" },
  { value: "task", label: "Task" },
  { value: "event", label: "Event" },
] as const;

export function activityTypeColor(type: string): string {
  switch (type) {
    case "exam": return "#e11d48";
    case "assignment": return "#db2777";
    case "study": return "#9333ea";
    case "event": return "#ea580c";
    default: return "#4f46e5";
  }
}
