import * as React from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { consumeLastScan } from "@/state/scan-result";
import { getFoodByBarcode, searchFoodsByText } from "@/services/open-food-facts";
import { MEAL_NAMES, type Food, type Meal, type MealName } from "@/types/models";
import { addMeal } from "@/utils/meals-storage";

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default function AddMealPage() {
  const router = useRouter();

  const [mealName, setMealName] = React.useState<MealName>("Déjeuner");
  const [foods, setFoods] = React.useState<Food[]>([]);

  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebouncedValue(query, 500);

  const [results, setResults] = React.useState<Food[]>([]);
  const [loadingSearch, setLoadingSearch] = React.useState(false);
  const [loadingScan, setLoadingScan] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const addFoodToMeal = React.useCallback((food: Food) => {
    setFoods((prev) => [...prev, food]);
  }, []);

  const removeFood = React.useCallback((index: number) => {
    setFoods((prev) => prev.filter((_, i) => i !== index));
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
    const trimmedQuery = debouncedQuery.trim();

    if (trimmedQuery.length < 2) {
      setResults([]);
      setLoadingSearch(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoadingSearch(true);
        setError(null);

        const foundFoods = await searchFoodsByText(trimmedQuery, 10);

        if (!cancelled) {
          setResults(foundFoods);
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

  const handleValidate = async () => {
    if (foods.length === 0) {
      setError("Ajoute au moins un aliment avant de valider.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const meal: Meal = {
        id: Date.now().toString(),
        name: mealName,
        date: getTodayDate(),
        foods,
      };

      await addMeal(meal);
      router.replace("/");
    } catch {
      setError("Impossible d’enregistrer le repas.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Ajouter un repas</ThemedText>

        <ThemedText style={styles.label}>Type de repas</ThemedText>
        <View style={styles.mealTypeContainer}>
          {MEAL_NAMES.map((name) => {
            const isSelected = mealName === name;

            return (
              <Pressable
                key={name}
                style={({ pressed }) => [
                  styles.mealTypeButton,
                  isSelected && styles.mealTypeButtonSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => setMealName(name)}
              >
                <ThemedText
                  style={[
                    styles.mealTypeButtonText,
                    isSelected && styles.mealTypeButtonTextSelected,
                  ]}
                >
                  {name}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={styles.sectionTitle}>Ajouter des aliments</ThemedText>

        <Pressable
          style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
          onPress={() => router.push("/add/camera")}
        >
          <ThemedText style={styles.scanButtonText}>Scanner un code-barres</ThemedText>
        </Pressable>

        {loadingScan && (
          <View style={styles.feedbackRow}>
            <ActivityIndicator />
            <ThemedText>Récupération du produit scanné…</ThemedText>
          </View>
        )}

        <ThemedText style={styles.muted}>Ou rechercher par texte :</ThemedText>

        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Ex : coca cola"
          placeholderTextColor="#666666"
          autoCapitalize="none"
        />

        {loadingSearch && (
          <View style={styles.feedbackRow}>
            <ActivityIndicator />
            <ThemedText>Recherche…</ThemedText>
          </View>
        )}

        {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}

        {!loadingSearch &&
          debouncedQuery.trim().length >= 2 &&
          results.length === 0 &&
          !error && (
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

                {!!food.brand && <ThemedText style={styles.muted}>{food.brand}</ThemedText>}

                <ThemedText style={styles.muted}>
                  {round1(food.calories)} kcal • P {round1(food.proteins)}g • G{" "}
                  {round1(food.carbs)}g • L {round1(food.fats)}g
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

        <ThemedText style={styles.sectionTitle}>Aliments ajoutés</ThemedText>

        {foods.length === 0 ? (
          <ThemedText style={styles.muted}>Aucun aliment ajouté au repas en cours.</ThemedText>
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

                  {!!food.brand && <ThemedText style={styles.muted}>{food.brand}</ThemedText>}

                  <ThemedText style={styles.muted}>
                    {round1(food.calories)} kcal • P {round1(food.proteins)}g • G{" "}
                    {round1(food.carbs)}g • L {round1(food.fats)}g
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
            styles.validateButton,
            (foods.length === 0 || saving) && styles.validateButtonDisabled,
            pressed && styles.pressed,
          ]}
          onPress={handleValidate}
          disabled={foods.length === 0 || saving}
        >
          <ThemedText style={styles.validateButtonText}>
            {saving ? "Enregistrement..." : "Valider"}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  validateButton: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  validateButtonDisabled: {
    opacity: 0.5,
  },
  validateButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
});