import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

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

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function computeTotals(meal: Meal) {
  let kcal = 0;
  let proteins = 0;
  let carbs = 0;
  let fat = 0;

  for (const it of meal.items) {
    const factor = (it.grams || 0) / 100;
    kcal += (it.nutrimentsPer100g.kcal ?? 0) * factor;
    proteins += (it.nutrimentsPer100g.proteins ?? 0) * factor;
    carbs += (it.nutrimentsPer100g.carbs ?? 0) * factor;
    fat += (it.nutrimentsPer100g.fat ?? 0) * factor;
  }

  return {
    kcal: round1(kcal),
    proteins: round1(proteins),
    carbs: round1(carbs),
    fat: round1(fat),
  };
}

export default function Page() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [meal, setMeal] = React.useState<Meal | null>(null);

  const loadMeal = React.useCallback(async () => {
    const mealId = String(id ?? "");
    if (!mealId) {
      setMeal(null);
      return;
    }

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Meal[]) : [];
    const meals = Array.isArray(parsed) ? parsed : [];

    const found = meals.find((m) => m.id === mealId) ?? null;
    setMeal(found);
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      loadMeal().catch(console.error);
    }, [loadMeal]),
  );

  if (!meal) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Repas introuvable</ThemedText>
        <ThemedText style={styles.muted}>
          Ce repas n’existe plus (ou l’identifiant est incorrect).
        </ThemedText>

        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText type="link">← Retour</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const totals = computeTotals(meal);

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <ThemedText type="link">← Retour</ThemedText>
      </Pressable>

      <ThemedText type="title">{meal.title}</ThemedText>
      <ThemedText style={styles.muted}>
        {new Date(meal.createdAt).toLocaleString()}
      </ThemedText>

      <View style={styles.summary}>
        <ThemedText style={styles.summaryText}>{totals.kcal} kcal</ThemedText>
        <ThemedText style={styles.muted}>
          Protéines {totals.proteins}g • Glucides {totals.carbs}g • Lipides {totals.fat}g
        </ThemedText>
      </View>

      <ThemedText style={styles.sectionTitle}>Aliments</ThemedText>

      {meal.items.length === 0 ? (
        <ThemedText style={styles.muted}>Aucun aliment dans ce repas.</ThemedText>
      ) : (
        <View style={styles.list}>
          {meal.items.map((it, idx) => {
            const factor = it.grams / 100;
            const kcal = round1((it.nutrimentsPer100g.kcal ?? 0) * factor);

            return (
              <View key={`${it.code}-${idx}`} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.cardTitle}>{it.name}</ThemedText>
                  {it.brands ? <ThemedText style={styles.muted}>{it.brands}</ThemedText> : null}
                  <ThemedText style={styles.muted}>
                    {it.grams}g • {kcal} kcal
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  backBtn: { paddingVertical: 6, alignSelf: "flex-start" },
  sectionTitle: { marginTop: 12, fontSize: 18, fontWeight: "700" },
  muted: { opacity: 0.8 },
  summary: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 6,
  },
  summaryText: { fontSize: 18, fontWeight: "800" },
  list: { gap: 10, marginTop: 8 },
  itemRow: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
});
