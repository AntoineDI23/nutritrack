import { getDatabase } from "@/utils/database";

const DAILY_CALORIE_GOAL_KEY = "daily_calorie_goal";
const DEFAULT_DAILY_CALORIE_GOAL = 2000;

function normalizeGoal(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return DEFAULT_DAILY_CALORIE_GOAL;
  }

  return Math.round(n);
}

export async function getDailyCalorieGoal(): Promise<number> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    DAILY_CALORIE_GOAL_KEY,
  );

  if (!row) {
    return DEFAULT_DAILY_CALORIE_GOAL;
  }

  return normalizeGoal(row.value);
}

export async function saveDailyCalorieGoal(goal: number) {
  const db = await getDatabase();
  const normalizedGoal = normalizeGoal(goal);

  await db.runAsync(
    `
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    DAILY_CALORIE_GOAL_KEY,
    String(normalizedGoal),
  );
}