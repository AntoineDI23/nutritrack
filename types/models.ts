export type MealName = "Petit-déjeuner" | "Déjeuner" | "Dîner" | "Snack";

export const MEAL_NAMES: MealName[] = [
  "Petit-déjeuner",
  "Déjeuner",
  "Dîner",
  "Snack",
];

export type Food = {
  id: string;
  name: string;
  brand: string;
  image_url: string;
  nutriscore: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
};

export type Meal = {
  id: string;
  name: MealName;
  date: string;
  foods: Food[];
};