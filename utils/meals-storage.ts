import type { Food, Meal, MealName } from "@/types/models";
import { getDatabase } from "@/utils/database";

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeMealName(value: unknown): MealName {
  if (
    value === "Petit-déjeuner" ||
    value === "Déjeuner" ||
    value === "Dîner" ||
    value === "Snack"
  ) {
    return value;
  }

  if (value === "Breakfast") return "Petit-déjeuner";
  if (value === "Lunch") return "Déjeuner";
  if (value === "Dinner") return "Dîner";

  return "Déjeuner";
}

function normalizeFood(raw: any): Food | null {
  if (!raw || typeof raw !== "object") return null;

  const id = String(raw.id ?? "").trim();
  if (!id) return null;

  const name = String(raw.name ?? "Produit sans nom").trim();

  return {
    id,
    name: name || "Produit sans nom",
    brand: String(raw.brand ?? "").trim(),
    image_url: String(raw.image_url ?? "").trim(),
    nutriscore: String(raw.nutriscore ?? "").trim().toLowerCase(),
    calories: toNumber(raw.calories),
    proteins: toNumber(raw.proteins),
    carbs: toNumber(raw.carbs),
    fats: toNumber(raw.fats),
  };
}

function buildMealId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type MealRow = {
  id: string;
  name: string;
  date: string;
};

type FoodRow = {
  row_id: string;
  id: string;
  meal_id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  nutriscore: string | null;
  calories: number | null;
  proteins: number | null;
  carbs: number | null;
  fats: number | null;
};

export function computeMealTotals(meal: Meal) {
  return meal.foods.reduce(
    (acc, food) => {
      acc.calories += food.calories;
      acc.proteins += food.proteins;
      acc.carbs += food.carbs;
      acc.fats += food.fats;
      return acc;
    },
    { calories: 0, proteins: 0, carbs: 0, fats: 0 },
  );
}

export async function loadMeals(): Promise<Meal[]> {
  const db = await getDatabase();

  const mealRows = await db.getAllAsync<MealRow>(
    "SELECT id, name, date FROM meals ORDER BY date DESC, id DESC",
  );

  const foodRows = await db.getAllAsync<FoodRow>(
    `
      SELECT row_id, id, meal_id, name, brand, image_url, nutriscore, calories, proteins, carbs, fats
      FROM foods
      ORDER BY row_id DESC
    `,
  );

  const foodsByMealId = new Map<string, Food[]>();

  for (const row of foodRows) {
    const food = normalizeFood(row);
    if (!food) continue;

    const currentFoods = foodsByMealId.get(row.meal_id) ?? [];
    currentFoods.push(food);
    foodsByMealId.set(row.meal_id, currentFoods);
  }

  return mealRows.map((row) => ({
    id: row.id,
    name: normalizeMealName(row.name),
    date: row.date,
    foods: foodsByMealId.get(row.id) ?? [],
  }));
}

export async function saveMeals(meals: Meal[]) {
  const db = await getDatabase();

  await db.execAsync(`
    DELETE FROM foods;
    DELETE FROM meals;
  `);

  for (const meal of meals) {
    await db.runAsync(
      "INSERT INTO meals (id, name, date) VALUES (?, ?, ?)",
      meal.id,
      meal.name,
      meal.date,
    );

    for (const food of meal.foods) {
      await db.runAsync(
        `
          INSERT INTO foods (
            row_id,
            id,
            meal_id,
            name,
            brand,
            image_url,
            nutriscore,
            calories,
            proteins,
            carbs,
            fats
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        buildMealId(),
        food.id,
        meal.id,
        food.name,
        food.brand,
        food.image_url,
        food.nutriscore,
        food.calories,
        food.proteins,
        food.carbs,
        food.fats,
      );
    }
  }
}

export async function addMeal(meal: Meal) {
  const db = await getDatabase();

  await db.runAsync(
    "INSERT INTO meals (id, name, date) VALUES (?, ?, ?)",
    meal.id,
    meal.name,
    meal.date,
  );

  for (const food of meal.foods) {
    await db.runAsync(
      `
        INSERT INTO foods (
          row_id,
          id,
          meal_id,
          name,
          brand,
          image_url,
          nutriscore,
          calories,
          proteins,
          carbs,
          fats
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      buildMealId(),
      food.id,
      meal.id,
      food.name,
      food.brand,
      food.image_url,
      food.nutriscore,
      food.calories,
      food.proteins,
      food.carbs,
      food.fats,
    );
  }
}

export async function getMealById(id: string): Promise<Meal | null> {
  const db = await getDatabase();

  const mealRow = await db.getFirstAsync<MealRow>(
    "SELECT id, name, date FROM meals WHERE id = ?",
    id,
  );

  if (!mealRow) return null;

  const foodRows = await db.getAllAsync<FoodRow>(
    `
      SELECT row_id, id, meal_id, name, brand, image_url, nutriscore, calories, proteins, carbs, fats
      FROM foods
      WHERE meal_id = ?
      ORDER BY row_id DESC
    `,
    id,
  );

  const foods = foodRows
    .map(normalizeFood)
    .filter((food): food is Food => food !== null);

  return {
    id: mealRow.id,
    name: normalizeMealName(mealRow.name),
    date: mealRow.date,
    foods,
  };
}

export async function deleteMealById(id: string) {
  const db = await getDatabase();

  await db.runAsync("DELETE FROM meals WHERE id = ?", id);
}