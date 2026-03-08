import * as React from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Food, Meal, MealName } from "@/types/models";
import { MEAL_NAMES } from "@/types/models";
import { addMeal } from "@/utils/meals-storage";
import { consumeLastScan } from "@/state/scan-result";
import { getFoodByBarcode, searchFoodsByText } from "@/services/open-food-facts";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default function Page() {
  const router = useRouter();

  const [mealName, setMealName] = React.useState<MealName>("Déjeuner");
  const [mealDate, setMealDate] = React.useState(getTodayDate());
  const [foods, setFoods] = React.useState<Food[]>([]);

  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebouncedValue(query, 700);

  const [results, setResults] = React.useState<Food[]>([]);
  const [loadingSearch, setLoadingSearch] = React.useState(false);
  const [loadingScan, setLoadingScan] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const addFoodToMeal = React.useCallback((food: Food) => {
    setFoods((prev) => [...prev, food]);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const scan = consumeLastScan();
      if (!scan) return;

      let cancelled = false;

      (async () => {
        try {
          setLoadingScan(true);
          setError(null);

          const food = await getFoodByBarcode(scan.barcode);

          if (cancelled) return;

          if (!food) {
            setError("Produit non trouvé pour ce code-barres. Essaie la recherche par texte.");
            return;
          }

          addFoodToMeal(food);
        } catch {
          if (!cancelled) {
            setError("Erreur lors de la récupération du produit scanné.");
          }
        } finally {
          if (!cancelled) {
            setLoadingScan(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [addFoodToMeal]),
  );

  React.useEffect(() => {
    const trimmed = debouncedQuery.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setLoadingSearch(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoadingSearch(true);
        setError(null);

        const foodsFound = await searchFoodsByText(trimmed, 10);

        if (!cancelled) {
          setResults(foodsFound);
        }
      } catch {
        if (!cancelled) {
          setError("Erreur lors de la recherche Open Food Facts.");
        }
      } finally {
        if (!cancelled) {
          setLoadingSearch(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const removeFood = (index: number) => {
    setFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const saveCurrentMeal = async () => {
    if (!mealDate.trim()) {
      setError("Renseigne une date de repas.");
      return;
    }

    if (foods.length === 0) {
      setError("Ajoute au moins un aliment.");
      return;
    }

    const meal: Meal = {
      id: Date.now().toString(),
      name: mealName,
      date: mealDate,
      foods,
    };

    await addMeal(meal);
    router.replace("/");
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Ajouter un repas</ThemedText>

        <ThemedText style={styles.label}>Type de repas</ThemedText>
        <View style={styles.mealTypeContainer}>
          {MEAL_NAMES.map((name) => {
            const selected = mealName === name;

            return (
              <Pressable
                key={name}
                style={({ pressed }) => [
                  styles.mealTypeButton,
                  selected && styles.mealTypeButtonSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => setMealName(name)}
              >
                <ThemedText
                  style={[
                    styles.mealTypeButtonText,
                    selected && styles.mealTypeButtonTextSelected,
                  ]}
                >
                  {name}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={styles.label}>Date</ThemedText>
        <TextInput
          style={styles.input}
          value={mealDate}
          onChangeText={setMealDate}
          placeholder="2025-02-10"
          placeholderTextColor="#666666"
        />

        <ThemedText style={styles.sectionTitle}>Ajouter un aliment</ThemedText>

        <Pressable style={styles.scanButton} onPress={() => router.push("/add/camera")}>
          <ThemedText style={styles.scanButtonText}>Scanner un code-barres</ThemedText>
        </Pressable>

        {loadingScan && (
          <ThemedText style={styles.muted}>Récupération du produit scanné…</ThemedText>
        )}

        <ThemedText style={styles.muted}>Ou recherche par texte :</ThemedText>

        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Ex: coca cola"
          placeholderTextColor="#666666"
          autoCapitalize="none"
        />

        {loadingSearch && (
          <ThemedText style={styles.muted}>Recherche…</ThemedText>
        )}

        {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}

        {!loadingSearch && debouncedQuery.trim().length >= 2 && results.length === 0 && !error && (
          <ThemedText style={styles.muted}>
            Aucun résultat. Tous les produits ne sont pas forcément dans Open Food Facts.
          </ThemedText>
        )}

        <View style={styles.results}>
          {results.map((food) => (
            <Pressable
              key={food.id}
              style={({ pressed }) => [styles.resultCard, pressed && styles.pressed]}
              onPress={() => addFoodToMeal(food)}
            >
              {food.image_url ? (
                <Image source={{ uri: food.image_url }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]} />
              )}

              <View style={styles.resultContent}>
                <ThemedText style={styles.cardTitle}>{food.name}</ThemedText>

                {!!food.brand && (
                  <ThemedText style={styles.muted}>{food.brand}</ThemedText>
                )}

                <ThemedText style={styles.muted}>
                  {round1(food.calories)} kcal • P {round1(food.proteins)}g • G {round1(food.carbs)}g • L {round1(food.fats)}g
                </ThemedText>

                {!!food.nutriscore && (
                  <ThemedText style={styles.muted}>
                    Nutri-Score {food.nutriscore.toUpperCase()}
                  </ThemedText>
                )}
              </View>

              <ThemedText type="link">Ajouter</ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>Aliments du repas</ThemedText>

        {foods.length === 0 ? (
          <ThemedText style={styles.muted}>Aucun aliment ajouté.</ThemedText>
        ) : (
          <View style={styles.results}>
            {foods.map((food, index) => (
              <View key={`${food.id}-${index}`} style={styles.resultCard}>
                {food.image_url ? (
                  <Image source={{ uri: food.image_url }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]} />
                )}

                <View style={styles.resultContent}>
                  <ThemedText style={styles.cardTitle}>{food.name}</ThemedText>

                  {!!food.brand && (
                    <ThemedText style={styles.muted}>{food.brand}</ThemedText>
                  )}

                  <ThemedText style={styles.muted}>
                    {round1(food.calories)} kcal • P {round1(food.proteins)}g • G {round1(food.carbs)}g • L {round1(food.fats)}g
                  </ThemedText>
                </View>

                <Pressable onPress={() => removeFood(index)}>
                  <ThemedText type="link">Retirer</ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            foods.length === 0 && styles.saveButtonDisabled,
            pressed && styles.pressed,
          ]}
          onPress={saveCurrentMeal}
          disabled={foods.length === 0}
        >
          <ThemedText style={styles.saveButtonText}>Enregistrer le repas</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 20,
    gap: 12,
  },
  label: {
    fontWeight: "700",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "800",
  },
  muted: {
    opacity: 0.8,
  },
  error: {
    color: "#c62828",
    fontWeight: "700",
  },
  mealTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mealTypeButton: {
    borderWidth: 1,
    borderColor: "#0a7ea4",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  mealTypeButtonSelected: {
    backgroundColor: "#0a7ea4",
  },
  mealTypeButtonText: {
    color: "#0a7ea4",
    fontWeight: "700",
  },
  mealTypeButtonTextSelected: {
    color: "#fff",
  },
  scanButton: {
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  scanButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  results: {
    gap: 10,
    marginTop: 6,
  },
  resultCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  resultContent: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.75,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  thumbPlaceholder: {
    borderWidth: 1,
    borderColor: "#ddd",
  },
  saveButton: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
});