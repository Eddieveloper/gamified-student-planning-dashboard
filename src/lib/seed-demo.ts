import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  meals,
  settings,
  studySessions,
  subjects,
  users,
} from "@/db/schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { addDaysISO, startOfWeekISO, todayISO } from "@/lib/utils";

export const DEMO_EMAIL = "demo@bloomu.app";
export const DEMO_PASSWORD = "tulip1234";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates the demo account with ~3 weeks of realistic life if it doesn't
 * already exist. Returns the demo user's id either way.
 */
export async function ensureDemoSeed(): Promise<{ id: string; name: string }> {
  const existing = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, DEMO_EMAIL))
    .limit(1);
  if (existing[0]) return existing[0];

  const rand = mulberry32(20260214);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const between = (lo: number, hi: number) =>
    Math.round(lo + rand() * (hi - lo));

  const supabase = createSupabaseAdminClient();
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: "Maya Chen" },
  });
  if (authError || !authData.user)
    throw new Error(authError?.message ?? "Unable to create the Supabase demo user");

  const [user] = await db
    .insert(users)
    .values({
      id: authData.user.id,
      email: DEMO_EMAIL,
      name: "Maya Chen",
      // Backdate so seeded history participates in debt calculations
      createdAt: new Date(Date.now() - 16 * 86400000),
    })
    .returning({ id: users.id });

  await db.insert(settings).values({
    userId: user.id,
    calorieGoal: 2100,
    studyGoalMinutes: 150,
    reminderTime: "17:30",
    notificationsEnabled: false,
  });

  const weekMonday = startOfWeekISO(todayISO());

  const subjectRows = await db
    .insert(subjects)
    .values([
      {
        userId: user.id,
        name: "Calculus II",
        code: "MATH 201",
        color: "#f472b6",
        instructor: "Dr. Priya Patel",
        credits: 4,
        weeklyTargetMinutes: 240,
        examDate: addDaysISO(weekMonday, 19),
        notes: "Office hours Tue 15:00, bring problem sets.",
      },
      {
        userId: user.id,
        name: "Organic Chemistry",
        code: "CHEM 210",
        color: "#fb7185",
        instructor: "Prof. Daniel Alvarez",
        credits: 4,
        weeklyTargetMinutes: 300,
        examDate: addDaysISO(weekMonday, 12),
        notes: "Lab reports due every Friday at noon.",
      },
      {
        userId: user.id,
        name: "Data Structures",
        code: "CS 240",
        color: "#e879f9",
        instructor: "Dr. Grace Kim",
        credits: 3,
        weeklyTargetMinutes: 270,
        examDate: addDaysISO(weekMonday, 26),
        notes: "Pair-programming allowed on PAs 1–4 only.",
      },
      {
        userId: user.id,
        name: "Modern Literature",
        code: "ENG 310",
        color: "#c084fc",
        instructor: "Prof. Eleanor Hughes",
        credits: 3,
        weeklyTargetMinutes: 150,
        notes: "Seminar participation counts for 20%.",
      },
      {
        userId: user.id,
        name: "Microeconomics",
        code: "ECON 101",
        color: "#fb923c",
        instructor: "Dr. Kofi Osei",
        credits: 3,
        weeklyTargetMinutes: 150,
        examDate: addDaysISO(weekMonday, 33),
      },
      {
        userId: user.id,
        name: "Cognitive Psychology",
        code: "PSYC 220",
        color: "#fda4af",
        instructor: "Dr. Camille Laurent",
        credits: 3,
        weeklyTargetMinutes: 120,
      },
    ])
    .returning({ id: subjects.id, code: subjects.code });

  const S = Object.fromEntries(subjectRows.map((s) => [s.code, s.id])) as Record<
    string,
    string
  >;

  const breakfasts = [
    { name: "Overnight oats with berries", cal: 340, p: 12 },
    { name: "Greek yogurt parfait", cal: 290, p: 18 },
    { name: "Avocado toast + poached egg", cal: 420, p: 16 },
    { name: "Banana protein pancakes", cal: 480, p: 24 },
    { name: "Berry smoothie bowl", cal: 310, p: 9 },
    { name: "Bagel with cream cheese", cal: 390, p: 11 },
  ];
  const lunches = [
    { name: "Chicken caesar wrap", cal: 560, p: 34 },
    { name: "Quinoa buddha bowl", cal: 520, p: 19 },
    { name: "Tomato basil pasta", cal: 610, p: 17 },
    { name: "Salmon poke bowl", cal: 580, p: 32 },
    { name: "Veggie burrito", cal: 640, p: 21 },
    { name: "Grilled cheese + tomato soup", cal: 670, p: 20 },
  ];
  const dinners = [
    { name: "Tofu veggie stir-fry", cal: 590, p: 26 },
    { name: "Chicken pesto pasta", cal: 720, p: 38 },
    { name: "Sushi platter (12 pc)", cal: 550, p: 28 },
    { name: "Turkey chili + rice", cal: 480, p: 30 },
    { name: "Margherita pizza, 2 slices", cal: 640, p: 24 },
    { name: "Miso ramen with egg", cal: 610, p: 25 },
  ];
  const snacks = [
    { name: "Protein bar", cal: 210, p: 15 },
    { name: "Apple + peanut butter", cal: 190, p: 5 },
    { name: "Trail mix handful", cal: 260, p: 7 },
    { name: "Iced oat latte", cal: 120, p: 3 },
    { name: "Dark chocolate squares", cal: 150, p: 2 },
  ];

  const mealInserts: (typeof meals.$inferInsert)[] = [];
  const studyInserts: (typeof studySessions.$inferInsert)[] = [];
  const studyCodes = [
    "MATH 201",
    "CHEM 210",
    "CS 240",
    "ENG 310",
    "ECON 101",
    "PSYC 220",
  ];
  const studyNotes = [
    "Lecture notes review",
    "Problem set practice",
    "Flashcards — active recall",
    "Past paper questions",
    "Reading + annotations",
    "Group study at the library",
    "Rewatched recorded lecture",
  ];

  const today = todayISO();

  // 15 days of history + today
  for (let i = 15; i >= 0; i--) {
    const date = addDaysISO(today, -i);

    if (i === 0) {
      // Today — intentionally partial so the tulip is mid-growth
      const b = breakfasts[0];
      const l = lunches[3];
      mealInserts.push(
        { userId: user.id, date, name: b.name, calories: b.cal, protein: b.p, mealType: "breakfast" },
        { userId: user.id, date, name: l.name, calories: l.cal, protein: l.p, mealType: "lunch" }
      );
      studyInserts.push({
        userId: user.id,
        date,
        subjectId: S["CS 240"],
        minutes: 90,
        note: "Binary trees worksheet",
      });
      continue;
    }

    // Meals: 3-4 per day
    const b = pick(breakfasts);
    const l = pick(lunches);
    const d = pick(dinners);
    mealInserts.push(
      { userId: user.id, date, name: b.name, calories: b.cal, protein: b.p, mealType: "breakfast" },
      { userId: user.id, date, name: l.name, calories: l.cal, protein: l.p, mealType: "lunch" },
      { userId: user.id, date, name: d.name, calories: d.cal, protein: d.p, mealType: "dinner" }
    );
    if (rand() > 0.35) {
      const s = pick(snacks);
      mealInserts.push({
        userId: user.id,
        date,
        name: s.name,
        calories: s.cal,
        protein: s.p,
        mealType: "snack",
      });
    }

    // Study: most days 1–3 sessions; every ~5th day is a rest day
    const restDay = i % 5 === 3;
    if (!restDay) {
      const sessionCount = rand() > 0.55 ? 2 : rand() > 0.25 ? 3 : 1;
      for (let k = 0; k < sessionCount; k++) {
        studyInserts.push({
          userId: user.id,
          date,
          subjectId: S[pick(studyCodes)],
          minutes: between(30, 95),
          note: pick(studyNotes),
        });
      }
    }
  }

  await db.insert(meals).values(mealInserts);
  await db.insert(studySessions).values(studyInserts);

  type Act = typeof activities.$inferInsert;
  const acts: Act[] = [
    // Completed past work
    { userId: user.id, subjectId: S["MATH 201"], title: "Problem Set 6 — integration techniques", date: addDaysISO(today, -6), type: "assignment", status: "done", priority: "high", estimateMinutes: 120, completedAt: new Date(Date.now() - 5 * 86400000) },
    { userId: user.id, subjectId: S["CS 240"], title: "PA3: hash maps implementation", date: addDaysISO(today, -4), type: "assignment", status: "done", priority: "high", estimateMinutes: 180, completedAt: new Date(Date.now() - 4 * 86400000) },
    { userId: user.id, subjectId: S["PSYC 220"], title: "Quiz 3 — memory & attention", date: addDaysISO(today, -3), type: "exam", status: "done", priority: "high", estimateMinutes: 60, completedAt: new Date(Date.now() - 3 * 86400000) },
    { userId: user.id, title: "Meal prep for the week", date: addDaysISO(today, -2), type: "task", status: "done", priority: "low", estimateMinutes: 90, completedAt: new Date(Date.now() - 2 * 86400000) },
    { userId: user.id, subjectId: S["ECON 101"], title: "Chapter 7 practice problems", date: addDaysISO(today, -1), type: "study", status: "done", priority: "medium", estimateMinutes: 75, completedAt: new Date(Date.now() - 86400000) },
    // Overdue — these form the "debt"
    { userId: user.id, subjectId: S["CHEM 210"], title: "Lab report: acid-base titration", date: addDaysISO(today, -3), type: "assignment", status: "pending", priority: "high", estimateMinutes: 150 },
    { userId: user.id, subjectId: S["ENG 310"], title: "Read Mrs Dalloway, ch. 8–9", date: addDaysISO(today, -1), type: "assignment", status: "pending", priority: "medium", estimateMinutes: 80 },
    { userId: user.id, subjectId: S["CS 240"], title: "Debugging worksheet — pointers", date: addDaysISO(today, -2), type: "task", status: "pending", priority: "low", estimateMinutes: 45 },
    // Today — one done, two open
    { userId: user.id, subjectId: S["MATH 201"], title: "Submit quiz reflections", date: today, type: "task", status: "done", priority: "medium", estimateMinutes: 20, completedAt: new Date() },
    { userId: user.id, subjectId: S["CHEM 210"], title: "Flashcards: reaction mechanisms", date: today, type: "study", status: "pending", priority: "high", estimateMinutes: 40 },
    { userId: user.id, title: "Gym session with Sarah", date: today, type: "event", status: "pending", priority: "low", estimateMinutes: 60 },
    // Upcoming
    { userId: user.id, title: "Study group — library room 2B", date: addDaysISO(today, 1), type: "event", status: "pending", priority: "medium", estimateMinutes: 90 },
    { userId: user.id, subjectId: S["ECON 101"], title: "Problem set 4 — elasticity", date: addDaysISO(today, 2), type: "assignment", status: "pending", priority: "high", estimateMinutes: 110 },
    { userId: user.id, subjectId: S["ENG 310"], title: "Essay draft: Woolf's narrative time", date: addDaysISO(today, 3), type: "assignment", status: "pending", priority: "high", estimateMinutes: 240 },
    { userId: user.id, subjectId: S["PSYC 220"], title: "Summarize attention models paper", date: addDaysISO(today, 4), type: "assignment", status: "pending", priority: "medium", estimateMinutes: 100 },
    { userId: user.id, subjectId: S["CS 240"], title: "Midterm: trees, graphs & heaps", date: addDaysISO(today, 5), type: "exam", status: "pending", priority: "high", estimateMinutes: 120 },
    { userId: user.id, title: "Register for fall courses", date: addDaysISO(today, 6), type: "task", status: "pending", priority: "medium", estimateMinutes: 30 },
    { userId: user.id, subjectId: S["CHEM 210"], title: "Lab practical — spectra analysis", date: addDaysISO(today, 8), type: "exam", status: "pending", priority: "high", estimateMinutes: 120 },
    { userId: user.id, title: "Call the campus clinic", date: addDaysISO(today, 2), type: "task", status: "pending", priority: "low", estimateMinutes: 15 },
  ];
  await db.insert(activities).values(acts);

  return { id: user.id, name: "Maya Chen" };
}
