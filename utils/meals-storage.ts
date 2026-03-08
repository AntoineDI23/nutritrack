import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Food, Meal, MealName } from "@/types/models";

export const STORAGE_KEY = "nutritrack.meals.v1";

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

function normalizeDate(value: unknown): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (typeof value === "string" && value.includes("T")) {
    return value.split("T")[0];
  }

  return new Date().toISOString().split("T")[0];
}

function normalizeFood(raw: any): Food | null {
  if (!raw || typeof raw !== "object") return null;

  const id = String(raw.id ?? raw.code ?? "").trim();
  if (!id) return null;

  const name = String(
    raw.name ??
      raw.product_name ??
      raw.product_name_fr ??
      raw.product_name_en ??
      "Produit sans nom",
  ).trim();

  return {
    id,
    name: name || "Produit sans nom",
    brand: String(raw.brand ?? raw.brands ?? "").trim(),
    image_url: String(raw.image_url ?? raw.imageUrl ?? "").trim(),
    nutriscore: String(raw.nutriscore ?? raw.nutriScore ?? "").trim().toLowerCase(),
    calories: toNumber(raw.calories ?? raw.nutrimentsPer100g?.kcal),
    proteins: toNumber(raw.proteins ?? raw.nutrimentsPer100g?.proteins),
    carbs: toNumber(raw.carbs ?? raw.nutrimentsPer100g?.carbs),
    fats: toNumber(raw.fats ?? raw.nutrimentsPer100g?.fat ?? raw.nutrimentsPer100g?.fats),
  };
}

function normalizeMeal(raw: any): Meal | null {
  if (!raw || typeof raw !== "object") return null;

  const id = String(raw.id ?? "").trim();
  if (!id) return null;

  const foodsSource = Array.isArray(raw.foods)
    ? raw.foods
    : Array.isArray(raw.items)
      ? raw.items
      : [];

  const foods = foodsSource
    .map(normalizeFood)
    .filter((food: Food | null): food is Food => food !== null);

  return {
    id,
    name: normalizeMealName(raw.name ?? raw.title),
    date: normalizeDate(raw.date ?? raw.createdAt),
    foods,
  };
}

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
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeMeal)
      .filter((meal): meal is Meal => meal !== null)
      .sort((a, b) => {
        if (a.date === b.date) return b.id.localeCompare(a.id);
        return b.date.localeCompare(a.date);
      });
  } catch {
    return [];
  }
}

export async function saveMeals(meals: Meal[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
}

export async function addMeal(meal: Meal) {
  const meals = await loadMeals();
  await saveMeals([meal, ...meals]);
}

export async function getMealById(id: string) {
  const meals = await loadMeals();
  return meals.find((meal) => meal.id === id) ?? null;
}