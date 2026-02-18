type Nutriments = Record<string, unknown>;

export type FoodSearchItem = {
  code: string;
  name: string;
  brands?: string;
  imageUrl?: string;
  nutriScore?: string;
  nutrimentsPer100g: {
    kcal?: number;
    proteins?: number;
    carbs?: number;
    fat?: number;
    sugars?: number;
    salt?: number;
  };
};

function toNumber(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function getKcalPer100g(nutriments?: Nutriments): number | undefined {
  if (!nutriments) return undefined;

  const kcal = toNumber(nutriments["energy-kcal_100g"]) ?? toNumber(nutriments["energy-kcal"]);
  if (kcal !== undefined) return kcal;

  const energyKj = toNumber(nutriments["energy_100g"]);
  if (energyKj !== undefined) return Math.round((energyKj / 4.184) * 10) / 10;

  return undefined;
}

function buildItem(p: any): FoodSearchItem {
  const name =
    (p.product_name_fr?.trim?.() ? p.product_name_fr : undefined) ||
    (p.product_name?.trim?.() ? p.product_name : undefined) ||
    (p.product_name_en?.trim?.() ? p.product_name_en : undefined) ||
    "Produit sans nom";

  const nutriments: Nutriments | undefined = p.nutriments;

  return {
    code: String(p.code ?? ""),
    name,
    brands: p.brands ? String(p.brands) : undefined,
    imageUrl: p.image_url ? String(p.image_url) : undefined,
    nutriScore: p.nutriscore_grade ? String(p.nutriscore_grade) : undefined,
    nutrimentsPer100g: {
      kcal: getKcalPer100g(nutriments),
      proteins: toNumber(nutriments?.["proteins_100g"]),
      carbs: toNumber(nutriments?.["carbohydrates_100g"]),
      fat: toNumber(nutriments?.["fat_100g"]),
      sugars: toNumber(nutriments?.["sugars_100g"]),
      salt: toNumber(nutriments?.["salt_100g"]),
    },
  };
}

const OFF_USER_AGENT = "nutritrack/1.0 (expo)";

export async function searchFoodsByText(query: string, pageSize = 10): Promise<FoodSearchItem[]> {
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

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": OFF_USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new Error(`Open Food Facts error: ${res.status}`);
  }

  const data = await res.json();
  const products: any[] = Array.isArray(data?.products) ? data.products : [];

  return products.map(buildItem).filter((p) => p.code.length > 0);
}

export async function getFoodByBarcode(barcode: string): Promise<FoodSearchItem | null> {
  const code = barcode.trim();
  if (!code) return null;

  const url =
    `https://fr.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json` +
    "?fields=code,product_name,product_name_fr,product_name_en,brands,nutriments,image_url,nutriscore_grade";

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": OFF_USER_AGENT,
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Open Food Facts product error: ${res.status}`);
  }

  const data = await res.json();

  if (!data?.product) return null;

  const item = buildItem(data.product);
  if (!item.code) return null;

  return item;
}
