import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "@clerk/clerk-expo";

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
  const { user } = useUser();

  const [meals, setMeals] = React.useState<Meal[]>([]);

  const loadMeals = React.useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Meal[]) : [];
    setMeals(Array.isArray(parsed) ? parsed : []);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadMeals().catch(console.error);
    }, [loadMeals]),
  );

  const openMeal = (id: string) => {
    router.push({
      pathname: "/(main)/(home)/[id]",
      params: { id },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">NutriTrack</ThemedText>

      <ThemedText style={styles.muted}>
        Bonjour {user?.emailAddresses?.[0]?.emailAddress}
      </ThemedText>

      <View style={styles.row}>
        <Link href="/add">
          <ThemedText type="link">+ Ajouter un repas</ThemedText>
        </Link>
      </View>

      <ThemedText style={styles.sectionTitle}>Mes repas</ThemedText>

      {meals.length === 0 ? (
        <ThemedText style={styles.muted}>Aucun repas enregistré pour l’instant.</ThemedText>
      ) : (
        <View style={styles.list}>
          {meals
            .slice()
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .map((meal) => {
              const totals = computeTotals(meal);
              const date = new Date(meal.createdAt).toLocaleString();

              return (
                <Pressable
                  key={meal.id}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  onPress={() => openMeal(meal.id)}
                >
                  <ThemedText style={styles.cardTitle}>{meal.title}</ThemedText>
                  <ThemedText style={styles.muted}>{date}</ThemedText>
                  <ThemedText style={styles.muted}>
                    {totals.kcal} kcal • P {totals.proteins}g • G {totals.carbs}g • L {totals.fat}g
                  </ThemedText>
                </Pressable>
              );
            })}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  sectionTitle: { marginTop: 12, fontSize: 18, fontWeight: "700" },
  muted: { opacity: 0.8 },
  list: { gap: 10, marginTop: 8 },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
  },
  cardPressed: { opacity: 0.75 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
});
