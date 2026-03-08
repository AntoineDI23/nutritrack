import type { Food } from "@/types/models";

type ScanResult = {
  food: Food;
  at: number;
};

let lastScannedFood: ScanResult | null = null;

export function setLastScannedFood(food: Food) {
  lastScannedFood = {
    food,
    at: Date.now(),
  };
}

export function consumeLastScannedFood(): Food | null {
  const value = lastScannedFood;
  lastScannedFood = null;
  return value?.food ?? null;
}