import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  date,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const settings = pgTable("settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  calorieGoal: integer("calorie_goal").notNull().default(2200),
  studyGoalMinutes: integer("study_goal_minutes").notNull().default(120),
  reminderTime: varchar("reminder_time", { length: 5 }).notNull().default("18:00"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 32 }).notNull().default(""),
  color: varchar("color", { length: 16 }).notNull().default("#f472b6"),
  instructor: varchar("instructor", { length: 120 }).notNull().default(""),
  credits: integer("credits").notNull().default(3),
  weeklyTargetMinutes: integer("weekly_target_minutes").notNull().default(180),
  examDate: date("exam_date", { mode: "string" }),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const meals = pgTable("meals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull().default(0),
  mealType: varchar("meal_type", { length: 16 }).notNull().default("snack"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const studySessions = pgTable("study_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id").references(() => subjects.id, {
    onDelete: "set null",
  }),
  date: date("date", { mode: "string" }).notNull(),
  minutes: integer("minutes").notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id").references(() => subjects.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 180 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default("task"),
  status: varchar("status", { length: 12 }).notNull().default("pending"),
  priority: varchar("priority", { length: 8 }).notNull().default("medium"),
  estimateMinutes: integer("estimate_minutes").notNull().default(60),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
