export type TulipTask = {
  key: string;
  label: string;
  earned: number;
  points: number;
};

export type TulipStage = "seed" | "sprout" | "bud" | "opening" | "bloom";

export type TulipResult = {
  percent: number;
  stage: TulipStage;
  tasks: TulipTask[];
};

export type TulipInput = {
  studyMinutes: number;
  studyGoalMinutes: number;
  mealCount: number;
  calories: number;
  calorieGoal: number;
  activitiesTotal: number;
  activitiesDone: number;
};

/**
 * The daily tulip grows from 5 habits:
 *  - focus time        (up to 40 pts, proportional to study goal)
 *  - logging meals     (20 pts)
 *  - staying on target (15 pts)
 *  - finishing plans   (25 pts)
 */
export function computeTulip(input: TulipInput): TulipResult {
  const studyRatio =
    input.studyGoalMinutes > 0
      ? Math.min(1, input.studyMinutes / input.studyGoalMinutes)
      : 1;
  const studyEarned = Math.round(40 * studyRatio);

  let mealsEarned = 0;
  if (input.mealCount >= 1) mealsEarned += 8;
  if (input.mealCount >= 2) mealsEarned += 6;
  if (input.mealCount >= 3) mealsEarned += 6;

  const onTarget =
    input.mealCount >= 2 &&
    input.calories <= Math.round(input.calorieGoal * 1.05) &&
    input.calories >= Math.round(input.calorieGoal * 0.45);
  const targetEarned = onTarget ? 15 : 0;

  // No activities planned shouldn't block a bloom — grant the points.
  const actRatio =
    input.activitiesTotal === 0
      ? 1
      : Math.min(1, input.activitiesDone / input.activitiesTotal);
  const actEarned = Math.round(25 * actRatio);

  const tasks: TulipTask[] = [
    {
      key: "study",
      label: `Focus time ${input.studyMinutes}/${input.studyGoalMinutes} min`,
      earned: studyEarned,
      points: 40,
    },
    {
      key: "meals",
      label: `${input.mealCount} meal${input.mealCount === 1 ? "" : "s"} logged`,
      earned: mealsEarned,
      points: 20,
    },
    {
      key: "target",
      label: "Calories on target",
      earned: targetEarned,
      points: 15,
    },
    {
      key: "activities",
      label:
        input.activitiesTotal === 0
          ? "Clear schedule — no tasks due"
          : `${input.activitiesDone}/${input.activitiesTotal} tasks done`,
      earned: actEarned,
      points: 25,
    },
  ];

  const percent = Math.min(
    100,
    studyEarned + mealsEarned + targetEarned + actEarned
  );

  const stage: TulipStage =
    percent >= 90
      ? "bloom"
      : percent >= 68
      ? "opening"
      : percent >= 45
      ? "bud"
      : percent >= 20
      ? "sprout"
      : "seed";

  return { percent, stage, tasks };
}

export const STAGE_META: Record<TulipStage, { title: string; hint: string }> = {
  seed: { title: "A seed in the soil", hint: "Log your first habits to wake your tulip." },
  sprout: { title: "Sprouting", hint: "Roots are down — keep the streak alive." },
  bud: { title: "A bud appears", hint: "Halfway there. Petals are forming." },
  opening: { title: "Almost in bloom", hint: "One more push and it opens fully." },
  bloom: { title: "Full bloom!", hint: "You finished the day's plan. Beautiful." },
};
