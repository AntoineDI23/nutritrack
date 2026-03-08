import * as React from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "@clerk/clerk-expo";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import type { Meal } from "@/types/models";
import { computeMealTotals, loadMeals } from "@/utils/meals-storage";
import { getDailyCalorieGoal } from "@/utils/settings-storage";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export default function Page() {
  const router = useRouter();
  const { user } = useUser();

  const [meals, setMeals] = React.useState<Meal[]>([]);
  const [dailyCalorieGoal, setDailyCalorieGoal] = React.useState(2000);

  const refreshData = React.useCallback(async () => {
    const [storedMeals, storedGoal] = await Promise.all([
      loadMeals(),
      getDailyCalorieGoal(),
    ]);

    setMeals(storedMeals);
    setDailyCalorieGoal(storedGoal);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshData().catch(console.error);
    }, [refreshData]),
  );

  const openMeal = (id: string) => {
    router.push({
      pathname: "/(main)/(home)/[id]",
      params: { id },
    });
  };

  const today = getTodayDate();
  const todaysMeals = meals.filter((meal) => meal.date === today);
  const todaysCalories = todaysMeals.reduce(
    (sum, meal) => sum + computeMealTotals(meal).calories,
    0,
  );

  const progressRatio =
    dailyCalorieGoal > 0 ? todaysCalories / dailyCalorieGoal : 0;
  const progressPercent = Math.min(progressRatio * 100, 100);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">NutriTrack</ThemedText>

      <ThemedText style={styles.muted}>
        Bonjour {user?.emailAddresses?.[0]?.emailAddress}
      </ThemedText>

      <View style={styles.progressCard}>
        <ThemedText style={styles.progressTitle}>
          Objectif calorique du jour
        </ThemedText>
        <ThemedText style={styles.progressText}>
          {round1(todaysCalories)} / {dailyCalorieGoal} kcal
        </ThemedText>

        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%` },
            ]}
          />
        </View>

        <ThemedText style={styles.muted}>
          {todaysMeals.length} repas pour aujourd’hui
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Link href="/add">
          <ThemedText type="link">+ Ajouter un repas</ThemedText>
        </Link>
      </View>

      <ThemedText style={styles.sectionTitle}>Mes repas</ThemedText>

      {meals.length === 0 ? (
        <ThemedText style={styles.muted}>
          Aucun repas enregistré pour l’instant.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {meals.map((meal) => {
            const totals = computeMealTotals(meal);

            return (
              <Pressable
                key={meal.id}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => openMeal(meal.id)}
              >
                <ThemedText style={styles.cardTitle}>{meal.name}</ThemedText>
                <ThemedText style={styles.muted}>{meal.date}</ThemedText>
                <ThemedText style={styles.muted}>
                  {round1(totals.calories)} kcal
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
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  sectionTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
  },
  muted: {
    opacity: 0.8,
  },
  list: {
    gap: 10,
    marginTop: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  progressCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  progressText: {
    fontSize: 15,
    fontWeight: "600",
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: "#e6e6e6",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#0a7ea4",
    borderRadius: 999,
  },
});