import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SignedIn, SignedOut } from "@clerk/clerk-expo";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { consumeLastScan } from "@/state/scan-result";
import {
  getFoodByBarcode,
  searchFoodsByText,
  type FoodSearchItem,
} from "@/services/open-food-facts";

type MealItem = {
  code: string;
  name: string;
  brands?: string;
  grams: number;
  nutrimentsPer100g: {
    kcal?: number;
    proteins?: number;
    carbs?: number;
    fat?: number;
  };
};

type Meal = {
  id: string;
  title: string;
  createdAt: string;
  items: MealItem[];
};

const STORAGE_KEY = "nutritrack.meals.v1";

function clampNumber(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function Page() {
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [items, setItems] = React.useState<MealItem[]>([]);

  // recherche texte
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebouncedValue(query, 700); // important (limite 10 req/min)
  const [results, setResults] = React.useState<FoodSearchItem[]>([]);
  const [loadingSearch, setLoadingSearch] = React.useState(false);

  // scan
  const [loadingScan, setLoadingScan] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);

  const addFood = React.useCallback((food: FoodSearchItem) => {
    setItems((prev) => [
      ...prev,
      {
        code: food.code,
        name: food.name,
        brands: food.brands,
        grams: 100,
        nutrimentsPer100g: {
          kcal: food.nutrimentsPer100g.kcal,
          proteins: food.nutrimentsPer100g.proteins,
          carbs: food.nutrimentsPer100g.carbs,
          fat: food.nutrimentsPer100g.fat,
        },
      },
    ]);
  }, []);

  // Quand on revient du scanner, on récupère le code-barres et on fetch le produit
  useFocusEffect(
    React.useCallback(() => {
      const scan = consumeLastScan();
      if (!scan) return;

      let cancelled = false;

      (async () => {
        try {
          setLoadingScan(true);
          setError(null);

          const product = await getFoodByBarcode(scan.barcode);

          if (cancelled) return;

          if (!product) {
            setError(
              "Produit introuvable pour ce code-barres. Essaie la recherche par texte.",
            );
            return;
          }

          addFood(product);
        } catch (e) {
          if (!cancelled) setError("Erreur lors de la récupération du produit scanné.");
        } finally {
          if (!cancelled) setLoadingScan(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [addFood]),
  );

  // Recherche texte (API v1)
  React.useEffect(() => {
    const q = debouncedQuery.trim();

    if (q.length < 2) {
      setResults([]);
      setError(null);
      setLoadingSearch(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoadingSearch(true);
        setError(null);

        const data = await searchFoodsByText(q, 10);
        if (!cancelled) setResults(data);
      } catch (e) {
        if (!cancelled) setError("Erreur lors de la recherche Open Food Facts.");
      } finally {
        if (!cancelled) setLoadingSearch(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const updateGrams = (index: number, gramsText: string) => {
    const n = Number(gramsText.replace(",", "."));
    const grams = Number.isFinite(n) ? clampNumber(n, 0, 5000) : 0;

    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, grams } : it)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const saveMeal = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Donne un nom à ton repas.");
      return;
    }
    if (items.length === 0) {
      setError("Ajoute au moins un aliment.");
      return;
    }

    const meal: Meal = {
      id: `${Date.now()}`,
      title: trimmedTitle,
      createdAt: new Date().toISOString(),
      items,
    };

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as Meal[]) : [];
    const next = Array.isArray(existing) ? [meal, ...existing] : [meal];

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    router.replace("/");
  };

  const goToScanner = () => {
    setError(null);
    router.push("/add/camera");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Ajouter un repas</ThemedText>

      <SignedOut>
        <ThemedText>Tu dois être connecté pour ajouter un repas.</ThemedText>
        <View style={styles.row}>
          <Link href="/(auth)/login">
            <ThemedText type="link">Login</ThemedText>
          </Link>
          <Link href="/(auth)/signup">
            <ThemedText type="link">Sign up</ThemedText>
          </Link>
        </View>
      </SignedOut>

      <SignedIn>
        <ThemedText style={styles.label}>Nom du repas</ThemedText>
        <TextInput
          style={styles.input}
          value={title}
          placeholder="Ex: Déjeuner"
          placeholderTextColor="#666666"
          onChangeText={setTitle}
        />

        <ThemedText style={styles.sectionTitle}>Ajouter un aliment</ThemedText>

        <Pressable style={styles.scanBtn} onPress={goToScanner}>
          <ThemedText style={styles.scanBtnText}>Scanner un code-barres</ThemedText>
        </Pressable>

        {loadingScan ? (
          <View style={styles.row}>
            <ActivityIndicator />
            <ThemedText>Récupération du produit scanné…</ThemedText>
          </View>
        ) : null}

        <ThemedText style={styles.muted}>Ou recherche par texte :</ThemedText>

        <TextInput
          style={styles.input}
          value={query}
          placeholder="Tape un aliment (ex: coca cola)"
          placeholderTextColor="#666666"
          onChangeText={setQuery}
          autoCapitalize="none"
        />

        {loadingSearch ? (
          <View style={styles.row}>
            <ActivityIndicator />
            <ThemedText>Recherche…</ThemedText>
          </View>
        ) : null}

        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

        {!loadingSearch && debouncedQuery.trim().length >= 2 && results.length === 0 ? (
          <ThemedText style={styles.muted}>
            Aucun résultat. (La base Open Food Facts ne contient pas tous les produits.)
          </ThemedText>
        ) : null}

        <View style={styles.results}>
          {results.map((p) => (
            <Pressable
              key={p.code}
              style={({ pressed }) => [styles.resultCard, pressed && styles.cardPressed]}
              onPress={() => addFood(p)}
            >
              {p.imageUrl ? (
                <Image source={{ uri: p.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]} />
              )}

              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText style={styles.cardTitle}>{p.name}</ThemedText>
                {p.brands ? <ThemedText style={styles.muted}>{p.brands}</ThemedText> : null}
                <ThemedText style={styles.muted}>
                  {p.nutrimentsPer100g.kcal ?? "?"} kcal / 100g
                  {p.nutriScore ? ` • Nutri-Score ${p.nutriScore.toUpperCase()}` : ""}
                </ThemedText>
              </View>

              <ThemedText type="link">Ajouter</ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>Aliments du repas</ThemedText>

        {items.length === 0 ? (
          <ThemedText style={styles.muted}>Aucun aliment ajouté.</ThemedText>
        ) : (
          <View style={styles.items}>
            {items.map((it, idx) => (
              <View key={`${it.code}-${idx}`} style={styles.itemCard}>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText style={styles.cardTitle}>{it.name}</ThemedText>
                  {it.brands ? <ThemedText style={styles.muted}>{it.brands}</ThemedText> : null}
                  <ThemedText style={styles.muted}>
                    {it.nutrimentsPer100g.kcal ?? "?"} kcal / 100g
                  </ThemedText>
                </View>

                <View style={styles.gramsBox}>
                  <ThemedText style={styles.muted}>g</ThemedText>
                  <TextInput
                    style={styles.gramsInput}
                    value={String(it.grams)}
                    keyboardType="numeric"
                    onChangeText={(t) => updateGrams(idx, t)}
                  />
                </View>

                <Pressable onPress={() => removeItem(idx)} style={styles.removeBtn}>
                  <ThemedText type="link">Retirer</ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            (!title.trim() || items.length === 0) && styles.saveBtnDisabled,
            pressed && styles.cardPressed,
          ]}
          onPress={saveMeal}
          disabled={!title.trim() || items.length === 0}
        >
          <ThemedText style={styles.saveBtnText}>Enregistrer le repas</ThemedText>
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText type="link">Annuler</ThemedText>
        </Pressable>
      </SignedIn>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },

  label: { fontWeight: "800", fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },

  sectionTitle: { marginTop: 10, fontSize: 18, fontWeight: "900" },
  muted: { opacity: 0.8 },
  error: { color: "#c62828", fontWeight: "800" },

  scanBtn: {
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  scanBtnText: { color: "white", fontWeight: "900" },

  results: { gap: 10, marginTop: 6 },
  resultCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  cardPressed: { opacity: 0.75 },
  cardTitle: { fontSize: 16, fontWeight: "900" },

  thumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#eee" },
  thumbPlaceholder: { borderWidth: 1, borderColor: "#ddd" },

  items: { gap: 10, marginTop: 6 },
  itemCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  gramsBox: { flexDirection: "row", alignItems: "center", gap: 6 },
  gramsInput: {
    width: 70,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    textAlign: "center",
  },
  removeBtn: { paddingVertical: 6, paddingHorizontal: 8 },

  saveBtn: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "white", fontWeight: "900" },

  backBtn: { alignSelf: "flex-start", paddingVertical: 6 },
});
