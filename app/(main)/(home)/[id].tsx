import * as React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import type { Meal } from "@/types/models";
import { computeMealTotals, getMealById } from "@/utils/meals-storage";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default function Page() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meal, setMeal] = React.useState<Meal | null>(null);

  const refreshMeal = React.useCallback(async () => {
    const mealId = String(id ?? "");
    if (!mealId) {
      setMeal(null);
      return;
    }

    const foundMeal = await getMealById(mealId);
    setMeal(foundMeal);
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      refreshMeal().catch(console.error);
    }, [refreshMeal]),
  );

  if (!meal) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Repas introuvable</ThemedText>
        <ThemedText style={styles.muted}>
          Ce repas n’existe plus ou son identifiant est invalide.
        </ThemedText>

        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText type="link">← Retour</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const totals = computeMealTotals(meal);

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <ThemedText type="link">← Retour</ThemedText>
      </Pressable>

      <ThemedText type="title">{meal.name}</ThemedText>
      <ThemedText style={styles.muted}>{meal.date}</ThemedText>

      <View style={styles.summary}>
        <ThemedText style={styles.summaryText}>{round1(totals.calories)} kcal</ThemedText>
        <ThemedText style={styles.muted}>
          Protéines {round1(totals.proteins)}g • Glucides {round1(totals.carbs)}g • Lipides {round1(totals.fats)}g
        </ThemedText>
      </View>

      <ThemedText style={styles.sectionTitle}>Aliments</ThemedText>

      {meal.foods.length === 0 ? (
        <ThemedText style={styles.muted}>Aucun aliment dans ce repas.</ThemedText>
      ) : (
        <View style={styles.list}>
          {meal.foods.map((food, index) => (
            <View key={`${food.id}-${index}`} style={styles.itemRow}>
              {food.image_url ? (
                <Image source={{ uri: food.image_url }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]} />
              )}

              <View style={styles.itemContent}>
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
            </View>
          ))}
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
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  thumbPlaceholder: {
    borderWidth: 1,
    borderColor: "#ddd",
  },
});