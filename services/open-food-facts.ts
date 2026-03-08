import type { Food } from "@/types/models";

type Nutriments = Record<string, unknown>;

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getCaloriesPer100g(nutriments?: Nutriments): number {
  if (!nutriments) return 0;

  const kcal =
    toNumber(nutriments["energy-kcal_100g"]) ||
    toNumber(nutriments["energy-kcal"]);

  if (kcal > 0) return kcal;

  const energyKj = toNumber(nutriments["energy_100g"]);
  if (energyKj > 0) {
    return Math.round((energyKj / 4.184) * 10) / 10;
  }

  return 0;
}

function buildFood(product: any): Food {
  const name =
    (product.product_name_fr?.trim?.() ? product.product_name_fr : undefined) ||
    (product.product_name?.trim?.() ? product.product_name : undefined) ||
    (product.product_name_en?.trim?.() ? product.product_name_en : undefined) ||
    "Produit sans nom";

  const nutriments: Nutriments | undefined = product.nutriments;

  return {
    id: String(product.code ?? ""),
    name,
    brand: String(product.brands ?? "").trim(),
    image_url: String(product.image_url ?? "").trim(),
    nutriscore: String(product.nutriscore_grade ?? "").trim().toLowerCase(),
    calories: getCaloriesPer100g(nutriments),
    proteins: toNumber(nutriments?.["proteins_100g"]),
    carbs: toNumber(nutriments?.["carbohydrates_100g"]),
    fats: toNumber(nutriments?.["fat_100g"]),
  };
}

const OFF_USER_AGENT = "nutritrack/1.0 (expo)";

export async function searchFoodsByText(query: string, pageSize = 10): Promise<Food[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url =
    "https://fr.openfoodfacts.org/cgi/search.pl" +
    `?search_terms=${encodeURIComponent(trimmed)}` +
    "&search_simple=1" +
    "&action=process" +
    "&json=1" +
    "&fields=code,product_name,product_name_fr,product_name_en,brands,nutriments,image_url,nutriscore_grade" +
    `&page_size=${pageSize}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": OFF_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Open Food Facts error: ${response.status}`);
  }

  const data = await response.json();
  const products: any[] = Array.isArray(data?.products) ? data.products : [];

  return products
    .map(buildFood)
    .filter((food) => food.id.length > 0);
}

export async function getFoodByBarcode(barcode: string): Promise<Food | null> {
  const code = barcode.trim();
  if (!code) return null;

  const url =
    `https://fr.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json` +
    "?fields=code,product_name,product_name_fr,product_name_en,brands,nutriments,image_url,nutriscore_grade";

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": OFF_USER_AGENT,
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Open Food Facts product error: ${response.status}`);
  }

  const data = await response.json();
  if (!data?.product) return null;

  const food = buildFood(data.product);
  if (!food.id) return null;

  return food;
}